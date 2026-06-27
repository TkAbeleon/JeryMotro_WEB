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
    
    const formatted = new Intl.DateTimeFormat(langCode, {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(localDate);
    
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  return value;
};

function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function StatsPage() {
  const { t, lang } = useI18n();

  // Calculate date range for last 30 days
  const { dateFrom } = useMemo(() => {
    const now = new Date();
    const cutoff = subDays(now, 30);
    return {
      dateFrom: formatDateForAPI(cutoff)
    };
  }, []);

  const dailyQ = useGetDailyStats({ date_from: dateFrom });
  const detectionsQ = useListDetections({ limit: 2000, date_from: dateFrom });
  const clustersQ = useListClusters({ limit: 50 });

  const daily = dailyQ.data?.stats || [];
  const detections = detectionsQ.data?.detections || [];
  const clusters = clustersQ.data?.clusters || [];

  const last30 = daily;
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
    detections.forEach(d => {
      const src = d.source?.toLowerCase().includes("viirs") ? "VIIRS" : "MODIS";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).map(([source, count]) => ({ source, count }));
  }, [detections]);

  const weeklyComparison = useMemo(() => {
    return last7.map(d => ({
      date: d.date.slice(5),
      fullDate: d.date,
      current: d.total_detections,
      high_risk: d.high_risk_count,
      clusters: d.active_clusters,
    }));
  }, [last7]);

  if (dailyQ.isLoading || detectionsQ.isLoading || clustersQ.isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalDetections = last30.reduce((s, d) => s + d.total_detections, 0);
  const totalHighRisk = last30.reduce((s, d) => s + d.high_risk_count, 0);
  const avgPerDay = Math.round(totalDetections / 30);
  const maxDay = last30.reduce((m, d) => d.total_detections > m.total_detections ? d : m, last30[0] || { total_detections: 0, date: "" });

  // Calculate dynamic scale for critical fires
  const maxCritical = Math.max(...last30.map(d => d.high_risk_count), 1);
  const criticalScaleMax = Math.ceil(maxCritical * 1.2);

  // Calculate dynamic scale for weekly chart
  const maxCriticalWeekly = Math.max(...last7.map(d => d.high_risk_count), 1);
  const criticalScaleMaxWeekly = Math.ceil(maxCriticalWeekly * 1.2);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("stats.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("stats.subtitle")}</p>
        </div>
        <a href="/export" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Download className="w-4 h-4" />
          {t("export.title")}
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <YAxis 
              yAxisId="total" 
              tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} 
              tickLine={false} 
              axisLine={false}
              label={{ value: t("stats.trend.total"), angle: -90, position: 'insideLeft', fontSize: 9, fill: "hsl(150 8% 55%)" }}
            />
            <YAxis 
              yAxisId="critical" 
              orientation="right"
              tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} 
              tickLine={false} 
              axisLine={false}
              domain={[0, criticalScaleMax]}
              label={{ value: t("stats.trend.highRisk"), angle: 90, position: 'insideRight', fontSize: 9, fill: "hsl(0 84% 60%)" }}
            />
            <Tooltip 
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--popover-border))", borderRadius: 8, fontSize: 11 }} 
              labelFormatter={(value) => formatDateForTooltip(value, lang)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="total_detections" yAxisId="total" name={t("stats.trend.total")} stroke="hsl(18 80% 50%)" strokeWidth={2} fill="url(#g1)" />
            <Area type="monotone" dataKey="high_risk_count" yAxisId="critical" name={t("stats.trend.highRisk")} stroke="hsl(0 84% 60%)" strokeWidth={2} fill="url(#g2)" />
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
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--popover-border))", borderRadius: 8, fontSize: 11 }} />
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
              <XAxis dataKey="fullDate" tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis 
                yAxisId="total" 
                tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} 
                tickLine={false} 
                axisLine={false}
                label={{ value: t("stats.weekly.total"), angle: -90, position: 'insideLeft', fontSize: 9, fill: "hsl(150 8% 55%)" }}
              />
              <YAxis 
                yAxisId="critical" 
                orientation="right"
                tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} 
                tickLine={false} 
                axisLine={false}
                domain={[0, criticalScaleMaxWeekly]}
                label={{ value: t("stats.weekly.highRisk"), angle: 90, position: 'insideRight', fontSize: 9, fill: "hsl(0 84% 60%)" }}
              />
              <Tooltip 
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--popover-border))", borderRadius: 8, fontSize: 11 }} 
                labelFormatter={(value) => formatDateForTooltip(value, lang)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="current" yAxisId="total" name={t("stats.weekly.total")} stroke="hsl(18 80% 50%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(18 80% 50%)" }} />
              <Line type="monotone" dataKey="high_risk" yAxisId="critical" name={t("stats.weekly.highRisk")} stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(0 84% 60%)" }} />
              <Line type="monotone" dataKey="clusters" yAxisId="total" name={t("stats.weekly.clusters")} stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(38 92% 50%)" }} />
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
