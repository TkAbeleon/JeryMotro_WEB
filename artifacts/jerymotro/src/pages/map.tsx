import "leaflet/dist/leaflet.css";
import { useState, useMemo, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl, useMapEvents } from "react-leaflet";
import { X, ChevronDown, Compass, Loader2, Search, MapPin, Check, Calendar as CalendarIcon } from "lucide-react";
import L from "leaflet";
// @ts-ignore
import MarkerClusterGroup from "react-leaflet-cluster";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, subDays, subMonths, endOfDay } from "date-fns";
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
  detectedAt: Date | null;
}

const REGIONS = ["Antananarivo", "Fianarantsoa", "Toamasina", "Mahajanga", "Toliara", "Antsiranana"];
const DEFAULT_MAP_LIMIT = 3000;
const UNLIMITED_MAP_LIMIT = 10000;
const REGION_BOUNDARIES: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  Antananarivo: { minLat: -19.5, maxLat: -15.8, minLng: 46.5, maxLng: 49.5 },
  Fianarantsoa: { minLat: -22.5, maxLat: -19, minLng: 46, maxLng: 48.5 },
  Toamasina: { minLat: -18, maxLat: -15, minLng: 48, maxLng: 50.5 },
  Mahajanga: { minLat: -16.5, maxLat: -13.5, minLng: 43, maxLng: 46.5 },
  Toliara: { minLat: -25.5, maxLat: -19, minLng: 43, maxLng: 47 },
  Antsiranana: { minLat: -12.5, maxLat: -11, minLng: 49, maxLng: 50.5 },
};

function isInRegion(lat: number, lng: number, region: string) {
  const bounds = REGION_BOUNDARIES[region];
  return Boolean(bounds && lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng);
}

function getRiskLevel(risk: number): RiskLevel {
  if (risk >= 0.7) return "critical";
  if (risk >= 0.5) return "high";
  if (risk >= 0.3) return "medium";
  return "low";
}

function getRiskColor(risk: number) {
  if (risk >= 0.7) return "#ef4444";
  if (risk >= 0.5) return "#f97316";
  if (risk >= 0.3) return "#f59e0b";
  return "#22c55e";
}

function parseDetectionDate(detection: any): Date | null {
  const raw = detection.acq_date ?? detection.detected_at ?? detection.inserted_at;
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

function getPeriodRange(period: Exclude<Period, "custom">, now = new Date()) {
  switch (period) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "7d": return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d": return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "90d": return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case "1y": return { from: startOfDay(subMonths(now, 12)), to: endOfDay(now) };
  }
}

function toApiDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function isWithinDateRange(value: Date | null, from: Date, to: Date) {
  if (!value) return false;
  const timestamp = value.getTime();
  return timestamp >= startOfDay(from).getTime() && timestamp <= endOfDay(to).getTime();
}

function MapAttributionFix() {
  const map = useMap();
  useEffect(() => { map.zoomControl?.remove(); }, [map]);
  return null;
}

function MapRecenter({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target && Number.isFinite(target.lat) && Number.isFinite(target.lng)) {
      map.flyTo([target.lat, target.lng], target.zoom ?? 12, { duration: 1.2 });
    }
  }, [map, target]);
  return null;
}

function MapBoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend() { onBoundsChange(map.getBounds()); },
    zoomend() { onBoundsChange(map.getBounds()); },
  });
  useEffect(() => onBoundsChange(map.getBounds()), [map, onBoundsChange]);
  return null;
}

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function MapPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [mapStyle] = useState<"satellite" | "roadmap" | "dark">("satellite");
  const [period, setPeriod] = useState<Period>("7d");
  const [selectedRisks, setSelectedRisks] = useState<Set<RiskLevel>>(new Set(["critical", "high", "medium", "low"]));
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [filterOpen, setFilterOpen] = useState(true);
  const [limitEnabled, setLimitEnabled] = useState(true);
  const [dateRange, setDateRange] = useState(() => getPeriodRange("7d"));
  const [appliedDateRange, setAppliedDateRange] = useState(() => getPeriodRange("7d"));
  const [showCalendar, setShowCalendar] = useState(false);
  const [hoveredFireId, setHoveredFireId] = useState<number | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ formatted_address: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const detectionsQuery = useListDetections({
    limit: limitEnabled ? DEFAULT_MAP_LIMIT : UNLIMITED_MAP_LIMIT,
    date_from: toApiDate(appliedDateRange.from),
    date_to: toApiDate(appliedDateRange.to),
  });

  const fires = useMemo<FirePoint[]>(() => {
    const detections = detectionsQuery.data?.detections ?? [];
    return detections.map((d) => ({
      id: d.id,
      lat: d.latitude,
      lng: d.longitude,
      risk: d.risk_score ?? 0,
      confidence: d.confidence_num ?? (d.confidence ? Number.parseInt(d.confidence, 10) : 0),
      brightness: d.brightness ?? 0,
      source: String(d.source ?? "").toLowerCase().includes("viirs") ? "VIIRS" : "MODIS",
      region: d.region || "Inconnue",
      detectedAt: parseDetectionDate(d),
    })).filter((fire) => Number.isFinite(fire.lat) && Number.isFinite(fire.lng));
  }, [detectionsQuery.data]);

  const filtered = useMemo(() => fires.filter((point) => {
    if (!selectedRisks.has(getRiskLevel(point.risk))) return false;
    if (selectedRegion !== "all" && !isInRegion(point.lat, point.lng, selectedRegion)) return false;
    if (selectedSource !== "all" && point.source !== selectedSource) return false;
    if (!isWithinDateRange(point.detectedAt, appliedDateRange.from, appliedDateRange.to)) return false;
    return true;
  }), [fires, selectedRisks, selectedRegion, selectedSource, appliedDateRange]);

  const visibleFires = useMemo(() => {
    if (!visibleBounds) return filtered;
    return filtered.filter((fire) => visibleBounds.contains([fire.lat, fire.lng]));
  }, [filtered, visibleBounds]);

  const handlePeriodChange = (next: Exclude<Period, "custom">) => {
    const nextRange = getPeriodRange(next);
    setPeriod(next);
    setDateRange(nextRange);
    setAppliedDateRange(nextRange);
  };

  const handleCustomRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from) return;
    setDateRange({ from: range.from, to: range.to ?? range.from });
    setPeriod("custom");
  };

  const applyCustomRange = () => {
    setAppliedDateRange({ from: dateRange.from, to: dateRange.to });
    setPeriod("custom");
    setShowCalendar(false);
  };

  const toggleRisk = (risk: RiskLevel) => {
    setSelectedRisks((previous) => {
      const next = new Set(previous);
      if (next.has(risk)) next.delete(risk); else next.add(risk);
      return next;
    });
  };

  const resetFilters = () => {
    const nextRange = getPeriodRange("7d");
    setSelectedRisks(new Set(["critical", "high", "medium", "low"]));
    setSelectedRegion("all");
    setSelectedSource("all");
    setPeriod("7d");
    setDateRange(nextRange);
    setAppliedDateRange(nextRange);
    setLimitEnabled(true);
    setShowCalendar(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({ title: t("common.error" as any), description: t("map.geolocation.error.generic" as any), variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(position);
        setMapTarget({ ...position, zoom: 12 });
        setLocating(false);
        toast({ title: t("common.success" as any), description: t("map.geolocation.success" as any) });
      },
      (error) => {
        setLocating(false);
        const key = error.code === error.PERMISSION_DENIED
          ? "map.geolocation.error.denied"
          : error.code === error.POSITION_UNAVAILABLE
            ? "map.geolocation.error.unavailable"
            : error.code === error.TIMEOUT
              ? "map.geolocation.error.timeout"
              : "map.geolocation.error.generic";
        toast({ title: t("common.error" as any), description: t(key as any), variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&components=country:MG&key=${googleMapsApiKey}`);
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
      } else {
        toast({ title: t("common.error" as any), description: data.status === "ZERO_RESULTS" ? t("map.search.noResults" as any) : t("map.search.error" as any), variant: "destructive" });
        setSearchResults([]);
      }
    } catch {
      toast({ title: t("common.error" as any), description: t("map.search.error" as any), variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const onBoundsChange = useCallback((bounds: L.LatLngBounds) => setVisibleBounds(bounds), []);
  const isLoading = detectionsQuery.isLoading;
  const isRefreshing = detectionsQuery.isFetching && !detectionsQuery.isLoading;

  return (
    <div className="relative h-[calc(100vh-4rem)] min-h-[620px] overflow-hidden bg-background">
      <MapContainer center={[-18.8792, 47.5079]} zoom={6} zoomControl={false} className="h-full w-full">
        <MapAttributionFix />
        <ZoomControl position="bottomright" />
        <MapRecenter target={mapTarget} />
        <MapBoundsTracker onBoundsChange={onBoundsChange} />
        {mapStyle === "dark" ? (
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
        ) : mapStyle === "satellite" && googleMapsApiKey ? (
          <TileLayer url={`https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${googleMapsApiKey}`} attribution="&copy; Google" />
        ) : (
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        )}

        <MarkerClusterGroup chunkedLoading>
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
                  <div>Date : {fire.detectedAt ? format(fire.detectedAt, "dd/MM/yyyy") : "N/A"}</div>
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
        {isRefreshing && <div className="pointer-events-none mt-2 text-right text-[11px] text-white/80">Mise à jour des données…</div>}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[450] grid place-items-center bg-background/30 backdrop-blur-[1px]">
          <div className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm shadow-lg"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Chargement des détections…</div>
        </div>
      )}

      <div className="absolute bottom-4 left-3 right-3 z-[500] sm:left-4 sm:right-auto">
        <div className="w-full max-w-[380px] rounded-xl border border-card-border bg-card/95 p-3 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Filtres</div>
            <button type="button" onClick={() => setFilterOpen((value) => !value)} className="rounded-md p-1 hover:bg-accent"><ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} /></button>
          </div>

          {filterOpen && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(["today", "7d", "30d", "90d", "1y"] as const).map((item) => (
                  <button key={item} type="button" onClick={() => handlePeriodChange(item)} className={`rounded-lg border px-2 py-2 text-xs font-medium ${period === item ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>{item}</button>
                ))}
              </div>

              <button type="button" onClick={() => setShowCalendar((value) => !value)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium ${period === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                <span className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{format(dateRange.from, "dd/MM/yyyy")} → {format(dateRange.to, "dd/MM/yyyy")}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showCalendar ? "rotate-180" : ""}`} />
              </button>

              {showCalendar && (
                <div className="rounded-lg border border-border bg-background p-2">
                  <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={handleCustomRangeChange as any} numberOfMonths={1} />
                  <div className="mt-2 flex justify-end"><button type="button" onClick={applyCustomRange} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Appliquer</button></div>
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

              <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                <span>
                  <span className="block font-medium">Limiter les résultats</span>
                  <span className="text-[10px] text-muted-foreground">{limitEnabled ? `${DEFAULT_MAP_LIMIT.toLocaleString("fr-FR")} détections max` : "Jusqu’à 10 000 détections"}</span>
                </span>
                <input type="checkbox" checked={limitEnabled} onChange={(e) => setLimitEnabled(e.target.checked)} className="h-4 w-4 accent-primary" />
              </label>

              <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                <span>{filtered.length} résultat(s){limitEnabled && detectionsQuery.data && detectionsQuery.data.total > DEFAULT_MAP_LIMIT ? " • affichage plafonné" : ""}</span>
                <button type="button" onClick={resetFilters} className="hover:text-foreground">Réinitialiser les filtres</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {userLocation && (
        <div className="pointer-events-none absolute right-4 bottom-4 z-[500] rounded-full border border-card-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow backdrop-blur">Position : {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</div>
      )}

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
