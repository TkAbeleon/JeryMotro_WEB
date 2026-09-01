import { useState, useMemo } from "react";
import { useListDetections } from "@workspace/api-client-react";
import { Search, Filter, Map, List, X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const getRiskColor = (score: number | null | undefined) => {
  if (!score) return "bg-muted text-muted-foreground";
  if (score >= 0.7) return "bg-destructive/15 text-destructive";
  if (score >= 0.5) return "bg-primary/15 text-primary";
  if (score >= 0.3) return "bg-[#f59e0b]/15 text-[#f59e0b]";
  return "bg-accent/15 text-accent";
};

const REGIONS = ["Toutes", "Analamanga", "Boeny", "Diana", "Itasy", "Atsinanana"];
const SOURCES = ["Toutes", "MODIS", "VIIRS"];

export default function DetectionsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("Toutes");
  const [source, setSource] = useState("Toutes");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<number | null>(null);

  const getRiskLabel = (s: number | null | undefined) => {
    if (!s) return t("risk.unknown");
    if (s >= 0.7) return t("risk.critical");
    if (s >= 0.5) return t("risk.high");
    if (s >= 0.3) return t("risk.medium");
    return t("risk.low");
  };

  const query = useListDetections({ limit: 100 });
  const data = query.data ?? { detections: [] };
  const detections = data.detections || [];

  const filtered = useMemo(() => detections.filter(d => {
    if (region !== "Toutes" && d.region?.toLowerCase() !== region.toLowerCase()) return false;
    if (source !== "Toutes" && !d.source?.toLowerCase().includes(source.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      return (d.region || "").toLowerCase().includes(q) || d.id.toString().includes(q);
    }
    return true;
  }), [detections, region, source, search]);

  if (query.isLoading) return <div className="flex h-full min-h-[400px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const selectedDet = filtered.find(d => d.id === selected);
  const allLabel = t("detections.filter.allRegions");

  return (
    <div className="flex h-full flex-col gap-5 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("detections.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} {t("detections.subtitle.count")} · {new Date().toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="inline-flex self-start rounded-lg border border-border/60 bg-card/60 p-0.5 sm:self-auto">
          <button onClick={() => setViewMode("list")} aria-label="Liste" className={`flex h-8 w-9 items-center justify-center rounded-md transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><List className="h-4 w-4" /></button>
          <button onClick={() => setViewMode("map")} aria-label="Carte" className={`flex h-8 w-9 items-center justify-center rounded-md transition-colors ${viewMode === "map" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Map className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2.5 border-b border-border/50 pb-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("detections.search.placeholder")} className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
        </div>
        <label className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <select value={region} onChange={e => setRegion(e.target.value)} className="bg-transparent text-sm text-foreground outline-none">
            {REGIONS.map(r => <option key={r} value={r}>{r === "Toutes" ? allLabel : r}</option>)}
          </select>
        </label>
        <select value={source} onChange={e => setSource(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
          {SOURCES.map(s => <option key={s} value={s}>{s === "Toutes" ? t("detections.filter.allSources") : s}</option>)}
        </select>
        {(region !== "Toutes" || source !== "Toutes" || search) && <button onClick={() => { setRegion("Toutes"); setSource("Toutes"); setSearch(""); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="h-3 w-3" />{t("common.reset")}</button>}
      </div>

      <div className="relative flex min-h-0 flex-1 gap-4">
        <div className={`${selected ? "hidden sm:flex sm:flex-1" : "flex w-full"} min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40`}>
          <div className="min-h-0 flex-1 overflow-x-auto">
            <div className="hidden min-w-[650px] grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_80px_64px_80px] gap-4 border-b border-border/50 bg-muted/25 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>{t("detections.col.id")}</span><span>{t("detections.col.region")}</span><span>{t("detections.col.coords")}</span><span className="text-right">{t("detections.col.frp")}</span><span className="text-right">{t("detections.col.source")}</span><span className="text-right">{t("detections.col.risk")}</span>
            </div>
            <div className="min-h-full divide-y divide-border/45 sm:min-w-[650px]">
              {filtered.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground">{t("detections.empty")}</div> : filtered.map(d => (
                <button key={d.id} data-testid={`row-detection-${d.id}`} onClick={() => setSelected(d.id === selected ? null : d.id)} className={`w-full items-center gap-4 px-4 py-3.5 text-left transition-colors sm:grid sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_80px_64px_80px] ${selected === d.id ? "bg-primary/[0.045]" : "hover:bg-muted/35"}`}>
                  <div className="sm:hidden"><div className="mb-1 flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{d.region || "—"}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${getRiskColor(d.risk_score)}`}>{getRiskLabel(d.risk_score)}</span></div><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground"><span>#{d.id}</span><span>•</span><span className="font-mono">{d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}</span><span>•</span><span>{d.source}</span><span>•</span><span>{d.frp?.toFixed(0) ?? "—"} MW</span></div></div>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{d.id}</span><span className="hidden truncate text-sm font-medium sm:inline">{d.region || "—"}</span><span className="hidden font-mono text-xs text-muted-foreground sm:inline">{d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}</span><span className="hidden text-right font-mono text-xs sm:inline">{d.frp?.toFixed(0) ?? "—"}</span><span className="hidden text-right text-xs sm:inline">{d.source}</span><span className="hidden text-right sm:inline"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getRiskColor(d.risk_score)}`}>{getRiskLabel(d.risk_score)}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedDet && <aside className="absolute inset-y-0 right-0 z-10 w-full overflow-y-auto rounded-xl border border-border/70 bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:static sm:w-80 sm:shrink-0 sm:rounded-xl sm:shadow-none">
          <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("detections.detail.title")}</div><h3 className="font-heading text-lg font-semibold">#{selectedDet.id}</h3></div><button onClick={() => setSelected(null)} aria-label={t("common.close")} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button></div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskColor(selectedDet.risk_score)}`}>{getRiskLabel(selectedDet.risk_score)} · {((selectedDet.risk_score ?? 0) * 100).toFixed(0)}%</span>
          <dl className="mt-6 divide-y divide-border/50">{[
            { label: t("detections.detail.region"), value: selectedDet.region }, { label: t("detections.detail.latitude"), value: selectedDet.latitude?.toFixed(5) }, { label: t("detections.detail.longitude"), value: selectedDet.longitude?.toFixed(5) }, { label: t("detections.detail.source"), value: selectedDet.source }, { label: t("detections.detail.satellite"), value: selectedDet.satellite }, { label: t("detections.detail.frp"), value: selectedDet.frp ? `${selectedDet.frp.toFixed(1)} MW` : "—" }, { label: t("detections.detail.brightness"), value: selectedDet.brightness ? `${selectedDet.brightness.toFixed(1)} K` : "—" }, { label: t("detections.detail.confidence"), value: selectedDet.confidence }, { label: t("detections.detail.date"), value: selectedDet.acq_date }, { label: t("detections.detail.time"), value: selectedDet.acq_time }, { label: t("detections.detail.temperature"), value: selectedDet.temperature_2m ? `${selectedDet.temperature_2m.toFixed(1)}°C` : "—" }, { label: t("detections.detail.wind"), value: selectedDet.wind_speed ? `${selectedDet.wind_speed.toFixed(1)} m/s` : "—" }, { label: t("detections.detail.daynight"), value: selectedDet.daynight === "D" ? t("daynight.day") : t("daynight.night") }, { label: t("detections.detail.landcover"), value: selectedDet.landcover }, { label: t("detections.detail.cluster"), value: selectedDet.cluster_id ? `#${selectedDet.cluster_id}` : t("detections.detail.noCluster") },
          ].map(item => item.value && <div key={item.label} className="flex items-center justify-between gap-4 py-2.5 text-sm"><dt className="text-muted-foreground">{item.label}</dt><dd className="text-right font-medium">{item.value}</dd></div>)}</dl>
        </aside>}
      </div>
    </div>
  );
}
