import "leaflet/dist/leaflet.css";
import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl } from "react-leaflet";
import { Filter, X, Layers, ChevronDown, Compass, Loader2, Search, MapPin, Check } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subMonths, isAfter } from "date-fns";
import { useListDetections } from "@workspace/api-client-react";

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

const now = new Date();


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
    case "7d": return subDays(now, 7);
    case "30d": return subDays(now, 30);
    case "90d": return subMonths(now, 3);
    case "1y": return subMonths(now, 12);
  }
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

  const toggleRisk = (r: RiskLevel) => {
    setSelectedRisks(prev => {
      const next = new Set(prev);
      if (next.has(r)) { next.delete(r); } else { next.add(r); }
      return next;
    });
  };

  const detectionsQuery = useListDetections({ limit: 200 });

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
    const cutoff = getPeriodCutoff(period);
    return fires.filter(p => {
      if (!isAfter(p.detectedAt, cutoff)) return false;
      if (!selectedRisks.has(getRiskLevel(p.risk))) return false;
      if (selectedRegion !== "all" && p.region !== selectedRegion) return false;
      if (selectedSource !== "all" && p.source !== selectedSource) return false;
      return true;
    });
  }, [fires, period, selectedRisks, selectedRegion, selectedSource]);

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
  };

  return (
    <div className="flex h-[calc(100vh-58px)] overflow-hidden relative">

      {/* ── Filter Panel ── */}
      <div
        className={`bg-card border-r border-border flex flex-col z-[998] transition-all duration-300 flex-shrink-0 overflow-y-auto max-md:absolute max-md:left-0 max-md:top-0 max-md:bottom-0 h-full max-md:shadow-2xl md:relative ${filterOpen ? "w-[280px]" : "w-0 overflow-hidden border-r-0"
          }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0 gap-2">
          <span className="font-heading font-semibold text-sm flex-1 truncate">{t("map.filter.title")}</span>
          <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 flex-1">
          {/* Style de carte */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t("map.filter.style")}</div>
            <div className="grid grid-cols-3 gap-1 bg-secondary/60 p-1 rounded-lg border border-border">
              {(["satellite", "roadmap", "dark"] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setMapStyle(style)}
                  className={`text-center text-[10px] sm:text-xs py-1.5 px-1 rounded transition-all font-medium ${mapStyle === style
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
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
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${period === p ? "bg-primary text-primary-foreground font-medium" : "hover:bg-secondary text-muted-foreground"
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
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${selectedSource === s
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
          style={{ left: filterOpen ? "296px" : "56px" }}
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
            {periodLabels[period]}
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
          )}

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
