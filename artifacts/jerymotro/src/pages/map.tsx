import "leaflet/dist/leaflet.css";
import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl, useMapEvents } from "react-leaflet";
import { Filter, X, Layers, ChevronDown, Compass, Loader2, Search, MapPin, Check, List, Calendar as CalendarIcon } from "lucide-react";
import L from "leaflet";
// @ts-ignore
import MarkerClusterGroup from "react-leaflet-cluster";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subMonths, isAfter, isBefore, isEqual } from "date-fns";
import { useListDetections } from "@workspace/api-client-react";
import { Calendar } from "@/components/ui/calendar";

// --- Types ---
type RiskLevel = "critical" | "high" | "medium" | "low";
type Period = "today" | "7d" | "30d" | "90d" | "1y" | "custom";

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

const REGIONS = ["Antananarivo", "Fianarantsoa", "Toamasina", "Mahajanga", "Toliara", "Antsiranana"];

// Geographic bounding boxes for Madagascar regions (minLat, maxLat, minLng, maxLng)
const REGION_BOUNDARIES: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  "Antananarivo": { minLat: -19.5, maxLat: -15.8, minLng: 46.5, maxLng: 49.5 },
  "Fianarantsoa": { minLat: -22.5, maxLat: -19.0, minLng: 46.0, maxLng: 48.5 },
  "Toamasina": { minLat: -18.0, maxLat: -15.0, minLng: 48.0, maxLng: 50.5 },
  "Mahajanga": { minLat: -16.5, maxLat: -13.5, minLng: 43.0, maxLng: 46.5 },
  "Toliara": { minLat: -25.5, maxLat: -19.0, minLng: 43.0, maxLng: 47.0 },
  "Antsiranana": { minLat: -12.5, maxLat: -11.0, minLng: 49.0, maxLng: 50.5 }
};

function isInRegion(lat: number, lng: number, region: string): boolean {
  const bounds = REGION_BOUNDARIES[region];
  if (!bounds) return false;
  return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
}
const PERIODS: Period[] = ["today", "7d", "30d", "90d", "1y", "custom"];

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

function getPeriodCutoff(period: Period, now: Date): Date {
  switch (period) {
    case "today": return subDays(now, 1);
    case "7d": return subDays(now, 7);
    case "30d": return subDays(now, 30);
    case "90d": return subMonths(now, 3);
    case "1y": return subMonths(now, 12);
    default: return subDays(now, 30);
  }
}

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateInRange(date: Date, from: Date, to: Date): boolean {
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const normalizedTo = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  // Normalize to UTC to avoid timezone issues
  normalizedDate.setUTCHours(0, 0, 0, 0);
  normalizedFrom.setUTCHours(0, 0, 0, 0);
  normalizedTo.setUTCHours(0, 0, 0, 0);

  return (isAfter(normalizedDate, normalizedFrom) || isEqual(normalizedDate, normalizedFrom)) &&
    (isBefore(normalizedDate, normalizedTo) || isEqual(normalizedDate, normalizedTo));
}

// Fix map attribution + legend overlap + remove default zoom controls
function MapAttributionFix() {
  const map = useMap();

  useEffect(() => {
    // Ensure no default zoom controls are present
    map.zoomControl?.remove();
  }, [map]);

  return null;
}

function MapRecenter({ lat, lng, zoom = 12 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], zoom, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}


function MapBoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds());
    },
    zoomend() {
      onBoundsChange(map.getBounds());
    },
    load() {
      onBoundsChange(map.getBounds());
    }
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";


