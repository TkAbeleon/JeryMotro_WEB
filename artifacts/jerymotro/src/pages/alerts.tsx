import { useState, useRef, useEffect, useMemo } from "react";
import {
  useGetMyAlerts,
  useGetMySubscriptions,
  useSubscribeAlert,
  useDeleteSubscription,
  useVerifySubscription,
  useResendVerificationCode,
  type Subscription,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, Phone, Trash2, Plus, Filter, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";

const channelIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  EMAIL: Mail,
  whatsapp: MessageSquare,
  WHATSAPP: MessageSquare,
  sms: Phone,
  SMS: Phone,
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  sent: CheckCircle,
  SENT: CheckCircle,
  failed: XCircle,
  FAILED: XCircle,
  pending: Clock,
  PENDING: Clock,
};

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

function validateDestination(channel: string, destination: string): string | null {
  if (!destination.trim()) return "Ce champ est requis.";
  if (channel.toLowerCase() === "email") {
    if (!EMAIL_REGEX.test(destination)) return "Adresse email invalide (ex: vous@exemple.mg)";
  } else {
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
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"subscribe" | "verify">("subscribe");
  const [pendingSubscription, setPendingSubscription] = useState<Subscription | null>(null);

  const [subForm, setSubForm] = useState({
    channel: "EMAIL",
    destination: "",
    min_risk: "0.5",
  });
  const [fieldError, setFieldError] = useState<string | null>(null);

  // OTP verification state
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [attemptsExceeded, setAttemptsExceeded] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [success, setSuccess] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Query data
  const myAlertsQ = useGetMyAlerts();
  const mySubscriptionsQ = useGetMySubscriptions();

  const subscriptions = mySubscriptionsQ.data || [];
  const alertsHistory = myAlertsQ.data?.alerts || [];

  // Debug logs
  console.log("=== ALERTS DEBUG ===");
  console.log("myAlertsQ.isLoading:", myAlertsQ.isLoading);
  console.log("myAlertsQ.isError:", myAlertsQ.isError);
  console.log("myAlertsQ.error:", myAlertsQ.error);
  console.log("myAlertsQ.data:", myAlertsQ.data);
  console.log("alertsHistory:", alertsHistory);
  console.log("alertsHistory.length:", alertsHistory.length);
  console.log("subscriptions:", subscriptions);
  console.log("===================");

  // Mutations
  const subscribeMutation = useSubscribeAlert({
    mutation: {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ["/alerts/subscriptions"] });
        setPendingSubscription(data);
        setModalMode("verify");
        setError(null);
        resetOtpState();
        toast({
          title: t("common.success"),
          description: "Code de vérification envoyé !",
        });
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message || "Erreur lors de l'ajout. Vérifiez votre accès (compte Premium requis pour SMS/WhatsApp).";
        toast({
          title: t("common.error"),
          description: msg,
          variant: "destructive",
        });
      },
    },
  });

  const deleteMutation = useDeleteSubscription({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/alerts/subscriptions"] });
        toast({
          title: t("common.success"),
          description: "Abonnement supprimé !",
        });
      },
    },
  });

  const verifyMutation = useVerifySubscription({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/alerts/subscriptions"] });
        setSuccess(true);
        setTimeout(() => {
          closeModal();
        }, 1500);
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message || "Erreur lors de la vérification";
        setError(msg);
        if (msg.includes("maximal")) {
          setAttemptsExceeded(true);
        }
      },
    },
  });

  const resendMutation = useResendVerificationCode({
    mutation: {
      onSuccess: (data) => {
        setPendingSubscription(data);
        setCooldown(60);
        setError(null);
        setAttemptsExceeded(false);
        resetOtpState();
        toast({
          title: t("common.success"),
          description: "Code renvoyé !",
        });
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message || "Impossible de renvoyer le code.";
        setError(msg);
      },
    },
  });

  // Cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  // Reset modal state when opened
  useEffect(() => {
    if (showModal) {
      setError(null);
      setAttemptsExceeded(false);
      setSuccess(false);
      setCooldown(0);
    }
  }, [showModal]);

  // Filter options
  const levelFilters = [
    { key: "all", label: t("alerts.filter.all") },
    { key: "critical", label: t("risk.critical") },
    { key: "high", label: t("risk.high") },
    { key: "medium", label: t("risk.medium") },
  ];

  const channelFilters = [
    { key: "all", label: t("alerts.filter.all") },
    { key: "email", label: t("channel.email") },
    { key: "whatsapp", label: t("channel.whatsapp") },
    { key: "sms", label: t("channel.sms") },
  ];

  // Filtered alerts
  const filtered = useMemo(() => {
    return alertsHistory.filter((a) => {
      if (levelFilter !== "all" && a.alert_level?.toLowerCase() !== levelFilter.toLowerCase()) return false;
      if (channelFilter !== "all" && a.channel?.toLowerCase() !== channelFilter.toLowerCase()) return false;
      return true;
    });
  }, [alertsHistory, levelFilter, channelFilter]);

  const openSubscribeModal = () => {
    setModalMode("subscribe");
    setPendingSubscription(null);
    setSubForm({ channel: "EMAIL", destination: "", min_risk: "0.5" });
    setFieldError(null);
    setShowModal(true);
  };

  const openVerifyModal = (sub: Subscription) => {
    setModalMode("verify");
    setPendingSubscription(sub);
    resetOtpState();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMode("subscribe");
    setPendingSubscription(null);
    resetOtpState();
  };

  const resetOtpState = () => {
    setOtp(new Array(6).fill(""));
    setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 150);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateDestination(subForm.channel, subForm.destination);
    if (validationErr) {
      setFieldError(validationErr);
      return;
    }
    const destination = subForm.channel.toLowerCase() === "email"
      ? subForm.destination.trim()
      : subForm.destination.trim().replace(/\s/g, "");
    await subscribeMutation.mutateAsync({
      data: {
        channel: subForm.channel as any,
        destination,
        min_risk: parseFloat(subForm.min_risk),
        min_frp: 50.0,
      },
    });
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingSubscription) return;
    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      setError("Veuillez saisir les 6 chiffres du code.");
      return;
    }
    await verifyMutation.mutateAsync({
      id: pendingSubscription.id,
      data: { code: fullCode },
    });
  };

  const handleResend = async () => {
    if (!pendingSubscription || cooldown > 0) return;
    await resendMutation.mutateAsync({ id: pendingSubscription.id });
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length !== 6 || isNaN(Number(pastedData))) return;
    const newOtp = pastedData.split("");
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
  };

  if (myAlertsQ.isLoading || mySubscriptionsQ.isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("alerts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("alerts.subtitle")}</p>
        </div>
        <button
          onClick={openSubscribeModal}
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
            {subscriptions.map((s) => {
              const Icon = channelIcon[s.channel];
              return (
                <div key={s.id} data-testid={`row-subscription-${s.id}`} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.destination}</div>
                    <div className="text-xs text-muted-foreground truncate capitalize">
                      {s.channel.toLowerCase()} · {t("alerts.subs.risk")} ≥ {((s.min_risk || 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!s.is_verified ? (
                      <button
                        onClick={() => openVerifyModal(s)}
                        className="text-xs px-3 py-1 rounded-full bg-destructive/10 text-destructive font-medium flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        En attente de vérification
                      </button>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-accent/15 text-accent font-medium">
                        {t("common.active")}
                      </span>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate({ id: s.id })}
                      data-testid={`button-delete-subscription-${s.id}`}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
            {levelFilters.map((f) => (
              <button key={f.key} onClick={() => setLevelFilter(f.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${levelFilter === f.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {channelFilters.map((f) => (
            <button key={f.key} onClick={() => setChannelFilter(f.key)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${channelFilter === f.key ? "bg-secondary border-primary/30" : "border-border hover:bg-secondary"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts History */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-semibold">{t("alerts.history.title")} ({filtered.length})</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{t("alerts.history.empty")}</div>
        ) : (
          filtered.map((a) => {
            const levelConfig = {
              critical: { label: t("risk.critical"), color: "bg-destructive/15 text-destructive" },
              high: { label: t("risk.high"), color: "bg-primary/15 text-primary" },
              medium: { label: t("risk.medium"), color: "bg-[#f59e0b]/15 text-[#f59e0b]" },
              low: { label: t("risk.low"), color: "bg-accent/15 text-accent" },
            };
            const level = levelConfig[a.alert_level.toLowerCase() as keyof typeof levelConfig] || { label: a.alert_level, color: "bg-muted text-muted-foreground" };
            const ChanIcon = channelIcon[a.channel];
            const StatusIcon = statusIcon[a.status];
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
                      {a.message || `FRP: ${a.frp?.toFixed(0)} MW · ${t("alerts.subs.risk")}: ${((a.risk_score || 0) * 100).toFixed(0)}%`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-border/40 sm:border-0 pt-2 sm:pt-0 pl-11 sm:pl-0">
                  <div className={`flex items-center gap-1 text-xs ${a.status.toLowerCase() === "sent" ? "text-accent" : a.status.toLowerCase() === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{a.status.toLowerCase() === "sent" ? t("alert.status.sent") : a.status.toLowerCase() === "failed" ? t("alert.status.failed") : t("alert.status.pending")}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.sent_at ? new Date(a.sent_at).toLocaleDateString("fr-FR") : "—"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl"
              onClick={closeModal}
            >
              ×
            </button>

            {success ? (
              <div className="flex flex-col items-center gap-4 p-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 border-2 border-green-500 flex items-center justify-center text-3xl font-bold animate-bounce">
                  ✓
                </div>
                <h2 className="text-xl font-bold">Abonnement Activé !</h2>
                <p className="text-muted-foreground text-center">
                  Votre canal {pendingSubscription?.channel.toLowerCase()} ({pendingSubscription?.destination}) est validé avec succès.
                </p>
              </div>
            ) : modalMode === "subscribe" ? (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <h3 className="font-heading font-bold text-lg">Nouvel abonnement</h3>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("alerts.form.channel")}</label>
                  <select
                    value={subForm.channel}
                    onChange={(e) => {
                      setSubForm((f) => ({ ...f, channel: e.target.value, destination: "" }));
                      setFieldError(null);
                    }}
                    className="w-full h-10 px-3 rounded-md bg-secondary border border-input text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="EMAIL">{t("channel.email")}</option>
                    <option value="WHATSAPP">{t("channel.whatsapp")} ({t("common.premium")})</option>
                    <option value="SMS">{t("channel.sms")} ({t("common.premium")})</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("alerts.form.destination")}</label>
                  <input
                    type={subForm.channel.toLowerCase() === "email" ? "email" : "tel"}
                    value={subForm.destination}
                    onChange={(e) => {
                      setSubForm((f) => ({ ...f, destination: e.target.value }));
                      const err = validateDestination(subForm.channel, e.target.value);
                      setFieldError(err);
                    }}
                    onBlur={(e) => setFieldError(validateDestination(subForm.channel, e.target.value))}
                    placeholder={subForm.channel.toLowerCase() === "email" ? "vous@exemple.mg" : "+261 34 12 345 67"}
                    required
                    autoComplete={subForm.channel.toLowerCase() === "email" ? "email" : "tel"}
                    className={`w-full h-10 px-3 rounded-md bg-secondary border text-sm outline-none focus:ring-2 transition-colors ${fieldError ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-primary/30"
                      }`}
                  />
                  {fieldError ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {fieldError}
                    </p>
                  ) : (
                    subForm.channel.toLowerCase() !== "email" && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Format international requis, ex: <strong>+261341234567</strong>
                      </p>
                    )
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("alerts.form.riskThreshold")}</label>
                  <input
                    value={subForm.min_risk}
                    onChange={(e) => setSubForm((f) => ({ ...f, min_risk: e.target.value }))}
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
                    onClick={closeModal}
                    className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={subscribeMutation.isPending || !!fieldError}
                    className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {subscribeMutation.isPending ? "Envoi..." : t("alerts.form.addButton")}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <h2 className="text-xl font-bold text-center">Vérification de sécurité</h2>
                <p className="text-muted-foreground text-center">
                  Nous avons envoyé un code de validation temporaire à <strong>{pendingSubscription?.destination}</strong>.
                </p>

                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={verifyMutation.isPending || attemptsExceeded}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 ${error ? "border-destructive" : "border-input focus:border-primary"
                        } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50`}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={verifyMutation.isPending || otp.some(d => !d) || attemptsExceeded}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {verifyMutation.isPending ? "Vérification..." : "Valider l'abonnement"}
                  </button>
                  <div className="text-center text-muted-foreground text-sm">
                    Vous n'avez pas reçu de code ?
                    <button
                      type="button"
                      disabled={cooldown > 0 || resendMutation.isPending}
                      onClick={handleResend}
                      className="ml-2 text-sky-400 font-semibold hover:text-sky-300 disabled:text-muted-foreground transition-colors"
                    >
                      {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer un code"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
