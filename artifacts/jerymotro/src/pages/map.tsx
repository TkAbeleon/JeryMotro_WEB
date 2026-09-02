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
const REGION_BOUNDARIES: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  Antananarivo: { minLat: -19.5, maxLat: -15.8, minLng: 46.5, maxLng: 49.5 },
  Fianarantsoa: { minLat: -22.5, maxLat: -19.0, minLng: 46.0, maxLng: 48.5 },
  Toamasina: { minLat: -18.0, maxLat: -15.0, minLng: 48.0, maxLng: 50.5 },
  Mahajanga: { minLat: -16.5, maxLat: -13.5, minLng: 43.0, maxLng: 46.5 },
  Toliara: { minLat: -25.5, maxLat: -19.0, minLng: 43.0, maxLng: 47.0 },
  Antsiranana: { minLat: -12.5, maxLat: -11.0, minLng: 49.0, maxLng: 50.5 },
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
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDetectionDate(detection: any): Date | null {
  const raw = detection.acq_date || detection.inserted_at;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDateInRange(date: Date | null, from: Date, to: Date): boolean {
  if (!date) return false;
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return day >= start && day <= end;
}

function MapAttributionFix() {
  const map = useMap();
  useEffect(() => {
    map.zoomControl?.remove();
  }, [map]);
  return null;
}

function MapRecenter({ lat, lng, zoom = 12 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.flyTo([lat, lng], zoom, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

function MapBoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend() { onBoundsChange(map.getBounds()); },
    zoomend() { onBoundsChange(map.getBounds()); },
    load() { onBoundsChange(map.getBounds()); },
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
      if (data.status === "OK" && data.results?.length) {
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
        toast({ title: t("common.error" as any), description: t("map.search.noResults" as any), variant: "destructive" });
        setSearchResults([]);
      } else {
        toast({ title: t("common.error" as any), description: t("map.search.error" as any), variant: "destructive" });
        setSearchResults([]);
      }
    } catch (error) {
      console.error(error);
      toast({ title: t("common.error" as any), description: t("map.search.error" as any), variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({ title: t("common.error" as any), description: t("map.geolocation.error.generic" as any), variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setMapTarget({ lat: latitude, lng: longitude, zoom: 12 });
        setLocating(false);
        toast({ title: t("common.success" as any), description: t("map.geolocation.success" as any) });
      },
      (error) => {
        setLocating(false);
        let errorKey = "map.geolocation.error.generic";
        if (error.code === error.PERMISSION_DENIED) errorKey = "map.geolocation.error.denied";
        else if (error.code === error.POSITION_UNAVAILABLE) errorKey = "map.geolocation.error.unavailable";
        else if (error.code === error.TIMEOUT) errorKey = "map.geolocation.error.timeout";
        toast({ title: t("common.error" as any), description: t(errorKey as any), variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 },
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
    return { from: subDays(now, 30), to: now };
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const toggleRisk = (risk: RiskLevel) => {
    setSelectedRisks((previous) => {
      const next = new Set(previous);
      if (next.has(risk)) next.delete(risk);
      else next.add(risk);
      return next;
    });
  };

  const { apiDateFrom, apiDateTo } = useMemo(() => {
    const current = new Date();
    if (period === "custom") {
      return { apiDateFrom: formatDateForAPI(dateRange.from), apiDateTo: formatDateForAPI(dateRange.to) };
    }
    const cutoff = getPeriodCutoff(period, current);
    return { apiDateFrom: formatDateForAPI(cutoff), apiDateTo: formatDateForAPI(current) };
  }, [period, dateRange.from, dateRange.to]);

  // The server query depends only on the actual time window. Risk, region and source
  // stay client-side so changing a filter never clears or reloads the map data.
  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {
      limit: 10000,
      date_from: apiDateFrom,
      date_to: apiDateTo,
    };
    return params;
  }, [apiDateFrom, apiDateTo]);

  const detectionsQuery = useListDetections(queryParams);

  const fires = useMemo<FirePoint[]>(() => {
    const detections = detectionsQuery.data?.detections || [];
    return detections
      .map((d) => {
        const detectedAt = getDetectionDate(d);
        return {
          id: d.id,
          lat: d.latitude,
          lng: d.longitude,
          risk: d.risk_score ?? 0,
          confidence: d.confidence_num ?? (d.confidence ? parseInt(d.confidence) : 0) ?? 0,
          brightness: d.brightness ?? 0,
          source: (d.source?.toLowerCase().includes("viirs") ? "VIIRS" : "MODIS") as "MODIS" | "VIIRS",
          region: d.region || "Inconnue",
          detectedAt: detectedAt || new Date(0),
        };
      })
      .filter((fire) => Number.isFinite(fire.lat) && Number.isFinite(fire.lng));
  }, [detectionsQuery.data]);

  const filtered = useMemo(() => {
    return fires.filter((point) => {
      if (!selectedRisks.has(getRiskLevel(point.risk))) return false;
      if (selectedRegion !== "all" && !isInRegion(point.lat, point.lng, selectedRegion)) return false;
      if (selectedSource !== "all" && point.source !== selectedSource) return false;
      if (period === "custom" && !isDateInRange(point.detectedAt.getTime() ? point.detectedAt : null, dateRange.from, dateRange.to)) return false;
      return true;
    });
  }, [fires, selectedRisks, selectedRegion, selectedSource, period, dateRange.from, dateRange.to]);

  const visibleFires = useMemo(() => {
    if (!visibleBounds) return filtered;
    return filtered.filter((fire) => visibleBounds.contains([fire.lat, fire.lng]));
  }, [filtered, visibleBounds]);

  const riskCounts = useMemo(() => {
    return {
      critical: fires.filter((fire) => getRiskLevel(fire.risk) === "critical").length,
      high: fires.filter((fire) => getRiskLevel(fire.risk) === "high").length,
      medium: fires.filter((fire) => getRiskLevel(fire.risk) === "medium").length,
      low: fires.filter((fire) => getRiskLevel(fire.risk) === "low").length,
    };
  }, [fires]);

  const handlePeriodChange = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    if (nextPeriod !== "custom") {
      const current = new Date();
      setDateRange({ from: getPeriodCutoff(nextPeriod, current), to: current });
    }
  };

  const handleCustomRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from) return;
    const from = range.from;
    const to = range.to || range.from;
    setDateRange({ from, to });
    setPeriod("custom");
  };

  const isLoading = detectionsQuery.isLoading;
  const isFetching = detectionsQuery.isFetching && !detectionsQuery.isLoading;

  return (
    <div className="relative h-[calc(100vh-4rem)] min-h-[620px] overflow-hidden bg-background">
      <MapContainer center={[-18.8792, 47.5079]} zoom={6} zoomControl={false} className="h-full w-full">
        <MapAttributionFix />
        <ZoomControl position="bottomright" />
        {mapTarget && <MapRecenter lat={mapTarget.lat} lng={mapTarget.lng} zoom={mapTarget.zoom} />}
        <MapBoundsTracker onBoundsChange={setVisibleBounds} />
        {mapStyle === "dark" ? (
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
        ) : mapStyle === "satellite" && googleMapsApiKey ? (
          <TileLayer url={`https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${googleMapsApiKey}`} attribution='&copy; Google' />
        ) : (
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        )}

        <MarkerClusterGroup chunkedLoading={true}>
          {visibleFires.map((fire) => (
            <CircleMarker
              key={fire.id}
              center={[fire.lat, fire.lng]}
              radius={hoveredFireId === fire.id ? 10 : 7}
              pathOptions={{ color: getRiskColor(fire.risk), fillColor: getRiskColor(fire.risk), fillOpacity: 0.75, weight: 2 }}
              eventHandlers={{ mouseover: () => setHoveredFireId(fire.id), mouseout: () => setHoveredFireId(null) }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1 text-sm">
                  <div className="font-semibold">{fire.region}</div>
                  <div>Latitude : {fire.lat.toFixed(5)}</div>
                  <div>Longitude : {fire.lng.toFixed(5)}</div>
                  <div>Risque : {(fire.risk * 100).toFixed(1)}%</div>
                  <div>Source : {fire.source}</div>
                  <div>Date : {format(fire.detectedAt, "dd/MM/yyyy")}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-4">
        <div className="pointer-events-auto flex items-start justify-between gap-3">
          <div className="rounded-xl border border-card-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" />JeryMotro</div>
            <div className="text-xs text-muted-foreground">{filtered.length} détection(s) affichée(s)</div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowSearchModal(true)} className="rounded-xl border border-card-border bg-card/95 p-3 shadow-lg backdrop-blur hover:bg-accent" aria-label="Rechercher une localisation"><Search className="h-4 w-4" /></button>
            <button type="button" onClick={handleLocateMe} className="rounded-xl border border-card-border bg-card/95 p-3 shadow-lg backdrop-blur hover:bg-accent" aria-label="Me localiser">{locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}</button>
          </div>
        </div>
      </div>

      {isFetching && (
        <div className="pointer-events-none absolute right-4 top-20 z-[500] rounded-full border border-card-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow backdrop-blur">
          Actualisation des données…
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-[450] grid place-items-center bg-background/30 backdrop-blur-[1px]">
          <div className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm shadow-lg"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Chargement des détections…</div>
        </div>
      )}

      <div className="absolute bottom-4 left-3 right-3 z-[500] sm:left-4 sm:right-auto">
        <div className="w-full max-w-[380px] rounded-xl border border-card-border bg-card/95 p-3 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold">Filtres</div><button type="button" onClick={() => setFilterOpen(!filterOpen)} className="rounded-md p-1 hover:bg-accent"><ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} /></button></div>
          {filterOpen && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {PERIODS.slice(0, 5).map((item) => (
                  <button key={item} type="button" onClick={() => handlePeriodChange(item)} className={`rounded-lg border px-2 py-2 text-xs font-medium ${period === item ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>{item}</button>
                ))}
              </div>
              <button type="button" onClick={() => { setPeriod("custom"); setShowCalendar((value) => !value); }} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium ${period === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                <span className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{format(dateRange.from, "dd/MM/yyyy")} → {format(dateRange.to, "dd/MM/yyyy")}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showCalendar ? "rotate-180" : ""}`} />
              </button>
              {showCalendar && (
                <div className="rounded-lg border border-border bg-background p-2">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={handleCustomRangeChange as any}
                    numberOfMonths={1}
                  />
                  <div className="mt-2 flex justify-end"><button type="button" onClick={() => setShowCalendar(false)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Appliquer</button></div>
                </div>
              )}

              <div>
                <div className="mb-2 text-xs font-medium">Niveau de risque</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["critical", "high", "medium", "low"] as RiskLevel[]).map((risk) => (
                    <button key={risk} type="button" onClick={() => toggleRisk(risk)} className={`rounded-lg border px-1.5 py-2 text-[11px] font-medium ${selectedRisks.has(risk) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}><Check className={`mx-auto mb-0.5 h-3.5 w-3.5 ${selectedRisks.has(risk) ? "opacity-100" : "opacity-0"}`} />{risk}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs"><span className="text-muted-foreground">Région</span><select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"><option value="all">Toutes</option>{REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
                <label className="space-y-1 text-xs"><span className="text-muted-foreground">Source</span><select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"><option value="all">Toutes</option><option value="MODIS">MODIS</option><option value="VIIRS">VIIRS</option></select></label>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                <span>{filtered.length} résultat(s)</span>
                <button type="button" onClick={() => { setSelectedRisks(new Set(["critical", "high", "medium", "low"])); setSelectedRegion("all"); setSelectedSource("all"); }} className="hover:text-foreground">Réinitialiser les filtres</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSearchModal && (
        <div className="absolute inset-0 z-[600] grid place-items-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-card-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><div><div className="font-heading font-semibold">Rechercher une localisation</div><div className="text-xs text-muted-foreground">Recherche limitée à Madagascar</div></div><button type="button" onClick={() => setShowSearchModal(false)} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button></div>
            <div className="flex gap-2"><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleSearchLocation(); }} placeholder="Ex. Antananarivo" className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm" /><button type="button" onClick={() => void handleSearchLocation()} disabled={searching || !searchQuery.trim()} className="rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button></div>
            {searchResults.length > 0 && <div className="mt-3 space-y-2">{searchResults.map((result) => <button key={`${result.lat}-${result.lng}`} type="button" onClick={() => { setMapTarget({ lat: result.lat, lng: result.lng, zoom: 12 }); setShowSearchModal(false); setSearchResults([]); setSearchQuery(""); }} className="w-full rounded-lg border border-border p-3 text-left text-sm hover:bg-accent">{result.formatted_address}</button>)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
