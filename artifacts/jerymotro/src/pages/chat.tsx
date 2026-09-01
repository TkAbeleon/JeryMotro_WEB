import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
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
  return source.replace(/^\s*```(?:mermaid)?\s*/i, "").replace(/\s*```\s*$/i, "").replace(/\r\n?/g, "\n").trim();
}

function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const elementId = useRef(`mermaid-${Math.random().toString(36).slice(2, 11)}`);
  const source = normalizeMermaid(chart);

  useEffect(() => {
    let active = true;
    setSvg("");
    setError(null);
    const render = async () => {
      if (!source) { setError("Diagramme Mermaid vide."); return; }
      try {
        await mermaid.parse(source, { suppressErrors: false });
        const result = await mermaid.render(elementId.current, source);
        if (active) setSvg(result.svg);
        document.getElementById(elementId.current)?.remove();
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (active) setError("Impossible de prévisualiser ce diagramme Mermaid.");
        document.getElementById(elementId.current)?.remove();
      }
    };
    void render();
    return () => { active = false; document.getElementById(elementId.current)?.remove(); };
  }, [source]);

  if (error) return <details className="my-3 overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5"><summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{error}</summary><pre className="max-h-64 overflow-auto border-t border-destructive/10 px-3 py-3 text-[10px] leading-5 text-muted-foreground">{source}</pre></details>;
  if (!svg) return <div className="my-3 flex min-h-24 items-center justify-center rounded-2xl border border-border/70 bg-muted/35 text-xs text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Prévisualisation du diagramme…</div>;
  return <div className="mermaid-chart my-3 overflow-x-auto rounded-2xl border border-border/70 bg-background p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); } catch { const textarea = document.createElement("textarea"); textarea.value = text; textarea.style.position = "fixed"; textarea.style.opacity = "0"; document.body.appendChild(textarea); textarea.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(textarea); } setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <button type="button" onClick={copy} title={copied ? copiedLabel : label} aria-label={copied ? copiedLabel : label} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{copied ? copiedLabel : label}</span></button>;
}
function formatTime(ts?: number) { if (!ts) return ""; try { return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }

export default function ChatPage() {
  const { t } = useI18n();
  const chatMutation = useChatWithAI();
  const suggestions = [t("chat.suggestion.1"), t("chat.suggestion.2"), t("chat.suggestion.3"), t("chat.suggestion.4")];
  const makeWelcome = useCallback((): Message => ({ id: 0, role: "assistant", content: t("chat.welcome"), sources: [], createdAt: Date.now() }), [t]);
  const [messages, setMessages] = useState<Message[]>(() => [makeWelcome()]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState(() => Math.random().toString(36).slice(2));
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);
  const isNearBottom = useCallback(() => { const el = messagesContainerRef.current; return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 96; }, []);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => { messagesEndRef.current?.scrollIntoView({ behavior, block: "end" }); setUnreadCount(0); setIsAtBottom(true); }, []);
  useEffect(() => { if (!messages.length) return; if (isNearBottom()) requestAnimationFrame(() => scrollToBottom()); else setUnreadCount((count) => count + 1); }, [messages, isNearBottom, scrollToBottom]);
  useEffect(() => { const el = textareaRef.current; if (!el) return; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 180)}px`; }, [input]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text, createdAt: Date.now() }]);
    setInput("");
    try { const res = await chatMutation.mutateAsync({ data: { message: text, conversation_id: convId } }); setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: res.response, sources: res.sources, model: res.model_used ?? undefined, time_ms: res.response_time_ms ?? undefined, createdAt: Date.now() }]); }
    catch { setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: t("chat.errorMessage"), isError: true, retryText: text, createdAt: Date.now() }]); }
    finally { requestAnimationFrame(() => textareaRef.current?.focus()); }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey && !isComposingRef.current) { event.preventDefault(); void sendMessage(input); } };
  const startNewConversation = () => { setMessages([makeWelcome()]); setInput(""); setConvId(Math.random().toString(36).slice(2)); requestAnimationFrame(() => textareaRef.current?.focus()); };
  const isWelcomeOnly = messages.length <= 1;
  const remaining = MAX_MESSAGE_LENGTH - input.length;

  return <section className="flex h-[calc(100dvh-58px)] min-h-0 flex-col bg-background">
    <header className="border-b border-border/60 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15"><Sparkles className="h-4 w-4 text-primary" /></div><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate font-heading text-sm font-semibold sm:text-base">{t("chat.title")}</h1><span className="hidden items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary sm:inline-flex"><Zap className="h-2.5 w-2.5" />{t("chat.badge")}</span></div><p className="truncate text-xs text-muted-foreground">{t("chat.subtitle")}</p></div></div><button type="button" onClick={startNewConversation} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold shadow-sm transition-all hover:border-primary/30 hover:bg-muted"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{t("chat.newConversation")}</span></button></div></header>
    <div ref={messagesContainerRef} onScroll={() => { const atBottom = isNearBottom(); setIsAtBottom(atBottom); if (atBottom) setUnreadCount(0); }} className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-4xl px-4 pb-44 pt-6 sm:px-6 sm:pt-8">
      {isWelcomeOnly ? <div className="flex min-h-[calc(100dvh-250px)] flex-col items-center justify-center text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-primary/15 bg-primary/8 shadow-sm"><Bot className="h-7 w-7 text-primary" /></div><h2 className="max-w-xl font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{t("chat.emptyTitle")}</h2><div className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{messages[0]?.content.split("\n").map((line, index) => <p key={index}>{line}</p>)}</div><div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-xs font-medium text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:text-foreground hover:shadow-md sm:text-sm">{suggestion}</button>)}</div></div> : <div className="space-y-8">{messages.map((message) => { const isUser = message.role === "user"; return <article key={message.id} className={`flex gap-3.5 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}>{!isUser && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">{message.isError ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Bot className="h-4 w-4" />}</div>}<div className={isUser ? "max-w-[85%] sm:max-w-[72%]" : "min-w-0 max-w-[92%] flex-1 sm:max-w-[82%]"}><div className={isUser ? "rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm leading-7 text-primary-foreground shadow-sm" : message.isError ? "rounded-2xl border border-destructive/15 bg-destructive/5 px-1 py-1 text-sm leading-7" : "px-1 py-0.5 text-sm leading-7 text-foreground"}>{message.isError && <div className="mb-2 flex items-center gap-2 px-3 pt-2 text-xs font-semibold text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{t("common.error")}</div>}{isUser ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({ className, children, ...props }) { const match = /language-(\w+)/.exec(className || ""); const language = match ? match[1] : ""; const codeString = String(children).replace(/\n$/, ""); const isBlock = !!className || codeString.includes("\n"); if (!isBlock) return <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.84em]" {...props}>{children}</code>; if (language === "mermaid") return <Mermaid chart={codeString} />; return <div className="group/code relative my-3 overflow-hidden rounded-2xl border border-border/70 bg-slate-950 text-slate-100 dark:bg-black"><pre className="overflow-x-auto p-4 text-xs leading-6"><code className={className} {...props}>{children}</code></pre><div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/code:opacity-100"><CopyButton text={codeString} label="Copier" copiedLabel="Copié" /></div></div>; }, p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>, h1: ({ children }) => <h1 className="mb-3 mt-6 font-heading text-xl font-bold first:mt-0">{children}</h1>, h2: ({ children }) => <h2 className="mb-2 mt-5 font-heading text-lg font-semibold first:mt-0">{children}</h2>, h3: ({ children }) => <h3 className="mb-2 mt-4 font-heading text-base font-semibold first:mt-0">{children}</h3>, ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-6">{children}</ul>, ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-6">{children}</ol>, blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-primary/40 pl-4 text-muted-foreground">{children}</blockquote>, a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">{children}</a>, table: ({ children }) => <div className="my-3 overflow-x-auto rounded-xl border border-border/70"><table className="w-full text-left text-xs">{children}</table></div>, th: ({ children }) => <th className="border-b border-border/70 bg-muted px-3 py-2 font-semibold">{children}</th>, td: ({ children }) => <td className="border-b border-border/50 px-3 py-2 align-top last:border-b-0">{children}</td>, hr: () => <hr className="my-5 border-border/70" /> }}>{message.content}</ReactMarkdown>}</div><div className={`mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/55 ${isUser ? "justify-end" : "justify-start"}`}>{!isUser && <span>{t("chat.assistant")}</span>}{message.createdAt && <span>· {formatTime(message.createdAt)}</span>}{!isUser && message.time_ms ? <span>· {message.time_ms} ms</span> : null}{message.sources?.length ? <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold"><BookOpen className="h-2.5 w-2.5" />{message.sources.length} source{message.sources.length > 1 ? "s" : ""}</span> : null}{!isUser && !message.isError && <CopyButton text={message.content} label="Copier" copiedLabel="Copié" />}{message.isError && message.retryText && <button type="button" onClick={() => void sendMessage(message.retryText || "")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"><RotateCcw className="h-3 w-3" />Réessayer</button>}</div>{!isUser && message.sources?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{message.sources.map((source) => <span key={source} className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[10px] text-muted-foreground"><BookOpen className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{source}</span></span>)}</div> : null}</div>{isUser && <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:flex"><User className="h-4 w-4" /></div>}</article>; })}{chatMutation.isPending && <article className="flex gap-3.5 sm:gap-4"><div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10"><Bot className="h-4 w-4" /></div><div className="flex items-center gap-2 pt-1"><span className="h-2 w-2 animate-pulse rounded-full bg-primary/80" /><span className="h-2 w-2 animate-pulse rounded-full bg-primary/50 [animation-delay:150ms]" /><span className="h-2 w-2 animate-pulse rounded-full bg-primary/30 [animation-delay:300ms]" /></div></article>}<div ref={messagesEndRef} /></div>}
    </div>{!isAtBottom && messages.length > 1 && <button type="button" onClick={() => scrollToBottom()} className="fixed bottom-32 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-xl"><span className="inline-flex items-center gap-2"><ArrowDown className="h-3.5 w-3.5" />{unreadCount > 0 ? `${unreadCount} nouveaux messages` : "Revenir en bas"}</span></button>}</div>
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-10"><div className="pointer-events-auto mx-auto w-full max-w-4xl px-4 sm:px-6"><form onSubmit={(event) => { event.preventDefault(); void sendMessage(input); }} className="rounded-[26px] border border-border bg-background/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:shadow-[0_14px_48px_rgba(0,0,0,0.35)]"><div className="flex items-end gap-2"><textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} onCompositionStart={() => { isComposingRef.current = true; }} onCompositionEnd={() => { isComposingRef.current = false; }} rows={1} maxLength={MAX_MESSAGE_LENGTH} placeholder={t("chat.inputPlaceholder")} aria-label={t("chat.inputPlaceholder")} className="max-h-44 min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground/60 focus:ring-0" /><button type="submit" disabled={!input.trim() || chatMutation.isPending || remaining < 0} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Envoyer le message">{chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div><div className="flex items-center justify-between px-3 pb-1 pt-0.5 text-[10px] text-muted-foreground/55"><span className="hidden sm:inline">Entrée pour envoyer · Shift + Entrée pour une nouvelle ligne</span><span className="sm:hidden">Entrée pour envoyer</span><span className={remaining < 100 ? "text-primary" : undefined}>{remaining} caractères</span></div></form></div></div>
  </section>;
}
