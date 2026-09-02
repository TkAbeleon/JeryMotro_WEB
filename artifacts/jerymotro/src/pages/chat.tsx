import { memo, useState, useRef, useEffect, useCallback, useId, type KeyboardEvent } from "react";
import { useChatWithAI } from "@workspace/api-client-react";
import { ArrowDown, AlertTriangle, Bot, BookOpen, Check, Copy, Loader2, Plus, RotateCcw, Send, Sparkles, User, Zap } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "base", securityLevel: "strict", suppressErrorRendering: true, fontFamily: "inherit", themeVariables: { primaryColor: "#eefbf3", primaryTextColor: "#143326", primaryBorderColor: "#b8dfc5", lineColor: "#7fa88f", secondaryColor: "#f5f7f6", tertiaryColor: "#ffffff" } });

const MAX_MESSAGE_LENGTH = 2000;

interface Message { id: number; role: "user" | "assistant"; content: string; sources?: string[]; model?: string; time_ms?: number; createdAt?: number; isError?: boolean; retryText?: string; }

function normalizeMermaid(source: string) {
  let normalized = source
    .replace(/^\s*```(?:mermaid)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();

  // AI-generated flowcharts often put characters such as parentheses, slashes
  // or colons directly in square-bracket labels. Quote those labels so Mermaid
  // interprets the whole value as text instead of parsing punctuation as syntax.
  normalized = normalized.replace(/(\b[A-Za-z0-9_-]+)\[([^\]\n]+)\]/g, (_match, id: string, label: string) => {
    const cleanLabel = label.trim();
    if (!cleanLabel || (cleanLabel.startsWith('"') && cleanLabel.endsWith('"'))) return `${id}[${label}]`;
    return `${id}["${cleanLabel.replace(/"/g, "&quot;")}" ]`.replace('" ]', '"]');
  });

  return normalized;
}

const Mermaid = memo(function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState("");
  const [ready, setReady] = useState(false);
  const renderId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const elementId = `mermaid-chat-${renderId}`;
  const source = normalizeMermaid(chart);

  useEffect(() => {
    let active = true;
    setSvg("");
    setReady(false);
    const render = async () => {
      if (!source) { if (active) setReady(true); return; }
      try {
        const result = await mermaid.render(elementId, source);
        if (!active) return;
        setSvg(result.svg); setReady(true); document.getElementById(elementId)?.remove();
      } catch {
        document.getElementById(elementId)?.remove();
        if (!active) return;
        setReady(true);
      }
    };
    void render();
    return () => { active = false; document.getElementById(elementId)?.remove(); };
  }, [elementId, source]);

  if (!ready) return <div className="my-4 flex min-h-24 items-center justify-center rounded-xl border border-border/60 bg-muted/25 text-xs text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Prévisualisation du diagramme…</div>;
  if (!svg) return <details className="my-4 overflow-hidden rounded-xl border border-border/60 bg-muted/20"><summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" />Diagramme Mermaid indisponible — afficher le code source</summary><pre className="max-h-64 overflow-auto border-t border-border/50 px-3 py-3 text-[10px] leading-5 text-muted-foreground">{source || "Diagramme vide."}</pre></details>;
  return <div className="mermaid-chart my-4 overflow-x-auto rounded-xl border border-border/60 bg-background/70 px-3 py-4 sm:px-5 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
});

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); } catch { const textarea = document.createElement("textarea"); textarea.value = text; textarea.style.position = "fixed"; textarea.style.opacity = "0"; document.body.appendChild(textarea); textarea.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(textarea); } setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <button type="button" onClick={copy} title={copied ? copiedLabel : label} aria-label={copied ? copiedLabel : label} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{copied ? copiedLabel : label}</span></button>;
}

