import { useCallback, useState } from "react";
import { Activity, CheckCircle2, Database, Flame, Loader2, RefreshCw, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AsyncStateInline } from "@/components/ui/async-state";

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://") || envUrl.startsWith("/"))) return envUrl;
  const apiPort = import.meta.env.VITE_API_BACKEND_PORT || "8081";
  if (typeof window !== "undefined") return `${window.location.protocol}//${window.location.hostname || "localhost"}:${apiPort}`;
  return `http://localhost:${apiPort}`;
};

type ActionKey = "collect" | "process" | "score" | "clusters";
type ActionResult = { status?: string; message?: string; [key: string]: unknown };

type AdminAction = {
  key: ActionKey;
  title: string;
  description: string;
  endpoint: string;
  icon: typeof Database;
  tone: string;
};

const actions: AdminAction[] = [
  {
    key: "collect",
    title: "Collecter les données",
    description: "Récupère les données FIRMS manquantes et les ajoute à la base.",
    endpoint: "/internal/collect-missing",
    icon: Database,
    tone: "text-primary bg-primary/10",
  },
  {
    key: "process",
    title: "Traiter FIRMS",
    description: "Lance le traitement de collecte prévu par le pipeline d’administration.",
    endpoint: "/internal/process-firms",
    icon: Workflow,
    tone: "text-accent bg-accent/10",
  },
  {
    key: "score",
    title: "Calculer les scores",
    description: "Attribue un score de risque aux détections qui n’en possèdent pas encore.",
    endpoint: "/internal/run-scoring?limit=1000",
    icon: Sparkles,
    tone: "text-warning bg-warning/10",
  },
  {
    key: "clusters",
    title: "Reconstruire les clusters",
    description: "Regroupe les nouvelles détections et met à jour les événements de feu.",
    endpoint: "/internal/rebuild-clusters?limit=50000",
    icon: Flame,
    tone: "text-destructive bg-destructive/10",
  },
];

async function runAdminAction(endpoint: string): Promise<ActionResult> {
  const token = localStorage.getItem("jerymotro_token");
  if (!token) throw new Error("Session administrateur absente.");

  const baseUrl = getApiUrl().replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail = payload?.detail || `La requête a échoué (${response.status}).`;
    throw new Error(String(detail));
  }

  return payload ?? { status: "done" };
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [running, setRunning] = useState<ActionKey | null>(null);
  const [results, setResults] = useState<Partial<Record<ActionKey, ActionResult>>>({});
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (action: AdminAction) => {
    setRunning(action.key);
    setError(null);
    try {
      const result = await runAdminAction(action.endpoint);
      setResults((current) => ({ ...current, [action.key]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setRunning(null);
    }
  }, []);

  if (!isAdmin) {
    return (
      <AsyncStateInline
        type="error"
        title="Accès administrateur requis"
        description="Cette page est réservée aux comptes ayant le rôle admin."
      />
    );
  }

  return (
    <div className="min-h-full bg-background px-4 py-5 sm:px-6 sm:py-7 lg:px-8"><div className="mx-auto max-w-[1600px] space-y-7">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 shadow-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            <ShieldCheck className="h-3 w-3" /> Administration
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Centre d’administration</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Supervision des opérations backend réservées aux administrateurs JeryMotro.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-border/70 bg-card/60 shadow-sm px-3 py-2 text-xs sm:self-auto">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="font-semibold">{user?.full_name || user?.email || "Administrateur"}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Rôle admin</div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const result = results[action.key];
          const active = running === action.key;
          return (
            <article key={action.key} className="group flex min-h-[220px] flex-col rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm transition-colors hover:bg-card sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {result && <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />}
              </div>
              <h2 className="mt-4 font-heading text-sm font-semibold">{action.title}</h2>
              <p className="mt-1.5 flex-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
              <Button type="button" size="sm" className="mt-4 w-full" onClick={() => void execute(action)} disabled={running !== null}>
                {active ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                {active ? "Exécution…" : "Lancer"}
              </Button>
              {result && <div className="mt-3 rounded-lg bg-muted/45 px-2.5 py-2 text-[10px] leading-4 text-muted-foreground">{result.message || result.status || "Opération terminée"}</div>}
            </article>
          );
        })}
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-sm">
          <Activity className="mt-0.5 h-4 w-4 shrink-0" />
          <div><div className="font-semibold">Échec de l’opération</div><div className="mt-0.5 text-xs text-destructive/80">{error}</div></div>
        </div>
      )}

      <section className="rounded-xl border border-border/70 bg-card/45 p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Database className="h-4 w-4" /></div>
          <div>
            <h2 className="font-heading text-sm font-semibold">Ordre recommandé</h2>
            <p className="mt-1 text-xs text-muted-foreground">Collecte → scoring → reconstruction des clusters. Le traitement FIRMS peut être lancé selon le besoin.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
  );
}
