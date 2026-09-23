import { useMemo, useState, type ReactNode } from "react";
import { useGetEnvironmentalAdvancedStats } from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
} from "recharts";
import { useI18n, type Lang } from "@/hooks/use-i18n";
import { subDays } from "date-fns";
import {
  Activity,
  BarChart3,
  CalendarRange,
  Database,
  Download,
  Flame,
  Globe2,
  Layers3,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Trees,
} from "lucide-react";
import { AsyncStateInline } from "@/components/ui/async-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const chartGrid = "hsl(var(--border))";
const chartTick = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const chartTooltip = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 11,
};

type DistributionRow = {
  dimension: string;
  value?: string | null;
  is_null: boolean;
  detections: number;
  percentage: number;
  enriched_percentage: number;
  average_frp?: number | null;
  average_risk?: number | null;
};

type Copy = {
  filters: string; dateFrom: string; dateTo: string; environment: string; region: string;
  allEnvironments: string; allRegions: string; excludeNoise: string; reset: string;
  overview: string; time: string; environmentTab: string; riskSignals: string; numeric: string;
  cluster: string; quality: string; totalDetections: string; totalFrp: string;
  environmentCoverage: string; regions: string; clusters: string; fireEvents: string;
  satellites: string; collectionRuns: string; temporalEvolution: string; temporalDescription: string;
  detections: string; highRisk: string; currentPeriod: string; hourly: string;
  environmentDistribution: string; riskDistribution: string; regionDistribution: string;
  sources: string; satellitesTitle: string; instruments: string; confidence: string; dayNight: string;
  drySeason: string; recentLoss: string; landcover: string; fireLabel: string; noise: string;
  numericStats: string; numericDescription: string; variable: string; valid: string; missing: string;
  mean: string; median: string; variance: string; stdDev: string; q1: string; q3: string;
  iqr: string; outliers: string; contextComposition: string; nullAnalysis: string; field: string;
  total: string; nullCount: string; nullPercent: string; correlations: string;
  correlationDescription: string; pairs: string; pearson: string; covariance: string;
  topClusters: string; fireEventsTitle: string; geospatial: string; minLatitude: string;
  maxLatitude: string; minLongitude: string; maxLongitude: string; centroidLatitude: string;
  centroidLongitude: string; latitudeStd: string; longitudeStd: string; notProvided: string;
  noData: string; enrichment: string; retry: string; category: string;
};

