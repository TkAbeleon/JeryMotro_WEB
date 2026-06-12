import "leaflet/dist/leaflet.css";
import { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Filter, X, Layers, ChevronDown } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { format, subDays, subMonths, isAfter } from "date-fns";

// --- Types ---
type RiskLevel = "critical" | "high" | "medium" | "low";
type Period = "today" | "7d" | "30d" | "90d" | "1y";

interface FirePoint {
  id: number;
  lat: number;
  lng: number;
  risk: number;
  confidence: number;
  brightness: number;
  source: "MODIS" | "VIIRS";
  region: string;
  detectedAt: Date;
}

// --- Mock data: realistic Madagascar fire detections ---
const now = new Date();
function daysAgo(d: number) { return subDays(now, d); }

const MOCK_FIRES: FirePoint[] = [
  // Antananarivo region
  { id: 1,  lat: -18.91, lng: 47.54, risk: 0.82, confidence: 91, brightness: 341, source: "MODIS", region: "Antananarivo", detectedAt: daysAgo(0) },
  { id: 2,  lat: -19.10, lng: 47.20, risk: 0.75, confidence: 88, brightness: 328, source: "VIIRS", region: "Antananarivo", detectedAt: daysAgo(1) },
  { id: 3,  lat: -18.65, lng: 47.80, risk: 0.55, confidence: 72, brightness: 310, source: "MODIS", region: "Antananarivo", detectedAt: daysAgo(2) },
  { id: 4,  lat: -19.30, lng: 46.90, risk: 0.38, confidence: 60, brightness: 295, source: "VIIRS", region: "Antananarivo", detectedAt: daysAgo(5) },
  { id: 5,  lat: -18.40, lng: 47.60, risk: 0.22, confidence: 45, brightness: 280, source: "MODIS", region: "Antananarivo", detectedAt: daysAgo(12) },
  { id: 6,  lat: -19.55, lng: 47.40, risk: 0.91, confidence: 95, brightness: 365, source: "VIIRS", region: "Antananarivo", detectedAt: daysAgo(0) },
  { id: 7,  lat: -18.80, lng: 46.80, risk: 0.63, confidence: 78, brightness: 315, source: "MODIS", region: "Antananarivo", detectedAt: daysAgo(3) },
  // Fianarantsoa
  { id: 8,  lat: -21.45, lng: 47.09, risk: 0.88, confidence: 93, brightness: 355, source: "VIIRS", region: "Fianarantsoa", detectedAt: daysAgo(0) },
  { id: 9,  lat: -21.80, lng: 47.40, risk: 0.72, confidence: 85, brightness: 330, source: "MODIS", region: "Fianarantsoa", detectedAt: daysAgo(1) },
  { id: 10, lat: -22.10, lng: 46.80, risk: 0.56, confidence: 74, brightness: 312, source: "VIIRS", region: "Fianarantsoa", detectedAt: daysAgo(4) },
  { id: 11, lat: -21.20, lng: 47.50, risk: 0.42, confidence: 65, brightness: 298, source: "MODIS", region: "Fianarantsoa", detectedAt: daysAgo(8) },
  { id: 12, lat: -22.40, lng: 47.00, risk: 0.78, confidence: 89, brightness: 338, source: "VIIRS", region: "Fianarantsoa", detectedAt: daysAgo(2) },
  { id: 13, lat: -20.90, lng: 46.50, risk: 0.29, confidence: 50, brightness: 285, source: "MODIS", region: "Fianarantsoa", detectedAt: daysAgo(20) },
  // Toamasina
  { id: 14, lat: -18.14, lng: 49.39, risk: 0.77, confidence: 87, brightness: 335, source: "VIIRS", region: "Toamasina", detectedAt: daysAgo(0) },
  { id: 15, lat: -17.80, lng: 49.10, risk: 0.61, confidence: 76, brightness: 318, source: "MODIS", region: "Toamasina", detectedAt: daysAgo(3) },
  { id: 16, lat: -18.60, lng: 48.90, risk: 0.85, confidence: 92, brightness: 348, source: "VIIRS", region: "Toamasina", detectedAt: daysAgo(1) },
  { id: 17, lat: -19.00, lng: 48.50, risk: 0.44, confidence: 68, brightness: 300, source: "MODIS", region: "Toamasina", detectedAt: daysAgo(7) },
  { id: 18, lat: -17.40, lng: 49.50, risk: 0.32, confidence: 55, brightness: 290, source: "VIIRS", region: "Toamasina", detectedAt: daysAgo(15) },
  // Mahajanga
  { id: 19, lat: -15.72, lng: 46.32, risk: 0.94, confidence: 97, brightness: 378, source: "VIIRS", region: "Mahajanga", detectedAt: daysAgo(0) },
  { id: 20, lat: -16.00, lng: 46.80, risk: 0.80, confidence: 90, brightness: 342, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(1) },
  { id: 21, lat: -15.30, lng: 47.10, risk: 0.65, confidence: 80, brightness: 322, source: "VIIRS", region: "Mahajanga", detectedAt: daysAgo(2) },
  { id: 22, lat: -16.50, lng: 45.90, risk: 0.51, confidence: 70, brightness: 308, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(6) },
  { id: 23, lat: -14.90, lng: 46.50, risk: 0.87, confidence: 93, brightness: 352, source: "VIIRS", region: "Mahajanga", detectedAt: daysAgo(0) },
  { id: 24, lat: -15.50, lng: 48.00, risk: 0.35, confidence: 58, brightness: 292, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(25) },
  // Toliara
  { id: 25, lat: -23.36, lng: 43.67, risk: 0.73, confidence: 86, brightness: 332, source: "MODIS", region: "Toliara", detectedAt: daysAgo(1) },
  { id: 26, lat: -24.00, lng: 44.20, risk: 0.59, confidence: 75, brightness: 314, source: "VIIRS", region: "Toliara", detectedAt: daysAgo(3) },
  { id: 27, lat: -22.80, lng: 43.40, risk: 0.89, confidence: 94, brightness: 360, source: "MODIS", region: "Toliara", detectedAt: daysAgo(0) },
  { id: 28, lat: -24.50, lng: 43.90, risk: 0.41, confidence: 64, brightness: 297, source: "VIIRS", region: "Toliara", detectedAt: daysAgo(9) },
  { id: 29, lat: -23.80, lng: 44.80, risk: 0.26, confidence: 47, brightness: 282, source: "MODIS", region: "Toliara", detectedAt: daysAgo(18) },
  { id: 30, lat: -22.50, lng: 44.50, risk: 0.66, confidence: 81, brightness: 324, source: "VIIRS", region: "Toliara", detectedAt: daysAgo(2) },
  // Antsiranana
  { id: 31, lat: -12.35, lng: 49.30, risk: 0.71, confidence: 84, brightness: 328, source: "VIIRS", region: "Antsiranana", detectedAt: daysAgo(1) },
  { id: 32, lat: -13.00, lng: 49.70, risk: 0.55, confidence: 73, brightness: 311, source: "MODIS", region: "Antsiranana", detectedAt: daysAgo(4) },
  { id: 33, lat: -12.80, lng: 48.90, risk: 0.83, confidence: 91, brightness: 345, source: "VIIRS", region: "Antsiranana", detectedAt: daysAgo(0) },
  { id: 34, lat: -13.50, lng: 49.00, risk: 0.47, confidence: 67, brightness: 302, source: "MODIS", region: "Antsiranana", detectedAt: daysAgo(10) },
  { id: 35, lat: -12.00, lng: 49.50, risk: 0.38, confidence: 60, brightness: 294, source: "VIIRS", region: "Antsiranana", detectedAt: daysAgo(22) },
  // Extra scattered
  { id: 36, lat: -17.00, lng: 44.00, risk: 0.76, confidence: 88, brightness: 337, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(1) },
  { id: 37, lat: -20.00, lng: 45.00, risk: 0.60, confidence: 77, brightness: 316, source: "VIIRS", region: "Toliara", detectedAt: daysAgo(2) },
  { id: 38, lat: -16.50, lng: 47.50, risk: 0.48, confidence: 69, brightness: 304, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(6) },
  { id: 39, lat: -20.50, lng: 48.00, risk: 0.34, confidence: 57, brightness: 291, source: "VIIRS", region: "Fianarantsoa", detectedAt: daysAgo(13) },
  { id: 40, lat: -14.00, lng: 48.50, risk: 0.69, confidence: 82, brightness: 326, source: "MODIS", region: "Antsiranana", detectedAt: daysAgo(2) },
  { id: 41, lat: -17.50, lng: 44.80, risk: 0.92, confidence: 96, brightness: 370, source: "VIIRS", region: "Mahajanga", detectedAt: daysAgo(0) },
  { id: 42, lat: -19.80, lng: 46.20, risk: 0.57, confidence: 74, brightness: 313, source: "MODIS", region: "Antananarivo", detectedAt: daysAgo(5) },
  { id: 43, lat: -21.70, lng: 44.30, risk: 0.81, confidence: 90, brightness: 343, source: "VIIRS", region: "Toliara", detectedAt: daysAgo(1) },
  { id: 44, lat: -13.80, lng: 47.80, risk: 0.43, confidence: 66, brightness: 299, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(8) },
  { id: 45, lat: -22.90, lng: 46.10, risk: 0.67, confidence: 82, brightness: 325, source: "VIIRS", region: "Fianarantsoa", detectedAt: daysAgo(2) },
  { id: 46, lat: -18.20, lng: 46.10, risk: 0.86, confidence: 93, brightness: 350, source: "MODIS", region: "Antananarivo", detectedAt: daysAgo(0) },
  { id: 47, lat: -16.80, lng: 49.20, risk: 0.52, confidence: 71, brightness: 309, source: "VIIRS", region: "Toamasina", detectedAt: daysAgo(6) },
  { id: 48, lat: -23.60, lng: 44.60, risk: 0.36, confidence: 59, brightness: 293, source: "MODIS", region: "Toliara", detectedAt: daysAgo(17) },
  { id: 49, lat: -11.80, lng: 49.20, risk: 0.74, confidence: 86, brightness: 333, source: "VIIRS", region: "Antsiranana", detectedAt: daysAgo(1) },
  { id: 50, lat: -15.00, lng: 47.60, risk: 0.62, confidence: 79, brightness: 320, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(3) },
  { id: 51, lat: -20.30, lng: 47.70, risk: 0.79, confidence: 89, brightness: 340, source: "VIIRS", region: "Fianarantsoa", detectedAt: daysAgo(1) },
  { id: 52, lat: -17.20, lng: 45.20, risk: 0.46, confidence: 67, brightness: 301, source: "MODIS", region: "Mahajanga", detectedAt: daysAgo(11) },
  { id: 53, lat: -24.20, lng: 43.50, risk: 0.84, confidence: 92, brightness: 347, source: "VIIRS", region: "Toliara", detectedAt: daysAgo(0) },
  { id: 54, lat: -12.60, lng: 49.80, risk: 0.53, confidence: 72, brightness: 310, source: "MODIS", region: "Antsiranana", detectedAt: daysAgo(7) },
  { id: 55, lat: -18.30, lng: 48.70, risk: 0.90, confidence: 95, brightness: 362, source: "VIIRS", region: "Toamasina", detectedAt: daysAgo(0) },
];

