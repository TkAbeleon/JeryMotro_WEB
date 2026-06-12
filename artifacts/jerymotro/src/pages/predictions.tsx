import { useMemo } from "react";
import { useListPredictions } from "@workspace/api-client-react";
import { generateMockPredictions } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain, Calendar, TrendingUp, Target } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const getRiskColor = (s: number) => {
  if (s >= 0.7) return "#ef4444";
  if (s >= 0.5) return "#e8531a";
  if (s >= 0.3) return "#f59e0b";
  return "#22c55e";
};

const getRiskBg = (s: number) => {
  if (s >= 0.7) return "bg-destructive/15 text-destructive";
  if (s >= 0.5) return "bg-primary/15 text-primary";
  if (s >= 0.3) return "bg-[#f59e0b]/15 text-[#f59e0b]";
  return "bg-accent/15 text-accent";
};

export default function PredictionsPage() {
  const { t } = useI18n();

  const getRiskLabel = (s: number) => {
    if (s >= 0.7) return t("risk.critical");
    if (s >= 0.5) return t("risk.high");
    if (s >= 0.3) return t("risk.medium");
    return t("risk.low");
  };

  const query = useListPredictions({ limit: 50 });
  const data = query.data ?? generateMockPredictions();
  const predictions = data.predictions || [];

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  const stats = useMemo(() => {
    const critical = predictions.filter(p => p.risk_score_j1 >= 0.7).length;
    const high = predictions.filter(p => p.risk_score_j1 >= 0.5 && p.risk_score_j1 < 0.7).length;
    const avg = predictions.reduce((s, p) => s + p.risk_score_j1, 0) / (predictions.length || 1);
    const avgConf = predictions.reduce((s, p) => s + (p.confidence ?? 0.75), 0) / (predictions.length || 1);
    return { critical, high, avg, avgConf };
  }, [predictions]);

  const regionData = useMemo(() => {
    const map: Record<string, { count: number; maxRisk: number }> = {};
    predictions.forEach(p => {
      const r = p.region || "Autre";
      if (!map[r]) map[r] = { count: 0, maxRisk: 0 };
      map[r].count++;
      map[r].maxRisk = Math.max(map[r].maxRisk, p.risk_score_j1);
    });
    return Object.entries(map).map(([region, d]) => ({ region, ...d })).sort((a, b) => b.maxRisk - a.maxRisk);
  }, [predictions]);

  const sortedByRisk = [...predictions].sort((a, b) => b.risk_score_j1 - a.risk_score_j1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("predictions.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />
            {tomorrow} — {t("predictions.model")}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs px-3 py-1.5 rounded-full">
          <Brain className="w-3.5 h-3.5" />
          <span>{t("predictions.accuracy")}: {(stats.avgConf * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("predictions.kpi.critical"), value: stats.critical, color: "text-destructive", bg: "bg-destructive/10", icon: Target },
          { label: t("predictions.kpi.high"), value: stats.high, color: "text-primary", bg: "bg-primary/10", icon: TrendingUp },
          { label: t("predictions.kpi.avgScore"), value: (stats.avg * 100).toFixed(0) + "%", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", icon: Brain },
          { label: t("predictions.kpi.analyzed"), value: predictions.length, color: "text-accent", bg: "bg-accent/10", icon: Calendar },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border border-card-border rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className={`font-heading text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk by region chart */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-heading font-semibold mb-4">{t("predictions.chart.regionRisk")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 15%)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 10, fill: "hsl(150 8% 55%)" }} tickLine={false} axisLine={false} width={90} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(0)}%`} contentStyle={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 15%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="maxRisk" radius={[0, 4, 4, 0]}>
                {regionData.map((entry, idx) => (
                  <Cell key={idx} fill={getRiskColor(entry.maxRisk)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top risk zones list */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-heading font-semibold">{t("predictions.topRisks")}</h2>
            <span className="text-xs text-muted-foreground">{t("predictions.model.label")}: {sortedByRisk[0]?.model_version || "v2.1"}</span>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[320px]">
            {sortedByRisk.slice(0, 20).map(p => (
              <div key={p.id} data-testid={`row-prediction-${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getRiskColor(p.risk_score_j1) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.region || t("predictions.zone.unknown")}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.latitude.toFixed(3)}, {p.longitude.toFixed(3)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${getRiskBg(p.risk_score_j1)} px-2 py-0.5 rounded-full`}>{getRiskLabel(p.risk_score_j1)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{(p.risk_score_j1 * 100).toFixed(0)}% {t("predictions.risk")}</div>
                </div>
                <div className="text-right w-16">
                  <div className="text-xs text-muted-foreground">{t("predictions.conf")}</div>
                  <div className="text-xs font-medium">{((p.confidence ?? 0.75) * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h2 className="font-heading font-semibold mb-4">{t("predictions.distribution.title")}</h2>
        <div className="flex items-center gap-4">
          {[
            { labelKey: "predictions.dist.critical" as const, count: stats.critical, color: "bg-destructive" },
            { labelKey: "predictions.dist.high" as const, count: stats.high, color: "bg-primary" },
            { labelKey: "predictions.dist.medium" as const, count: predictions.filter(p => p.risk_score_j1 >= 0.3 && p.risk_score_j1 < 0.5).length, color: "bg-[#f59e0b]" },
            { labelKey: "predictions.dist.low" as const, count: predictions.filter(p => p.risk_score_j1 < 0.3).length, color: "bg-accent" },
          ].map(item => (
            <div key={item.labelKey} className="flex-1 bg-secondary/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{t(item.labelKey)}</span>
              </div>
              <div className="font-heading text-2xl font-bold">{item.count}</div>
              <div className="text-xs text-muted-foreground">
                {predictions.length > 0 ? ((item.count / predictions.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