const copy: Record<Lang, Copy> = {
  fr: {
    filters: "Filtres d’analyse", dateFrom: "Du", dateTo: "Au", environment: "Environnement", region: "Région",
    allEnvironments: "Tous les environnements", allRegions: "Toutes les régions", excludeNoise: "Exclure le bruit",
    reset: "Réinitialiser", overview: "Vue d’ensemble", time: "Temps & sources", environmentTab: "Environnement",
    riskSignals: "Risque & signaux", numeric: "Statistiques & corrélations", cluster: "Clusters & événements",
    quality: "Qualité & géospatial", totalDetections: "Détections", totalFrp: "FRP total",
    environmentCoverage: "Couverture environnementale", regions: "Régions", clusters: "Clusters",
    fireEvents: "Événements feu", satellites: "Satellites", collectionRuns: "Runs de collecte",
    temporalEvolution: "Évolution temporelle", temporalDescription: "Détections, risque élevé et clusters par jour.",
    detections: "Détections", highRisk: "Risque élevé", currentPeriod: "Période sélectionnée", hourly: "Répartition horaire locale",
    environmentDistribution: "Répartition environnementale", riskDistribution: "Répartition des risques",
    regionDistribution: "Répartition par région", sources: "Sources", satellitesTitle: "Satellites", instruments: "Instruments",
    confidence: "Confiance FIRMS", dayNight: "Jour / nuit", drySeason: "Saison sèche", recentLoss: "Perte récente",
    landcover: "Landcover", fireLabel: "Fire label", noise: "Bruit", numericStats: "Statistiques numériques",
    numericDescription: "Dispersion, tendance centrale et valeurs extrêmes. Les NULL sont exclus des calculs numériques.",
    variable: "Variable", valid: "Valides", missing: "NULL", mean: "Moyenne", median: "Médiane",
    variance: "Variance", stdDev: "Écart-type", q1: "Q1", q3: "Q3", iqr: "IQR", outliers: "Outliers",
    contextComposition: "Composition des contextes", nullAnalysis: "Qualité des données / NULL", field: "Champ",
    total: "Total", nullCount: "NULL", nullPercent: "% NULL", correlations: "Corrélations de Pearson",
    correlationDescription: "Chaque paire utilise uniquement les observations où les deux variables sont présentes.",
    pairs: "Paires", pearson: "r", covariance: "Covariance", topClusters: "Clusters principaux",
    fireEventsTitle: "Événements feu principaux", geospatial: "Étendue géospatiale",
    minLatitude: "Latitude min", maxLatitude: "Latitude max", minLongitude: "Longitude min",
    maxLongitude: "Longitude max", centroidLatitude: "Centre latitude", centroidLongitude: "Centre longitude",
    latitudeStd: "Écart-type latitude", longitudeStd: "Écart-type longitude", notProvided: "Non renseigné",
    noData: "Aucune donnée disponible.", enrichment: "Enrichissement", retry: "Réessayer", category: "catégories", unit: "Unité",
  },
  mg: {
    filters: "Sivana famakafakana", dateFrom: "Manomboka", dateTo: "Hatramin’ny", environment: "Tontolo iainana",
    region: "Faritra", allEnvironments: "Tontolo iainana rehetra", allRegions: "Faritra rehetra",
    excludeNoise: "Esory ny tabataba", reset: "Avereno", overview: "Topimaso", time: "Fotoana & loharano",
    environmentTab: "Tontolo iainana", riskSignals: "Loza & famantarana", numeric: "Antontan’isa & fifandraisana",
    cluster: "Clusters & hetsika", quality: "Kalitaon’ny angona & jeografia", totalDetections: "Fahitana",
    totalFrp: "FRP total", environmentCoverage: "Fandrakofana tontolo iainana", regions: "Faritra",
    clusters: "Clusters", fireEvents: "Hetsika afo", satellites: "Satellites", collectionRuns: "Fanangonana",
    temporalEvolution: "Fiovan’ny fotoana", temporalDescription: "Fahitana, loza ambony ary clusters isan’andro.",
    detections: "Fahitana", highRisk: "Loza ambony", currentPeriod: "Fotoana voafidy", hourly: "Fizarana isan’ora",
    environmentDistribution: "Fizarana tontolo iainana", riskDistribution: "Fizarana haavon’ny loza",
    regionDistribution: "Fizarana isam-paritra", sources: "Loharano", satellitesTitle: "Satellites",
    instruments: "Fitaovana", confidence: "Fitokisan’ny FIRMS", dayNight: "Andro / alina",
    drySeason: "Vanim-potoana maina", recentLoss: "Fahaverezana vao haingana", landcover: "Landcover",
    fireLabel: "Marika afo", noise: "Tabataba", numericStats: "Antontan’isa isa",
    numericDescription: "Fiparitahana, sanda afovoany ary sanda ivelany. Ny NULL dia tsy ampidirina amin’ny kajy.",
    variable: "Miovaova", valid: "Misy", missing: "NULL", mean: "Salany", median: "Mediana",
    variance: "Variance", stdDev: "Écart-type", q1: "Q1", q3: "Q3", iqr: "IQR", outliers: "Sanda ivelany",
    contextComposition: "Famoronana ny tontolo iainana", nullAnalysis: "Kalitaon’ny angona / NULL", field: "Saha",
    total: "Fitambarany", nullCount: "NULL", nullPercent: "% NULL", correlations: "Fifandraisana Pearson",
    correlationDescription: "Ny mpivady tsirairay dia mampiasa ireo fandinihana ahitana ireo miovaova roa ihany.",
    pairs: "Mpivady", pearson: "r", covariance: "Covariance", topClusters: "Clusters lehibe",
    fireEventsTitle: "Hetsika afo lehibe", geospatial: "Faritra ara-jeografia", minLatitude: "Latitude kely indrindra",
    maxLatitude: "Latitude lehibe indrindra", minLongitude: "Longitude kely indrindra",
    maxLongitude: "Longitude lehibe indrindra", centroidLatitude: "Latitude afovoany",
    centroidLongitude: "Longitude afovoany", latitudeStd: "Écart-type latitude",
    longitudeStd: "Écart-type longitude", notProvided: "Tsy voafaritra", noData: "Tsy misy angona.",
    enrichment: "Fanampin-angona", retry: "Andramo indray", category: "sokajy", unit: "Vondrona",
  },
  en: {
    filters: "Analysis filters", dateFrom: "From", dateTo: "To", environment: "Environment", region: "Region",
    allEnvironments: "All environments", allRegions: "All regions", excludeNoise: "Exclude noise", reset: "Reset",
    overview: "Overview", time: "Time & sources", environmentTab: "Environment", riskSignals: "Risk & signals",
    numeric: "Statistics & correlations", cluster: "Clusters & events", quality: "Quality & geospatial",
    totalDetections: "Detections", totalFrp: "Total FRP", environmentCoverage: "Environmental coverage",
    regions: "Regions", clusters: "Clusters", fireEvents: "Fire events", satellites: "Satellites",
    collectionRuns: "Collection runs", temporalEvolution: "Temporal evolution",
    temporalDescription: "Detections, high-risk detections and clusters by day.", detections: "Detections",
    highRisk: "High risk", currentPeriod: "Selected period", hourly: "Local hourly distribution",
    environmentDistribution: "Environmental distribution", riskDistribution: "Risk distribution",
    regionDistribution: "Regional distribution", sources: "Sources", satellitesTitle: "Satellites",
    instruments: "Instruments", confidence: "FIRMS confidence", dayNight: "Day / night", drySeason: "Dry season",
    recentLoss: "Recent loss", landcover: "Landcover", fireLabel: "Fire label", noise: "Noise",
    numericStats: "Numeric statistics",
    numericDescription: "Dispersion, central tendency and extreme values. NULL values are excluded from numerical calculations.",
    variable: "Variable", valid: "Valid", missing: "NULL", mean: "Mean", median: "Median", variance: "Variance",
    stdDev: "Std. deviation", q1: "Q1", q3: "Q3", iqr: "IQR", outliers: "Outliers",
    contextComposition: "Context composition", nullAnalysis: "Data quality / NULL", field: "Field", total: "Total",
    nullCount: "NULL", nullPercent: "% NULL", correlations: "Pearson correlations",
    correlationDescription: "Each pair uses only observations where both variables are available.",
    pairs: "Pairs", pearson: "r", covariance: "Covariance", topClusters: "Top clusters",
    fireEventsTitle: "Top fire events", geospatial: "Geospatial extent", minLatitude: "Min latitude",
    maxLatitude: "Max latitude", minLongitude: "Min longitude", maxLongitude: "Max longitude",
    centroidLatitude: "Centroid latitude", centroidLongitude: "Centroid longitude", latitudeStd: "Latitude std. dev.",
    longitudeStd: "Longitude std. dev.", notProvided: "Not provided", noData: "No data available.",
    enrichment: "Enrichment", retry: "Retry", category: "categories", unit: "Unit",
  },
};

