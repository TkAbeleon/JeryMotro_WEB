import { useState, useEffect } from "react";
import { useListZones, useCreateZone, useDeleteZone, getListZonesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Trash2, Lock, Shield, Target, Compass, Loader2, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// --- Helper Components for Leaflet ---
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const targetZoom = zoom || (map.getZoom() < 8 ? 12 : map.getZoom());
      map.flyTo([lat, lng], targetZoom, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

export default function ZonesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  const [locating, setLocating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius_km: "", min_risk: "", min_frp: "", custom_ai_prompt: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // --- Overview Map Search States ---
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");
  const [overviewSearchResults, setOverviewSearchResults] = useState<{ formatted_address: string; lat: number; lng: number }[]>([]);
  const [overviewSearching, setOverviewSearching] = useState(false);
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [overviewMapTarget, setOverviewMapTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // --- Modal Map Search States ---
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState<{ formatted_address: string; lat: number; lng: number }[]>([]);
  const [modalSearching, setModalSearching] = useState(false);
  const [showModalDropdown, setShowModalDropdown] = useState(false);

  const handleOverviewSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!overviewSearchQuery.trim()) return;

    setOverviewSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(overviewSearchQuery)}&components=country:MG&key=${googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const results = data.results.map((r: any) => ({
          formatted_address: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
        setOverviewSearchResults(results);
        setShowOverviewDropdown(true);

        if (results.length === 1) {
          setOverviewMapTarget({ lat: results[0].lat, lng: results[0].lng, zoom: 12 });
          setShowOverviewDropdown(false);
        }
      } else if (data.status === "ZERO_RESULTS") {
        toast({
          title: t("common.error" as any),
          description: t("map.search.noResults" as any),
          variant: "destructive",
        });
        setOverviewSearchResults([]);
      } else {
        toast({
          title: t("common.error" as any),
          description: t("map.search.error" as any),
          variant: "destructive",
        });
        setOverviewSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: t("common.error" as any),
        description: t("map.search.error" as any),
        variant: "destructive",
      });
    } finally {
      setOverviewSearching(false);
    }
  };

  const handleModalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modalSearchQuery.trim()) return;

    setModalSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(modalSearchQuery)}&components=country:MG&key=${googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const results = data.results.map((r: any) => ({
          formatted_address: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
        setModalSearchResults(results);
        setShowModalDropdown(true);

        if (results.length === 1) {
          const res = results[0];
          setForm(f => ({ ...f, latitude: res.lat.toFixed(5), longitude: res.lng.toFixed(5) }));
          setModalSearchQuery(res.formatted_address);
          setShowModalDropdown(false);
        }
      } else if (data.status === "ZERO_RESULTS") {
        toast({
          title: t("common.error" as any),
          description: t("map.search.noResults" as any),
          variant: "destructive",
        });
        setModalSearchResults([]);
      } else {
        toast({
          title: t("common.error" as any),
          description: t("map.search.error" as any),
          variant: "destructive",
        });
        setModalSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: t("common.error" as any),
        description: t("map.search.error" as any),
        variant: "destructive",
      });
    } finally {
      setModalSearching(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".overview-search-container")) {
        setShowOverviewDropdown(false);
      }
      if (!target.closest(".modal-search-container")) {
        setShowModalDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!showForm) {
      setModalSearchQuery("");
      setModalSearchResults([]);
      setShowModalDropdown(false);
    }
  }, [showForm]);

  const handleLocateForm = () => {
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
        setForm(f => ({ ...f, latitude: latitude.toFixed(5), longitude: longitude.toFixed(5) }));
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
  const isPremium = user?.role === "admin" || user?.role === "premium";
  const qc = useQueryClient();

  const query = useListZones();

  const createMutation = useCreateZone({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
        setShowForm(false);
        setForm({ name: "", latitude: "", longitude: "", radius_km: "", min_risk: "", min_frp: "", custom_ai_prompt: "" });
        toast({
          title: t("common.success" as any),
          description: t("zones.toast.createSuccess" as any),
        });
      },
    },
  });

  const deleteMutation = useDeleteZone({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
        setDeleteConfirm(null);
        toast({
          title: t("common.success" as any),
          description: t("zones.toast.deleteSuccess" as any),
        });
      },
    },
  });

  if (query.isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const zones = query.data ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: form.name,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          radius_km: parseFloat(form.radius_km),
          min_risk: form.min_risk ? parseFloat(form.min_risk) : undefined,
          min_frp: form.min_frp ? parseFloat(form.min_frp) : undefined,
          custom_ai_prompt: form.custom_ai_prompt || undefined,
        },
      });
    } catch (err: unknown) {
      const errorMessage = (err as { message?: string })?.message || t("zones.toast.createError" as any);
      toast({
        title: t("common.error" as any),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (!isPremium) {
    return (
      <div className="p-4 sm:p-6 h-full flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold mb-2">{t("zones.premium.title")}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">{t("zones.premium.desc")}</p>
        </div>
        <a
          href="/subscriptions"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t("zones.premium.cta")}
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold">{t("zones.title")}</h1>
            <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
              {t("common.premium")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("zones.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-add-zone"
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t("zones.addButton")}
        </button>
      </div>

      {/* Zone cards */}
      {/* Main Content Layout */}
      {zones.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t("zones.empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* List of Zone Cards */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map(z => (
                <div key={z.id} data-testid={`card-zone-${z.id}`} className="bg-card border border-card-border rounded-xl p-5 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <button
                        onClick={() => setDeleteConfirm(z.id)}
                        data-testid={`button-delete-zone-${z.id}`}
                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-heading font-bold text-base mb-1">{z.name}</h3>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-mono">{z.latitude.toFixed(4)}, {z.longitude.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <span className="text-muted-foreground">
                          {t("zones.card.radius")}: <span className="text-foreground font-medium">{z.radius_km} km</span>
                        </span>
                        {z.min_risk !== undefined && z.min_risk !== null && (
                          <span className="text-muted-foreground">
                            {t("zones.card.threshold")}: <span className="text-primary font-medium">{(z.min_risk * 100).toFixed(0)}%</span>
                          </span>
                        )}
                        {z.min_frp !== undefined && z.min_frp !== null && (
                          <span className="text-muted-foreground">
                            FRP: <span className="text-foreground font-medium">{z.min_frp} MW</span>
                          </span>
                        )}
                      </div>
                      {z.custom_ai_prompt && (
                        <div className="text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-1.5 italic">
                          "{z.custom_ai_prompt}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      {t("zones.card.created")} {new Date(z.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overview Google Map */}
          <div className="w-full lg:w-[360px] xl:w-[420px] h-[350px] lg:h-[480px] bg-card border border-card-border rounded-xl p-3 flex flex-col gap-2.5 order-1 lg:order-2 sticky top-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Carte des zones prioritaires (Google Maps)
            </div>
            <div className="flex-1 rounded-lg overflow-hidden border border-border relative z-0">
              {/* Floating Search Bar on Overview Map */}
              <div className="absolute top-3 left-3 right-3 z-[500] flex flex-col overview-search-container">
                <form
                  onSubmit={handleOverviewSearch}
                  className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border shadow-lg rounded-xl pl-3 pr-2 py-1.5 h-10 w-full"
                >
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={overviewSearchQuery}
                    onChange={(e) => {
                      setOverviewSearchQuery(e.target.value);
                      if (!e.target.value) {
                        setOverviewSearchResults([]);
                        setShowOverviewDropdown(false);
                      }
                    }}
                    placeholder={t("map.search.placeholder")}
                    className="bg-transparent border-0 outline-none text-xs w-full h-full text-foreground placeholder:text-muted-foreground/80 focus:ring-0 focus:outline-none"
                  />
                  {overviewSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setOverviewSearchQuery("");
                        setOverviewSearchResults([]);
                        setShowOverviewDropdown(false);
                      }}
                      className="p-1 rounded-md text-muted-foreground hover:bg-secondary flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={overviewSearching || !overviewSearchQuery.trim()}
                    className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center justify-center h-7 transition-all flex-shrink-0"
                  >
                    {overviewSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      t("common.search" as any).replace("...", "")
                    )}
                  </button>
                </form>

                {/* Results Dropdown */}
                {showOverviewDropdown && overviewSearchResults.length > 0 && (
                  <div className="mt-1.5 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl max-h-40 overflow-y-auto w-full py-1 divide-y divide-border/40 z-[1000] scrollbar-thin">
                    {overviewSearchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setOverviewMapTarget({ lat: result.lat, lng: result.lng, zoom: 12 });
                          setShowOverviewDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-secondary flex items-start gap-2.5 transition-colors group"
                      >
                        <MapPin className="w-4 h-4 text-primary mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="text-xs text-foreground/90 group-hover:text-foreground font-medium truncate">
                          {result.formatted_address}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <MapContainer
                center={[-18.766947, 46.869107]}
                zoom={5}
                style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
              >
                <TileLayer
                  url={`https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${googleMapsApiKey}`}
                  attribution="&copy; Google Maps"
                  maxZoom={20}
                />
                {overviewMapTarget && (
                  <MapRecenter lat={overviewMapTarget.lat} lng={overviewMapTarget.lng} zoom={overviewMapTarget.zoom} />
                )}
                {zones.map(z => (
                  <div key={z.id}>
                    <CircleMarker
                      center={[z.latitude, z.longitude]}
                      radius={5}
                      pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 1 }}
                    >
                      <Popup className="fire-popup">
                        <div className="text-sm font-semibold mb-1">{z.name}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>Lat: {z.latitude.toFixed(4)}, Lng: {z.longitude.toFixed(4)}</div>
                          <div>Rayon: {z.radius_km} km</div>
                          {z.min_risk !== undefined && z.min_risk !== null && (
                            <div>Seuil risque: {(z.min_risk * 100).toFixed(0)}%</div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                    <Circle
                      center={[z.latitude, z.longitude]}
                      radius={z.radius_km * 1000}
                      pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1, weight: 1 }}
                    />
                  </div>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="font-heading font-bold text-lg mb-4">{t("zones.form.title")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Interactive Map Selection */}
              <div className="flex flex-col gap-2 min-h-[300px] md:min-h-[400px]">
                <label className="text-sm font-medium block">
                  Sélection géographique (Cliquez sur la carte) *
                </label>
                <div className="flex-1 h-full rounded-lg overflow-hidden border border-border relative z-0">
                  {/* Floating Search Bar on Modal Map */}
                  <div className="absolute top-2.5 left-2.5 right-[130px] z-[500] flex flex-col modal-search-container">
                    <form
                      onSubmit={handleModalSearch}
                      className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border shadow-lg rounded-xl pl-3 pr-2 py-1 h-8 w-full"
                    >
                      <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <input
                        type="text"
                        value={modalSearchQuery}
                        onChange={(e) => {
                          setModalSearchQuery(e.target.value);
                          if (!e.target.value) {
                            setModalSearchResults([]);
                            setShowModalDropdown(false);
                          }
                        }}
                        placeholder={t("map.search.placeholder")}
                        className="bg-transparent border-0 outline-none text-xs w-full h-full text-foreground placeholder:text-muted-foreground/80 focus:ring-0 focus:outline-none"
                      />
                      {modalSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalSearchQuery("");
                            setModalSearchResults([]);
                            setShowModalDropdown(false);
                          }}
                          className="p-0.5 rounded-md text-muted-foreground hover:bg-secondary flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={modalSearching || !modalSearchQuery.trim()}
                        className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center justify-center h-6 transition-all flex-shrink-0"
                      >
                        {modalSearching ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          t("common.search" as any).replace("...", "")
                        )}
                      </button>
                    </form>

                    {/* Results Dropdown */}
                    {showModalDropdown && modalSearchResults.length > 0 && (
                      <div className="mt-1 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl max-h-36 overflow-y-auto w-full py-1 divide-y divide-border/40 z-[1000] scrollbar-thin">
                        {modalSearchResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setForm(f => ({ ...f, latitude: result.lat.toFixed(5), longitude: result.lng.toFixed(5) }));
                              setModalSearchQuery(result.formatted_address);
                              setShowModalDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-secondary flex items-start gap-2 transition-colors group"
                          >
                            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span className="text-xs text-foreground/90 group-hover:text-foreground font-medium truncate">
                              {result.formatted_address}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleLocateForm}
                    disabled={locating}
                    className="absolute top-2.5 right-2.5 z-[500] bg-card/95 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-md hover:bg-secondary disabled:opacity-50 transition-colors"
                  >
                    {locating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    ) : (
                      <Compass className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span>
                      {locating ? t("map.geolocation.loading" as any) : t("map.geolocation.button" as any)}
                    </span>
                  </button>
                  <MapContainer
                    center={
                      form.latitude && form.longitude && !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude))
                        ? [parseFloat(form.latitude), parseFloat(form.longitude)]
                        : [-18.766947, 46.869107]
                    }
                    zoom={form.latitude && form.longitude && !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude)) ? 10 : 5}
                    style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
                  >
                    <TileLayer
                      url={`https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${googleMapsApiKey}`}
                      attribution="&copy; Google Maps"
                      maxZoom={20}
                    />
                    <MapEvents
                      onClick={(lat, lng) => {
                        setForm(f => ({ ...f, latitude: lat.toFixed(5), longitude: lng.toFixed(5) }));
                      }}
                    />
                    {form.latitude && form.longitude && !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude)) && (
                      <>
                        <CircleMarker
                          center={[parseFloat(form.latitude), parseFloat(form.longitude)]}
                          radius={6}
                          pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1 }}
                        />
                        {form.radius_km && !isNaN(parseFloat(form.radius_km)) && (
                          <Circle
                            center={[parseFloat(form.latitude), parseFloat(form.longitude)]}
                            radius={parseFloat(form.radius_km) * 1000}
                            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.15, weight: 1.5 }}
                          />
                        )}
                        <MapRecenter lat={parseFloat(form.latitude)} lng={parseFloat(form.longitude)} />
                      </>
                    )}
                  </MapContainer>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  * Cliquez sur la carte pour définir automatiquement le centre (latitude & longitude) de la zone prioritaire.
                </p>
              </div>

              {/* Right Column: Form Fields */}
              <form onSubmit={handleCreate} className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">{t("zones.form.name")} *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t("zones.form.namePlaceholder")}
                      required
                      className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("zones.form.latitude")} *</label>
                      <input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="-18.76" required type="number" step="0.00001" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("zones.form.longitude")} *</label>
                      <input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="46.86" required type="number" step="0.00001" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("zones.form.radius")} *</label>
                      <input value={form.radius_km} onChange={e => setForm(f => ({ ...f, radius_km: e.target.value }))} placeholder="25" required type="number" min="1" max="200" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("zones.form.riskThreshold")}</label>
                      <input value={form.min_risk} onChange={e => setForm(f => ({ ...f, min_risk: e.target.value }))} placeholder="0.7" type="number" min="0" max="1" step="0.1" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">FRP Seuil (MW)</label>
                    <input value={form.min_frp} onChange={e => setForm(f => ({ ...f, min_frp: e.target.value }))} placeholder="50" type="number" min="0" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">{t("zones.form.aiPrompt")} ({t("common.optional")})</label>
                    <textarea value={form.custom_ai_prompt} onChange={e => setForm(f => ({ ...f, custom_ai_prompt: e.target.value }))} placeholder={t("zones.form.aiPromptPlaceholder")} rows={2} className="w-full px-3 py-2 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none text-xs" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border mt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                    {t("common.cancel")}
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                    {createMutation.isPending ? t("zones.form.creating") : t("zones.form.createButton")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-sm shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="font-heading font-bold mb-2">{t("zones.delete.title")}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t("zones.delete.confirm")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                {t("common.cancel")}
              </button>
              <button
                onClick={() => { deleteMutation.mutate({ id: deleteConfirm }); setDeleteConfirm(null); }}
                className="flex-1 h-10 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
