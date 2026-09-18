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
  "What are the main contributions of the thesis?",
  "Which systems scored at least 4/5, and what distinguished them?",
  "What are the main limitations of the review?",
  "How were objective and subjective evaluation evidence distinguished?",
];

const ASSISTANT_API_URL =
  process.env.NEXT_PUBLIC_ASSISTANT_API_URL || "/api/assistant/";

const WELCOME: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ask about the review, methodology, findings, 27-system listening analysis, limitations, or appendices. I search the full public thesis PDF, answer only from its text, and cite the exact thesis pages used.",
};

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
              <p className="mt-0.5 text-xs text-muted">Full thesis PDF · page-cited answers · site links for exploration</p>
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
                {message.content}
              </div>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 rounded-lg border border-line bg-white px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Thesis pages used</p>
                  <ol className="mt-2 space-y-2">
                    {message.sources.map((source, index) => (
                      <li key={source.id} className="text-xs leading-relaxed text-muted">
                        <a
                          href={source.href}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-forest"
                        >
                          [T{index + 1}] {source.label}
                        </a>
                        <span className="mt-0.5 block">{source.excerpt}</span>
                        {source.siteLinks.length > 0 && (
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted/80">
                              Explore on site
                            </span>
                            {source.siteLinks.map((link) => (
                              <Link key={link.href} href={link.href} className="font-medium text-forest hover:underline">
                                {link.label}
                              </Link>
                            ))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
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
            The public thesis PDF is the only source used for answers. Links to website pages are provided for easier exploration, not as evidence.
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
