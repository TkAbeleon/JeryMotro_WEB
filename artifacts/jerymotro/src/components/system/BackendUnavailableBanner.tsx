import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ServerOff } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const messages = {
  fr: {
    title: "JeryMotro est actuellement indisponible",
    description:
      "Le serveur n’est actuellement pas disponible. Les services de la plateforme, y compris la connexion, ne sont pas accessibles pour le moment.",
    retry: "Réessayer",
    checking: "Vérification…",
  },
  mg: {
    title: "Tsy azo ampiasaina amin’izao fotoana izao i JeryMotro",
    description:
      "Tsy mandeha amin’izao fotoana izao ny serveur. Noho izany dia tsy azo ampiasaina ny serivisy rehetra amin’ny sehatra, anisan’izany ny fidirana.",
    retry: "Andramo indray",
    checking: "Manamarina…",
  },
  en: {
    title: "JeryMotro is currently unavailable",
    description:
      "The server is currently unavailable. As a result, the platform services, including sign-in, are not accessible at the moment.",
    retry: "Retry",
    checking: "Checking…",
  },
} as const;

const HEALTH_CHECK_INTERVAL_MS = 30_000;
const HEALTH_CHECK_TIMEOUT_MS = 8_000;

// Used only for the first render. A successful /health response always changes the state to online.
const DEFAULT_BACKEND_OFFLINE =
  String(import.meta.env.VITE_BACKEND_DEFAULT_OFFLINE ?? "true").toLowerCase() !== "false";

function getApiUrl(): string | null {
  const envUrl = import.meta.env.VITE_API_URL;
  if (
    envUrl &&
    (envUrl.startsWith("http://") || envUrl.startsWith("https://") || envUrl.startsWith("/"))
  ) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const apiPort = import.meta.env.VITE_API_BACKEND_PORT || "8081";
    return `${window.location.protocol}//${window.location.hostname || "localhost"}:${apiPort}`;
  }

  return null;
}

function getHealthUrl(): string | null {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;
  return `${apiUrl.replace(/\/+$/, "")}/health`;
}

async function checkBackendHealth(signal: AbortSignal): Promise<boolean> {
  const healthUrl = getHealthUrl();
  if (!healthUrl) return false;

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return false;

    const data = (await response.json()) as { status?: unknown };
    return data?.status === "ok";
  } catch {
    return false;
  }
}

export function BackendUnavailableBanner() {
  const { lang } = useI18n();
  const message = messages[lang];
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    DEFAULT_BACKEND_OFFLINE ? "offline" : "checking",
  );
  const [isRetrying, setIsRetrying] = useState(false);

  const runCheck = useCallback(async () => {
    setIsRetrying(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    try {
      const online = await checkBackendHealth(controller.signal);
      setStatus(online ? "online" : "offline");
    } finally {
      window.clearTimeout(timeoutId);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    let disposed = false;

    const check = async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

      try {
        const online = await checkBackendHealth(controller.signal);
        if (!disposed) setStatus(online ? "online" : "offline");
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void check();

    const intervalId = window.setInterval(() => {
      void check();
    }, HEALTH_CHECK_INTERVAL_MS);

    const handleOnline = () => void check();
    window.addEventListener("online", handleOnline);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (status !== "offline") return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 top-[58px] z-[100] border-b border-primary/20 bg-background/95 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 text-sm">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ServerOff className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{message.title}</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">{message.description}</p>
        </div>
        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={isRetrying}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>{isRetrying ? message.checking : message.retry}</span>
        </button>
      </div>
    </aside>
  );
}