function formatTime(ts?: number) { if (!ts) return ""; try { return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }

const markdownComponents = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || ""); const language = match ? match[1] : ""; const codeString = String(children).replace(/\n$/, ""); const isBlock = !!className || codeString.includes("\n");
    if (!isBlock) return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.84em]" {...props}>{children}</code>;
    if (language.toLowerCase() === "mermaid") return <Mermaid chart={codeString} />;
    return <div className="group/code relative my-4 overflow-hidden rounded-xl border border-border/60 bg-slate-950 text-slate-100 dark:bg-black"><pre className="overflow-x-auto p-4 text-xs leading-6"><code className={className} {...props}>{children}</code></pre><div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/code:opacity-100 focus-within:opacity-100"><CopyButton text={codeString} label="Copier" copiedLabel="Copié" /></div></div>;
  },
  p: ({ children }: any) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="mb-3 mt-7 text-xl font-bold tracking-tight first:mt-0">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-2 mt-6 text-lg font-semibold tracking-tight first:mt-0">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 mt-5 text-base font-semibold first:mt-0">{children}</h3>,
  ul: ({ children }: any) => <ul className="mb-3 list-disc space-y-1.5 pl-6">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 list-decimal space-y-1.5 pl-6">{children}</ol>,
  blockquote: ({ children }: any) => <blockquote className="my-4 border-l-2 border-primary/35 pl-4 text-muted-foreground">{children}</blockquote>,
  a: ({ children, href }: any) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline decoration-primary/25 underline-offset-4 hover:decoration-primary">{children}</a>,
  table: ({ children }: any) => <div className="my-4 overflow-x-auto rounded-xl border border-border/60"><table className="w-full text-left text-xs">{children}</table></div>,
  th: ({ children }: any) => <th className="border-b border-border/60 bg-muted/70 px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }: any) => <td className="border-b border-border/45 px-3 py-2 align-top last:border-b-0">{children}</td>,
  hr: () => <hr className="my-6 border-border/55" />,
};

