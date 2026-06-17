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

  const filtered = useMemo(() => {
    return detections.filter(d => {
      if (region !== "Toutes" && d.region?.toLowerCase() !== region.toLowerCase()) return false;
      if (source !== "Toutes" && !d.source?.toLowerCase().includes(source.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        return (d.region || "").toLowerCase().includes(q) || d.id.toString().includes(q);
      }
      return true;
    });
  }, [detections, region, source, search]);

  if (query.isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedDet = filtered.find(d => d.id === selected);

  const allLabel = t("detections.filter.allRegions");

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("detections.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} {t("detections.subtitle.count")} — {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg border transition-colors ${viewMode === "list" ? "bg-primary/10 border-primary/30 text-primary" : "border-border hover:bg-secondary"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`p-2 rounded-lg border transition-colors ${viewMode === "map" ? "bg-primary/10 border-primary/30 text-primary" : "border-border hover:bg-secondary"}`}
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-card-border rounded-xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("detections.search.placeholder")}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="h-9 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            {REGIONS.map(r => (
              <option key={r} value={r}>{r === "Toutes" ? allLabel : r}</option>
            ))}
          </select>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            className="h-9 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            {SOURCES.map(s => (
              <option key={s} value={s}>{s === "Toutes" ? t("detections.filter.allSources") : s}</option>
            ))}
          </select>
        </div>
        {(region !== "Toutes" || source !== "Toutes" || search) && (
          <button
            onClick={() => { setRegion("Toutes"); setSource("Toutes"); setSearch(""); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 h-9"
          >
            <X className="w-3 h-3" /> {t("common.reset")}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-1 min-h-0">
        {/* List */}
        <div className={`${selected ? "hidden sm:flex sm:flex-1" : "flex w-full"} bg-card border border-card-border rounded-xl overflow-hidden flex-col`}>
          <div className="flex-1 overflow-x-auto min-h-0 flex flex-col">
            <div className="hidden sm:grid sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_80px_64px_80px] gap-4 text-xs text-muted-foreground font-medium border-b border-border px-4 py-2 bg-secondary/30 sm:min-w-[650px]">
              <span className="w-14">{t("detections.col.id")}</span>
              <span>{t("detections.col.region")}</span>
              <span>{t("detections.col.coords")}</span>
              <span className="w-20 text-right">{t("detections.col.frp")}</span>
              <span className="w-16 text-right">{t("detections.col.source")}</span>
              <span className="w-20 text-right">{t("detections.col.risk")}</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border sm:min-w-[650px]">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">{t("detections.empty")}</div>
              ) : filtered.map(d => (
                <button
                  key={d.id}
                  data-testid={`row-detection-${d.id}`}
                  onClick={() => setSelected(d.id === selected ? null : d.id)}
                  className={`w-full flex sm:grid sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_80px_64px_80px] gap-4 items-center px-4 py-3 text-left hover:bg-secondary/50 transition-colors text-sm sm:min-w-[650px] ${selected === d.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                >
                  {/* Mobile Layout */}
                  <div className="flex-1 min-w-0 sm:hidden">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-semibold text-sm truncate">{d.region || "—"}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRiskColor(d.risk_score)} flex-shrink-0`}>
                        {getRiskLabel(d.risk_score)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>#{d.id}</span>
                      <span>•</span>
                      <span className="font-mono">{d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}</span>
                      <span>•</span>
                      <span>{d.source}</span>
                      <span>•</span>
                      <span>{d.frp?.toFixed(0) ?? "—"} MW</span>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <span className="hidden sm:inline-block w-14 text-xs text-muted-foreground">{d.id}</span>
                  <span className="hidden sm:inline-block font-medium truncate">{d.region || "—"}</span>
                  <span className="hidden sm:inline-block text-xs text-muted-foreground font-mono">{d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}</span>
                  <span className="hidden sm:inline-block w-20 text-right text-xs font-mono">{d.frp?.toFixed(0) ?? "—"}</span>
                  <span className="hidden sm:inline-block w-16 text-right">
                    <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{d.source}</span>
                  </span>
                  <span className="hidden sm:inline-block w-20 text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRiskColor(d.risk_score)}`}>
                      {getRiskLabel(d.risk_score)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedDet && (
          <div className="w-full sm:w-80 bg-card border border-card-border rounded-xl p-5 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">{t("detections.detail.title")} #{selectedDet.id}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <span className={`self-start text-xs font-bold px-2 py-1 rounded-full ${getRiskColor(selectedDet.risk_score)}`}>
              {getRiskLabel(selectedDet.risk_score)} — {((selectedDet.risk_score ?? 0) * 100).toFixed(0)}%
            </span>
            <div className="space-y-3">
              {[
                { label: t("detections.detail.region"), value: selectedDet.region },
                { label: t("detections.detail.latitude"), value: selectedDet.latitude?.toFixed(5) },
                { label: t("detections.detail.longitude"), value: selectedDet.longitude?.toFixed(5) },
                { label: t("detections.detail.source"), value: selectedDet.source },
                { label: t("detections.detail.satellite"), value: selectedDet.satellite },
                { label: t("detections.detail.frp"), value: selectedDet.frp ? `${selectedDet.frp.toFixed(1)} MW` : "—" },
                { label: t("detections.detail.brightness"), value: selectedDet.brightness ? `${selectedDet.brightness.toFixed(1)} K` : "—" },
                { label: t("detections.detail.confidence"), value: selectedDet.confidence },
                { label: t("detections.detail.date"), value: selectedDet.acq_date },
                { label: t("detections.detail.time"), value: selectedDet.acq_time },
                { label: t("detections.detail.temperature"), value: selectedDet.temperature_2m ? `${selectedDet.temperature_2m.toFixed(1)}°C` : "—" },
                { label: t("detections.detail.wind"), value: selectedDet.wind_speed ? `${selectedDet.wind_speed.toFixed(1)} m/s` : "—" },
                { label: t("detections.detail.daynight"), value: selectedDet.daynight === "D" ? t("daynight.day") : t("daynight.night") },
                { label: t("detections.detail.landcover"), value: selectedDet.landcover },
                { label: t("detections.detail.cluster"), value: selectedDet.cluster_id ? `#${selectedDet.cluster_id}` : t("detections.detail.noCluster") },
              ].map(item => item.value && (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
