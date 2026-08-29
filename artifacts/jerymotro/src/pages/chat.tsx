import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { useChatWithAI } from "@workspace/api-client-react";
import {
  Bot,
  Send,
  User,
  Zap,
  BookOpen,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  ArrowDown,
  PlusCircle,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

// Initialize mermaid for premium dynamic diagrams
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "inherit",
});

const MAX_MESSAGE_LENGTH = 2000;

function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const elementId = useRef(`mermaid-${Math.random().toString(36).substring(2, 11)}`);

  useEffect(() => {
    let active = true;
    const renderChart = async () => {
      try {
        setError(null);
        const { svg: renderedSvg } = await mermaid.render(elementId.current, chart);
        if (active) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (active) {
          setError("Erreur de rendu du diagramme Mermaid.");
        }
      }
    };

    renderChart();

    return () => {
      active = false;
      const element = document.getElementById(elementId.current);
      if (element) {
        element.remove();
      }
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono whitespace-pre-wrap">
        {error}
        <pre className="mt-2 text-[10px] text-muted-foreground">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center p-6 bg-secondary/50 rounded-lg animate-pulse">
        <span className="text-xs text-muted-foreground">Chargement du diagramme...</span>
      </div>
    );
  }

  return (
    <div
      className="mermaid-chart flex justify-center bg-secondary/30 p-4 rounded-xl border border-border/50 my-3 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  model?: string;
  time_ms?: number;
  createdAt?: number;
  isError?: boolean;
  retryText?: string;
}

/** Bouton de copie avec retour visuel court. */
function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback silencieux si l'API Clipboard est indisponible
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-secondary"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? copiedLabel : label}
    </button>
  );
}

