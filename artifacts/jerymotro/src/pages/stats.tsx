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

const chartGrid = "hsl(150 15% 15%)";
const chartTick = { fontSize: 10, fill: "hsl(150 8% 55%)" };
const chartTooltip = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--popover-border))",
  borderRadius: 10,
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
    noData: "Aucune donnée disponible.", enrichment: "Enrichissement", retry: "Réessayer", category: "catégories",
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
    enrichment: "Fanampin-angona", retry: "Andramo indray", category: "sokajy",
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
    enrichment: "Enrichment", retry: "Retry", category: "categories",
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
  return date.toISOString().slice(0, 10);
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : \`\${value.toFixed(1)}%\`;
}

function displayValue(value: string | null | undefined, lang: Lang, c: Copy) {
  if (value == null || value === "") return c.notProvided;
  return environmentLabels[value]?.[lang] ?? value;
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
    <section className={\`rounded-xl border border-border/55 bg-card/35 p-4 sm:p-5 \${className}\`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function DistributionTable({ title, rows, lang, c }: { title: string; rows: DistributionRow[]; lang: Lang; c: Copy }) {
  return (
    <SectionCard title={title}>
      {rows.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">{c.noData}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 font-medium">{c.variable}</th>
                <th className="pb-2 text-right font-medium">{c.detections}</th>
                <th className="pb-2 text-right font-medium">%</th>
                <th className="pb-2 text-right font-medium">{c.enrichment}</th>
                <th className="pb-2 text-right font-medium">FRP</th>
                <th className="pb-2 text-right font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={\`\${row.dimension}-\${row.value}-\${row.is_null}-\${index}\`} className="border-b border-border/30 last:border-0">
                  <td className="py-2.5 font-medium">{row.is_null ? c.notProvided : displayValue(row.value, lang, c)}</td>
                  <td className="text-right">{row.detections.toLocaleString()}</td>
                  <td className="text-right">{formatPercent(row.percentage)}</td>
                  <td className="text-right">{formatPercent(row.enriched_percentage)}</td>
                  <td className="text-right">{formatNumber(row.average_frp)}</td>
                  <td className="text-right">{formatNumber(row.average_risk, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function MetricCard({ label, value, icon: Icon, percent = false }: { label: string; value: number | null | undefined; icon: typeof Flame; percent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/55 bg-card/55 p-3.5">
      <Icon className="mb-3 h-4 w-4 text-primary" />
      <div className="font-heading text-xl font-semibold">{percent ? formatPercent(value) : formatNumber(value, 0)}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
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
    { label: c.environmentCoverage, value: summary?.environmental_coverage_percent, icon: Trees, percent: true },
    { label: c.regions, value: summary?.total_regions, icon: MapPin, percent: false },
    { label: c.clusters, value: summary?.total_clusters, icon: Layers3, percent: false },
    { label: c.fireEvents, value: summary?.total_fire_events, icon: BarChart3, percent: false },
    { label: c.satellites, value: summary?.total_satellites, icon: Database, percent: false },
    { label: c.collectionRuns, value: summary?.total_collection_runs, icon: RefreshCw, percent: false },
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
    <div className="space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("stats.title")}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {c.currentPeriod} : {dateFrom} → {dateTo}
          </p>
        </div>
        <a
          href="/export"
          className="inline-flex h-9 items-center gap-2 self-start rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:opacity-90 lg:self-auto"
        >
          <Download className="h-3.5 w-3.5" />{t("export.title")}
        </a>
      </header>

      <section className="sticky top-2 z-20 rounded-xl border border-border/60 bg-background/95 p-3 shadow-sm backdrop-blur sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold">{c.filters}</h2>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {c.reset}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{c.dateFrom}</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={e => setDateFrom(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs"
            />
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{c.dateTo}</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={e => setDateTo(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs"
            />
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{c.environment}</span>
            <select
              value={environment}
              onChange={e => setEnvironment(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs"
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

          <label className="flex min-h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs">
            <input type="checkbox" checked={excludeNoise} onChange={e => setExcludeNoise(e.target.checked)} />
            <span>{c.excludeNoise}</span>
          </label>
        </div>
      </section>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg p-1">
          <TabsTrigger value="overview" className="shrink-0 gap-1.5"><Globe2 className="h-3.5 w-3.5" />{c.overview}</TabsTrigger>
          <TabsTrigger value="time" className="shrink-0 gap-1.5"><CalendarRange className="h-3.5 w-3.5" />{c.time}</TabsTrigger>
          <TabsTrigger value="environment" className="shrink-0 gap-1.5"><Trees className="h-3.5 w-3.5" />{c.environmentTab}</TabsTrigger>
          <TabsTrigger value="risk" className="shrink-0 gap-1.5"><ShieldAlert className="h-3.5 w-3.5" />{c.riskSignals}</TabsTrigger>
          <TabsTrigger value="numeric" className="shrink-0 gap-1.5"><BarChart3 className="h-3.5 w-3.5" />{c.numeric}</TabsTrigger>
          <TabsTrigger value="cluster" className="shrink-0 gap-1.5"><Layers3 className="h-3.5 w-3.5" />{c.cluster}</TabsTrigger>
          <TabsTrigger value="quality" className="shrink-0 gap-1.5"><Database className="h-3.5 w-3.5" />{c.quality}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {kpis.map(item => <MetricCard key={item.label} {...item} />)}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DistributionTable title={c.environmentDistribution} rows={advanced.environment_distribution} lang={lang} c={c} />
            <DistributionTable title={c.riskDistribution} rows={advanced.risk_distribution} lang={lang} c={c} />
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-muted-foreground">
                      <th className="pb-2">{c.variable}</th>
                      <th className="pb-2 text-right">{c.detections}</th>
                      <th className="pb-2 text-right">%</th>
                      <th className="pb-2 text-right">FRP</th>
                      <th className="pb-2 text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hourly.map((row, index) => (
                      <tr key={String(row.local_hour ?? "null") + "-" + row.is_null + "-" + index} className="border-b border-border/30 last:border-0">
                        <td className="py-2.5 font-medium">{row.is_null ? c.notProvided : String(row.local_hour).padStart(2, "0") + "h"}</td>
                        <td className="text-right">{row.detections.toLocaleString()}</td>
                        <td className="text-right">{formatPercent(row.percentage)}</td>
                        <td className="text-right">{formatNumber(row.average_frp)}</td>
                        <td className="text-right">{formatNumber(row.average_risk, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DistributionTable title={c.sources} rows={advanced.source_distribution} lang={lang} c={c} />
            <DistributionTable title={c.satellitesTitle} rows={advanced.satellite_distribution} lang={lang} c={c} />
            <DistributionTable title={c.instruments} rows={advanced.instrument_distribution} lang={lang} c={c} />
            <DistributionTable title={c.confidence} rows={advanced.confidence_distribution} lang={lang} c={c} />
            <DistributionTable title={c.dayNight} rows={advanced.daynight_distribution} lang={lang} c={c} />
            <DistributionTable title={c.drySeason} rows={advanced.season_distribution} lang={lang} c={c} />
          </div>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                    <tr key={row.context} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 font-medium">{displayValue(row.context, lang, c)}</td>
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

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DistributionTable title={c.riskDistribution} rows={advanced.risk_distribution} lang={lang} c={c} />
            <DistributionTable title={c.fireLabel} rows={advanced.fire_label_distribution} lang={lang} c={c} />
            <DistributionTable title={c.noise} rows={advanced.noise_distribution} lang={lang} c={c} />
            <DistributionTable title={c.recentLoss} rows={advanced.recent_loss_distribution} lang={lang} c={c} />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DistributionTable title={c.sources} rows={advanced.source_distribution} lang={lang} c={c} />
            <DistributionTable title={c.confidence} rows={advanced.confidence_distribution} lang={lang} c={c} />
          </div>
        </TabsContent>

        <TabsContent value="numeric" className="space-y-4">
          <SectionCard title={c.numericStats} description={c.numericDescription}>
            {numeric.length === 0 ? <EmptyState message={c.noData} /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-xs">
                  <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="pb-2">{c.variable}</th><th className="pb-2">{c.valid}</th><th className="pb-2">{c.missing}</th>
                    <th className="pb-2 text-right">{c.mean}</th><th className="pb-2 text-right">{c.median}</th>
                    <th className="pb-2 text-right">{c.variance}</th><th className="pb-2 text-right">{c.stdDev}</th>
                    <th className="pb-2 text-right">{c.q1}</th><th className="pb-2 text-right">{c.q3}</th>
                    <th className="pb-2 text-right">{c.iqr}</th><th className="pb-2 text-right">{c.outliers}</th>
                  </tr></thead>
                  <tbody>{numeric.map(row => (
                    <tr key={row.field} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 font-medium">{row.field}</td>
                      <td className="text-muted-foreground">{numericUnits[row.field] ?? "—"}</td>
                      <td>{row.valid_count.toLocaleString()}</td>
                      <td>{row.missing_count.toLocaleString()} ({formatPercent(row.missing_percentage)})</td>
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
                    <tr key={String(row.variable_x) + "-" + String(row.variable_y)} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 font-medium">{row.variable_x}</td><td>{row.variable_y}</td>
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

        <TabsContent value="cluster" className="space-y-4">
          <SectionCard title={c.topClusters}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-2">#</th><th className="pb-2 text-right">{c.detections}</th><th className="pb-2">{c.region}</th><th className="pb-2">{c.environment}</th>
                  <th className="pb-2 text-right">FRP</th><th className="pb-2 text-right">Risk</th>
                </tr></thead>
                <tbody>{advanced.top_clusters.map(row => (
                  <tr key={row.cluster_id} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 font-medium">#{row.cluster_id}</td><td className="text-right">{row.detections.toLocaleString()}</td>
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
                  <tr key={row.fire_event_id} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 font-medium">#{row.fire_event_id}</td><td className="text-right">{row.detections.toLocaleString()}</td>
                    <td>{row.region ?? c.notProvided}</td><td className="text-right">{formatNumber(row.total_frp)}</td>
                    <td className="text-right">{formatNumber(row.max_frp)}</td><td className="text-right">{formatNumber(row.average_risk, 3)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <SectionCard title={c.nullAnalysis}>
            {advanced.null_analysis.length === 0 ? <EmptyState message={c.noData} /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-xs">
                  <thead><tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="pb-2">{c.field}</th><th className="pb-2 text-right">{c.total}</th><th className="pb-2 text-right">{c.valid}</th>
                    <th className="pb-2 text-right">{c.nullCount}</th><th className="pb-2 text-right">{c.nullPercent}</th>
                  </tr></thead>
                  <tbody>{advanced.null_analysis.map(row => (
                    <tr key={row.field} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 font-medium">{row.field}</td><td className="text-right">{row.total_count.toLocaleString()}</td>
                      <td className="text-right">{row.non_null_count.toLocaleString()}</td><td className="text-right">{row.null_count.toLocaleString()}</td>
                      <td className="text-right">{formatPercent(row.null_percentage)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title={c.geospatial}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                <div key={String(name)} className="rounded-lg border border-border/45 bg-background/25 p-3">
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
