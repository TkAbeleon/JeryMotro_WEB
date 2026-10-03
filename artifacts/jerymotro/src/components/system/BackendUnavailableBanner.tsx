import { useCallback, useEffect, useState } from "react";
import { CircleAlert, RefreshCw, ServerOff } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const messages = {
  fr: {
    badge: "ERREUR SERVEUR",
    title: "JeryMotro est actuellement indisponible",
    description:
      "Les services de la plateforme, y compris la connexion, ne sont pas accessibles pour le moment.",
    retry: "Réessayer",
    checking: "Vérification…",
  },
  mg: {
    badge: "OLANA AMIN’NY SERVEUR",
    title: "Tsy azo ampiasaina amin’izao fotoana izao i JeryMotro",
    description:
      "Tsy azo ampiasaina amin’izao fotoana izao ny serivisy rehetra amin’ny sehatra, anisan’izany ny fidirana.",
    retry: "Andramo indray",
    checking: "Manamarina…",
  },
  en: {
    badge: "SERVER ERROR",
    title: "JeryMotro is currently unavailable",
    description:
      "Platform services, including sign-in, are not accessible at the moment.",
    retry: "Retry",
    checking: "Checking…",
  },
} as const;

const HEALTH_CHECK_INTERVAL_MS = 30_000;
const HEALTH_CHECK_TIMEOUT_MS = 8_000;


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
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
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
      className="pointer-events-none fixed inset-x-3 top-[76px] z-[100] flex justify-center sm:inset-x-5 sm:justify-end"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-background/95 px-3.5 py-3 text-foreground shadow-[9px_9px_16px_rgb(163,177,198,0.45),-9px_-9px_16px_rgba(255,255,255,0.45)] backdrop-blur-md sm:px-4 sm:py-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-destructive shadow-[inset_6px_6px_10px_rgb(163,177,198,0.5),inset_-6px_-6px_10px_rgba(255,255,255,0.45)]">
          <ServerOff className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <CircleAlert className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
            <span className="truncate text-[10px] font-extrabold tracking-[0.1em] text-destructive">
              {message.badge}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-bold leading-tight">
            {message.title}
          </p>
          <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">
            {message.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={isRetrying}
          aria-label={isRetrying ? message.checking : message.retry}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-destructive shadow-[5px_5px_10px_rgb(163,177,198,0.45),-5px_-5px_10px_rgba(255,255,255,0.45)] transition-all duration-300 ease-out hover:-translate-y-px hover:shadow-[7px_7px_14px_rgb(163,177,198,0.5),-7px_-7px_14px_rgba(255,255,255,0.5)] active:translate-y-px active:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