const environmentLabels: Record<string, Record<Lang, string>> = {
  "Forêt": { fr: "Forêt", mg: "Ala", en: "Forest" },
  "Arbustes": { fr: "Arbustes", mg: "Hazo madinika", en: "Shrubland" },
  "Prairie / Herbacé": { fr: "Prairie / Herbacé", mg: "Ahitra / bozaka", en: "Grassland / herbaceous" },
  "Culture agricole": { fr: "Culture agricole", mg: "Fambolena", en: "Cropland" },
  "Zone bâtie": { fr: "Zone bâtie", mg: "Faritra voaorina", en: "Built-up" },
  "Sol nu / Végétation clairsemée": { fr: "Sol nu / végétation clairsemée", mg: "Tany misokatra / zavamaniry vitsy", en: "Bare / sparse vegetation" },
  "Neige / Glace": { fr: "Neige / glace", mg: "Oram-panala / ranomandry", en: "Snow / ice" },
  "Eau permanente": { fr: "Eau permanente", mg: "Rano maharitra", en: "Permanent water" },
  "Zone humide herbacée": { fr: "Zone humide herbacée", mg: "Faritra mando ahitra", en: "Herbaceous wetland" },
  "Mangrove": { fr: "Mangrove", mg: "Honko", en: "Mangrove" },
  "Mousse / Lichen": { fr: "Mousse / lichen", mg: "Moss / lichen", en: "Moss / lichen" },
};

function apiDate(date: Date) {
  // Keep the calendar date in the user's local timezone instead of shifting it through UTC.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}%`;
}

function displayValue(value: string | null | undefined, lang: Lang, c: Copy) {
  if (value == null || value === "") return c.notProvided;
  return environmentLabels[value]?.[lang] ?? value;
}

function riskMeta(value?: string | null) {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("critical")) return { label: "CRITICAL", color: "#ef4444", bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.2)" };
  if (key.includes("high")) return { label: "HIGH", color: "#f97316", bg: "rgba(249,115,22,.12)", border: "rgba(249,115,22,.2)" };
  if (key.includes("medium")) return { label: "MEDIUM", color: "#f59e0b", bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.2)" };
  if (key.includes("low")) return { label: "LOW", color: "#22c55e", bg: "rgba(34,197,94,.1)", border: "rgba(34,197,94,.18)" };
  return null;
}

