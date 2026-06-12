import { useState, useMemo } from "react";
import { useGetMyAlerts, useSubscribeAlert, useDeleteSubscription, getGetMyAlertsQueryKey } from "@workspace/api-client-react";
import { generateMockAlerts } from "@/lib/mock-data";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, MessageSquare, Phone, Trash2, Plus, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

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

export default function AlertsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [levelFilter, setLevelFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ channel: "email", destination: "", min_risk: "0.5" });

  const levelConfig = {
    critical: { label: t("risk.critical"), color: "bg-destructive/15 text-destructive" },
    high: { label: t("risk.high"), color: "bg-primary/15 text-primary" },
    medium: { label: t("risk.medium"), color: "bg-[#f59e0b]/15 text-[#f59e0b]" },
    low: { label: t("risk.low"), color: "bg-accent/15 text-accent" },
  };

  const myAlertsQ = useGetMyAlerts();
  const mockAlerts = useMemo(() => generateMockAlerts(), []);

  const subscriptions = myAlertsQ.data?.subscriptions ?? [
    { id: 1, channel: "email", destination: "demo@jerymotro.mg", enabled: true, min_risk: 0.5, min_frp: 50 },
    { id: 2, channel: "whatsapp", destination: "+261 34 00 000 00", enabled: true, min_risk: 0.7, min_frp: 100 },
  ];
  const alertsHistory = myAlertsQ.data?.alerts_history ?? mockAlerts.alerts;

  const subscribeMutation = useSubscribeAlert({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMyAlertsQueryKey() }); setShowSubForm(false); } },
  });
  const deleteMutation = useDeleteSubscription({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMyAlertsQueryKey() }) },
  });

  const filtered = useMemo(() => {
    return alertsHistory.filter(a => {
      if (levelFilter !== "all" && a.alert_level !== levelFilter) return false;
      if (channelFilter !== "all" && a.channel !== channelFilter) return false;
      return true;
    });
  }, [alertsHistory, levelFilter, channelFilter]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("alerts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("alerts.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowSubForm(true)}
          data-testid="button-add-subscription"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
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
              const Icon = channelIcon[s.channel] || Bell;
              return (
                <div key={s.id} data-testid={`row-subscription-${s.id}`} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.destination}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {s.channel} · {t("alerts.subs.risk")} ≥ {((s.min_risk ?? 0) * 100).toFixed(0)}% · {t("alerts.subs.frp")} ≥ {s.min_frp ?? 0} MW
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${s.enabled ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                    {s.enabled ? t("common.active") : t("common.inactive")}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate({ id: s.id })}
                    data-testid={`button-delete-subscription-${s.id}`}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-2">
          {levelFilters.map(f => (
            <button key={f.key} onClick={() => setLevelFilter(f.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${levelFilter === f.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-2">
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
            const level = levelConfig[a.alert_level as keyof typeof levelConfig] || { label: a.alert_level, color: "bg-muted text-muted-foreground" };
            const ChanIcon = channelIcon[a.channel] || Bell;
            const StatusIcon = statusIcon[a.status] || Clock;
            const statusLabel = a.status === "sent" ? t("alert.status.sent") : a.status === "failed" ? t("alert.status.failed") : t("alert.status.pending");
            return (
              <div key={a.id} data-testid={`row-alert-${a.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-secondary">
                  <ChanIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.region || t("alerts.history.unknownRegion")}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.message || `FRP: ${a.frp?.toFixed(0)} MW · ${t("alerts.subs.risk")}: ${((a.risk_score ?? 0) * 100).toFixed(0)}%`}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${level.color}`}>{level.label}</span>
                <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${a.status === "sent" ? "text-accent" : a.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusLabel}</span>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {a.sent_at ? new Date(a.sent_at).toLocaleDateString("fr-FR") : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add subscription modal */}
      {showSubForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-heading font-bold text-lg mb-5">{t("alerts.form.title")}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await subscribeMutation.mutateAsync({ data: { channel: subForm.channel, destination: subForm.destination, min_risk: parseFloat(subForm.min_risk) } });
              } catch { setShowSubForm(false); }
            }} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("alerts.form.channel")}</label>
                <select value={subForm.channel} onChange={e => setSubForm(f => ({ ...f, channel: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="email">{t("channel.email")}</option>
                  <option value="whatsapp">{t("channel.whatsapp")} ({t("common.premium")})</option>
                  <option value="sms">{t("channel.sms")} ({t("common.premium")})</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("alerts.form.destination")}</label>
                <input value={subForm.destination} onChange={e => setSubForm(f => ({ ...f, destination: e.target.value }))} placeholder={subForm.channel === "email" ? "vous@exemple.mg" : "+261 XX XX XXX XX"} required className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("alerts.form.riskThreshold")}</label>
                <input value={subForm.min_risk} onChange={e => setSubForm(f => ({ ...f, min_risk: e.target.value }))} type="number" min="0" max="1" step="0.1" className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSubForm(false)} className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">{t("common.cancel")}</button>
                <button type="submit" disabled={subscribeMutation.isPending} className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
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
