import { useState, useMemo } from "react";
import { useListClusters, Cluster } from "@workspace/api-client-react";
import { Flame, Clock, MapPin, BarChart3, RefreshCw, Search } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { AsyncState } from "@/components/ui/async-state";

const riskConfig: Record<string, { color: string }> = {
  CRITICAL: { color: "text-destructive" },
  HIGH: { color: "text-primary" },
  MEDIUM: { color: "text-[#f59e0b]" },
  LOW: { color: "text-accent" },
};

export default function ClustersPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const statusConfig = {
    active: { label: t("cluster.status.active"), color: "bg-destructive/15 text-destructive" },
    cooling: { label: t("cluster.status.cooling"), color: "bg-[#f59e0b]/15 text-[#f59e0b]" },
    closed: { label: t("cluster.status.closed"), color: "bg-muted text-muted-foreground" },
  };
  const query = useListClusters({ limit: 50 });
  const clusters = query.data?.clusters || [];

  const filtered = useMemo(() => clusters.filter(c => {
    const status = (c.cluster_status || "").toLowerCase();
    const normalized = status === "active" ? "active" : status === "cooling" ? "cooling" : "closed";
    if (statusFilter !== "all" && normalized !== statusFilter) return false;
    return !search || (c.region || "").toLowerCase().includes(search.toLowerCase());
  }), [clusters, statusFilter, search]);

  const stats = useMemo(() => ({
    active: clusters.filter(c => (c.cluster_status || "").toLowerCase() === "active").length,
    cooling: clusters.filter(c => (c.cluster_status || "").toLowerCase() === "cooling").length,
    closed: clusters.filter(c => { const s = (c.cluster_status || "").toLowerCase(); return s !== "active" && s !== "cooling"; }).length,
    totalFRP: clusters.reduce((s, c) => s + (c.cluster_frp_total ?? 0), 0),
  }), [clusters]);

  if (query.isLoading) return <AsyncState type="loading" title={t("common.loading")} />;
  if (query.isError) return <AsyncState type="error" title={t("common.error")} description="Impossible de charger les clusters." actionLabel="Réessayer" onAction={() => query.refetch()} />;

  const filterButtons = [
    { key: "all", label: t("clusters.filter.all") },
    { key: "active", label: t("cluster.status.active") },
    { key: "cooling", label: t("cluster.status.cooling") },
    { key: "closed", label: t("cluster.status.closed") },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">{t("clusters.title")}</h1><p className="text-sm text-muted-foreground mt-1">{t("clusters.subtitle")}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[
        { label: t("clusters.kpi.active"), value: stats.active, color: "text-destructive", bg: "bg-destructive/10", icon: Flame },
        { label: t("clusters.kpi.cooling"), value: stats.cooling, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", icon: Clock },
        { label: t("clusters.kpi.closed"), value: stats.closed, color: "text-muted-foreground", bg: "bg-muted", icon: RefreshCw },
        { label: t("clusters.kpi.frpTotal"), value: stats.totalFRP.toFixed(0), color: "text-primary", bg: "bg-primary/10", icon: BarChart3 },
      ].map(k => { const Icon = k.icon; return <div key={k.label} className="bg-card border border-card-border rounded-xl p-4"><div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}><Icon className={`w-4 h-4 ${k.color}`} /></div><div className={`font-heading text-2xl font-bold ${k.color}`}>{k.value}</div><div className="text-xs text-muted-foreground mt-1">{k.label}</div></div>; })}</div>
      <div className="flex flex-wrap items-center gap-3"><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("clusters.search.placeholder")} className="h-9 w-56 pl-9 pr-3 rounded-md bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" /></div><div className="flex flex-wrap gap-2">{filterButtons.map(f => <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === f.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>{f.label}</button>)}</div></div>
      {filtered.length === 0 ? <AsyncState type="empty" title={search || statusFilter !== "all" ? "Aucun cluster correspondant" : t("clusters.empty")} description={search || statusFilter !== "all" ? "Modifiez la recherche ou le filtre pour voir d’autres résultats." : undefined} /> : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(c => {
        const statusLower = (c.cluster_status || "").toLowerCase(); const normalizedStatus = statusLower === "active" ? "active" : statusLower === "cooling" ? "cooling" : "closed"; const status = statusConfig[normalizedStatus]; const riskColor = riskConfig[c.risk_level ?? ""] || { color: "text-muted-foreground" };
        return <div key={c.id} data-testid={`card-cluster-${c.id}`} className={`bg-card border border-card-border rounded-xl p-5 hover:border-border/80 transition-colors ${statusLower === "active" ? "border-l-2 border-l-destructive" : ""}`}>
          <div className="flex items-start justify-between mb-3"><div><div className="flex items-center gap-2"><span className="font-heading font-bold text-sm">{c.fire_id || `Cluster #${c.id}`}</span>{(c.reactivation_count ?? 0) > 0 && <span className="text-[10px] bg-[#f59e0b]/15 text-[#f59e0b] px-1.5 py-0.5 rounded-full font-medium">{c.reactivation_count}x {t("clusters.card.reactivated")}</span>}</div><div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><MapPin className="w-3 h-3" /><span>{c.region || t("clusters.card.unknownRegion")}</span></div></div><span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>{status.label}</span></div>
          <div className="grid grid-cols-3 gap-3 mb-3"><div><div className="text-xs text-muted-foreground">{t("clusters.card.size")}</div><div className="font-heading font-bold text-sm">{c.cluster_size ?? "—"} {t("clusters.card.points")}</div></div><div><div className="text-xs text-muted-foreground">{t("clusters.card.frpMax")}</div><div className="font-heading font-bold text-sm">{c.cluster_frp_max?.toFixed(0) ?? "—"} MW</div></div><div><div className="text-xs text-muted-foreground">{t("clusters.card.duration")}</div><div className="font-heading font-bold text-sm">{c.duration_hours?.toFixed(0) ?? "—"}h</div></div></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${c.risk_score_max && c.risk_score_max >= 0.7 ? "bg-destructive" : c.risk_score_max && c.risk_score_max >= 0.5 ? "bg-primary" : "bg-[#f59e0b]"}`} /><span className={`text-xs font-bold ${riskColor.color}`}>{c.risk_level || "—"}</span><span className="text-xs text-muted-foreground">({((c.risk_score_max ?? 0) * 100).toFixed(0)}%)</span></div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>{new Date(c.last_seen).toLocaleDateString("fr-FR")}</span></div></div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground"><span>{c.center_latitude.toFixed(3)}, {c.center_longitude.toFixed(3)}</span><span>R={c.radius_km?.toFixed(1) ?? "—"} km</span></div>
        </div>;
      })}</div>}
    </div>
  );
}
