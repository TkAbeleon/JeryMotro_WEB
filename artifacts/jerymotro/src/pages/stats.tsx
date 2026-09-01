import { useMemo } from "react";
import { useGetDailyStats, useListDetections, useListClusters } from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { useI18n } from "@/hooks/use-i18n";
import { subDays, subMonths } from "date-fns";
import { Download } from "lucide-react";

const formatDateForTooltip = (value: string, lang: string) => {
  const parts = value.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const localDate = new Date(year, month, day);
    const langCode = lang === "mg" ? "mg-MG" : lang === "fr" ? "fr-FR" : "en-US";
    const formatted = new Intl.DateTimeFormat(langCode, { weekday: "long", day: "numeric", month: "long" }).format(localDate);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  return value;
};

function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

const chartGrid = "hsl(150 15% 15%)";
const chartTick = { fontSize: 10, fill: "hsl(150 8% 55%)" };
const chartTooltip = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--popover-border))", borderRadius: 10, fontSize: 11 };

export default function StatsPage() {
  const { t, lang } = useI18n();
  const { dateFrom } = useMemo(() => ({ dateFrom: formatDateForAPI(subDays(new Date(), 30)) }), []);
  const dailyQ = useGetDailyStats({ date_from: dateFrom });
  const detectionsQ = useListDetections({ limit: 2000, date_from: dateFrom });
  const clustersQ = useListClusters({ limit: 50 });
  const daily = dailyQ.data?.stats || [];
  const detections = detectionsQ.data?.detections || [];
  const clusters = clustersQ.data?.clusters || [];
  const last30 = daily.slice().reverse();
  const last7 = daily.slice(-7).reverse();

  const regionStats = useMemo(() => {
    const map: Record<string, { detections: number; critical: number; clusters: number }> = {};
    detections.forEach(d => {
      const r = d.region || "Autre";
      if (!map[r]) map[r] = { detections: 0, critical: 0, clusters: 0 };
      map[r].detections++;
      if ((d.risk_score ?? 0) >= 0.7) map[r].critical++;
    });
    clusters.forEach(c => {
      const r = c.region || "Autre";
      if (!map[r]) map[r] = { detections: 0, critical: 0, clusters: 0 };
      map[r].clusters++;
    });
    return Object.entries(map).map(([region, d]) => ({ region, ...d })).sort((a, b) => b.detections - a.detections).slice(0, 8);
  }, [detections, clusters]);

  const sourceStats = useMemo(() => {
    const map: Record<string, number> = {};
    detections.forEach(d => {
      const src = d.source?.toLowerCase().includes("viirs") ? "VIIRS" : "MODIS";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).map(([source, count]) => ({ source, count }));
  }, [detections]);

  const weeklyComparison = useMemo(() => last7.map(d => ({
    date: d.date.slice(5), fullDate: d.date, current: d.total_detections, high_risk: d.high_risk_count, clusters: d.active_clusters,
  })), [last7]);

  if (dailyQ.isLoading || detectionsQ.isLoading || clustersQ.isLoading) {
    return <div className="flex min-h-[400px] h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const totalDetections = last30.reduce((s, d) => s + d.total_detections, 0);
  const totalHighRisk = last30.reduce((s, d) => s + d.high_risk_count, 0);
  const avgPerDay = Math.round(totalDetections / 30);
  const maxDay = last30.reduce((m, d) => d.total_detections > m.total_detections ? d : m, last30[0] || { total_detections: 0, date: "" });
  const criticalScaleMax = Math.ceil(Math.max(...last30.map(d => d.high_risk_count), 1) * 1.2);
  const criticalScaleMaxWeekly = Math.ceil(Math.max(...last7.map(d => d.high_risk_count), 1) * 1.2);

  return (
    <div className="space-y-7 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("stats.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("stats.subtitle")}</p>
        </div>
        <a href="/export" className="inline-flex h-9 items-center gap-2 self-start rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:self-auto"><Download className="h-3.5 w-3.5" />{t("export.title")}</a>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("stats.kpi.total30"), value: totalDetections.toLocaleString(), color: "text-primary" },
          { label: t("stats.kpi.highRisk30"), value: totalHighRisk.toLocaleString(), color: "text-destructive" },
          { label: t("stats.kpi.avg"), value: avgPerDay, color: "text-[#f59e0b]" },
          { label: t("stats.kpi.peak"), value: maxDay?.total_detections ?? "—", color: "text-accent" },
        ].map(k => <div key={k.label} className="rounded-xl border border-border/55 bg-card/55 px-4 py-3.5 transition-colors hover:bg-card"><div className={`font-heading text-2xl font-semibold tracking-tight ${k.color}`}>{k.value}</div><div className="mt-1 text-[11px] text-muted-foreground">{k.label}</div></div>)}
      </div>

      <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-heading text-sm font-semibold">{t("stats.trend.title")}</h2><span className="text-[10px] text-muted-foreground">30 jours</span></div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={last30}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(18 80% 50%)" stopOpacity={0.18} /><stop offset="95%" stopColor="hsl(18 80% 50%)" stopOpacity={0} /></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.14} /><stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.28} vertical={false} />
            <XAxis dataKey="date" tick={chartTick} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} interval={4} />
            <YAxis yAxisId="total" tick={chartTick} tickLine={false} axisLine={false} />
            <YAxis yAxisId="critical" orientation="right" tick={chartTick} tickLine={false} axisLine={false} domain={[0, criticalScaleMax]} />
            <Tooltip contentStyle={chartTooltip} labelFormatter={(value) => formatDateForTooltip(value, lang)} />
            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={7} />
            <Area type="monotone" dataKey="total_detections" yAxisId="total" name={t("stats.trend.total")} stroke="hsl(18 80% 50%)" strokeWidth={2} fill="url(#g1)" />
            <Area type="monotone" dataKey="high_risk_count" yAxisId="critical" name={t("stats.trend.highRisk")} stroke="hsl(0 84% 60%)" strokeWidth={2} fill="url(#g2)" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">{t("stats.byRegion.title")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionStats} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.28} vertical={false} />
              <XAxis dataKey="region" tick={{ ...chartTick, fontSize: 9 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={chartTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltip} />
              <Bar dataKey="detections" name={t("stats.regionTable.detections")} fill="hsl(18 80% 50%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="critical" name={t("stats.regionTable.critical")} fill="hsl(0 84% 60%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">{t("stats.weekly.title")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.28} vertical={false} />
              <XAxis dataKey="fullDate" tick={chartTick} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis yAxisId="total" tick={chartTick} tickLine={false} axisLine={false} />
              <YAxis yAxisId="critical" orientation="right" tick={chartTick} tickLine={false} axisLine={false} domain={[0, criticalScaleMaxWeekly]} />
              <Tooltip contentStyle={chartTooltip} labelFormatter={(value) => formatDateForTooltip(value, lang)} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={7} />
              <Line type="monotone" dataKey="current" yAxisId="total" name={t("stats.weekly.total")} stroke="hsl(18 80% 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(18 80% 50%)" }} />
              <Line type="monotone" dataKey="high_risk" yAxisId="critical" name={t("stats.weekly.highRisk")} stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(0 84% 60%)" }} />
              <Line type="monotone" dataKey="clusters" yAxisId="total" name={t("stats.weekly.clusters")} stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(38 92% 50%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">{t("stats.sources.title")}</h2>
          <div className="space-y-3">
            {sourceStats.map(s => <div key={s.source} className="flex items-center gap-3"><div className="flex-1"><div className="mb-1 flex items-center justify-between text-sm"><span>{s.source}</span><span className="font-medium">{s.count}</span></div><div className="h-1 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: detections.length ? `${(s.count / detections.length) * 100}%` : "0%" }} /></div></div></div>)}
          </div>
        </section>

        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">{t("stats.regionTable.title")}</h2>
          <div className="overflow-x-auto"><div className="min-w-[420px] divide-y divide-border/45">
            <div className="grid grid-cols-4 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><span>{t("stats.regionTable.region")}</span><span className="text-right">{t("stats.regionTable.detections")}</span><span className="text-right">{t("stats.regionTable.critical")}</span><span className="text-right">{t("stats.regionTable.clusters")}</span></div>
            {regionStats.map(r => <div key={r.region} className="grid grid-cols-4 py-2.5 text-sm"><span className="truncate font-medium">{r.region}</span><span className="text-right text-primary">{r.detections}</span><span className="text-right text-destructive">{r.critical}</span><span className="text-right text-[#f59e0b]">{r.clusters}</span></div>)}
          </div></div>
        </section>
      </div>
    </div>
  );
}
