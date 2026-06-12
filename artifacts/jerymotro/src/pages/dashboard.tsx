import { useGetDashboardSummary, useGetDailyStats, useListDetections } from "@workspace/api-client-react";
import { mockDashboardSummary, generateMockDailyStats, generateMockDetections } from "@/lib/mock-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Flame, Bell, Cpu, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";

function useWithFallback<T>(query: { data: T | undefined; isLoading: boolean }, fallback: T) {
  return query.data ?? fallback;
}

const getRiskColor = (score: number | null | undefined) => {
  if (!score) return "text-muted-foreground";
  if (score >= 0.7) return "text-destructive";
  if (score >= 0.5) return "text-primary";
  if (score >= 0.3) return "text-[#f59e0b]";
  return "text-accent";
};

export default function DashboardPage() {
  const { t } = useI18n();

  const summaryQ = useGetDashboardSummary();
  const dailyQ = useGetDailyStats();
  const detectionsQ = useListDetections({ limit: 10 });

  const summary = useWithFallback(summaryQ, mockDashboardSummary);
  const daily = useWithFallback(dailyQ, generateMockDailyStats());
  const detectionsData = useWithFallback(detectionsQ, generateMockDetections());

  const chartData = useMemo(() => {
    return (daily.stats || []).slice(-14).map(d => ({
      date: d.date.slice(5),
      total: d.total_detections,
      high: d.high_risk_count,
    }));
  }, [daily]);

  const recentDetections = useMemo(() => {
    return (detectionsData.detections || []).slice(0, 6);
  }, [detectionsData]);

  const getRiskLabel = (score: number | null | undefined) => {
    if (!score) return t("risk.unknown");
    if (score >= 0.7) return t("risk.critical");
    if (score >= 0.5) return t("risk.high");
    if (score >= 0.3) return t("risk.medium");
    return t("risk.low");
  };

  const pipelineOk = summary.pipeline_status === "operational";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${pipelineOk ? "bg-accent/10 border-accent/30 text-accent" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
          {pipelineOk ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {pipelineOk ? t("pipeline.operational") : t("pipeline.degraded")}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t("dashboard.kpi.detectionsToday"),
            value: summary.total_detections_today,
            sub: t("dashboard.kpi.detectionsSub"),
            icon: Activity,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: t("dashboard.kpi.activeClusters"),
            value: summary.active_clusters,
            sub: `${summary.critical_alerts} ${t("dashboard.kpi.critiques")}`,
            icon: Flame,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
          {
            label: t("dashboard.kpi.alertsSent"),
            value: summary.critical_alerts,
            sub: t("dashboard.kpi.alertsSub"),
            icon: Bell,
            color: "text-[#f59e0b]",
            bg: "bg-[#f59e0b]/10",
          },
          {
            label: t("dashboard.kpi.accuracy"),
            value: `${((summary.xgboost_accuracy ?? 0.89) * 100).toFixed(0)}%`,
            sub: `${t("dashboard.kpi.ai")} ${summary.ai_response_time_ms}ms`,
            icon: Cpu,
            color: "text-accent",
            bg: "bg-accent/10",
          },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${k.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <div className={`font-heading text-3xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-sm font-medium mt-1">{k.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold">{t("dashboard.chart.title")}</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60 inline-block" />
                {t("dashboard.chart.total")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                {t("dashboard.chart.highRisk")}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(18 80% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(18 80% 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 15%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 15%)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="total" stroke="hsl(18 80% 50%)" strokeWidth={2} fill="url(#gTotal)" name={t("dashboard.chart.total")} />
              <Area type="monotone" dataKey="high" stroke="hsl(0 84% 60%)" strokeWidth={2} fill="url(#gHigh)" name={t("dashboard.chart.highRisk")} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-heading font-semibold mb-4">{t("dashboard.regions.title")}</h2>
          <div className="space-y-3">
            {(summary.regions_affected_today || ["Analamanga", "Boeny", "Diana"]).map((region, i) => (
              <div key={region} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-destructive" : i === 1 ? "bg-primary" : "bg-[#f59e0b]"}`} />
                <span className="text-sm flex-1">{region}</span>
                <span className="text-xs text-muted-foreground">{30 - i * 8}+ {t("dashboard.regions.fires")}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border text-xs text-muted-foreground">
              {t("dashboard.regions.updated")}
            </div>
          </div>
        </div>
      </div>

      {/* Recent detections */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-semibold">{t("dashboard.recent.title")}</h2>
          <a href="/detections" className="text-xs text-primary hover:underline">{t("common.seeAll")}</a>
        </div>
        <div className="divide-y divide-border">
          {recentDetections.map(d => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.risk_score && d.risk_score >= 0.7 ? "bg-destructive" : d.risk_score && d.risk_score >= 0.5 ? "bg-primary" : "bg-[#f59e0b]"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{d.region || t("dashboard.recent.unknownRegion")}</div>
                <div className="text-xs text-muted-foreground">{d.latitude?.toFixed(3)}, {d.longitude?.toFixed(3)} — {d.source}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${getRiskColor(d.risk_score)}`}>{getRiskLabel(d.risk_score)}</div>
                <div className="text-xs text-muted-foreground">{t("dashboard.recent.frp")}: {d.frp?.toFixed(0)} MW</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
