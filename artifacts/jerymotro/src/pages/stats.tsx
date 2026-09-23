import { useMemo } from "react";
import { useGetEnvironmentalAdvancedStats } from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { useI18n } from "@/hooks/use-i18n";
import { subDays } from "date-fns";
import { Download, Activity, Flame, Trees, BarChart3, Database, MapPin, Layers3 } from "lucide-react";
import { AsyncStateInline } from "@/components/ui/async-state";

const chartGrid = "hsl(150 15% 15%)";
const chartTick = { fontSize: 10, fill: "hsl(150 8% 55%)" };
const chartTooltip = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--popover-border))",
  borderRadius: 10,
  fontSize: 11,
};

function apiDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}%`;
}

function label(value: string | null | undefined) {
  return value == null || value === "" ? "Non renseigné" : value;
}

function DistributionTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    dimension: string;
    value?: string | null;
    is_null: boolean;
    detections: number;
    percentage: number;
    enriched_percentage: number;
    average_frp?: number | null;
    average_risk?: number | null;
  }>;
}) {
  return (
    <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        <span className="text-[10px] text-muted-foreground">{rows.length} catégories</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">Aucune donnée disponible.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 font-medium">Valeur</th>
                <th className="pb-2 text-right font-medium">Détections</th>
                <th className="pb-2 text-right font-medium">Part</th>
                <th className="pb-2 text-right font-medium">Enrichies</th>
                <th className="pb-2 text-right font-medium">FRP moyen</th>
                <th className="pb-2 text-right font-medium">Risque moyen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.dimension}-${row.value}-${row.is_null}-${index}`} className="border-b border-border/30 last:border-0">
                  <td className="py-2.5 font-medium">{row.is_null ? "Non renseigné" : label(row.value)}</td>
                  <td className="py-2.5 text-right">{row.detections.toLocaleString()}</td>
                  <td className="py-2.5 text-right">{formatPercent(row.percentage)}</td>
                  <td className="py-2.5 text-right">{formatPercent(row.enriched_percentage)}</td>
                  <td className="py-2.5 text-right">{formatNumber(row.average_frp)}</td>
                  <td className="py-2.5 text-right">{formatNumber(row.average_risk, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function StatsPage() {
  const { t } = useI18n();
  const { dateFrom, dateTo } = useMemo(() => {
    const to = new Date();
    return { dateFrom: apiDate(subDays(to, 30)), dateTo: apiDate(to) };
  }, []);

  const advancedQ = useGetEnvironmentalAdvancedStats(
    { date_from: dateFrom, date_to: dateTo, exclude_noise: true },
    { query: { staleTime: 60_000, refetchInterval: 5 * 60_000 } },
  );

  const advanced = advancedQ.data;
  const summary = advanced?.summary;
  const daily = advanced?.daily_evolution ?? [];
  const numeric = advanced?.numeric_statistics ?? [];
  const hourly = advanced?.hourly_distribution ?? [];

  const numericUnits: Record<string, string> = {
    frp: "MW",
    brightness: "K",
    bright_t31: "K",
    diff_brightness: "K",
    risk_score: "score",
    confidence_num: "score",
    temperature_2m: "°C",
    relative_humidity: "%",
    wind_speed: "m/s",
    precipitation: "mm",
    slope_deg: "°",
    ndvi_10m: "indice",
    scan: "km",
    track: "km",
    scan_track_ratio: "ratio",
  };

  const correlations = useMemo(
    () => (advanced?.correlations ?? [])
      .filter(row => row.pair_count >= 2 && row.pearson_correlation != null)
      .sort((a, b) => Math.abs(b.pearson_correlation ?? 0) - Math.abs(a.pearson_correlation ?? 0))
      .slice(0, 15),
    [advanced?.correlations],
  );

  if (advancedQ.isLoading) {
    return <AsyncStateInline type="loading" title={t("common.loading")} description="Préparation des statistiques analytiques…" />;
  }

  if (advancedQ.isError || !advanced) {
    return (
      <AsyncStateInline
        type="error"
        title="Impossible de charger les statistiques"
        description="L'analyse avancée n'est pas disponible actuellement."
        onAction={() => advancedQ.refetch()}
        actionLabel="Réessayer"
      />
    );
  }

  const kpis = [
    { label: "Détections", value: summary?.total_detections, icon: Flame },
    { label: "FRP total", value: summary?.total_frp, icon: Activity },
    { label: "Couverture environnementale", value: summary?.environmental_coverage_percent, icon: Trees, suffix: "%" },
    { label: "Régions", value: summary?.total_regions, icon: MapPin },
    { label: "Clusters", value: summary?.total_clusters, icon: Layers3 },
    { label: "Événements feu", value: summary?.total_fire_events, icon: BarChart3 },
    { label: "Satellites", value: summary?.total_satellites, icon: Database },
    { label: "Runs de collecte", value: summary?.total_collection_runs, icon: Database },
  ];

  return (
    <div className="space-y-7 p-4 sm:p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("stats.title")}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Analyse avancée de firms_fire_detections du {dateFrom} au {dateTo}. Les valeurs NULL restent explicitement identifiées et ne sont jamais converties en zéro.
          </p>
        </div>
        <a href="/export" className="inline-flex h-9 items-center gap-2 self-start rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:opacity-90 lg:self-auto">
          <Download className="h-3.5 w-3.5" />{t("export.title")}
        </a>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {kpis.map(({ label: kpiLabel, value, icon: Icon, suffix }) => (
          <div key={kpiLabel} className="rounded-xl border border-border/55 bg-card/55 p-3.5">
            <Icon className="mb-3 h-4 w-4 text-primary" />
            <div className="font-heading text-xl font-semibold">{suffix ? formatPercent(value) : formatNumber(value, 0)}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{kpiLabel}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-sm font-semibold">Évolution temporelle</h2>
            <p className="mt-1 text-xs text-muted-foreground">Détections, risque et clusters par jour.</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{daily.length} jours</span>
        </div>
        {daily.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">Aucune donnée temporelle.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="statsTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(18 80% 50%)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="hsl(18 80% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="date" tick={chartTick} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis tick={chartTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltip} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={7} />
              <Area type="monotone" dataKey="detections" name="Détections" stroke="hsl(18 80% 50%)" fill="url(#statsTotal)" />
              <Line type="monotone" dataKey="high_risk_detections" name="Risque élevé" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clusters" name="Clusters" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DistributionTable title="Environnement" rows={advanced.environment_distribution} />
        <DistributionTable title="Niveau de risque" rows={advanced.risk_distribution} />
        <DistributionTable title="Régions" rows={advanced.region_distribution} />
        <DistributionTable title="Sources" rows={advanced.source_distribution} />
        <DistributionTable title="Satellites" rows={advanced.satellite_distribution} />
        <DistributionTable title="Instruments" rows={advanced.instrument_distribution} />
        <DistributionTable title="Confiance FIRMS" rows={advanced.confidence_distribution} />
        <DistributionTable title="Jour / nuit" rows={advanced.daynight_distribution} />
        <DistributionTable title="Saison sèche" rows={advanced.season_distribution} />
        <DistributionTable title="Perte récente" rows={advanced.recent_loss_distribution} />
        <DistributionTable title="Landcover" rows={advanced.landcover_distribution} />
        <DistributionTable title="Fire label" rows={advanced.fire_label_distribution} />
        <DistributionTable title="Bruit" rows={advanced.noise_distribution} />
      </div>

      <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-sm font-semibold">Répartition horaire locale</h2>
            <p className="mt-1 text-xs text-muted-foreground">Les heures manquantes restent séparées et ne sont pas transformées en une heure artificielle.</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{hourly.length} modalités</span>
        </div>
        {hourly.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">Aucune donnée horaire disponible.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-xs">
              <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2">Heure</th><th className="pb-2 text-right">Détections</th><th className="pb-2 text-right">Part</th><th className="pb-2 text-right">FRP moyen</th><th className="pb-2 text-right">Risque moyen</th>
              </tr></thead>
              <tbody>{hourly.map((row, index) => (
                <tr key={`${row.local_hour ?? "null"}-${row.is_null}-${index}`} className="border-b border-border/30 last:border-0">
                  <td className="py-2.5 font-medium">{row.is_null ? "Non renseigné" : `${String(row.local_hour).padStart(2, "0")}h`}</td>
                  <td className="text-right">{row.detections.toLocaleString()}</td>
                  <td className="text-right">{formatPercent(row.percentage)}</td>
                  <td className="text-right">{formatNumber(row.average_frp)}</td>
                  <td className="text-right">{formatNumber(row.average_risk, 3)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-heading text-sm font-semibold">Statistiques numériques</h2>
          <p className="mt-1 text-xs text-muted-foreground">Échantillon valide, valeurs manquantes, dispersion et valeurs extrêmes.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-xs">
            <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
              <th className="pb-2">Variable</th><th className="text-right">N valide</th><th className="text-right">NULL</th><th className="text-right">Moyenne</th><th className="text-right">Médiane</th><th className="text-right">Variance</th><th className="text-right">Écart-type</th><th className="text-right">Q1</th><th className="text-right">Q3</th><th className="text-right">IQR</th><th className="text-right">Outliers</th>
            </tr></thead>
            <tbody>{numeric.map(row => (
              <tr key={row.field} className="border-b border-border/30 last:border-0">
                <td className="py-2.5 font-medium">{row.field}</td>
                <td className="text-muted-foreground">{numericUnits[row.field] ?? "—"}</td>
                <td className="text-right">{row.valid_count.toLocaleString()}</td>
                <td className="text-right">{row.missing_count.toLocaleString()} ({formatPercent(row.missing_percentage)})</td>
                <td className="text-right">{formatNumber(row.mean)}</td>
                <td className="text-right">{formatNumber(row.median)}</td>
                <td className="text-right">{formatNumber(row.variance)}</td>
                <td className="text-right">{formatNumber(row.std_dev)}</td>
                <td className="text-right">{formatNumber(row.q1)}</td>
                <td className="text-right">{formatNumber(row.q3)}</td>
                <td className="text-right">{formatNumber(row.iqr)}</td>
                <td className="text-right">{formatNumber(row.outlier_count, 0)} ({formatPercent(row.outlier_percentage)})</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">Composition des contextes</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-xs">
              <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2">Contexte</th><th className="text-right">Détections</th><th className="text-right">Moyenne</th><th className="text-right">Médiane</th><th className="text-right">Variance</th><th className="text-right">Écart-type</th>
              </tr></thead>
              <tbody>{advanced.context_composition.map(row => (
                <tr key={row.context} className="border-b border-border/30 last:border-0">
                  <td className="py-2.5 font-medium">{row.context}</td>
                  <td className="text-right">{row.detections_with_context.toLocaleString()}</td>
                  <td className="text-right">{formatPercent(row.mean_percentage)}</td>
                  <td className="text-right">{formatPercent(row.median_percentage)}</td>
                  <td className="text-right">{formatNumber(row.variance)}</td>
                  <td className="text-right">{formatNumber(row.std_dev)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">Analyse des NULL</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead><tr className="border-b border-border/50 text-left text-muted-foreground"><th className="pb-2">Champ</th><th className="text-right">Total</th><th className="text-right">Valides</th><th className="text-right">NULL</th><th className="text-right">Part NULL</th></tr></thead>
              <tbody>{advanced.null_analysis.map(row => (
                <tr key={row.field} className="border-b border-border/30 last:border-0">
                  <td className="py-2.5 font-medium">{row.field}</td><td className="text-right">{row.total_count.toLocaleString()}</td><td className="text-right">{row.non_null_count.toLocaleString()}</td><td className="text-right">{row.null_count.toLocaleString()}</td><td className="text-right">{formatPercent(row.null_percentage)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-heading text-sm font-semibold">Corrélations Pearson</h2>
          <p className="mt-1 text-xs text-muted-foreground">Calculées uniquement sur les paires où les deux variables sont disponibles.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-xs">
            <thead><tr className="border-b border-border/50 text-left text-muted-foreground"><th className="pb-2">X</th><th className="pb-2">Y</th><th className="pb-2 text-right">Paires</th><th className="pb-2 text-right">r</th><th className="pb-2 text-right">Covariance</th></tr></thead>
            <tbody>{correlations.map(row => (
              <tr key={`${row.variable_x}-${row.variable_y}`} className="border-b border-border/30 last:border-0">
                <td className="py-2.5 font-medium">{row.variable_x}</td><td>{row.variable_y}</td><td className="text-right">{row.pair_count.toLocaleString()}</td><td className="text-right font-medium">{formatNumber(row.pearson_correlation, 3)}</td><td className="text-right">{formatNumber(row.covariance, 3)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">Clusters principaux</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-xs">
            <thead><tr className="border-b border-border/50 text-left text-muted-foreground"><th className="pb-2">Cluster</th><th className="text-right">Détections</th><th>Région</th><th>Environnement</th><th className="text-right">FRP total</th><th className="text-right">Risque</th></tr></thead>
            <tbody>{advanced.top_clusters.map(row => <tr key={row.cluster_id} className="border-b border-border/30 last:border-0"><td className="py-2.5 font-medium">#{row.cluster_id}</td><td className="text-right">{row.detections.toLocaleString()}</td><td>{label(row.region)}</td><td>{label(row.dominant_environment)}</td><td className="text-right">{formatNumber(row.total_frp)}</td><td className="text-right">{formatNumber(row.average_risk, 3)}</td></tr>)}</tbody>
          </table></div>
        </section>

        <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">Événements feu principaux</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-xs">
            <thead><tr className="border-b border-border/50 text-left text-muted-foreground"><th className="pb-2">Événement</th><th className="text-right">Détections</th><th>Région</th><th className="text-right">FRP total</th><th className="text-right">FRP max</th><th className="text-right">Risque</th></tr></thead>
            <tbody>{advanced.top_fire_events.map(row => <tr key={row.fire_event_id} className="border-b border-border/30 last:border-0"><td className="py-2.5 font-medium">#{row.fire_event_id}</td><td className="text-right">{row.detections.toLocaleString()}</td><td>{label(row.region)}</td><td className="text-right">{formatNumber(row.total_frp)}</td><td className="text-right">{formatNumber(row.max_frp)}</td><td className="text-right">{formatNumber(row.average_risk, 3)}</td></tr>)}</tbody>
          </table></div>
        </section>
      </div>

      <section className="rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold">Étendue géospatiale</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Latitude min", advanced.geospatial_summary.min_latitude],
            ["Latitude max", advanced.geospatial_summary.max_latitude],
            ["Longitude min", advanced.geospatial_summary.min_longitude],
            ["Longitude max", advanced.geospatial_summary.max_longitude],
            ["Centre latitude", advanced.geospatial_summary.centroid_latitude],
            ["Centre longitude", advanced.geospatial_summary.centroid_longitude],
            ["Écart-type latitude", advanced.geospatial_summary.latitude_std_dev],
            ["Écart-type longitude", advanced.geospatial_summary.longitude_std_dev],
          ].map(([name, value]) => (
            <div key={name} className="rounded-lg border border-border/45 bg-background/25 p-3">
              <div className="text-sm font-semibold">{formatNumber(value as number | null | undefined, 4)}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
