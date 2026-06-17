import { useState, useMemo } from "react";
import { useGetMyAlerts, useGetMySubscriptions, useSubscribeAlert, useDeleteSubscription, getGetMyAlertsQueryKey, getGetMySubscriptionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, MessageSquare, Phone, Trash2, Plus, Filter, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";

const channelIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  whatsapp: MessageSquare,
  sms: Phone,
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  sent: CheckCircle,
  failed: XCircle,
  pending: Clock,
};

// Validation helpers
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

function validateDestination(channel: string, destination: string): string | null {
  if (!destination.trim()) return "Ce champ est requis.";
  if (channel === "email") {
    if (!EMAIL_REGEX.test(destination)) return "Adresse email invalide (ex: vous@exemple.mg)";
  } else {
    // sms or whatsapp — need international format
    if (!PHONE_REGEX.test(destination.replace(/\s/g, ""))) {
      return "Numéro invalide — format international requis (ex: +261341234567)";
    }
  }
  return null;
}

export default function AlertsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [levelFilter, setLevelFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ channel: "email", destination: "", min_risk: "0.5" });
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const levelConfig = {
    critical: { label: t("risk.critical"), color: "bg-destructive/15 text-destructive" },
    high: { label: t("risk.high"), color: "bg-primary/15 text-primary" },
    medium: { label: t("risk.medium"), color: "bg-[#f59e0b]/15 text-[#f59e0b]" },
    low: { label: t("risk.low"), color: "bg-accent/15 text-accent" },
  };

  const myAlertsQ = useGetMyAlerts();
  const mySubscriptionsQ = useGetMySubscriptions();

  const subscriptions = mySubscriptionsQ.data ?? [];
  const alertsHistory = myAlertsQ.data?.alerts ?? [];

  const subscribeMutation = useSubscribeAlert({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMySubscriptionsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMyAlertsQueryKey() });
        setShowSubForm(false);
        setApiError(null);
        setFieldError(null);
        setSubForm({ channel: "email", destination: "", min_risk: "0.5" });
        toast({
          title: t("common.success" as any),
          description: t("alerts.toast.createSuccess" as any),
        });
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message;
        const finalMsg = msg || "Erreur lors de l'ajout. Vérifiez votre accès (compte Premium requis pour SMS/WhatsApp).";
        setApiError(finalMsg);
        toast({
          title: t("common.error" as any),
          description: finalMsg,
          variant: "destructive",
        });
      },
    },
  });
  const deleteMutation = useDeleteSubscription({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMySubscriptionsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMyAlertsQueryKey() });
        toast({
          title: t("common.success" as any),
          description: t("alerts.toast.deleteSuccess" as any),
        });
      },
    },
  });

  const filtered = useMemo(() => {
    return alertsHistory.filter(a => {
      if (levelFilter !== "all" && a.alert_level?.toLowerCase() !== levelFilter.toLowerCase()) return false;
      if (channelFilter !== "all" && a.channel?.toLowerCase() !== channelFilter.toLowerCase()) return false;
      return true;
    });
  }, [alertsHistory, levelFilter, channelFilter]);

  if (myAlertsQ.isLoading || mySubscriptionsQ.isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const levelFilters = [
    { key: "all", label: t("alerts.filter.all") },
    { key: "critical", label: t("alerts.filter.critical") },
    { key: "high", label: t("alerts.filter.high") },
    { key: "medium", label: t("alerts.filter.medium") },
  ];

  const channelFilters = [
    { key: "all", label: t("alerts.filter.all") },
    { key: "email", label: t("channel.email") },
    { key: "whatsapp", label: t("channel.whatsapp") },
    { key: "sms", label: t("channel.sms") },
  ];

  const handleDestinationChange = (value: string) => {
    setSubForm(f => ({ ...f, destination: value }));
    const err = validateDestination(subForm.channel, value);
    setFieldError(err);
  };

  const handleChannelChange = (value: string) => {
    setSubForm(f => ({ ...f, channel: value, destination: "" }));
    setFieldError(null);
    setApiError(null);
  };

  const openForm = () => {
    setShowSubForm(true);
    setApiError(null);
    setFieldError(null);
    setSubForm({ channel: "email", destination: "", min_risk: "0.5" });
  };

  const closeForm = () => {
    setShowSubForm(false);
    setApiError(null);
    setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const validationErr = validateDestination(subForm.channel, subForm.destination);
    if (validationErr) {
      setFieldError(validationErr);
      return;
    }
    const destination = subForm.channel === "email"
      ? subForm.destination.trim()
      : subForm.destination.trim().replace(/\s/g, "");
    try {
      await subscribeMutation.mutateAsync({
        data: {
          channel: subForm.channel.toUpperCase(),
          destination,
          min_risk: parseFloat(subForm.min_risk),
          min_frp: 50.0,
        },
      });
    } catch {
      // error handled by onError above
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("alerts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("alerts.subtitle")}</p>
        </div>
        <button
          onClick={openForm}
          data-testid="button-add-subscription"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t("alerts.addSub")}
        </button>
      </div>

      {/* Subscriptions */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-semibold">{t("alerts.subs.title")} ({subscriptions.length})</h2>
        </div>
        {subscriptions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">{t("alerts.subs.empty")}</div>
        ) : (
          <div className="divide-y divide-border">
            {subscriptions.map(s => {
              const Icon = channelIcon[s.channel.toLowerCase()] || Bell;
              return (
                <div key={s.id} data-testid={`row-subscription-${s.id}`} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.destination}</div>
                    <div className="text-xs text-muted-foreground truncate capitalize">
                      {s.channel.toLowerCase()} · {t("alerts.subs.risk")} ≥ {((s.min_risk ?? 0) * 100).toFixed(0)}% · {t("alerts.subs.frp")} ≥ {s.min_frp ?? 0} MW
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${s.enabled ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                    {s.enabled ? t("common.active") : t("common.inactive")}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate({ id: s.id })}
                    data-testid={`button-delete-subscription-${s.id}`}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {levelFilters.map(f => (
              <button key={f.key} onClick={() => setLevelFilter(f.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${levelFilter === f.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {channelFilters.map(c => (
            <button key={c.key} onClick={() => setChannelFilter(c.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${channelFilter === c.key ? "bg-secondary border-primary/30" : "border-border hover:bg-secondary"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts history */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-semibold">{t("alerts.history.title")} ({filtered.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">{t("alerts.history.empty")}</div>
          ) : filtered.map(a => {
            const level = levelConfig[a.alert_level.toLowerCase() as keyof typeof levelConfig] || { label: a.alert_level, color: "bg-muted text-muted-foreground" };
            const ChanIcon = channelIcon[a.channel.toLowerCase()] || Bell;
            const StatusIcon = statusIcon[a.status.toLowerCase()] || Clock;
            const statusLabel = a.status.toLowerCase() === "sent" ? t("alert.status.sent") : a.status.toLowerCase() === "failed" ? t("alert.status.failed") : t("alert.status.pending");
            return (
              <div key={a.id} data-testid={`row-alert-${a.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-secondary mt-0.5">
                    <ChanIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{a.region || t("alerts.history.unknownRegion")}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${level.color}`}>{level.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 break-words">
                      {a.message || `FRP: ${a.frp?.toFixed(0)} MW · ${t("alerts.subs.risk")}: ${((a.risk_score ?? 0) * 100).toFixed(0)}%`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-border/40 sm:border-0 pt-2 sm:pt-0 pl-11 sm:pl-0">
                  <div className={`flex items-center gap-1 text-xs ${a.status.toLowerCase() === "sent" ? "text-accent" : a.status.toLowerCase() === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusLabel}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.sent_at ? new Date(a.sent_at).toLocaleDateString("fr-FR") : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add subscription modal */}
      {showSubForm && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-heading font-bold text-lg mb-5">{t("alerts.form.title")}</h3>

            {/* API error banner */}
            {apiError && (
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Channel */}
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("alerts.form.channel")}</label>
                <select
                  value={subForm.channel}
                  onChange={e => handleChannelChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="email">{t("channel.email")}</option>
                  <option value="whatsapp">{t("channel.whatsapp")} ({t("common.premium")})</option>
                  <option value="sms">{t("channel.sms")} ({t("common.premium")})</option>
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("alerts.form.destination")}</label>
                <input
                  type={subForm.channel === "email" ? "email" : "tel"}
                  value={subForm.destination}
                  onChange={e => handleDestinationChange(e.target.value)}
                  onBlur={e => setFieldError(validateDestination(subForm.channel, e.target.value))}
                  placeholder={subForm.channel === "email" ? "vous@exemple.mg" : "+261 34 12 345 67"}
                  required
                  autoComplete={subForm.channel === "email" ? "email" : "tel"}
                  className={`w-full h-10 px-3 rounded-md bg-secondary border text-sm outline-none focus:ring-2 transition-colors ${
                    fieldError
                      ? "border-destructive focus:ring-destructive/30"
                      : "border-input focus:ring-primary/30"
                  }`}
                />
                {fieldError ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {fieldError}
                  </p>
                ) : (
                  subForm.channel !== "email" && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Format international requis, ex: <strong>+261341234567</strong>
                    </p>
                  )
                )}
              </div>

              {/* Risk threshold */}
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("alerts.form.riskThreshold")}</label>
                <input
                  value={subForm.min_risk}
                  onChange={e => setSubForm(f => ({ ...f, min_risk: e.target.value }))}
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(parseFloat(subForm.min_risk || "0") * 100)}% — Alerte si le score de risque dépasse ce seuil
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending || !!fieldError}
                  className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {subscribeMutation.isPending ? t("alerts.form.adding") : t("alerts.form.addButton")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
