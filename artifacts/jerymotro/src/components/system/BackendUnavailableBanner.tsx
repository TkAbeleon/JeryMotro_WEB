import { useEffect, useState } from "react";
import { ServerOff } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const messages = {
  fr: {
    title: "JeryMotro est actuellement indisponible",
    description:
      "Le serveur n’est actuellement pas disponible. Les services de la plateforme, y compris la connexion, ne sont pas accessibles pour le moment.",
  },
  mg: {
    title: "Tsy azo ampiasaina amin’izao fotoana izao i JeryMotro",
    description:
      "Tsy mandeha amin’izao fotoana izao ny serveur. Noho izany dia tsy azo ampiasaina ny serivisy rehetra amin’ny sehatra, anisan’izany ny fidirana.",
  },
  en: {
    title: "JeryMotro is currently unavailable",
    description:
      "The server is currently unavailable. As a result, the platform services, including sign-in, are not accessible at the moment.",
  },
} as const;

const HEALTH_CHECK_INTERVAL_MS = 30_000;
const HEALTH_CHECK_TIMEOUT_MS = 8_000;

// This is only the initial/fallback state. A successful /health response always wins.
const DEFAULT_BACKEND_OFFLINE =
  String(import.meta.env.VITE_BACKEND_DEFAULT_OFFLINE ?? "true").toLowerCase() !== "false";

type BackendStatus = "checking" | "online" | "offline";

function getHealthUrl(): string | null {
  const apiUrl = import.meta.env.VITE_API_URL;

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
      signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { status?: unknown };
    return data?.status === "ok";
  } catch {
    return false;
  }
}

export function BackendUnavailableBanner() {
  const { lang } = useI18n();
  const [status, setStatus] = useState<BackendStatus>(
    DEFAULT_BACKEND_OFFLINE ? "offline" : "checking",
  );
  const message = messages[lang];

  useEffect(() => {
    let disposed = false;
    let timeoutId: number | undefined;

    const runCheck = async () => {
      const controller = new AbortController();
      const abortTimeoutId = window.setTimeout(
        () => controller.abort(),
        HEALTH_CHECK_TIMEOUT_MS,
      );

      const online = await checkBackendHealth(controller.signal);
      window.clearTimeout(abortTimeoutId);

      if (disposed) return;

      setStatus(online ? "online" : "offline");
      timeoutId = window.setTimeout(runCheck, HEALTH_CHECK_INTERVAL_MS);
    };

    runCheck();

    return () => {
      disposed = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (status !== "offline") return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="border-b border-primary/20 bg-primary/5 px-4 py-3 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 text-sm">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ServerOff className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{message.title}</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">
            {message.description}
          </p>
        </div>
      </div>
    </aside>
  );
}
