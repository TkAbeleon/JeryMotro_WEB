import { useState, useRef, useEffect } from "react";
import { useChatWithAI } from "@workspace/api-client-react";
import { mockChatResponse } from "@/lib/mock-data";
import { Bot, Send, User, Zap, BookOpen, AlertTriangle } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

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
      const mock = mockChatResponse(text);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: mock.response,
        sources: mock.sources,
        model: mock.model_used ?? undefined,
        time_ms: mock.response_time_ms ?? undefined,
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ height: "calc(100vh - 58px - 48px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("chat.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("chat.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full">
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
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                ))}
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
