"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { AssistantAnswer, AssistantMessage, AssistantSource } from "@/lib/assistant/types";

interface DisplayMessage extends AssistantMessage {
  id: string;
  sources?: AssistantSource[];
}

interface ThesisAssistantProps {
  variant?: "page" | "panel";
  onClose?: () => void;
}

const STORAGE_KEY = "thesis-assistant-conversation-v3";
const ASSISTANT_API_URL = process.env.NEXT_PUBLIC_ASSISTANT_API_URL || "/api/assistant/";

const SUGGESTIONS = [
  "What is the difference between the 107-study corpus and the 27-system subset?",
  "Compare GETMusic and MusicGen on control and long-term structure.",
  "What are the main contributions of the thesis?",
  "Why is orchestration underrepresented?",
];

const WELCOME: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  content: "Ask about the thesis, the 107 reviewed studies, or the 27-system listening analysis. Answers are in English and use only verified thesis evidence.",
};

function cleanAssistantText(content: string) {
  return content
    .replace(/\[(?:T|M|L)\d+\]/gi, "")
    .replaceAll("**", "")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function safeStoredMessages(value: string | null): DisplayMessage[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 40) return null;
    const valid = parsed.every((item) =>
      typeof item === "object"
      && item !== null
      && "id" in item
      && typeof item.id === "string"
      && "role" in item
      && (item.role === "user" || item.role === "assistant")
      && "content" in item
      && typeof item.content === "string",
    );
    return valid ? parsed as DisplayMessage[] : null;
  } catch {
    return null;
  }
}

function MessageSources({ sources }: { sources: AssistantSource[] }) {
  const readingLinks = sources
    .flatMap((item) => [
      ...item.siteLinks,
      ...(item.kind === "thesis" && item.href ? [{ label: item.label, href: item.href }] : []),
    ])
    .filter((link, index, links) => links.findIndex((candidate) => candidate.href === link.href) === index)
    .slice(0, 4);

  return (
    <div className="mt-3 rounded-lg border border-line bg-white px-3 py-2.5 text-xs">
      {readingLinks.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-muted">Read more:</span>
          {readingLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="font-medium text-forest hover:underline">
              {link.label}
            </a>
          ))}
        </div>
      )}
      <details className={readingLinks.length > 0 ? "mt-2 border-t border-line pt-2" : ""}>
        <summary className="cursor-pointer select-none font-medium text-forest-ink">Evidence ({sources.length})</summary>
        <ul className="mt-2 space-y-2.5">
          {sources.map((item) => (
            <li key={item.id} className="leading-relaxed text-muted">
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="font-medium text-forest hover:underline">
                  {item.label}
                </a>
              ) : (
                <span className="font-medium text-forest-ink">{item.label}</span>
              )}
              <span className="mt-0.5 block">{item.excerpt}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export default function ThesisAssistant({ variant = "page", onClose }: ThesisAssistantProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "loading">("ready");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const hydratedRef = useRef(false);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = safeStoredMessages(window.sessionStorage.getItem(STORAGE_KEY));
    if (stored) setMessages(stored);
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    const container = conversationRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, status]);

  const ask = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loadingRef.current) return;
    loadingRef.current = true;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}-${requestIdRef.current + 1}`,
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
        .slice(-8)
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
            id: `assistant-${Date.now()}-${requestId}`,
            role: "assistant",
            content: cleanAssistantText(data.answer),
            sources: data.sources,
          },
        ]);
      }
    } catch (caught) {
      if (requestIdRef.current === requestId) {
        if (caught instanceof DOMException && caught.name === "AbortError") setError("Answer cancelled.");
        else setError(caught instanceof Error ? caught.message : "The assistant could not answer.");
      }
    } finally {
      if (requestIdRef.current === requestId) {
        abortRef.current = null;
        loadingRef.current = false;
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
    abortRef.current = null;
    loadingRef.current = false;
    setMessages([WELCOME]);
    setInput("");
    setError(null);
    setStatus("ready");
    window.sessionStorage.removeItem(STORAGE_KEY);
  };

  const compact = variant === "panel";
  const conversation = (
    <section aria-label="Thesis assistant conversation" className={`flex overflow-hidden border border-line bg-white shadow-sm ${compact ? "h-full flex-col rounded-2xl" : "flex-col rounded-xl"}`}>
      <div className="border-b border-line bg-forest-light/65 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-forest-ink">Thesis assistant</p>
            <p className="mt-0.5 truncate text-xs text-muted">Verified thesis evidence · English only</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={reset} className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-forest-ink hover:bg-canvas">New chat</button>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close thesis assistant" className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-lg leading-none text-forest-ink hover:bg-canvas">×</button>
            )}
          </div>
        </div>
      </div>

      <div ref={conversationRef} className={`space-y-5 overflow-y-auto px-4 py-5 ${compact ? "min-h-0 flex-1" : "min-h-[28rem] max-h-[42rem] sm:px-6"}`} aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className={`max-w-[94%] ${message.role === "user" ? "ml-auto" : "mr-auto"}`}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">{message.role === "user" ? "You" : "Thesis assistant"}</p>
            <div className={`whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-forest text-white" : "border border-line bg-canvas text-ink"}`}>
              {message.role === "assistant" ? cleanAssistantText(message.content) : message.content}
            </div>
            {message.sources && message.sources.length > 0 && <MessageSources sources={message.sources} />}
          </article>
        ))}
        {status === "loading" && (
          <div className="mr-auto max-w-[94%]" role="status">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">Thesis assistant</p>
            <div className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-muted">Checking the evidence…</div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-line bg-canvas/70 p-4">
        <label htmlFor={`assistant-question-${variant}`} className="sr-only">Ask a question about the thesis</label>
        <textarea
          id={`assistant-question-${variant}`}
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
          rows={compact ? 2 : 3}
          placeholder="Ask about a finding, system, method, score, or limitation…"
          className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-inner placeholder:text-muted/75 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">Enter to send</p>
          {status === "loading" ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink">Cancel</button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45">Ask</button>
          )}
        </div>
        {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      </form>
    </section>
  );

  if (compact) return conversation;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      {conversation}
      <aside>
        <div className="rounded-xl border border-line bg-white p-4">
          <h2 className="text-base">Try a question</h2>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => void ask(suggestion)} disabled={status === "loading"} className="w-full rounded-lg border border-line px-3 py-2.5 text-left text-xs leading-relaxed text-ink transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-55">{suggestion}</button>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-forest-light/60 p-4 text-xs leading-relaxed text-muted">
          <p className="font-medium text-forest-ink">Scope and caution</p>
          <p className="mt-2">Answers use the public thesis and verified records derived from the final 107-study and 27-system tables. The original spreadsheets are not published or downloadable.</p>
          <a href="/thesis/AI_Music_Thesis_Public_Edition.pdf" target="_blank" rel="noreferrer" className="mt-3 inline-flex font-medium text-forest hover:underline">Open the public thesis PDF</a>
        </div>
      </aside>
    </div>
  );
}
