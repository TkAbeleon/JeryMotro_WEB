import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { Search, Filter, LocateFixed, X, Layers, ChevronDown, Check, List, SlidersHorizontal, Loader2, MapPin } from "lucide-react";
import L from "leaflet";
// @ts-ignore
import MarkerClusterGroup from "react-leaflet-cluster";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subMonths } from "date-fns";
import { useListDetections } from "@workspace/api-client-react";
import { AsyncStateInline } from "@/components/ui/async-state";

type RiskLevel = "critical" | "high" | "medium" | "low";
type Period = "today" | "7d" | "30d" | "90d" | "1y" | "custom";
type MapStyle = "satellite" | "roadmap" | "dark";

interface FirePoint { id: number; lat: number; lng: number; risk: number; confidence: number; brightness: number; source: "MODIS" | "VIIRS"; sourceRaw: string; region: string; detectedAt: Date; }
interface SearchResult { formatted_address: string; lat: number; lng: number; }
interface RegionCenter { name: string; lat: number; lng: number; }

const MADAGASCAR_REGIONS: RegionCenter[] = [
  { name: "Analamanga", lat: -18.91, lng: 47.52 }, { name: "Vakinankaratra", lat: -19.88, lng: 47.04 },
  { name: "Itasy", lat: -19.01, lng: 46.82 }, { name: "Bongolava", lat: -18.45, lng: 46.17 },
  { name: "Haute Matsiatra", lat: -21.45, lng: 47.09 }, { name: "Amoron'i Mania", lat: -20.22, lng: 47.18 },
  { name: "Vatovavy", lat: -21.16, lng: 47.56 }, { name: "Fitovinany", lat: -21.70, lng: 47.58 },
  { name: "Atsimo-Atsinanana", lat: -23.48, lng: 47.22 }, { name: "Ihorombe", lat: -22.45, lng: 46.57 },
  { name: "Atsimo-Andrefana", lat: -23.35, lng: 43.69 }, { name: "Androy", lat: -25.02, lng: 46.27 },
  { name: "Menabe", lat: -20.30, lng: 44.28 }, { name: "Melaky", lat: -16.50, lng: 44.30 },
  { name: "Boeny", lat: -16.15, lng: 46.00 }, { name: "Betsiboka", lat: -16.68, lng: 46.95 },
  { name: "Sofia", lat: -14.58, lng: 48.00 }, { name: "Diana", lat: -13.41, lng: 48.30 },
  { name: "Sava", lat: -14.27, lng: 50.00 }, { name: "Atsinanana", lat: -18.15, lng: 49.40 },
  { name: "Analanjirofo", lat: -16.92, lng: 49.43 }, { name: "Alaotra-Mangoro", lat: -17.59, lng: 48.42 },
];

const PERIODS: Period[] = ["today", "7d", "30d", "90d", "1y", "custom"];
const RISK_LEVELS: { key: RiskLevel; color: string }[] = [
  { key: "critical", color: "#ef4444" }, { key: "high", color: "#f97316" }, { key: "medium", color: "#f59e0b" }, { key: "low", color: "#22c55e" },
];

