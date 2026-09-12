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
      role="alert"
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 top-[70px] z-[100] flex justify-center px-3 sm:px-4"
    >
      <div className="pointer-events-auto flex w-full max-w-[620px] items-center gap-3 rounded-2xl border border-red-200/90 bg-red-50/95 px-3 py-2.5 text-red-950 shadow-lg shadow-red-950/10 backdrop-blur-md dark:border-red-900/80 dark:bg-red-950/95 dark:text-red-50 sm:gap-3.5 sm:px-4 sm:py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/25 dark:bg-red-500">
          <ServerOff className="h-4.5 w-4.5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <CircleAlert className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <span className="truncate text-[10px] font-extrabold tracking-[0.1em] text-red-700 dark:text-red-300">
              {message.badge}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm font-bold leading-tight text-red-950 dark:text-red-50">
            {message.title}
          </p>
          <p className="mt-0.5 hidden truncate text-xs text-red-800/80 dark:text-red-100/75 sm:block">
            {message.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={isRetrying}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-300 bg-white/90 px-3 text-xs font-bold text-red-700 shadow-sm transition hover:border-red-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:bg-red-900/70 dark:text-red-50 dark:hover:bg-red-900"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
          <span className="hidden sm:inline">{isRetrying ? message.checking : message.retry}</span>
        </button>
      </div>
    </aside>
  );
}
