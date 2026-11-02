import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Lightbulb, X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

type Item = { id?: number; slug?: string; title: string; summary: string; content_type?: string; source_url?: string | null; source_title?: string | null };
const fallback: Record<string, Item[]> = {
  fr: [{ slug: "firms-detection-limitations", title: "Une détection satellite n'est pas automatiquement un feu confirmé.", summary: "Les satellites détectent des anomalies thermiques. Leur interprétation doit tenir compte de la résolution, des nuages et des observations complémentaires.", content_type: "scientific_fact", source_title: "NASA FIRMS — FAQ", source_url: "https://www.earthdata.nasa.gov/data/tools/firms/faq" }],
  mg: [{ slug: "firms-detection-limitations", title: "Tsy midika ho afo voamarina avy hatrany ny fahitana avy amin'ny zanabolana.", summary: "Mahita fiovana hafanana ny zanabolana. Mila dinihina miaraka amin'ny toe-javatra sy loharanom-baovao hafa izany.", content_type: "scientific_fact", source_title: "NASA FIRMS — FAQ", source_url: "https://www.earthdata.nasa.gov/data/tools/firms/faq" }],
  en: [{ slug: "firms-detection-limitations", title: "A satellite detection is not automatically a confirmed fire.", summary: "Satellites detect thermal anomalies. Interpretation must account for resolution, clouds and complementary observations.", content_type: "scientific_fact", source_title: "NASA FIRMS — FAQ", source_url: "https://www.earthdata.nasa.gov/data/tools/firms/faq" }],
};

const configuredApi = import.meta.env.VITE_API_URL;
const API = (configuredApi && (configuredApi.startsWith("http://") || configuredApi.startsWith("https://") || configuredApi.startsWith("/"))
  ? configuredApi
  : typeof window !== "undefined" ? window.location.protocol + "//" + window.location.hostname + ":" + (import.meta.env.VITE_API_BACKEND_PORT || "8081") : "http://localhost:8081").replace(/\/$/, "");
const CACHE_PREFIX = "jm-awareness-cache-v1-";
async function loadItems(language: string): Promise<Item[]> {
  const response = await fetch(`${API}/awareness/contents?language=${language}&limit=20`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Awareness API unavailable");
  const data: Item[] = await response.json();
  try { if (data.length) localStorage.setItem(CACHE_PREFIX + language, JSON.stringify({ savedAt: new Date().toISOString(), items: data })); } catch { /* stockage navigateur indisponible */ }
  return data;
}
function cachedItems(language: string): Item[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + language);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : null;
  } catch { return null; }
}

