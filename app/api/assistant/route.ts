import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { buildAssistantInstructions } from "@/lib/assistant/prompt";
import { retrieveThesisContext } from "@/lib/assistant/retrieve";
import type { AssistantMessage } from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.THESIS_ASSISTANT_MODEL || "gemini-2.5-flash";
const MAX_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_TOTAL_LENGTH = 14_000;
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
  if (existing.count >= 12) return false;
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
    const recentConversation = messages
      .slice(-4)
      .map(({ role, content }) => `${role}: ${content}`)
      .join("\n");
    const retrieved = retrieveThesisContext(`${latestQuestion}\n${recentConversation}`);
    const result = await generateText({
      model: google(MODEL),
      instructions: buildAssistantInstructions(retrieved),
      messages,
      maxOutputTokens: 700,
      temperature: 0.2,
      maxRetries: 1,
    });

    return NextResponse.json(
      {
        answer: result.text,
        sources: retrieved.map(({ context: _context, ...source }) => source),
      },
      { headers: responseHeaders(request) },
    );
  } catch (error) {
    console.error("Thesis assistant request failed", error);
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable. The thesis pages remain accessible." },
      { status: 503, headers: responseHeaders(request) },
    );
  }
}