export default function ChatPage() {
  const { t } = useI18n(); const chatMutation = useChatWithAI(); const suggestions = [t("chat.suggestion.1"), t("chat.suggestion.2"), t("chat.suggestion.3"), t("chat.suggestion.4")]; const makeWelcome = useCallback((): Message => ({ id: 0, role: "assistant", content: t("chat.welcome"), sources: [], createdAt: Date.now() }), [t]);
  const [messages, setMessages] = useState<Message[]>(() => [makeWelcome()]); const [input, setInput] = useState(""); const [convId, setConvId] = useState(() => Math.random().toString(36).slice(2)); const [isAtBottom, setIsAtBottom] = useState(true); const [unreadCount, setUnreadCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null); const messagesEndRef = useRef<HTMLDivElement>(null); const textareaRef = useRef<HTMLTextAreaElement>(null); const isComposingRef = useRef(false);
  const isNearBottom = useCallback(() => { const el = messagesContainerRef.current; return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 96; }, []);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => { messagesEndRef.current?.scrollIntoView({ behavior, block: "end" }); setUnreadCount(0); setIsAtBottom(true); }, []);
  useEffect(() => { if (!messages.length) return; if (isNearBottom()) requestAnimationFrame(() => scrollToBottom()); else setUnreadCount((count) => count + 1); }, [messages, isNearBottom, scrollToBottom]);
  useEffect(() => { const el = textareaRef.current; if (!el) return; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 180)}px`; }, [input]);
  const sendMessage = async (rawText: string) => { const text = rawText.trim(); if (!text || text.length > MAX_MESSAGE_LENGTH || chatMutation.isPending) return; setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text, createdAt: Date.now() }]); setInput(""); try { const res = await chatMutation.mutateAsync({ data: { message: text, conversation_id: convId } }); setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: res.response, sources: res.sources, model: res.model_used ?? undefined, time_ms: res.response_time_ms ?? undefined, createdAt: Date.now() }]); } catch { setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: t("chat.errorMessage"), isError: true, retryText: text, createdAt: Date.now() }]); } finally { requestAnimationFrame(() => textareaRef.current?.focus()); } };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey && !isComposingRef.current) { event.preventDefault(); void sendMessage(input); } };
  const startNewConversation = () => { setMessages([makeWelcome()]); setInput(""); setConvId(Math.random().toString(36).slice(2)); requestAnimationFrame(() => textareaRef.current?.focus()); };
  const isWelcomeOnly = messages.length <= 1; const remaining = MAX_MESSAGE_LENGTH - input.length;
  return <section className="flex h-[calc(100dvh-58px)] min-h-0 flex-col bg-background"><header className="shrink-0 border-b border-border/45 bg-background/80 backdrop-blur-xl"><div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:px-6"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/9 text-primary"><Sparkles className="h-4 w-4" /></div><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-semibold tracking-tight">{t("chat.title")}</h1><span className="hidden items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary/75 sm:inline-flex"><Zap className="h-2.5 w-2.5" />{t("chat.badge")}</span></div><p className="truncate text-[11px] text-muted-foreground">{t("chat.subtitle")}</p></div></div><button type="button" onClick={startNewConversation} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("chat.newConversation")}</span></button></div></header>
  <div ref={messagesContainerRef} onScroll={() => { const atBottom = isNearBottom(); setIsAtBottom(atBottom); if (atBottom) setUnreadCount(0); }} className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-3xl px-4 pb-40 pt-7 sm:px-6 sm:pt-10">
  {isWelcomeOnly ? <div className="flex min-h-[calc(100dvh-230px)] flex-col items-center justify-center text-center"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/9 text-primary ring-1 ring-primary/10"><Bot className="h-6 w-6" /></div><h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-[2rem]">{t("chat.emptyTitle")}</h2><div className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{messages[0]?.content.split("\n").map((line, index) => <p key={index}>{line}</p>)}</div><div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="group min-h-16 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/20 hover:bg-card hover:text-foreground hover:shadow-sm"><span className="leading-5">{suggestion}</span><span className="mt-1 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground/45 transition-colors group-hover:text-primary/65">{t("chat.you")}</span></button>)}</div></div> : <div className="space-y-10">{messages.map((message) => { const isUser = message.role === "user"; return <article key={message.id} className={`group flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}>{!isUser && <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/8">{message.isError ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <Bot className="h-3.5 w-3.5" />}</div>}<div className={isUser ? "max-w-[88%] sm:max-w-[72%]" : "min-w-0 max-w-[calc(100%-2.5rem)] flex-1 sm:max-w-[88%]"}><div className={isUser ? "rounded-[22px] rounded-br-md bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground shadow-sm" : message.isError ? "rounded-xl border border-destructive/15 bg-destructive/5 px-3 py-2.5 text-sm leading-6" : "text-sm leading-7 text-foreground"}>{message.isError && <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{t("common.error")}</div>}{isUser ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown>}</div><div className={`mt-1.5 flex items-center gap-1 text-[9px] text-muted-foreground/45 ${isUser ? "justify-end" : "justify-start"}`}>{!isUser && <span>{t("chat.assistant")}</span>}{message.createdAt && <span>· {formatTime(message.createdAt)}</span>}{!isUser && message.time_ms ? <span>· {message.time_ms} ms</span> : null}{!isUser && !message.isError && <span className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"><CopyButton text={message.content} label="Copier" copiedLabel="Copié" /></span>}{message.isError && message.retryText && <button type="button" onClick={() => void sendMessage(message.retryText || "")} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><RotateCcw className="h-3 w-3" />Réessayer</button>}</div>{!isUser && message.sources?.length ? <details className="mt-2 group/sources"><summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1.5 py-1 text-[9px] font-medium text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"><BookOpen className="h-3 w-3" />{message.sources.length} source{message.sources.length > 1 ? "s" : ""}</summary><div className="mt-1.5 flex flex-wrap gap-1.5 pl-1">{message.sources.map((source) => <span key={source} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/55 bg-muted/35 px-2 py-1 text-[9px] text-muted-foreground"><BookOpen className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{source}</span></span>)}</div></details> : null}</div>{isUser && <div className="mt-1 hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:flex"><User className="h-3.5 w-3.5" /></div>}</article>; })}{chatMutation.isPending && <article className="flex gap-3 sm:gap-4"><div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/8"><Bot className="h-3.5 w-3.5" /></div><div className="flex items-center gap-1.5 pt-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/45 [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/25 [animation-delay:300ms]" /></div></article>}<div ref={messagesEndRef} /></div>}
  </div>{!isAtBottom && messages.length > 1 && <button type="button" onClick={() => scrollToBottom()} className="fixed bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border/60 bg-background/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-xl"><span className="inline-flex items-center gap-2"><ArrowDown className="h-3.5 w-3.5" />{unreadCount > 0 ? `${unreadCount} nouveaux messages` : "Revenir en bas"}</span></button>}</div>
  <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background via-background/92 to-transparent pb-4 pt-12 sm:pb-5"><div className="pointer-events-auto mx-auto w-full max-w-3xl px-3 sm:px-6"><form onSubmit={(event) => { event.preventDefault(); void sendMessage(input); }} className="rounded-[24px] border border-border/70 bg-background/95 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.07)] backdrop-blur-xl dark:shadow-[0_14px_42px_rgba(0,0,0,0.28)]"><div className="flex items-end gap-2"><textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} onCompositionStart={() => { isComposingRef.current = true; }} onCompositionEnd={() => { isComposingRef.current = false; }} rows={1} maxLength={MAX_MESSAGE_LENGTH} placeholder={t("chat.inputPlaceholder")} aria-label={t("chat.inputPlaceholder")} className="max-h-44 min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground/55 focus:ring-0" /><button type="submit" disabled={!input.trim() || chatMutation.isPending || remaining < 0} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Envoyer le message">{chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div><div className="flex items-center justify-between px-3 pb-0.5 pt-0.5 text-[9px] text-muted-foreground/45"><span className="hidden sm:inline">Entrée pour envoyer · Shift + Entrée pour une nouvelle ligne</span><span className="sm:hidden">Entrée pour envoyer</span><span className={remaining < 100 ? "text-primary" : undefined}>{remaining} caractères</span></div></form></div></div>
  </section>;
}
