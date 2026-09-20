import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { buildAssistantInstructions } from "@/lib/assistant/prompt";
import { retrieveThesisContext } from "@/lib/assistant/retrieve";
import {
  answerDeterministically,
  answerScopeOnly,
  containsUnknownId,
} from "@/lib/assistant/answer";
import {
  retrieveStructuredContext,
  wantsExpandedAnswer,
} from "@/lib/assistant/structured";
import type { StructuredEvidenceSource } from "@/lib/assistant/structured";
import type { AssistantEvidenceSource, AssistantMessage } from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.THESIS_ASSISTANT_MODEL || "gemini-3.6-flash";
const MAX_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_TOTAL_LENGTH = 14_000;
const NOT_VERIFIED = "I could not verify that from the thesis evidence available to me.";
const ALLOWED_ORIGINS = new Set([
  "https://ai-music-generation-thesis-review.vercel.app",
  "https://ai-rt-c.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

type RateEntry = { count: number; resetAt: number };
const rateLimit = new Map<string, RateEntry>();

function responseHeaders(request: Request) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      ...responseHeaders(request),
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function allowRequest(ip: string) {
  const now = Date.now();
  if (rateLimit.size > 2_000) {
    for (const [key, entry] of rateLimit) {
      if (entry.resetAt <= now) rateLimit.delete(key);
    }
  }
  const existing = rateLimit.get(ip);
  if (!existing || existing.resetAt <= now) {
    rateLimit.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (existing.count >= 30) return false;
  existing.count += 1;
  return true;
}

function parseMessages(input: unknown): AssistantMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const parsed: AssistantMessage[] = [];
  let totalLength = 0;

  for (const item of input.slice(-MAX_MESSAGES)) {
    if (typeof item !== "object" || item === null) return null;
    const role = "role" in item ? item.role : undefined;
    const rawContent = "content" in item ? item.content : undefined;
    if ((role !== "user" && role !== "assistant") || typeof rawContent !== "string") return null;
    const content = rawContent.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null;
    totalLength += content.length;
    if (totalLength > MAX_TOTAL_LENGTH) return null;
    parsed.push({ role, content });
  }

  return parsed.at(-1)?.role === "user" ? parsed : null;
}

function publicSource(source: AssistantEvidenceSource | StructuredEvidenceSource) {
  const structuredSource = source as StructuredEvidenceSource;
  const { context: _context, directAnswer: _directAnswer, ...publicFields } = structuredSource;
  return publicFields;
}

function isContextDependentQuestion(latest: string) {
  const words = latest.trim().split(/\s+/);
  return words.length <= 14 && (
    /^(?:what|how) about\b|^(?:and|but)\b|^which one\b/i.test(latest)
    || /\b(?:it|its|that|this|those|these|they|them|both|former|latter)\b/i.test(latest)
    || /^(?:why|how)\s*\??$/i.test(latest)
    || /^(?:پس|اون|آن|این|آنها|آن‌ها|اینا|اونا)\b/i.test(latest)
  );
}

function resolvedQuestion(messages: AssistantMessage[]) {
  const latest = messages.at(-1)!.content.trim();
  if (!isContextDependentQuestion(latest)) return latest;
  const previous = [...messages.slice(0, -1)].reverse().find((message) => message.role === "user");
  return previous ? `${previous.content}\nFollow-up: ${latest}` : latest;
}

function numericClaims(value: string) {
  return [...value.matchAll(/(?<![\p{L}\p{N}])\d{1,4}(?:[.,]\d+)?%?(?![\p{L}\p{N}])/gu)]
    .map((match) => match[0].replace(",", "."));
}

function containsUnsupportedNumber(answer: string, evidence: string, question: string) {
  const allowed = new Set([
    ...numericClaims(evidence),
    ...numericClaims(question),
    "27",
    "107",
  ]);
  return numericClaims(answer).some((claim) => !allowed.has(claim));
}

function cleanGeneratedAnswer(answer: string) {
  return answer
    .replace(/\[(?:T|M|L)\d+\]/gi, "")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowRequest(ip)) {
    return NextResponse.json(
      { error: "Too many questions. Please wait a few minutes and try again." },
      { status: 429, headers: responseHeaders(request) },
    );
  }

  try {
    const body = await request.json();
    const messages = parseMessages(body?.messages);
    if (!messages) {
      return NextResponse.json(
        { error: "Please send a short, valid question." },
        { status: 400, headers: responseHeaders(request) },
      );
    }

    const latestQuestion = messages.at(-1)!.content;
    // Resolve complete questions on their own before consulting conversation
    // history. This prevents an earlier unrelated question from contaminating
    // a later standalone query such as "How many studies use Transformers?".
    const hasEarlierUserQuestion = messages
      .slice(0, -1)
      .some((message) => message.role === "user");
    const contextDependent = hasEarlierUserQuestion
      && isContextDependentQuestion(latestQuestion);
    const latestDeterministic = contextDependent ? null : answerDeterministically(latestQuestion);
    if (latestDeterministic?.sources.length) {
      return NextResponse.json(latestDeterministic, { headers: responseHeaders(request) });
    }

    const questionForEvidence = resolvedQuestion(messages);
    const deterministic = questionForEvidence === latestQuestion
      ? latestDeterministic
      : answerDeterministically(questionForEvidence);
    if (deterministic) {
      return NextResponse.json(deterministic, { headers: responseHeaders(request) });
    }

    const structured = retrieveStructuredContext(questionForEvidence);
    const expandedAnswer = wantsExpandedAnswer(latestQuestion);
    const thesis = retrieveThesisContext(questionForEvidence, structured.length ? 2 : 3);
    const retrieved = [...structured, ...thesis];
    if (!retrieved.length) {
      return NextResponse.json(answerScopeOnly(), { headers: responseHeaders(request) });
    }
    // Keep the public endpoint useful and quiet when the optional provider
    // secret is not configured. Verified deterministic answers above continue
    // to work; open-ended questions fail closed without producing runtime
    // errors or invented content.
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { answer: NOT_VERIFIED, sources: [] },
        { headers: responseHeaders(request) },
      );
    }
    const result = await generateText({
      model: google(MODEL),
      instructions: buildAssistantInstructions(retrieved, expandedAnswer),
      messages,
      maxOutputTokens: expandedAnswer ? 1_200 : 420,
      reasoning: "minimal",
      temperature: 0,
      maxRetries: 1,
    });

    const cleanedAnswer = cleanGeneratedAnswer(result.text);
    const evidenceText = retrieved.map((source) => source.context).join("\n");
    const mustRefuse = !cleanedAnswer
      || containsUnknownId(cleanedAnswer)
      || containsUnsupportedNumber(cleanedAnswer, evidenceText, questionForEvidence)
      || /(?:could not verify|insufficient evidence|not enough evidence|not available in the (?:supplied|thesis) evidence)/i.test(cleanedAnswer);

    return NextResponse.json(
      {
        answer: mustRefuse ? NOT_VERIFIED : cleanedAnswer,
        sources: mustRefuse ? [] : retrieved.map(publicSource),
      },
      { headers: responseHeaders(request) },
    );
  } catch (error) {
    console.error("Thesis assistant request failed", error);
    return NextResponse.json(
      { answer: NOT_VERIFIED, sources: [] },
      { status: 200, headers: responseHeaders(request) },
    );
  }
}