const REGIONS = ["Antananarivo", "Fianarantsoa", "Toamasina", "Mahajanga", "Toliara", "Antsiranana"];
const PERIODS: Period[] = ["today", "7d", "30d", "90d", "1y"];

function getRiskLevel(risk: number): RiskLevel {
  if (risk >= 0.7) return "critical";
  if (risk >= 0.5) return "high";
  if (risk >= 0.3) return "medium";
  return "low";
}

function getRiskColor(risk: number): string {
  if (risk >= 0.7) return "#ef4444";
  if (risk >= 0.5) return "#f97316";
  if (risk >= 0.3) return "#f59e0b";
  return "#22c55e";
}

function getPeriodCutoff(period: Period): Date {
  switch (period) {
    case "today": return subDays(now, 1);
    case "7d":   return subDays(now, 7);
    case "30d":  return subDays(now, 30);
    case "90d":  return subMonths(now, 3);
    case "1y":   return subMonths(now, 12);
  }
}

// Fix map attribution + legend overlap
function MapAttributionFix() {
  const map = useMap();
  return null;
}

export default function MapPage() {
  const { t } = useI18n();

  const [period, setPeriod] = useState<Period>("30d");
  const [selectedRisks, setSelectedRisks] = useState<Set<RiskLevel>>(new Set(["critical", "high", "medium", "low"]));
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [filterOpen, setFilterOpen] = useState(true);

  const toggleRisk = (r: RiskLevel) => {
    setSelectedRisks(prev => {
      const next = new Set(prev);
      if (next.has(r)) { next.delete(r); } else { next.add(r); }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const cutoff = getPeriodCutoff(period);
    return MOCK_FIRES.filter(p => {
      if (!isAfter(p.detectedAt, cutoff)) return false;
      if (!selectedRisks.has(getRiskLevel(p.risk))) return false;
      if (selectedRegion !== "all" && p.region !== selectedRegion) return false;
      if (selectedSource !== "all" && p.source !== selectedSource) return false;
      return true;
    });
  }, [period, selectedRisks, selectedRegion, selectedSource]);

  const criticalCount = filtered.filter(p => p.risk >= 0.7).length;

  const RISK_LEVELS: { key: RiskLevel; color: string }[] = [
    { key: "critical", color: "#ef4444" },
    { key: "high",     color: "#f97316" },
    { key: "medium",   color: "#f59e0b" },
    { key: "low",      color: "#22c55e" },
  ];

  const legendLabels: Record<RiskLevel, string> = {
    critical: t("map.legend.critical"),
    high:     t("map.legend.high"),
    medium:   t("map.legend.medium"),
    low:      t("map.legend.low"),
  };

  const periodLabels: Record<Period, string> = {
    today: t("map.filter.period.today"),
    "7d":  t("map.filter.period.7d"),
    "30d": t("map.filter.period.30d"),
    "90d": t("map.filter.period.90d"),
    "1y":  t("map.filter.period.1y"),
  };

  return (
    <div className="-m-4 sm:-m-6 flex h-[calc(100vh-58px)] overflow-hidden relative">

      {/* ── Filter Panel ── */}
      <div
        className={`bg-card border-r border-border flex flex-col z-[500] transition-all duration-300 flex-shrink-0 overflow-y-auto ${
          filterOpen ? "w-[280px]" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <span className="font-heading font-semibold text-sm">{t("map.filter.title")}</span>
          <button onClick={() => setFilterOpen(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-6 flex-1">
          {/* Period */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("map.filter.period")}</div>
            <div className="flex flex-col gap-1.5">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    period === p ? "bg-primary text-primary-foreground font-medium" : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Risk level */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("map.filter.risk")}</div>
            <div className="flex flex-col gap-2">
              {RISK_LEVELS.map(({ key, color }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedRisks.has(key)}
                    onChange={() => toggleRisk(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0`}
                    style={{
                      borderColor: color,
                      backgroundColor: selectedRisks.has(key) ? color : "transparent",
                    }}
                  >
                    {selectedRisks.has(key) && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm">{legendLabels[key]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("map.filter.region")}</div>
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="w-full h-9 bg-secondary border border-input rounded-lg px-3 pr-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{t("map.filter.region.all")}</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Source */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("map.filter.source")}</div>
            <div className="flex gap-2">
              {["all", "MODIS", "VIIRS"].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSource(s)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                    selectedSource === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {s === "all" ? t("map.filter.source.all") : s}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setPeriod("30d");
              setSelectedRisks(new Set(["critical", "high", "medium", "low"]));
              setSelectedRegion("all");
              setSelectedSource("all");
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg py-2 transition-colors"
          >
            {t("common.reset")}
          </button>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 inline mr-1.5" />
            {t("map.legend")}
          </div>
          <div className="space-y-2">
            {RISK_LEVELS.map(({ key, color }) => (
              <div key={key} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color, opacity: 0.9 }} />
                {legendLabels[key]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Toggle filter button */}
        {!filterOpen && (
          <button
            onClick={() => setFilterOpen(true)}
            className="absolute top-4 left-4 z-[500] bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium shadow-md hover:bg-secondary transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t("map.filter.title")}
          </button>
        )}

        {/* Stats bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-5 py-2.5 shadow-lg text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("map.stats.total")}</span>
            <span className="font-bold">{filtered.length}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">{t("map.stats.critical")}</span>
            <span className="font-bold text-destructive">{criticalCount}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="text-xs text-muted-foreground">
            {periodLabels[period]}
          </div>
        </div>

        {/* Leaflet Map — dark CartoDB tiles */}
        <MapContainer
          center={[-18.766947, 46.869107]}
          zoom={6}
          style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
          zoomControl={true}
          attributionControl={true}
        >
          <MapAttributionFix />

          {/* Dark tile layer (CartoDB Dark Matter) — dev */}
          {/* PRODUCTION: swap TileLayer for @react-google-maps/api <GoogleMap> with mapTypeId="satellite" */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {filtered.map(point => (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              radius={point.risk >= 0.7 ? 9 : point.risk >= 0.5 ? 7 : 6}
              pathOptions={{
                color: getRiskColor(point.risk),
                fillColor: getRiskColor(point.risk),
                fillOpacity: 0.85,
                weight: 1.5,
              }}
            >
              <Popup className="fire-popup">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getRiskColor(point.risk) }}
                  />
                  {point.region}
                  <span
                    className="ml-auto text-xs px-1.5 py-0.5 rounded font-bold uppercase"
                    style={{ backgroundColor: getRiskColor(point.risk) + "22", color: getRiskColor(point.risk) }}
                  >
                    {t(`risk.${getRiskLevel(point.risk)}` as any)}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between gap-4">
                    <span>{t("map.popup.confidence")}</span>
                    <span className="text-white font-medium">{point.confidence}%</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>{t("map.popup.brightness")}</span>
                    <span className="text-white font-medium">{point.brightness} K</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>{t("map.popup.source")}</span>
                    <span className="text-white font-medium">{point.source}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>{t("map.popup.detected")}</span>
                    <span className="text-white font-medium">{format(point.detectedAt, "dd/MM HH:mm")}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>{t("map.popup.coords")}</span>
                    <span className="text-white font-medium">{point.lat.toFixed(3)}, {point.lng.toFixed(3)}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