function RiskBadge({ value }: { value?: string | null }) {
  const meta = riskMeta(value);
  if (!meta) return <span className="text-muted-foreground">{value ?? "—"}</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.08em]"
      style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function DistributionTable({ title, rows, lang, c }: { title: string; rows: DistributionRow[]; lang: Lang; c: Copy }) {
  const isRisk = title === c.riskDistribution;
  return (
    <SectionCard title={title}>
      {rows.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">{c.noData}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="pb-3 font-medium">{c.variable}</th>
                <th className="pb-3 text-right font-medium">{c.detections}</th>
                <th className="pb-3 text-right font-medium">%</th>
                <th className="pb-3 text-right font-medium">{c.enrichment}</th>
                <th className="pb-3 text-right font-medium">FRP</th>
                <th className="pb-3 text-right font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const risk = riskMeta(row.value);
                return (
                  <tr key={`${row.dimension}-${row.value}-${row.is_null}-${index}`} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="py-3 font-medium">{isRisk && !row.is_null ? <RiskBadge value={row.value} /> : row.is_null ? c.notProvided : displayValue(row.value, lang, c)}</td>
                    <td className="text-right font-medium">{row.detections.toLocaleString()}</td>
                    <td className="min-w-[140px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }} />
                        </div>
                        <span>{formatPercent(row.percentage)}</span>
                      </div>
                    </td>
                    <td className="text-right">{formatPercent(row.enriched_percentage)}</td>
                    <td className="text-right">{formatNumber(row.average_frp)}</td>
                    <td className="text-right">{risk ? <span className="font-semibold" style={{ color: risk.color }}>{formatNumber(row.average_risk, 3)}</span> : formatNumber(row.average_risk, 3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function RiskOverview({ rows, lang, c }: { rows: DistributionRow[]; lang: Lang; c: Copy }) {
  const visible = rows.filter(row => !row.is_null && row.value).map(row => ({ ...row, risk: riskMeta(row.value) })).filter(row => row.risk);
  return (
    <SectionCard title={c.riskDistribution}>
      <div className="space-y-4">
        {visible.length === 0 ? <EmptyState message={c.noData} /> : visible.map((row, index) => (
          <div key={`${row.value}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <RiskBadge value={row.value} />
              <span className="text-xs font-semibold tabular-nums">{row.detections.toLocaleString()} · {formatPercent(row.percentage)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%`, backgroundColor: row.risk?.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  percent = false,
  tone,
  emphasis = "primary",
}: {
  label: string;
  value: number | null | undefined;
  icon: typeof Flame;
  percent?: boolean;
  tone: string;
  emphasis?: "primary" | "secondary";
}) {
  return (
    <div className={`group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-px hover:border-border3 ${emphasis === "primary" ? "sm:p-5" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="max-w-[10rem] text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      </div>
      <div className={`mt-4 font-heading font-semibold tracking-tight ${emphasis === "primary" ? "text-3xl" : "text-2xl"}`}>
        {percent ? formatPercent(value) : formatNumber(value, 0)}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { t, lang } = useI18n();
  const c = copy[lang];

  const [dateFrom, setDateFrom] = useState(() => apiDate(subDays(new Date(), 30)));
  const [dateTo, setDateTo] = useState(() => apiDate(new Date()));
  const [environment, setEnvironment] = useState("");
  const [region, setRegion] = useState("");
  const [excludeNoise, setExcludeNoise] = useState(true);

  const advancedQ = useGetEnvironmentalAdvancedStats(
    {
      date_from: dateFrom,
      date_to: dateTo,
      environment: environment || undefined,
      region: region || undefined,
      exclude_noise: excludeNoise,
    },
    { query: { staleTime: 60_000, refetchInterval: 5 * 60_000, keepPreviousData: true } },
  );

  const optionsQ = useGetEnvironmentalAdvancedStats(
    { date_from: dateFrom, date_to: dateTo, exclude_noise: excludeNoise },
    { query: { staleTime: 5 * 60_000, refetchInterval: 10 * 60_000, keepPreviousData: true } },
  );

  const advanced = advancedQ.data;
  const optionsData = optionsQ.data ?? advanced;
  const summary = advanced?.summary;
  const daily = advanced?.daily_evolution ?? [];
  const hourly = advanced?.hourly_distribution ?? [];
  const numeric = advanced?.numeric_statistics ?? [];

  const correlations = useMemo(
    () => (advanced?.correlations ?? [])
      .filter(row => row.pair_count >= 2 && row.pearson_correlation != null)
      .sort((a, b) => Math.abs(b.pearson_correlation ?? 0) - Math.abs(a.pearson_correlation ?? 0)),
    [advanced?.correlations],
  );

  const environmentOptions = useMemo(
    () => (optionsData?.environment_distribution ?? [])
      .filter((row: DistributionRow) => !row.is_null && row.value)
      .map((row: DistributionRow) => row.value as string),
    [optionsData?.environment_distribution],
  );

  const regionOptions = useMemo(
    () => (optionsData?.region_distribution ?? [])
      .filter((row: DistributionRow) => !row.is_null && row.value)
      .map((row: DistributionRow) => row.value as string),
    [optionsData?.region_distribution],
  );

  const numericUnits: Record<string, string> = {
    frp: "MW", brightness: "K", bright_t31: "K", diff_brightness: "K", risk_score: "score",
    confidence_num: "score", temperature_2m: "°C", relative_humidity: "%", wind_speed: "m/s",
    precipitation: "mm", slope_deg: "°", ndvi_10m: "index", scan: "km", track: "km", scan_track_ratio: "ratio",
  };

  const kpis = [
    { label: c.totalDetections, value: summary?.total_detections, icon: Flame, percent: false },
    { label: c.totalFrp, value: summary?.total_frp, icon: Activity, percent: false },
    { label: c.highRisk, value: summary?.high_risk_detections, icon: ShieldAlert, percent: false },
    { label: c.environmentCoverage, value: summary?.environmental_coverage_percent, icon: Trees, percent: true },
    { label: c.regions, value: summary?.total_regions, icon: MapPin, percent: false },
    { label: c.clusters, value: summary?.total_clusters, icon: Layers3, percent: false },
    { label: c.fireEvents, value: summary?.total_fire_events, icon: BarChart3, percent: false },
    { label: c.satellites, value: summary?.total_satellites, icon: Database, percent: false },
  ];

  const resetFilters = () => {
    setDateFrom(apiDate(subDays(new Date(), 30)));
    setDateTo(apiDate(new Date()));
    setEnvironment("");
    setRegion("");
    setExcludeNoise(true);
  };

  if (advancedQ.isLoading) {
    return <AsyncStateInline type="loading" title={t("common.loading")} description={c.temporalDescription} />;
  }

  if (advancedQ.isError || !advanced) {
    return (
      <div className="p-4 sm:p-6">
        <AsyncStateInline
          type="error"
          title={c.noData}
          description={
            lang === "fr"
              ? "L’analyse avancée n’est pas disponible actuellement."
              : lang === "mg"
                ? "Tsy azo ampiasaina amin’izao fotoana izao ny famakafakana lalina."
                : "Advanced analytics are currently unavailable."
          }
          onAction={() => advancedQ.refetch()}
          actionLabel={c.retry}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-primary" /><h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{t("stats.title")}</h1></div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {c.currentPeriod} : <span className="font-medium text-foreground">{dateFrom} → {dateTo}</span>
            {advancedQ.dataUpdatedAt ? <span className="ml-2 text-xs text-muted-foreground/70">· {new Date(advancedQ.dataUpdatedAt).toLocaleTimeString(lang === "fr" ? "fr-FR" : lang === "mg" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span> : null}
          </p>
        </div>
        <a
          href="/export"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 lg:self-auto"
        >
          <Download className="h-3.5 w-3.5" />{t("export.title")}
        </a>
      </header>

      <section className="sticky top-3 z-30 rounded-2xl border border-border/70 bg-background/90 p-4 shadow-md shadow-black/5 backdrop-blur-xl sm:p-5 lg:top-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold">{c.filters}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] ${advancedQ.isFetching ? "border-primary/30 bg-primary/5 text-primary" : "border-accent/25 bg-accent/5 text-accent"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${advancedQ.isFetching ? "animate-pulse bg-primary" : "bg-accent"}`} />
              {advancedQ.isFetching
                ? (lang === "fr" ? "ACTUALISATION" : lang === "mg" ? "MANAVAO" : "UPDATING")
                : (lang === "fr" ? "DONNÉES À JOUR" : lang === "mg" ? "ANGONA VAOVAO" : "DATA UP TO DATE")}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {c.reset}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.15fr_1.15fr_auto]">
          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{c.dateFrom}</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={e => setDateFrom(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-xs outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{c.dateTo}</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={e => setDateTo(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{c.environment}</span>
            <select
              value={environment}
              onChange={e => setEnvironment(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">{c.allEnvironments}</option>
              {environmentOptions.map(value => (
                <option key={value} value={value}>{displayValue(value, lang, c)}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{c.region}</span>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs"
            >
              <option value="">{c.allRegions}</option>
              {regionOptions.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>

          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs transition-colors hover:bg-muted/40">
            <input type="checkbox" checked={excludeNoise} onChange={e => setExcludeNoise(e.target.checked)} />
            <span>{c.excludeNoise}</span>
          </label>
        </div>
      </section>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm">
          <TabsTrigger value="overview" className="shrink-0 gap-1.5 rounded-lg border-0 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-3.5"><Globe2 className="h-3.5 w-3.5" />{c.overview}</TabsTrigger>
          <TabsTrigger value="time" className="shrink-0 gap-1.5 rounded-lg border-0 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-3.5"><CalendarRange className="h-3.5 w-3.5" />{c.time}</TabsTrigger>
          <TabsTrigger value="environment" className="shrink-0 gap-1.5 rounded-lg border-0 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-3.5"><Trees className="h-3.5 w-3.5" />{c.environmentTab}</TabsTrigger>
          <TabsTrigger value="risk" className="shrink-0 gap-1.5 rounded-lg border-0 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-3.5"><ShieldAlert className="h-3.5 w-3.5" />{c.riskSignals}</TabsTrigger>
          <TabsTrigger value="numeric" className="shrink-0 gap-1.5 rounded-lg border-0 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-3.5"><BarChart3 className="h-3.5 w-3.5" />{c.numeric}</TabsTrigger>
          <TabsTrigger value="cluster" className="shrink-0 gap-1.5 rounded-lg border-0 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-3.5"><Layers3 className="h-3.5 w-3.5" />{c.cluster}</TabsTrigger>
          <TabsTrigger value="quality" className="shrink-0 gap-1.5 rounded-lg border-0 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-3.5"><Database className="h-3.5 w-3.5" />{c.quality}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
            {kpis.slice(0, 4).map((item, index) => <MetricCard key={item.label} {...item} emphasis="primary" tone={["bg-primary/10 text-primary", "bg-primary/10 text-primary", "bg-destructive/10 text-destructive", "bg-accent/10 text-accent"][index]} />)}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.slice(4).map((item, index) => <MetricCard key={item.label} {...item} emphasis="secondary" tone={["bg-muted text-muted-foreground", "bg-muted text-muted-foreground", "bg-primary/10 text-primary", "bg-muted text-muted-foreground"][index]} />)}
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard title={c.environmentDistribution}>
              <div className="h-[300px] w-full">
                {advanced.environment_distribution.length === 0 ? (
                  <EmptyState message={c.noData} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={advanced.environment_distribution.filter((row: DistributionRow) => !row.is_null).slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 4, right: 18, left: 12, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.35} horizontal={false} />
                      <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="value" width={118} tick={chartTick} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltip} formatter={(value) => [formatNumber(Number(value), 0), c.detections]} />
                      <Bar dataKey="detections" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </SectionCard>
            <RiskOverview rows={advanced.risk_distribution} lang={lang} c={c} />
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <SectionCard title={c.temporalEvolution} description={c.temporalDescription}>
            {daily.length === 0 ? <EmptyState message={c.noData} /> : (
              <ResponsiveContainer width="100%" height={330}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="statsTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(18 80% 50%)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="hsl(18 80% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="date" tick={chartTick} tickLine={false} axisLine={false} tickFormatter={v => String(v).slice(5)} />
                  <YAxis tick={chartTick} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={7} />
                  <Area type="monotone" dataKey="detections" name={c.detections} stroke="hsl(18 80% 50%)" fill="url(#statsTotal)" />
                  <Line type="monotone" dataKey="high_risk_detections" name={c.highRisk} stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clusters" name={c.clusters} stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title={c.hourly}>
            {hourly.length === 0 ? <EmptyState message={c.noData} /> : (
              <div className="space-y-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={hourly.filter(row => !row.is_null)} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} strokeOpacity={0.18} vertical={false} />
                    <XAxis
                      dataKey="local_hour"
                      tick={chartTick}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={value => `${String(value).padStart(2, "0")}h`}
                    />
                    <YAxis tick={chartTick} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={chartTooltip}
                      formatter={(value, name) => [
                        Number(value).toLocaleString(),
                        name === "detections" ? c.detections : "FRP / Risk",
                      ]}
                    />
                    <Bar dataKey="detections" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <table className="w-full min-w-[620px] text-xs">
                    <thead className="bg-muted/35">
                      <tr className="border-b border-border/50 text-left text-muted-foreground">
                        <th className="px-3 py-2.5">{c.variable}</th>
                        <th className="px-3 py-2.5 text-right">{c.detections}</th>
                        <th className="px-3 py-2.5 text-right">%</th>
                        <th className="px-3 py-2.5 text-right">FRP</th>
                        <th className="px-3 py-2.5 text-right">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hourly.map((row, index) => (
                        <tr key={String(row.local_hour ?? "null") + "-" + row.is_null + "-" + index} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30">
                          <td className="px-3 py-2.5 font-medium">{row.is_null ? c.notProvided : String(row.local_hour).padStart(2, "0") + "h"}</td>
                          <td className="px-3 py-2.5 text-right">{row.detections.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right">{formatPercent(row.percentage)}</td>
                          <td className="px-3 py-2.5 text-right">{formatNumber(row.average_frp)}</td>
                          <td className="px-3 py-2.5 text-right">{formatNumber(row.average_risk, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <DistributionTable title={c.sources} rows={advanced.source_distribution} lang={lang} c={c} />
            <DistributionTable title={c.satellitesTitle} rows={advanced.satellite_distribution} lang={lang} c={c} />
            <DistributionTable title={c.instruments} rows={advanced.instrument_distribution} lang={lang} c={c} />
            <DistributionTable title={c.confidence} rows={advanced.confidence_distribution} lang={lang} c={c} />
            <DistributionTable title={c.dayNight} rows={advanced.daynight_distribution} lang={lang} c={c} />
            <DistributionTable title={c.drySeason} rows={advanced.season_distribution} lang={lang} c={c} />
          </div>
        </TabsContent>

        <TabsContent value="environment" className="space-y-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <DistributionTable title={c.environmentDistribution} rows={advanced.environment_distribution} lang={lang} c={c} />
            <DistributionTable title={c.regionDistribution} rows={advanced.region_distribution} lang={lang} c={c} />
            <DistributionTable title={c.landcover} rows={advanced.landcover_distribution} lang={lang} c={c} />
            <DistributionTable title={c.recentLoss} rows={advanced.recent_loss_distribution} lang={lang} c={c} />
          </div>
          <SectionCard title={c.contextComposition}>
            {advanced.context_composition.length === 0 ? <EmptyState message={c.noData} /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="pb-2">{c.variable}</th><th className="pb-2 text-right">{c.detections}</th><th className="pb-2 text-right">{c.mean}</th><th className="pb-2 text-right">{c.median}</th><th className="pb-2 text-right">{c.variance}</th><th className="pb-2 text-right">{c.stdDev}</th>
                  </tr></thead>
                  <tbody>{advanced.context_composition.map(row => (
                    <tr key={row.context} className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="py-3 font-medium">{displayValue(row.context, lang, c)}</td>
                      <td className="text-right">{row.detections_with_context.toLocaleString()}</td>
                      <td className="text-right">{formatPercent(row.mean_percentage)}</td>
                      <td className="text-right">{formatPercent(row.median_percentage)}</td>
                      <td className="text-right">{formatNumber(row.variance)}</td>
                      <td className="text-right">{formatNumber(row.std_dev)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <DistributionTable title={c.riskDistribution} rows={advanced.risk_distribution} lang={lang} c={c} />
            <DistributionTable title={c.fireLabel} rows={advanced.fire_label_distribution} lang={lang} c={c} />
            <DistributionTable title={c.noise} rows={advanced.noise_distribution} lang={lang} c={c} />
            <DistributionTable title={c.recentLoss} rows={advanced.recent_loss_distribution} lang={lang} c={c} />
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <DistributionTable title={c.sources} rows={advanced.source_distribution} lang={lang} c={c} />
            <DistributionTable title={c.confidence} rows={advanced.confidence_distribution} lang={lang} c={c} />
          </div>
        </TabsContent>

        <TabsContent value="numeric" className="space-y-6">
          <SectionCard title={c.numericStats} description={c.numericDescription}>
            {numeric.length === 0 ? <EmptyState message={c.noData} /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1320px] text-xs">
                  <thead><tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="pb-3">{c.variable}</th><th className="pb-3">{c.unit}</th><th className="pb-3 text-right">{c.valid}</th><th className="pb-3 text-right">{c.missing}</th>
                    <th className="pb-3 text-right">{c.mean}</th><th className="pb-3 text-right">{c.median}</th>
                    <th className="pb-3 text-right">{c.variance}</th><th className="pb-3 text-right">{c.stdDev}</th>
                    <th className="pb-3 text-right">{c.q1}</th><th className="pb-3 text-right">{c.q3}</th>
                    <th className="pb-3 text-right">{c.iqr}</th><th className="pb-3 text-right">{c.outliers}</th>
                  </tr></thead>
                  <tbody>{numeric.map(row => (
                    <tr key={row.field} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="py-3 font-medium">{row.field}</td>
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
            )}
          </SectionCard>

          <SectionCard title={c.correlations} description={c.correlationDescription}>
            {correlations.length === 0 ? <EmptyState message={c.noData} /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead><tr className="border-b border-border/50 text-left text-muted-foreground"><th className="pb-2">X</th><th className="pb-2">Y</th><th className="pb-2 text-right">{c.pairs}</th><th className="pb-2 text-right">{c.pearson}</th><th className="pb-2 text-right">{c.covariance}</th></tr></thead>
                  <tbody>{correlations.map(row => (
                    <tr key={String(row.variable_x) + "-" + String(row.variable_y)} className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="py-3 font-medium">{row.variable_x}</td><td>{row.variable_y}</td>
                      <td className="text-right">{row.pair_count.toLocaleString()}</td>
                      <td className="text-right font-medium">{formatNumber(row.pearson_correlation, 3)}</td>
                      <td className="text-right">{formatNumber(row.covariance, 3)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="cluster" className="space-y-6">
          <SectionCard title={c.topClusters}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-2">#</th><th className="pb-2 text-right">{c.detections}</th><th className="pb-2">{c.region}</th><th className="pb-2">{c.environment}</th>
                  <th className="pb-2 text-right">FRP</th><th className="pb-2 text-right">Risk</th>
                </tr></thead>
                <tbody>{advanced.top_clusters.map(row => (
                  <tr key={row.cluster_id} className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="py-3 font-medium">#{row.cluster_id}</td><td className="text-right">{row.detections.toLocaleString()}</td>
                    <td>{row.region ?? c.notProvided}</td><td>{row.dominant_environment ? displayValue(row.dominant_environment, lang, c) : c.notProvided}</td>
                    <td className="text-right">{formatNumber(row.total_frp)}</td><td className="text-right">{formatNumber(row.average_risk, 3)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title={c.fireEventsTitle}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-xs">
                <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-2">#</th><th className="pb-2 text-right">{c.detections}</th><th className="pb-2">{c.region}</th>
                  <th className="pb-2 text-right">FRP</th><th className="pb-2 text-right">Max</th><th className="pb-2 text-right">Risk</th>
                </tr></thead>
                <tbody>{advanced.top_fire_events.map(row => (
                  <tr key={row.fire_event_id} className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="py-3 font-medium">#{row.fire_event_id}</td><td className="text-right">{row.detections.toLocaleString()}</td>
                    <td>{row.region ?? c.notProvided}</td><td className="text-right">{formatNumber(row.total_frp)}</td>
                    <td className="text-right">{formatNumber(row.max_frp)}</td><td className="text-right">{formatNumber(row.average_risk, 3)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <SectionCard title={c.nullAnalysis}>
            {advanced.null_analysis.length === 0 ? <EmptyState message={c.noData} /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-xs">
                  <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="pb-2">{c.field}</th><th className="pb-2 text-right">{c.total}</th><th className="pb-2 text-right">{c.valid}</th>
                    <th className="pb-2 text-right">{c.nullCount}</th><th className="pb-2 text-right">{c.nullPercent}</th>
                  </tr></thead>
                  <tbody>{advanced.null_analysis.map(row => (
                    <tr key={row.field} className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="py-3 font-medium">{row.field}</td><td className="text-right">{row.total_count.toLocaleString()}</td>
                      <td className="text-right">{row.non_null_count.toLocaleString()}</td><td className="text-right">{row.null_count.toLocaleString()}</td>
                      <td className="text-right">{formatPercent(row.null_percentage)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title={c.geospatial}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                [c.minLatitude, advanced.geospatial_summary.min_latitude],
                [c.maxLatitude, advanced.geospatial_summary.max_latitude],
                [c.minLongitude, advanced.geospatial_summary.min_longitude],
                [c.maxLongitude, advanced.geospatial_summary.max_longitude],
                [c.centroidLatitude, advanced.geospatial_summary.centroid_latitude],
                [c.centroidLongitude, advanced.geospatial_summary.centroid_longitude],
                [c.latitudeStd, advanced.geospatial_summary.latitude_std_dev],
                [c.longitudeStd, advanced.geospatial_summary.longitude_std_dev],
              ].map(([name, value]) => (
                <div key={String(name)} className="rounded-xl border border-border/50 bg-background/35 p-4 transition-colors hover:bg-background/55">
                  <div className="text-sm font-semibold">{formatNumber(value as number | null | undefined, 4)}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{name}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <DistributionTable title={c.recentLoss} rows={advanced.recent_loss_distribution} lang={lang} c={c} />
          <DistributionTable title={c.noise} rows={advanced.noise_distribution} lang={lang} c={c} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-8 text-center text-xs text-muted-foreground">{message}</div>;
}