export function AwarenessBanner() {
  const { lang } = useI18n();
  const [items, setItems] = useState<Item[]>(fallback[lang] || fallback.fr);
  const [index, setIndex] = useState(0);
  const [usingCache, setUsingCache] = useState(false);
  useEffect(() => {
    let active = true;
    loadItems(lang).then(data => { if (active && data.length) { setItems(data); setIndex(0); setUsingCache(false); } }).catch(() => { if (active) { const cached = cachedItems(lang); setItems(cached?.length ? cached : fallback[lang] || fallback.fr); setUsingCache(!!cached?.length); } });
    return () => { active = false; };
  }, [lang]);
  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % items.length), 24000);
    return () => window.clearInterval(timer);
  }, [items.length]);
  const item = items[index % Math.max(items.length, 1)];
  if (!item) return null;
  return (
    <section aria-label="Sensibilisation" className="relative mx-auto my-3 w-[calc(100%-1.5rem)] max-w-7xl overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Lightbulb className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">JeryMotro · Sensibilisation {usingCache && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400">Contenu en cache</span>}</div>
          <h2 className="text-sm font-semibold leading-snug sm:text-base">{item.title}</h2>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <Link href="/sensibilisation" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline dark:text-emerald-400">En savoir plus <ArrowRight className="h-3.5 w-3.5" /></Link>
            {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" className="text-muted-foreground underline underline-offset-2">{item.source_title || "Source"}</a>}
          </div>
        </div>
        {items.length > 1 && <div className="flex shrink-0 items-center gap-1">
          <button type="button" aria-label="Précédent" onClick={() => setIndex(i => (i - 1 + items.length) % items.length)} className="rounded-lg p-1.5 hover:bg-emerald-500/10"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-8 text-center text-[10px] tabular-nums text-muted-foreground">{index + 1}/{items.length}</span>
          <button type="button" aria-label="Suivant" onClick={() => setIndex(i => (i + 1) % items.length)} className="rounded-lg p-1.5 hover:bg-emerald-500/10"><ChevronRight className="h-4 w-4" /></button>
        </div>}
      </div>
    </section>
  );
}

export function AwarenessFloatingCard() {
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [item, setItem] = useState<Item>((fallback[lang] || fallback.fr)[0]);
  useEffect(() => {
    if (sessionStorage.getItem("jm-awareness-dismissed") === new Date().toDateString()) return;
    const lastShown = Number(sessionStorage.getItem("jm-awareness-last-shown") || 0);
    const remaining = Math.max(0, 15 * 60 * 1000 - (Date.now() - lastShown));
    const timer = window.setTimeout(() => { setVisible(true); sessionStorage.setItem("jm-awareness-last-shown", String(Date.now())); }, lastShown ? Math.max(55000, remaining) : 55000);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { loadItems(lang).then(data => { if (data.length) setItem(data[0]); }).catch(() => setItem((fallback[lang] || fallback.fr)[0])); }, [lang]);
  useEffect(() => {
    if (!visible || collapsed) return;
    const timer = window.setTimeout(() => setCollapsed(true), 12000);
    return () => window.clearTimeout(timer);
  }, [visible, collapsed]);
  if (!visible || dismissed) return null;
  if (collapsed) return <button type="button" onClick={() => setCollapsed(false)} className="fixed bottom-3 right-3 z-40 inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-500/30 bg-card px-3 text-xs font-semibold shadow-lg" aria-label="Ouvrir le conseil de sensibilisation"><Lightbulb className="h-4 w-4 text-emerald-600" />Sensibilisation</button>;
  return <aside aria-label="Message de sensibilisation" className="fixed bottom-3 right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-card p-4 shadow-xl md:block">
    <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><Lightbulb className="h-4 w-4" /> Le saviez-vous ?</span><button aria-label="Fermer" onClick={() => { setDismissed(true); sessionStorage.setItem("jm-awareness-dismissed", new Date().toDateString()); }} className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button></div>
    <h3 className="text-sm font-semibold leading-snug">{item.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
    <Link href="/sensibilisation" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Découvrir <ArrowRight className="h-3.5 w-3.5" /></Link>
  </aside>;
}

export default function AwarenessPage() {
  const { lang } = useI18n();
  const [period, setPeriod] = useState("yesterday");
  const [region, setRegion] = useState("");
  const [items, setItems] = useState<Item[]>(fallback[lang] || fallback.fr);
  const [history, setHistory] = useState<any>(null);
  const [error, setError] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  useEffect(() => { loadItems(lang).then(data => { if (data.length) { setItems(data); setUsingCache(false); setError(false); } }).catch(() => { const cached = cachedItems(lang); setItems(cached?.length ? cached : fallback[lang] || fallback.fr); setUsingCache(!!cached?.length); setError(true); }); }, [lang]);
  useEffect(() => {
    let active = true;
    fetch(`${API}/awareness/history?period=${period}${region ? `&region=${encodeURIComponent(region)}` : ""}&language=${lang}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { if (active) setHistory(data); }).catch(() => { if (active) setHistory(null); });
    return () => { active = false; };
  }, [period, region, lang]);
  const labels: Record<string, string> = { yesterday: "Hier", week: "Cette semaine", month: "Ce mois", year: "Cette année" };
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div className="mb-8"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><Flame className="h-5 w-5" /> JeryMotro · Sensibilisation</div><h1 className="text-3xl font-bold tracking-tight">Comprendre, prévenir et agir</h1><p className="mt-2 max-w-3xl text-muted-foreground">Des observations issues des données satellitaires et des informations scientifiques pour mieux comprendre les feux de végétation à Madagascar.</p></div>
    <div className="mb-8 grid gap-3 sm:grid-cols-2"><section className="rounded-2xl border border-border p-5"><h2 className="text-lg font-semibold">Nos observations</h2><p className="mt-1 text-sm text-muted-foreground">Indicateurs calculés depuis les données disponibles dans JeryMotro.</p><div className="mt-4 flex flex-wrap gap-2">{Object.entries(labels).map(([key,label]) => <button key={key} onClick={() => setPeriod(key)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${period === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{label}</button>)}</div>{history && <label className="mt-3 block text-xs text-muted-foreground">Région <select value={region} onChange={e => setRegion(e.target.value)} className="ml-2 rounded-lg border bg-background px-2 py-1 text-xs"><option value="">Toutes les régions</option>{(history.by_region || []).map((entry: {region:string}) => <option key={entry.region} value={entry.region}>{entry.region}</option>)}</select></label>}{history ? <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/60 p-3"><div className="text-2xl font-bold tabular-nums">{history.detections_count}</div><div className="text-xs text-muted-foreground">Détections satellitaires</div></div><div className="rounded-xl bg-muted/60 p-3"><div className="text-2xl font-bold tabular-nums">{history.grouped_events_count}</div><div className="text-xs text-muted-foreground">Événements regroupés</div></div></div> : <p className="mt-4 text-sm text-muted-foreground">Statistiques historiques temporairement indisponibles.</p>}{history.messages?.length > 0 && <div className="mt-4 space-y-2">{history.messages.map((message: {key:string;title:string;message:string}) => <div key={message.key} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3"><h3 className="text-sm font-semibold">{message.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message.message}</p></div>)}</div>}<p className="mt-3 text-[11px] text-muted-foreground">Une détection ou un événement regroupé ne constitue pas une confirmation terrain.</p></section>
    <section className="rounded-2xl border border-border p-5"><h2 className="text-lg font-semibold">Comprendre et prévenir</h2><p className="mt-1 text-sm text-muted-foreground">Informations éditoriales indépendantes des statistiques historiques.</p><p className="mt-4 text-sm">Les contenus scientifiques et les conseils doivent être consultés avec leurs références. JeryMotro distingue les mesures satellitaires des confirmations sur le terrain.</p>{error && <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">{usingCache ? "API indisponible : affichage du dernier contenu enregistré sur cet appareil." : "Mode de secours éditorial : contenu statique embarqué dans le frontend."}</p>}</section></div>
    <div className="grid gap-4 md:grid-cols-2">{items.map((item,i) => <article key={item.id || item.slug || i} className="rounded-2xl border border-border p-5"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{item.content_type || "Information"}</div><h2 className="text-lg font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>{item.source_url && <a className="mt-3 inline-block text-xs underline underline-offset-2" href={item.source_url} target="_blank" rel="noreferrer">Consulter la source</a>}</article>)}</div>
  </div>;
}