function formatTime(ts?: number) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatPage() {
  const { t } = useI18n();

  const SUGGESTIONS = [
    t("chat.suggestion.1"),
    t("chat.suggestion.2"),
    t("chat.suggestion.3"),
    t("chat.suggestion.4"),
  ];

  const makeWelcome = useCallback(
    (): Message => ({
      id: 0,
      role: "assistant",
      content: t("chat.welcome"),
      sources: [],
      createdAt: Date.now(),
    }),
    [t]
  );

  const [messages, setMessages] = useState<Message[]>(() => [makeWelcome()]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState(() => Math.random().toString(36).slice(2));
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);
  const chatMutation = useChatWithAI();

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUnreadCount(0);
    setIsAtBottom(true);
  }, []);

  // Auto-scroll uniquement si l'utilisateur est déjà proche du bas, sinon
  // afficher un badge "nouveaux messages" pour ne pas casser sa lecture.
  useEffect(() => {
    if (messages.length === 0) return;
    if (isNearBottom()) {
      scrollToBottom();
    } else {
      setUnreadCount((c) => c + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleScroll = () => {
    const atBottom = isNearBottom();
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  };

  // Auto-resize de la zone de saisie (comme les apps de chat modernes).
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH || chatMutation.isPending) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: text, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    requestAnimationFrame(() => textareaRef.current?.focus());

    try {
      const res = await chatMutation.mutateAsync({ data: { message: text, conversation_id: convId } });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: res.response,
          sources: res.sources,
          model: res.model_used ?? undefined,
          time_ms: res.response_time_ms ?? undefined,
          createdAt: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: t("chat.errorMessage"),
          isError: true,
          retryText: text,
          createdAt: Date.now(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startNewConversation = () => {
    setMessages([makeWelcome()]);
    setInput("");
    setConvId(Math.random().toString(36).slice(2));
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const isEmptyState = messages.length <= 1;
  const remaining = MAX_MESSAGE_LENGTH - input.length;
  const showCounter = remaining <= 200;

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full min-h-0" style={{ height: "calc(100vh - 58px)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 flex-shrink-0 gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("chat.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("chat.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEmptyState && (
            <button
              type="button"
              onClick={startNewConversation}
              className="flex items-center gap-1.5 text-xs border border-border bg-card px-3 py-1.5 rounded-full hover:bg-secondary hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
              title={t("chat.newConversation")}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("chat.newConversation")}</span>
            </button>
          )}
          <div className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3" />
            {t("chat.badge")}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="h-full overflow-y-auto bg-card border border-card-border rounded-xl p-4 space-y-5 scroll-smooth"
        >
          {isEmptyState ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-heading text-lg font-semibold mb-1">{t("chat.emptyTitle")}</h2>
              <div className="max-w-md text-sm text-muted-foreground leading-relaxed">
                {messages[0]?.content.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-2" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === "assistant"
                      ? msg.isError
                        ? "bg-destructive/15"
                        : "bg-primary/20"
                      : "bg-secondary"
                  }`}
                  aria-hidden="true"
                >
                  {msg.role === "assistant" ? (
                    <Bot className={`w-4 h-4 ${msg.isError ? "text-destructive" : "text-primary"}`} />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
                  <span className="sr-only">{msg.role === "assistant" ? t("chat.assistant") : t("chat.you")}</span>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? msg.isError
                          ? "bg-destructive/10 border border-destructive/20 text-foreground"
                          : "bg-secondary text-foreground"
                        : "bg-primary text-primary-foreground"
                    } ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        {msg.isError && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t("common.error")}
                          </div>
                        )}
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const lang = match ? match[1] : "";
                              const codeString = String(children).replace(/\n$/, "");
                              const isBlock = !!className || codeString.includes("\n");

                              if (isBlock) {
                                if (lang === "mermaid") {
                                  return <Mermaid chart={codeString} />;
                                }
                                return (
                                  <div className="relative group/code">
                                    <pre className="bg-secondary/50 p-4 rounded-xl border border-border/50 text-xs font-mono overflow-x-auto my-2">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                );
                              }

                              return (
                                <code className="bg-secondary/80 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 font-heading">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1.5 font-heading text-primary">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-medium mt-2 mb-1 font-heading">{children}</h3>,
                            p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-sm">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-sm">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-3 border border-border rounded-lg bg-card/50">
                                <table className="w-full text-xs text-left border-collapse">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-secondary text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">{children}</thead>,
                            tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
                            tr: ({ children }) => <tr className="hover:bg-secondary/20 transition-colors">{children}</tr>,
                            th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
                            td: ({ children }) => <td className="px-3 py-2 text-foreground/90">{children}</td>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-primary pl-3 italic my-2 text-muted-foreground bg-primary/5 py-1 rounded-r-md">
                                {children}
                              </blockquote>
                            ),
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        {msg.isError && msg.retryText && (
                          <button
                            type="button"
                            onClick={() => sendMessage(msg.retryText!)}
                            className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-destructive hover:underline"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {t("chat.retry")}
                          </button>
                        )}
                      </>
                    ) : (
                      msg.content.split("\n").map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-2" : ""}>
                          {line}
                        </p>
                      ))
                    )}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s) => (
                        <span key={s} className="flex items-center gap-1 text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                          <BookOpen className="w-2.5 h-2.5" /> {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Barre méta : heure / modèle / latence + actions (copier), visible au survol sur desktop */}
                  <div className={`flex items-center gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {(msg.createdAt || msg.time_ms) && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(msg.createdAt)}
                        {msg.time_ms ? ` · ${msg.model ?? ""} · ${msg.time_ms}ms` : ""}
                      </span>
                    )}
                    {msg.role === "assistant" && !msg.isError && idx > 0 && (
                      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <CopyButton text={msg.content} label={t("chat.copy")} copiedLabel={t("chat.copied")} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {chatMutation.isPending && (
            <div className="flex gap-3 animate-in fade-in duration-200" aria-label={t("chat.thinking")}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bouton flottant "aller aux derniers messages" */}
        {!isAtBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-card border border-border shadow-md text-xs font-medium px-3 py-1.5 rounded-full hover:bg-secondary transition-colors animate-in fade-in slide-in-from-bottom-1"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            {t("chat.scrollToBottom")}
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Suggestions */}
      {isEmptyState && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-secondary border border-border px-3 py-2 rounded-xl hover:bg-secondary/80 hover:border-primary/30 transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex-shrink-0">
        <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-1.5 pl-4 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => (isComposingRef.current = true)}
            onCompositionEnd={() => (isComposingRef.current = false)}
            placeholder={t("chat.inputPlaceholder")}
            data-testid="input-chat"
            rows={1}
            autoFocus
            maxLength={MAX_MESSAGE_LENGTH + 200}
            aria-label={t("chat.inputPlaceholder")}
            className="flex-1 resize-none bg-transparent text-sm outline-none py-2.5 leading-relaxed placeholder:text-muted-foreground max-h-40"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={chatMutation.isPending || !input.trim() || input.length > MAX_MESSAGE_LENGTH}
            data-testid="button-send"
            aria-label={t("chat.send")}
            className="w-10 h-10 flex-shrink-0 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {showCounter && (
          <div className={`mt-1 text-[10px] text-right ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {input.length}/{MAX_MESSAGE_LENGTH}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground flex-shrink-0">
        <AlertTriangle className="w-3 h-3" />
        <span>{t("chat.disclaimer")}</span>
      </div>
    </div>
  );
}