export default function MapPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ formatted_address: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [sidebarTab, setSidebarTab] = useState<"list" | "filters">("list");
  const [hoveredFireId, setHoveredFireId] = useState<number | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&components=country:MG&key=${googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const results = data.results.map((r: any) => ({
          formatted_address: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
        setSearchResults(results);

        if (results.length === 1) {
          setMapTarget({ lat: results[0].lat, lng: results[0].lng, zoom: 12 });
          setShowSearchModal(false);
          setSearchQuery("");
        }
      } else if (data.status === "ZERO_RESULTS") {
        toast({
          title: t("common.error" as any),
          description: t("map.search.noResults" as any),
          variant: "destructive",
        });
        setSearchResults([]);
      } else {
        toast({
          title: t("common.error" as any),
          description: t("map.search.error" as any),
          variant: "destructive",
        });
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: t("common.error" as any),
        description: t("map.search.error" as any),
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };



  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: t("common.error" as any),
        description: t("map.geolocation.error.generic" as any),
        variant: "destructive",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setMapTarget({ lat: latitude, lng: longitude, zoom: 12 });
        setLocating(false);
        toast({
          title: t("common.success" as any),
          description: t("map.geolocation.success" as any),
        });
      },
      (error) => {
        setLocating(false);
        let errorKey = "map.geolocation.error.generic";
        if (error.code === error.PERMISSION_DENIED) {
          errorKey = "map.geolocation.error.denied";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorKey = "map.geolocation.error.unavailable";
        } else if (error.code === error.TIMEOUT) {
          errorKey = "map.geolocation.error.timeout";
        }
        toast({
          title: t("common.error" as any),
          description: t(errorKey as any),
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [mapStyle, setMapStyle] = useState<"satellite" | "roadmap" | "dark">("satellite");
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedRisks, setSelectedRisks] = useState<Set<RiskLevel>>(new Set(["critical", "high", "medium", "low"]));
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [filterOpen, setFilterOpen] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return {
      from: subDays(now, 30),
      to: now
    };
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const toggleRisk = (r: RiskLevel) => {
    setSelectedRisks(prev => {
      const next = new Set(prev);
      if (next.has(r)) { next.delete(r); } else { next.add(r); }
      return next;
    });
  };

  // Get current date and calculate date_from for API
  const { apiDateFrom, apiDateTo, now } = useMemo(() => {
    const n = new Date();
    let from: Date, to: Date;

    if (period === "custom") {
      from = dateRange.from;
      to = dateRange.to;
    } else {
      const cutoff = getPeriodCutoff(period, n);
      from = cutoff;
      to = n;
    }

    return {
      now: n,
      apiDateFrom: formatDateForAPI(from),
      apiDateTo: formatDateForAPI(to)
    };
  }, [period, dateRange]);

  // Prepare query params for API
  const queryParams = useMemo(() => {
    // Calculate dynamic limit based on date range
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const dynamicLimit = Math.min(10000, Math.max(2000, daysDiff * 100));
    
    const params: any = { limit: dynamicLimit, date_from: apiDateFrom, date_to: apiDateTo };
    
    // Add risk filters based on selected risks
    const riskThresholds = {
      critical: { min: 0.7, max: 1.0 },
      high: { min: 0.5, max: 0.7 },
      medium: { min: 0.3, max: 0.5 },
      low: { min: 0.0, max: 0.3 }
    };
    
    if (selectedRisks.size > 0 && selectedRisks.size < 4) {
      const activeThresholds = Array.from(selectedRisks).map(r => riskThresholds[r]);
      const minRisk = Math.min(...activeThresholds.map(t => t.min));
      const maxRisk = Math.max(...activeThresholds.map(t => t.max));
      params.min_risk = minRisk;
      params.max_risk = maxRisk;
    }
    
    // Region filter is handled client-side, not API
    if (selectedSource !== "all") {
      params.source = selectedSource === "VIIRS" ? "VIIRS_SNPP" : "MODIS";
    }
    
    return params;
  }, [apiDateFrom, apiDateTo, selectedRisks, selectedSource, dateRange]);

  const detectionsQuery = useListDetections(queryParams);

  const fires = useMemo(() => {
    if (!detectionsQuery.data?.detections) {
      return [];
    }
    return detectionsQuery.data.detections.map((d) => ({
      id: d.id,
      lat: d.latitude,
      lng: d.longitude,
      risk: d.risk_score ?? 0,
      confidence: d.confidence_num ?? (d.confidence ? parseInt(d.confidence) : 0) ?? 0,
      brightness: d.brightness ?? 0,
      source: (d.source?.toLowerCase().includes("viirs") ? "VIIRS" : "MODIS") as "MODIS" | "VIIRS",
      region: d.region || "Inconnue",
      detectedAt: d.inserted_at ? new Date(d.inserted_at) : new Date(d.acq_date),
    }));
  }, [detectionsQuery.data]);

  const filtered = useMemo(() => {
    return fires.filter(p => {
      // Risk filter
      if (!selectedRisks.has(getRiskLevel(p.risk))) return false;
      // Region filter - use geographic boundaries
      if (selectedRegion !== "all" && !isInRegion(p.lat, p.lng, selectedRegion)) return false;
      // Source filter
      if (selectedSource !== "all" && p.source !== selectedSource) return false;
      return true;
    });
  }, [fires, selectedRisks, selectedRegion, selectedSource]);

  const visibleFires = useMemo(() => {
    if (!visibleBounds) return filtered;
    return filtered.filter(f => visibleBounds.contains([f.lat, f.lng]));
  }, [filtered, visibleBounds]);

  const criticalCount = filtered.filter(p => p.risk >= 0.7).length;

  const RISK_LEVELS: { key: RiskLevel; color: string }[] = [
    { key: "critical", color: "#ef4444" },
    { key: "high", color: "#f97316" },
    { key: "medium", color: "#f59e0b" },
    { key: "low", color: "#22c55e" },
  ];

  const legendLabels: Record<RiskLevel, string> = {
    critical: t("map.legend.critical"),
    high: t("map.legend.high"),
    medium: t("map.legend.medium"),
    low: t("map.legend.low"),
  };

  const periodLabels: Record<Period, string> = {
    today: t("map.filter.period.today"),
    "7d": t("map.filter.period.7d"),
    "30d": t("map.filter.period.30d"),
    "90d": t("map.filter.period.90d"),
    "1y": t("map.filter.period.1y"),
    custom: t("map.filter.period.custom"),
  };

  return (
    <div className="flex h-[calc(100vh-58px)] overflow-hidden relative">

      {/* ── Filter Panel ── */}
      <div
        className={`bg-card border-r border-border flex flex-col z-[998] transition-all duration-300 flex-shrink-0 overflow-y-auto max-md:absolute max-md:left-0 max-md:top-0 max-md:bottom-0 h-full max-md:shadow-2xl md:relative ${filterOpen ? "w-[280px]" : "w-0 overflow-hidden border-r-0"}`}
      >
        <div className="p-4 border-b border-border flex flex-col flex-shrink-0 gap-3">
          <div className="flex items-center justify-between">
            <span className="font-heading font-semibold text-sm truncate">{t("map.sidebar.title") || "Fires & Alerts"}</span>
            <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSidebarTab("list")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors ${sidebarTab === "list" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"}`}
            >
              <List className="w-3.5 h-3.5" />
              {t("map.sidebar.tab.list") || "List"} ({visibleFires.length})
            </button>
            <button
              onClick={() => setSidebarTab("filters")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors ${sidebarTab === "filters" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"}`}
            >
              <Filter className="w-3.5 h-3.5" />
              {t("map.sidebar.tab.filters") || "Filters"}
            </button>
          </div>
        </div>

        {sidebarTab === "list" ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {visibleFires.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">{t("map.empty") || "No fires in this area"}</div>
            ) : (
              visibleFires.map(fire => (
                <div
                  key={fire.id}
                  onMouseEnter={() => setHoveredFireId(fire.id)}
                  onMouseLeave={() => setHoveredFireId(null)}
                  onClick={() => setMapTarget({ lat: fire.lat, lng: fire.lng, zoom: 15 })}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${hoveredFireId === fire.id ? "border-primary bg-secondary/50 shadow-md" : "border-border bg-card hover:border-border/80"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-muted-foreground font-mono">{fire.lat.toFixed(3)}, {fire.lng.toFixed(3)}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: getRiskColor(fire.risk) + "22", color: getRiskColor(fire.risk) }}>
                      {t(`risk.${getRiskLevel(fire.risk)}` as any)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 flex-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${fire.risk * 100}%`, backgroundColor: getRiskColor(fire.risk) }} />
                    </div>
                    <span className="text-xs font-bold font-heading ml-2">{fire.risk.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{fire.region}</span>
                    <span>{format(fire.detectedAt, "dd/MM HH:mm")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
              {/* Style de carte */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t("map.filter.style")}</div>
                <div className="grid grid-cols-3 gap-1 bg-secondary/60 p-1 rounded-lg border border-border">
                  {(["satellite", "roadmap", "dark"] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => setMapStyle(style)}
                      className={`text-center text-[10px] sm:text-xs py-1.5 px-1 rounded transition-all font-medium ${mapStyle === style ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                    >
                      {t(`map.filter.style.${style}` as any).replace(" (Google)", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("map.filter.period")}</div>
                <div className="flex flex-col gap-1.5">
                  {PERIODS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${period === p ? "bg-primary text-primary-foreground font-medium" : "hover:bg-secondary text-muted-foreground"}`}
                    >
                      {periodLabels[p]}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {period === "custom" && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Date de début</div>
                      <input
                        type="date"
                        value={formatDateForAPI(dateRange.from)}
                        min="2020-01-01"
                        max={formatDateForAPI(new Date())}
                        onChange={(e) => {
                          const [year, month, day] = e.target.value.split('-').map(Number);
                          const newFrom = new Date(year, month - 1, day);
                          setDateRange({ ...dateRange, from: newFrom, to: dateRange.to < newFrom ? newFrom : dateRange.to });
                        }}
                        className="w-full px-3 py-2 text-sm rounded border border-border bg-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Date de fin</div>
                      <input
                        type="date"
                        value={formatDateForAPI(dateRange.to)}
                        min={formatDateForAPI(dateRange.from)}
                        max={formatDateForAPI(new Date())}
                        onChange={(e) => {
                          const [year, month, day] = e.target.value.split('-').map(Number);
                          const newTo = new Date(year, month - 1, day);
                          setDateRange({ ...dateRange, to: newTo, from: dateRange.from > newTo ? newTo : dateRange.from });
                        }}
                        className="w-full px-3 py-2 text-sm rounded border border-border bg-card"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Plage: {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      <span className="ml-2 text-muted-foreground/60">
                        ({Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} jours)
                      </span>
                    </div>
                  </div>
                )}
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
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${selectedSource === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
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
                  const now = new Date();
                  setDateRange({ from: subDays(now, 30), to: now });
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
        )}
      </div>

      {/* ── Map area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Toggle filter button */}
        {!filterOpen && (
          <button
            onClick={() => setFilterOpen(true)}
            className="absolute top-4 left-4 z-[998] bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium shadow-md hover:bg-secondary transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{t("map.filter.title")}</span>
          </button>
        )}

        {/* Search toggle button */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="absolute top-4 z-[998] bg-card border border-border rounded-lg p-2.5 flex items-center justify-center shadow-md hover:bg-secondary transition-colors"
          style={{ left: filterOpen ? "296px" : "104px" }}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Geolocation floating button */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute top-4 right-4 z-[998] bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:bg-secondary disabled:opacity-50 transition-colors"
          title={t("map.geolocation.button" as any)}
        >
          {locating ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Compass className="w-4 h-4 text-primary" />
          )}
          <span className="hidden sm:inline text-xs font-semibold">
            {locating ? t("map.geolocation.loading" as any) : t("map.geolocation.button" as any)}
          </span>
        </button>

        {/* Search Modal */}
        {showSearchModal && (
          <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <span className="font-heading font-semibold">{t("map.search.placeholder")}</span>
                </div>
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchLocation();
                  }}
                  className="flex items-center gap-2 mb-4"
                >
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!e.target.value) {
                        setSearchResults([]);
                      }
                    }}
                    placeholder={t("map.search.placeholder")}
                    className="flex-1 h-10 bg-secondary border border-input rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="p-2 rounded-md text-muted-foreground hover:bg-secondary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="h-10 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground px-4 rounded-lg text-sm font-medium"
                  >
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("common.search" as any).replace("...", "")
                    )}
                  </button>
                </form>

                <div className="max-h-[50vh] overflow-y-auto space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMapTarget({ lat: result.lat, lng: result.lng, zoom: 12 });
                          setShowSearchModal(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-secondary flex items-start gap-3 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <span className="text-sm text-foreground flex-1">
                          {result.formatted_address}
                        </span>
                      </button>
                    ))
                  ) : (
                    searchQuery.length > 0 && !searching && (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        {t("map.search.noResults" as any)}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="absolute bottom-16 left-3 sm:left-4 z-[997] flex flex-col sm:flex-row flex-wrap items-start justify-start gap-2 sm:gap-3 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-lg text-xs sm:text-sm max-w-[90%] sm:max-w-[400px]">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{t("map.stats.total")}</span>
            <span className="font-bold">{filtered.length}</span>
          </div>
          <div className="hidden min-[380px]:block w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            <span className="text-muted-foreground">{t("map.stats.critical")}</span>
            <span className="font-bold text-destructive">{criticalCount}</span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-border" />
          <div className="text-[10px] sm:text-xs text-muted-foreground w-full sm:w-auto text-center sm:text-left border-t border-border/40 sm:border-0 pt-1.5 sm:pt-0">
            {period === "custom" ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}` : periodLabels[period]}
          </div>
        </div>

        {/* Leaflet Map — dark CartoDB tiles */}
        <MapContainer
          center={[-18.766947, 46.869107]}
          zoom={6}
          style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
          zoomControl={false}
          attributionControl={true}
        >
          <ZoomControl position="bottomright" />
          <MapAttributionFix />
          <MapBoundsTracker onBoundsChange={setVisibleBounds} />

          {mapTarget && (
            <MapRecenter lat={mapTarget.lat} lng={mapTarget.lng} zoom={mapTarget.zoom} />
          )}

          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm font-semibold">{t("map.userLocation.title" as any)}</div>
                <div className="text-xs text-muted-foreground">{t("map.userLocation.desc" as any)}</div>
              </Popup>
            </CircleMarker>
          )}

          {/* Google Maps and Dark Tile layer selection */}
          {mapStyle === "satellite" && (
            <TileLayer
              url={`https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${googleMapsApiKey}`}
              attribution="&copy; Google Maps"
              maxZoom={20}
            />
          )}
          {mapStyle === "roadmap" && (
            <TileLayer
              url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleMapsApiKey}`}
              attribution="&copy; Google Maps"
              maxZoom={20}
            />
          )}
          {mapStyle === "dark" && (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>"
              subdomains="abcd"
              maxZoom={19}
            />
          )}

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
          >
            {filtered.map(point => (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={point.id === hoveredFireId ? 12 : point.risk >= 0.7 ? 9 : point.risk >= 0.5 ? 7 : 6}
                eventHandlers={{
                  mouseover: () => setHoveredFireId(point.id),
                  mouseout: () => setHoveredFireId(null),
                }}
                pathOptions={{
                  color: point.id === hoveredFireId ? "#ffffff" : getRiskColor(point.risk),
                  fillColor: getRiskColor(point.risk),
                  fillOpacity: point.id === hoveredFireId ? 1 : 0.85,
                  weight: point.id === hoveredFireId ? 2 : 1.5,
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
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <span>{t("map.popup.confidence")}</span>
                      <span className="text-foreground font-medium">{point.confidence}%</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>{t("map.popup.brightness")}</span>
                      <span className="text-foreground font-medium">{point.brightness} K</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>{t("map.popup.source")}</span>
                      <span className="text-foreground font-medium">{point.source}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>{t("map.popup.detected")}</span>
                      <span className="text-foreground font-medium">{format(point.detectedAt, "dd/MM HH:mm")}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>{t("map.popup.coords")}</span>
                      <span className="text-foreground font-medium">{point.lat.toFixed(3)}, {point.lng.toFixed(3)}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}
