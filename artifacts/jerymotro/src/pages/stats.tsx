import { useMemo } from "react";
import { useGetDailyStats, useListDetections, useListClusters } from "@workspace/api-client-react";
import { generateMockDailyStats, generateMockDetections, generateMockClusters } from "@/lib/mock-data";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { useI18n } from "@/hooks/use-i18n";

export default function StatsPage() {
  const { t } = useI18n();

  const dailyQ = useGetDailyStats();
  const detectionsQ = useListDetections({ limit: 200 });
  const clustersQ = useListClusters({ limit: 50 });

  const daily = (dailyQ.data ?? generateMockDailyStats()).stats || [];
  const detections = (detectionsQ.data ?? generateMockDetections()).detections || [];
  const clusters = (clustersQ.data ?? generateMockClusters()).clusters || [];

  const last30 = daily.slice(-30);
  const last7 = daily.slice(-7);

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
    return Object.entries(map)
      .map(([region, d]) => ({ region, ...d }))
      .sort((a, b) => b.detections - a.detections)
      .slice(0, 8);
  }, [detections, clusters]);

  const sourceStats = useMemo(() => {
    const map: Record<string, number> = {};
    detections.forEach(d => { map[d.source] = (map[d.source] || 0) + 1; });
    return Object.entries(map).map(([source, count]) => ({ source, count }));
  }, [detections]);

  const weeklyComparison = useMemo(() => {
    return last7.map(d => ({
      date: d.date.slice(5),
      current: d.total_detections,
      high_risk: d.high_risk_count,
      clusters: d.active_clusters,
    }));
  }, [last7]);

  const totalDetections = last30.reduce((s, d) => s + d.total_detections, 0);
  const totalHighRisk = last30.reduce((s, d) => s + d.high_risk_count, 0);
  const avgPerDay = Math.round(totalDetections / 30);
  const maxDay = last30.reduce((m, d) => d.total_detections > m.total_detections ? d : m, last30[0] || { total_detections: 0, date: "" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("stats.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("stats.subtitle")}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("stats.kpi.total30"), value: totalDetections.toLocaleString(), color: "text-primary" },
          { label: t("stats.kpi.highRisk30"), value: totalHighRisk.toLocaleString(), color: "text-destructive" },
          { label: t("stats.kpi.avg"), value: avgPerDay, color: "text-[#f59e0b]" },
          { label: t("stats.kpi.peak"), value: maxDay?.total_detections ?? "—", color: "text-accent" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`font-heading text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Main trend chart */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h2 className="font-heading font-semibold mb-4">{t("stats.trend.title")}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={last30}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(18 80% 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(18 80% 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 15%)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 15%)", borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="total_detections" name={t("stats.trend.total")} stroke="hsl(18 80% 50%)" strokeWidth={2} fill="url(#g1)" />
            <Area type="monotone" dataKey="high_risk_count" name={t("stats.trend.highRisk")} stroke="hsl(0 84% 60%)" strokeWidth={2} fill="url(#g2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Region bar chart */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-heading font-semibold mb-4">{t("stats.byRegion.title")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionStats} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 15%)" vertical={false} />
              <XAxis dataKey="region" tick={{ fontSize: 9, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 15%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="detections" name={t("stats.regionTable.detections")} fill="hsl(18 80% 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="critical" name={t("stats.regionTable.critical")} fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly line chart */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-heading font-semibold mb-4">{t("stats.weekly.title")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 15%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 15%)", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="current" name={t("stats.weekly.total")} stroke="hsl(18 80% 50%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(18 80% 50%)" }} />
              <Line type="monotone" dataKey="high_risk" name={t("stats.weekly.highRisk")} stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(0 84% 60%)" }} />
              <Line type="monotone" dataKey="clusters" name={t("stats.weekly.clusters")} stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(38 92% 50%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source & Region summary table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-heading font-semibold mb-4">{t("stats.sources.title")}</h2>
          <div className="space-y-3">
            {sourceStats.map(s => (
              <div key={s.source} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{s.source}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(s.count / detections.length) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-heading font-semibold mb-4">{t("stats.regionTable.title")}</h2>
          <div className="divide-y divide-border">
            <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium pb-2">
              <span>{t("stats.regionTable.region")}</span>
              <span className="text-right">{t("stats.regionTable.detections")}</span>
              <span className="text-right">{t("stats.regionTable.critical")}</span>
              <span className="text-right">{t("stats.regionTable.clusters")}</span>
            </div>
            {regionStats.map(r => (
              <div key={r.region} className="grid grid-cols-4 text-sm py-2">
                <span className="font-medium truncate">{r.region}</span>
                <span className="text-right text-primary">{r.detections}</span>
                <span className="text-right text-destructive">{r.critical}</span>
                <span className="text-right text-[#f59e0b]">{r.clusters}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