function getRiskLevel(risk: number): RiskLevel { if (risk >= 0.7) return "critical"; if (risk >= 0.5) return "high"; if (risk >= 0.3) return "medium"; return "low"; }
function getRiskColor(risk: number) { if (risk >= 0.7) return "#ef4444"; if (risk >= 0.5) return "#f97316"; if (risk >= 0.3) return "#f59e0b"; return "#22c55e"; }
function getPeriodCutoff(period: Period, now: Date) { switch (period) { case "today": return subDays(now, 1); case "7d": return subDays(now, 7); case "30d": return subDays(now, 30); case "90d": return subMonths(now, 3); case "1y": return subMonths(now, 12); default: return subDays(now, 30); } }
function formatDateForAPI(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

function MapViewportTracker({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({ moveend: () => onBoundsChange(map.getBounds()), zoomend: () => onBoundsChange(map.getBounds()) });
  useEffect(() => onBoundsChange(map.getBounds()), [map, onBoundsChange]);
  return null;
}
function Recenter({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], target.zoom ?? 12, { duration: 0.65, easeLinearity: 0.25 }); }, [map, target]);
  return null;
}
function MapAutoResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    let frame: number | null = null;
    const invalidate = () => map.invalidateSize({ animate: false });
    const schedule = () => { if (frame !== null) cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { frame = null; invalidate(); }); };
    invalidate(); schedule();
    const timers = [50, 200, 500].map(delay => window.setTimeout(invalidate, delay));
    const observer = new ResizeObserver(schedule); observer.observe(container); window.addEventListener("resize", schedule);
    return () => { observer.disconnect(); window.removeEventListener("resize", schedule); timers.forEach(window.clearTimeout); if (frame !== null) cancelAnimationFrame(frame); };
  }, [map]);
  return null;
}

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function MapRedesignPage() {
  const { t } = useI18n(); const { toast } = useToast();
  const [controlsOpen, setControlsOpen] = useState(false); const [tab, setTab] = useState<"list" | "filters">("list");
  const [searchOpen, setSearchOpen] = useState(false); const [searchQuery, setSearchQuery] = useState(""); const [searchResults, setSearchResults] = useState<SearchResult[]>([]); const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false); const [target, setTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null); const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null); const [hoveredFireId, setHoveredFireId] = useState<number | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>("satellite"); const [period, setPeriod] = useState<Period>("30d");
  const [selectedRisks, setSelectedRisks] = useState<Set<RiskLevel>>(new Set(["critical", "high", "medium", "low"])); const [selectedRegion, setSelectedRegion] = useState("all"); const [selectedSource, setSelectedSource] = useState("all");
  const [dateRange, setDateRange] = useState(() => ({ from: subDays(new Date(), 30), to: new Date() }));
  const closeRef = useRef<HTMLButtonElement>(null);

  const now = new Date();
  const activeRange = useMemo(() => period === "custom" ? dateRange : { from: getPeriodCutoff(period, now), to: now }, [period, dateRange]);
  const apiDateFrom = formatDateForAPI(activeRange.from); const apiDateTo = formatDateForAPI(activeRange.to);

  const queryParams = useMemo(() => {
    const days = Math.max(1, Math.ceil((activeRange.to.getTime() - activeRange.from.getTime()) / 86400000));
    const limit = Math.min(3000, Math.max(500, days * 60));
    const params: Record<string, unknown> = { limit, offset: 0, date_from: apiDateFrom, date_to: apiDateTo };
    if (selectedRegion !== "all") params.region = selectedRegion;
    if (selectedSource === "MODIS") params.source = "MODIS";
    if (selectedRisks.size > 0 && selectedRisks.size < 4) {
      const ranges = { critical: [0.7, 1], high: [0.5, 0.7], medium: [0.3, 0.5], low: [0, 0.3] } as const;
      const active = Array.from(selectedRisks).map(r => ranges[r]);
      params.min_risk = Math.min(...active.map(r => r[0]));
      params.max_risk = Math.max(...active.map(r => r[1]));
    }
    return params;
  }, [activeRange, apiDateFrom, apiDateTo, selectedRegion, selectedSource, selectedRisks]);

  const detectionsQuery = useListDetections(queryParams);
  const fires: FirePoint[] = useMemo(() => (detectionsQuery.data?.detections || []).map(d => ({
    id: d.id, lat: d.latitude, lng: d.longitude, risk: d.risk_score ?? 0, confidence: d.confidence_num ?? (d.confidence ? parseInt(d.confidence) : 0), brightness: d.brightness ?? 0,
    source: d.source?.toLowerCase().includes("viirs") ? "VIIRS" : "MODIS", sourceRaw: d.source || "", region: d.region || "Inconnue", detectedAt: d.inserted_at ? new Date(d.inserted_at) : new Date(d.acq_date),
  })), [detectionsQuery.data]);

  const filtered = useMemo(() => fires.filter(fire => {
    if (!selectedRisks.has(getRiskLevel(fire.risk))) return false;
    if (selectedRegion !== "all" && fire.region !== selectedRegion) return false;
    if (selectedSource === "VIIRS" && fire.source !== "VIIRS") return false;
    if (selectedSource === "MODIS" && fire.source !== "MODIS") return false;
    return true;
  }), [fires, selectedRisks, selectedRegion, selectedSource]);
  const visibleFires = useMemo(() => visibleBounds ? filtered.filter(fire => visibleBounds.contains([fire.lat, fire.lng])) : filtered, [filtered, visibleBounds]);
  const criticalCount = filtered.filter(fire => fire.risk >= 0.7).length;
  const activeFiltersCount = (selectedRegion !== "all" ? 1 : 0) + (selectedSource !== "all" ? 1 : 0) + (selectedRisks.size < 4 ? 1 : 0) + (period !== "30d" ? 1 : 0);

  useEffect(() => {
    if (!controlsOpen) return;
    closeRef.current?.focus();
    const oldOverflow = document.body.style.overflow; if (window.innerWidth < 1024) document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setControlsOpen(false); };
    window.addEventListener("keydown", onKeyDown); return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [controlsOpen]);

  const toggleRisk = (risk: RiskLevel) => setSelectedRisks(prev => { const next = new Set(prev); if (next.has(risk)) next.delete(risk); else next.add(risk); return next; });
  const resetFilters = () => { const end = new Date(); setPeriod("30d"); setSelectedRisks(new Set(["critical", "high", "medium", "low"])); setSelectedRegion("all"); setSelectedSource("all"); setDateRange({ from: subDays(end, 30), to: end }); };

  const selectSearchResult = (result: SearchResult) => { setTarget(result); setSearchResults([]); setSearchOpen(false); setSearchQuery(""); };
  const searchLocation = async () => {
    const query = searchQuery.trim(); if (!query) return;
    const coordinateMatch = query.replace(/\s+/g, "").match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
    if (coordinateMatch) { setTarget({ lat: Number(coordinateMatch[1]), lng: Number(coordinateMatch[2]), zoom: 13 }); setSearchResults([]); setSearchOpen(false); return; }
    const normalized = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const local = MADAGASCAR_REGIONS.find(region => region.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized);
    if (local) { setTarget({ lat: local.lat, lng: local.lng, zoom: 9 }); setSearchResults([]); setSearchOpen(false); return; }
    if (!GOOGLE_KEY) { toast({ title: t("common.error" as any), description: "La recherche de lieux n’est pas configurée.", variant: "destructive" }); return; }
    setSearching(true);
    const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:MG&key=${GOOGLE_KEY}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Geocoding HTTP ${response.status}`);
      const data = await response.json();
      if (data.status === "OK" && data.results?.length) {
        const results: SearchResult[] = data.results.map((item: any) => ({ formatted_address: item.formatted_address, lat: item.geometry.location.lat, lng: item.geometry.location.lng }));
        if (results.length === 1) selectSearchResult(results[0]); else setSearchResults(results);
      } else {
        setSearchResults([]); toast({ title: t("common.error" as any), description: data.status === "ZERO_RESULTS" ? t("map.search.noResults" as any) : t("map.search.error" as any), variant: "destructive" });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") toast({ title: t("common.error" as any), description: t("map.search.error" as any), variant: "destructive" });
      else toast({ title: t("common.error" as any), description: "La recherche a dépassé 5 secondes. Essayez une région ou des coordonnées.", variant: "destructive" });
    } finally { window.clearTimeout(timeout); setSearching(false); }
  };

  const locateMe = () => {
    if (!navigator.geolocation) { toast({ title: t("common.error" as any), description: t("map.geolocation.error.generic" as any), variant: "destructive" }); return; }
    setLocating(true); navigator.geolocation.getCurrentPosition(({ coords }) => { setUserLocation({ lat: coords.latitude, lng: coords.longitude }); setTarget({ lat: coords.latitude, lng: coords.longitude, zoom: 13 }); setLocating(false); }, () => { setLocating(false); toast({ title: t("common.error" as any), description: t("map.geolocation.error.generic" as any), variant: "destructive" }); }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const periodLabel = (p: Period) => t(`map.filter.period.${p}` as any); const riskLabel = (r: RiskLevel) => t(`map.legend.${r}` as any);
  const mapTile = mapStyle === "satellite" ? { url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`, attribution: "&copy; Google Maps", maxZoom: 20 } : mapStyle === "roadmap" ? { url: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`, attribution: "&copy; Google Maps", maxZoom: 20 } : { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19, subdomains: "abcd" };

  if (detectionsQuery.isLoading) return <div className="relative isolate h-[calc(100dvh-58px)] w-full overflow-hidden"><MapContainer center={[-18.766947, 46.869107]} zoom={6} style={{ height: "100%", width: "100%" }} zoomControl={false}><TileLayer {...mapTile} /></MapContainer><div className="absolute inset-x-4 top-4 z-20"><AsyncStateInline type="loading" title={t("common.loading")} description="Chargement des détections cartographiques…" className="mx-auto max-w-sm rounded-2xl bg-card/90 shadow-xl backdrop-blur" /></div></div>;
  if (detectionsQuery.isError) return <AsyncStateInline type="error" title="Impossible de charger la carte" description="Les détections ne sont pas disponibles actuellement." onAction={() => detectionsQuery.refetch()} actionLabel="Réessayer" />;

  return <div className="relative isolate h-[calc(100dvh-58px)] min-h-0 w-full overflow-hidden bg-background">
    <div className="absolute inset-0 z-0"><MapContainer center={[-18.766947, 46.869107]} zoom={6} style={{ height: "100%", width: "100%", background: "#111827" }} zoomControl={false} attributionControl>
      <ZoomControl position="bottomleft" /><MapViewportTracker onBoundsChange={setVisibleBounds} /><Recenter target={target} /><MapAutoResize /><TileLayer {...mapTile} />
      {userLocation && <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={7} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 2 }} />}
      <MarkerClusterGroup chunkedLoading maxClusterRadius={48} spiderfyOnMaxZoom>{filtered.map(point => <CircleMarker key={point.id} center={[point.lat, point.lng]} radius={hoveredFireId === point.id ? 11 : point.risk >= .7 ? 8 : point.risk >= .5 ? 7 : 6} eventHandlers={{ mouseover: () => setHoveredFireId(point.id), mouseout: () => setHoveredFireId(null) }} pathOptions={{ color: hoveredFireId === point.id ? "#ffffff" : getRiskColor(point.risk), fillColor: getRiskColor(point.risk), fillOpacity: .86, weight: hoveredFireId === point.id ? 2 : 1.25 }}>
        <Tooltip direction="top" offset={[0, -8]} opacity={1}><div className="min-w-[190px] rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full" style={{ background: getRiskColor(point.risk) }} /><span className="truncate">{point.region}</span><span className="ml-auto text-[10px] font-bold uppercase" style={{ color: getRiskColor(point.risk) }}>{t(`risk.${getRiskLevel(point.risk)}` as any)}</span></div><div className="space-y-1 text-[11px] text-muted-foreground"><div className="flex justify-between gap-4"><span>{t("map.popup.confidence")}</span><span className="font-medium text-foreground">{point.confidence}%</span></div><div className="flex justify-between gap-4"><span>{t("map.popup.source")}</span><span className="font-medium text-foreground">{point.source}</span></div><div className="flex justify-between gap-4"><span>{t("map.popup.brightness")}</span><span className="font-medium text-foreground">{point.brightness} K</span></div></div></div></Tooltip>
        <Popup className="fire-popup"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: getRiskColor(point.risk) }} /><span className="truncate">{point.region}</span><span className="ml-auto text-[10px] font-bold uppercase" style={{ color: getRiskColor(point.risk) }}>{t(`risk.${getRiskLevel(point.risk)}` as any)}</span></div><div className="space-y-1 text-xs text-muted-foreground"><div className="flex justify-between gap-5"><span>{t("map.popup.confidence")}</span><span className="font-medium text-foreground">{point.confidence}%</span></div><div className="flex justify-between gap-5"><span>{t("map.popup.brightness")}</span><span className="font-medium text-foreground">{point.brightness} K</span></div><div className="flex justify-between gap-5"><span>{t("map.popup.source")}</span><span className="font-medium text-foreground">{point.sourceRaw || point.source}</span></div><div className="flex justify-between gap-5"><span>{t("map.popup.detected")}</span><span className="font-medium text-foreground">{format(point.detectedAt, "dd/MM HH:mm")}</span></div><div className="flex justify-between gap-5"><span>{t("map.popup.coords")}</span><span className="font-medium text-foreground">{point.lat.toFixed(3)}, {point.lng.toFixed(3)}</span></div></div></Popup>
      </CircleMarker>)}</MarkerClusterGroup>
    </MapContainer></div>

    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto absolute inset-x-3 top-3 sm:inset-x-4 sm:top-4">
        <div className="relative mx-auto hidden w-[min(420px,42vw)] md:block">
          <form onSubmit={e => { e.preventDefault(); searchLocation(); }} className="flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card/95 px-3 shadow-lg backdrop-blur"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("map.search.placeholder")} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />{searching ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" /> : searchQuery && <button type="button" onClick={() => { setSearchQuery(""); setSearchResults([]); }} aria-label={t("common.close")} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>}</form>
          {!searching && searchResults.length > 0 && <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><div className="max-h-72 overflow-y-auto p-1.5">{searchResults.map((result, index) => <button key={`${result.lat}-${index}`} type="button" onClick={() => selectSearchResult(result)} className="flex w-full items-start gap-3 rounded-xl p-3 text-left text-sm transition hover:bg-secondary"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{result.formatted_address}</span></button>)}</div></div>}
        </div>
        <button type="button" onClick={() => setSearchOpen(true)} aria-label={t("map.search.placeholder")} className="absolute left-1/2 top-0 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur md:hidden"><Search className="h-[18px] w-[18px]" /></button>
        <div className="absolute right-0 top-0 flex items-center gap-2"><button type="button" onClick={() => setControlsOpen(true)} aria-expanded={controlsOpen} className="relative flex h-11 items-center gap-2 rounded-2xl border border-border bg-card/95 px-3.5 text-sm font-semibold shadow-lg backdrop-blur sm:px-4"><SlidersHorizontal className="h-[17px] w-[17px]" /><span className="hidden sm:inline">{t("map.filter.title")}</span>{activeFiltersCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{activeFiltersCount}</span>}</button><button type="button" onClick={locateMe} disabled={locating} aria-label={t("map.geolocation.button" as any)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur disabled:opacity-50">{locating ? <Loader2 className="h-[17px] w-[17px] animate-spin text-primary" /> : <LocateFixed className="h-[17px] w-[17px] text-primary" />}</button></div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-3 right-3 flex justify-center sm:bottom-5 sm:left-4 sm:right-4"><div className="rounded-2xl border border-border bg-card/90 px-3.5 py-2.5 shadow-lg backdrop-blur sm:px-4"><div className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm"><span><b>{filtered.length}</b> <span className="text-muted-foreground">{t("map.stats.total")}</span></span><span className="h-3.5 w-px bg-border" /><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-destructive" /><b>{criticalCount}</b> <span className="text-muted-foreground">{t("map.stats.critical")}</span></span><span className="hidden h-3.5 w-px bg-border sm:block" /><span className="hidden text-muted-foreground sm:inline">{period === "custom" ? `${format(dateRange.from, "dd/MM")} – ${format(dateRange.to, "dd/MM")}` : periodLabel(period)}</span></div></div></div>

      {searchOpen && <div className="pointer-events-auto absolute inset-0 bg-black/35 p-3 backdrop-blur-[2px] sm:p-6 md:hidden"><div className="mx-auto mt-16 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"><form onSubmit={e => { e.preventDefault(); searchLocation(); }} className="flex items-center gap-2 border-b border-border p-3"><Search className="ml-1 h-5 w-5 text-muted-foreground" /><input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("map.search.placeholder")} className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><button type="button" onClick={() => { setSearchOpen(false); setSearchResults([]); setSearchQuery(""); }} aria-label={t("common.close")} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary"><X className="h-5 w-5" /></button></form><div className="max-h-[55vh] overflow-y-auto p-2">{searching && <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("map.search.searching" as any)}</div>}{!searching && searchResults.map((result, index) => <button key={`${result.lat}-${index}`} type="button" onClick={() => selectSearchResult(result)} className="flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-secondary"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="text-sm">{result.formatted_address}</span></button>)}</div></div></div>}

      {controlsOpen && <><button type="button" aria-label={t("common.close")} onClick={() => setControlsOpen(false)} className="pointer-events-auto absolute inset-0 bg-black/25 backdrop-blur-[1px] lg:bg-transparent lg:backdrop-blur-none" /><aside className="pointer-events-auto absolute bottom-3 right-3 top-16 flex w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-3xl border border-border bg-card/98 shadow-2xl backdrop-blur-xl sm:bottom-4 sm:right-4 sm:top-20">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5"><div><div className="font-heading text-sm font-bold sm:text-base">{t("map.filter.title")}</div><div className="mt-0.5 text-xs text-muted-foreground">{filtered.length} {t("map.stats.total")}</div></div><button ref={closeRef} type="button" onClick={() => setControlsOpen(false)} aria-label={t("common.close")} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="h-5 w-5" /></button></div>
        <div className="p-3 sm:p-4"><div className="grid grid-cols-2 rounded-xl bg-secondary/70 p-1"><button type="button" onClick={() => setTab("list")} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition ${tab === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><List className="h-4 w-4" />{t("map.sidebar.tab.list") || "Liste"}</button><button type="button" onClick={() => setTab("filters")} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition ${tab === "filters" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Filter className="h-4 w-4" />{t("map.sidebar.tab.filters") || "Filtres"}{activeFiltersCount > 0 && <span className="rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">{activeFiltersCount}</span>}</button></div></div>
        {tab === "list" ? <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:px-4">{visibleFires.length === 0 ? <AsyncStateInline type="empty" title={t("map.empty" as any)} description="Aucune détection ne correspond aux filtres ou à la zone visible." /> : visibleFires.map(fire => <button key={fire.id} type="button" onMouseEnter={() => setHoveredFireId(fire.id)} onMouseLeave={() => setHoveredFireId(null)} onClick={() => setTarget({ lat: fire.lat, lng: fire.lng, zoom: 14 })} className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${hoveredFireId === fire.id ? "border-primary/50 bg-primary/5" : "border-border bg-background/40 hover:bg-secondary/60"}`}><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: getRiskColor(fire.risk) }} /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{fire.region}</span><span className="text-[10px] font-bold uppercase" style={{ color: getRiskColor(fire.risk) }}>{fire.risk.toFixed(2)}</span></div><div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground"><span>{fire.sourceRaw || fire.source}</span><span>{format(fire.detectedAt, "dd/MM HH:mm")}</span></div></button>)}</div> : <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"><div className="space-y-5 pt-1">
          <section><div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("map.filter.style")}</div><div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/70 p-1">{(["satellite", "roadmap", "dark"] as MapStyle[]).map(style => <button key={style} type="button" onClick={() => setMapStyle(style)} className={`h-9 rounded-lg text-[11px] font-semibold transition ${mapStyle === style ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t(`map.filter.style.${style}` as any).replace(" (Google)", "")}</button>)}</div></section>
          <section><div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("map.filter.period")}</div><div className="grid grid-cols-3 gap-1.5">{PERIODS.map(p => <button key={p} type="button" onClick={() => setPeriod(p)} className={`min-h-10 rounded-xl border px-2 text-[11px] font-semibold transition ${period === p ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}>{periodLabel(p)}</button>)}</div></section>
          {period === "custom" && <section className="grid grid-cols-2 gap-2"><label className="text-[11px] text-muted-foreground">{t("export.dateFrom" as any)}<input type="date" value={formatDateForAPI(dateRange.from)} max={formatDateForAPI(new Date())} onChange={e => { const d = new Date(`${e.target.value}T00:00:00`); setDateRange(v => ({ from: d, to: v.to < d ? d : v.to })); }} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground" /></label><label className="text-[11px] text-muted-foreground">{t("export.dateTo" as any)}<input type="date" value={formatDateForAPI(dateRange.to)} min={formatDateForAPI(dateRange.from)} max={formatDateForAPI(new Date())} onChange={e => { const d = new Date(`${e.target.value}T00:00:00`); setDateRange(v => ({ from: v.from > d ? d : v.from, to: d })); }} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground" /></label></section>}
          <section><div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("map.filter.risk")}</div><div className="grid grid-cols-2 gap-1.5">{RISK_LEVELS.map(({ key, color }) => { const checked = selectedRisks.has(key); return <button key={key} type="button" onClick={() => toggleRisk(key)} className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-left text-[11px] font-semibold transition ${checked ? "border-border bg-secondary" : "border-border/70 text-muted-foreground opacity-60"}`}><span className="flex h-5 w-5 items-center justify-center rounded-md border-2" style={{ borderColor: color, background: checked ? color : "transparent" }}>{checked && <Check className="h-3 w-3 text-white" />}</span><span className="truncate">{riskLabel(key)}</span></button>; })}</div></section>
          <section><div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("map.filter.region")}</div><div className="relative"><select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary"><option value="all">{t("map.filter.region.all")}</option>{MADAGASCAR_REGIONS.map(region => <option key={region.name} value={region.name}>{region.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /></div></section>
          <section><div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("map.filter.source")}</div><div className="grid grid-cols-3 gap-1.5">{["all", "MODIS", "VIIRS"].map(source => <button key={source} type="button" onClick={() => setSelectedSource(source)} className={`min-h-10 rounded-xl border text-[11px] font-semibold transition ${selectedSource === source ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}>{source === "all" ? t("map.filter.source.all") : source}</button>)}</div></section>
          <section className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-3"><div className="flex items-center gap-2"><Layers className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-semibold">{t("map.legend")}</span></div><div className="flex items-center gap-3 text-[10px] text-muted-foreground">{RISK_LEVELS.map(({ key, color }) => <span key={key} className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: color }} />{riskLabel(key)}</span>)}</div></section>
          <button type="button" onClick={resetFilters} className="flex min-h-10 w-full items-center justify-center rounded-xl border border-border text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground">{t("common.reset")}</button>
        </div></div>}
      </aside></>}
    </div>
  </div>;
}
