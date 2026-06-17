import { useState, useRef, useEffect } from "react";
import { useChatWithAI } from "@workspace/api-client-react";
import { Bot, Send, User, Zap, BookOpen, AlertTriangle } from "lucide-react";
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
}

export default function ChatPage() {
  const { t } = useI18n();

  const SUGGESTIONS = [
    t("chat.suggestion.1"),
    t("chat.suggestion.2"),
    t("chat.suggestion.3"),
    t("chat.suggestion.4"),
  ];

  const WELCOME: Message = {
    id: 0,
    role: "assistant",
    content: t("chat.welcome"),
    sources: [],
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [convId] = useState(() => Math.random().toString(36).slice(2));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = useChatWithAI();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await chatMutation.mutateAsync({ data: { message: text, conversation_id: convId } });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: res.response,
        sources: res.sources,
        model: res.model_used ?? undefined,
        time_ms: res.response_time_ms ?? undefined,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: "Désolé, une erreur est survenue lors de la communication avec l'assistant.",
      }]);
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full min-h-0" style={{ height: "calc(100vh - 58px)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 flex-shrink-0 gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("chat.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("chat.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full self-start sm:self-auto">
          <Zap className="w-3 h-3" />
          {t("chat.badge")}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-card border border-card-border rounded-xl p-4 space-y-4 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"}`}>
              {msg.role === "assistant" ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] space-y-2 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
              <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${msg.role === "assistant" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
                {msg.role === "assistant" ? (
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
                            <div className="relative group">
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
                ) : (
                  msg.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                  ))
                )}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.sources.map(s => (
                    <span key={s} className="flex items-center gap-1 text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                      <BookOpen className="w-2.5 h-2.5" /> {s}
                    </span>
                  ))}
                </div>
              )}
              {msg.time_ms && (
                <span className="text-[10px] text-muted-foreground">{msg.model} · {msg.time_ms}ms</span>
              )}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-secondary px-4 py-3 rounded-xl">
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

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mt-3 flex-shrink-0">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-secondary border border-border px-3 py-1.5 rounded-full hover:bg-secondary/80 hover:border-primary/30 transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-2 flex-shrink-0">
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder={t("chat.inputPlaceholder")}
            data-testid="input-chat"
            className="w-full h-11 px-4 pr-12 rounded-xl bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={chatMutation.isPending || !input.trim()}
          data-testid="button-send"
          className="w-11 h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground flex-shrink-0">
        <AlertTriangle className="w-3 h-3" />
        <span>{t("chat.disclaimer")}</span>
      </div>
    </div>
  );
}
