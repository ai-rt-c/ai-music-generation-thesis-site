"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import type {
  AssistantAnswer,
  AssistantMessage,
  AssistantSource,
} from "@/lib/assistant/types";

interface DisplayMessage extends AssistantMessage {
  id: string;
  sources?: AssistantSource[];
}

const SUGGESTIONS = [
  "Which studies in the 107-paper corpus used Transformer- or LLM-based architectures?",
  "Which systems scored at least 4/5 overall, and what distinguished them?",
  "What are the main contributions of the thesis?",
  "What are the main limitations of the review?",
];

const ASSISTANT_API_URL =
  process.env.NEXT_PUBLIC_ASSISTANT_API_URL || "/api/assistant/";

const WELCOME: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ask about the review, individual studies, datasets, methods, findings, or the 27-system listening analysis. I use the public thesis plus verified structured records from the final 107-study and 27-system tables, cite the evidence used, and keep the answer brief.",
};

function cleanAssistantText(content: string) {
  return content
    .replaceAll("**", "")
    .replace(/\*([^*\n]+)\*/g, "$1");
}

function MessageSources({ sources }: { sources: AssistantSource[] }) {
  const readingLinks = sources
    .flatMap((source) => [
      ...source.siteLinks,
      ...(source.kind === "thesis"
        ? [{ label: `Thesis ${source.thesisPage === "Cover" ? "cover" : `p. ${source.thesisPage}`}`, href: source.href }]
        : []),
    ])
    .filter((link, index, links) => links.findIndex((candidate) => candidate.href === link.href) === index)
    .slice(0, 4);

  return (
    <div className="mt-3 rounded-lg border border-line bg-white px-3 py-2.5 text-xs">
      {readingLinks.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-muted">Read more:</span>
          {readingLinks.map((link) =>
            link.href.startsWith("/thesis/") ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-forest hover:underline"
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="font-medium text-forest hover:underline">
                {link.label}
              </Link>
            ),
          )}
        </div>
      )}
      <details className={readingLinks.length > 0 ? "mt-2 border-t border-line pt-2" : ""}>
        <summary className="cursor-pointer select-none font-medium text-forest-ink">
          Sources used ({sources.length})
        </summary>
        <ol className="mt-2 space-y-2.5">
          {sources.map((source) => (
            <li key={source.id} className="leading-relaxed text-muted">
              <a
                href={source.href}
                target={source.kind === "thesis" ? "_blank" : undefined}
                rel={source.kind === "thesis" ? "noreferrer" : undefined}
                className="font-medium text-forest hover:underline"
              >
                [{source.citation}] {source.label}
              </a>
              <span className="mt-0.5 block">{source.excerpt}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export default function ThesisAssistant() {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "loading">("ready");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const ask = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || status === "loading") return;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: cleanQuestion,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setStatus("loading");

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    abortRef.current = controller;

    try {
      const apiMessages = nextMessages
        .filter((message) => message.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));
      const response = await fetch(ASSISTANT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });
      const data = (await response.json()) as AssistantAnswer & { error?: string };
      if (!response.ok) throw new Error(data.error || "The assistant could not answer.");

      if (requestIdRef.current === requestId) {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.answer,
            sources: data.sources,
          },
        ]);
      }
    } catch (caught) {
      if (requestIdRef.current === requestId) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          setError("Answer cancelled.");
        } else {
          setError(caught instanceof Error ? caught.message : "The assistant could not answer.");
        }
      }
    } finally {
      if (requestIdRef.current === requestId) {
        abortRef.current = null;
        setStatus("ready");
      }
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(input);
  };

  const reset = () => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setMessages([WELCOME]);
    setInput("");
    setError(null);
    setStatus("ready");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <section aria-label="Thesis assistant conversation" className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="border-b border-line bg-forest-light/55 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-forest-ink">Evidence-grounded assistant</p>
              <p className="mt-0.5 text-xs text-muted">Public thesis · verified study data · concise cited answers</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-forest-ink hover:bg-canvas"
            >
              New conversation
            </button>
          </div>
        </div>

        <div className="min-h-[28rem] space-y-5 px-4 py-5 sm:px-6" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[92%] ${message.role === "user" ? "ml-auto" : "mr-auto"}`}
            >
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                {message.role === "user" ? "You" : "Thesis assistant"}
              </p>
              <div
                className={`whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-forest text-white"
                    : "border border-line bg-canvas text-ink"
                }`}
              >
                {message.role === "assistant" ? cleanAssistantText(message.content) : message.content}
              </div>
              {message.sources && message.sources.length > 0 && (
                <MessageSources sources={message.sources} />
              )}
            </article>
          ))}

          {status === "loading" && (
            <div className="mr-auto max-w-[92%]" role="status">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">Thesis assistant</p>
              <div className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-muted">
                Finding evidence and drafting an answer…
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="border-t border-line bg-canvas/70 p-4 sm:p-5">
          <label htmlFor="assistant-question" className="sr-only">Ask a question about the thesis</label>
          <textarea
            id="assistant-question"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (input.trim()) void ask(input);
              }
            }}
            disabled={status === "loading"}
            maxLength={4_000}
            rows={3}
            placeholder="Ask about a finding, system, method, score, limitation, or contribution…"
            className="w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-inner placeholder:text-muted/75 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Enter to send · Shift+Enter for a new line</p>
            {status === "loading" ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
              >
                Cancel
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Ask the thesis
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </form>
      </section>

      <aside>
        <div className="rounded-xl border border-line bg-white p-4">
          <h2 className="text-base">Try a question</h2>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void ask(suggestion)}
                disabled={status === "loading"}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-left text-xs leading-relaxed text-ink transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-55"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-forest-light/60 p-4 text-xs leading-relaxed text-muted">
          <p className="font-medium text-forest-ink">Scope and caution</p>
          <p className="mt-2">
            Answers use the public thesis and verified structured records derived from the final 107-study and 27-system tables. The original spreadsheets are not published or downloadable.
          </p>
          <a
            href="/thesis/AI_Music_Thesis_Public_Edition.pdf"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex font-medium text-forest hover:underline"
          >
            Open the public thesis PDF
          </a>
        </div>
      </aside>
    </div>
  );
}
