import { Check, Zap, Shield, Bot, Bell, Map, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isPremium = user?.role === "admin" || user?.role === "premium";

  const FREE_FEATURES = [
    { icon: Bell, text: t("nav.detections") },
    { icon: Map, text: t("nav.clusters") },
    { icon: BarChart3, text: t("nav.stats") },
    { icon: Bell, text: "1 alerte email / jour" },
  ];

  const PREMIUM_FEATURES = [
    { icon: BarChart3, text: `${t("common.free")} +` },
    { icon: BarChart3, text: t("nav.predictions") },
    { icon: Bot, text: `${t("nav.chat")} illimité` },
    { icon: Bell, text: `${t("channel.sms")} & ${t("channel.whatsapp")}` },
    { icon: Shield, text: `${t("nav.zones")} illimitées` },
    { icon: BarChart3, text: "Export CSV/JSON" },
    { icon: Zap, text: "Alertes < 5 min" },
    { icon: Map, text: "Historique 12 mois" },
    { icon: Shield, text: "Support prioritaire" },
  ];

  const FAQ = [
    {
      q: "Comment fonctionne l'essai gratuit ?",
      a: "14 jours avec toutes les fonctionnalités Premium, sans carte bancaire requise. Annulation à tout moment.",
    },
    {
      q: "Les données sont-elles en temps réel ?",
      a: "Oui. Les satellites NASA MODIS et VIIRS transmettent des données toutes les heures, que nous traitons automatiquement.",
    },
    {
      q: "Puis-je exporter mes données ?",
      a: "Avec le plan Premium, vous pouvez exporter toutes les détections et clusters en CSV ou JSON.",
    },
    {
      q: "Comment annuler mon abonnement ?",
      a: "Depuis votre profil, onglet Abonnement. L'annulation prend effet à la fin de la période en cours.",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("subscriptions.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subscriptions.subtitle")}</p>
      </div>

      {isPremium && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">{t("subscriptions.plan.premium")} actif</div>
              <div className="text-xs text-muted-foreground">Toutes les fonctionnalités sont débloquées. Renouvellement le 11/07/2026.</div>
            </div>
          </div>
          <span className="text-xs bg-primary/15 text-primary px-2 py-1 rounded-full font-medium w-fit flex-shrink-0">{t("common.active")}</span>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <div className={`bg-card border rounded-xl p-6 ${!isPremium ? "border-primary/30" : "border-card-border"}`}>
          {!isPremium && <div className="text-xs font-bold text-primary mb-3">{t("subscriptions.cta.free").toUpperCase()}</div>}
          <div className="mb-5">
            <h3 className="font-heading text-xl font-bold">{t("subscriptions.plan.free")}</h3>
            <div className="flex items-end gap-1 mt-2">
              <span className="font-heading text-4xl font-bold">0€</span>
              <span className="text-muted-foreground mb-1">/mois</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Pour découvrir la plateforme</p>
          </div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <li key={f.text} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>{f.text}</span>
                </li>
              );
            })}
          </ul>
          {!isPremium ? (
            <div className="text-center text-sm text-muted-foreground border border-border rounded-lg py-2.5">
              {t("subscriptions.cta.free")}
            </div>
          ) : (
            <button className="w-full text-center text-sm border border-border rounded-lg py-2.5 hover:bg-secondary transition-colors">
              {t("subscriptions.plan.free")}
            </button>
          )}
        </div>

        {/* Premium */}
        <div className={`bg-card border rounded-xl p-6 ${isPremium ? "border-primary/50 bg-primary/5" : "border-border"}`}>
          {isPremium && <div className="text-xs font-bold text-primary mb-3">{t("subscriptions.cta.free").toUpperCase()}</div>}
          <div className="mb-5">
            <h3 className="font-heading text-xl font-bold flex items-center gap-2">
              {t("subscriptions.plan.premium")}
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">RECOMMANDÉ</span>
            </h3>
            <div className="flex items-end gap-1 mt-2">
              <span className="font-heading text-4xl font-bold">29€</span>
              <span className="text-muted-foreground mb-1">/mois</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Pour les professionnels et organisations</p>
          </div>
          <ul className="space-y-3 mb-8">
            {PREMIUM_FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <li key={f.text} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{f.text}</span>
                </li>
              );
            })}
          </ul>
          {isPremium ? (
            <div className="text-center text-sm text-primary border border-primary/30 rounded-lg py-2.5 bg-primary/5">
              {t("subscriptions.cta.free")} — Renouvellement le 11/07/2026
            </div>
          ) : (
            <button className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity">
              {t("subscriptions.cta.premium")}
            </button>
          )}
        </div>
      </div>

      {/* Features comparison table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-semibold">Comparaison détaillée</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium border-b border-border px-4 py-2 bg-secondary/30">
              <span>Fonctionnalité</span>
              <span className="text-center">{t("subscriptions.plan.free")}</span>
              <span className="text-center">{t("subscriptions.plan.premium")}</span>
            </div>
            <div className="divide-y divide-border">
              {[
                { feature: t("nav.detections"), free: true, premium: true },
                { feature: t("nav.clusters"), free: true, premium: true },
                { feature: t("nav.stats"), free: "30 jours", premium: "12 mois" },
                { feature: "Alertes email", free: "1/jour", premium: "Illimité" },
                { feature: `${t("channel.sms")}/${t("channel.whatsapp")}`, free: false, premium: true },
                { feature: t("nav.predictions"), free: false, premium: true },
                { feature: t("nav.chat"), free: false, premium: "Illimité" },
                { feature: t("nav.zones"), free: false, premium: "Illimité" },
                { feature: "Export données", free: false, premium: "CSV, JSON" },
                { feature: "Délai alerte", free: "1h", premium: "<5 min" },
              ].map(row => (
                <div key={row.feature} className="grid grid-cols-3 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{row.feature}</span>
                  <span className="text-center">
                    {row.free === true ? (
                      <Check className="w-4 h-4 text-accent inline" />
                    ) : row.free === false ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span className="text-xs font-medium">{row.free}</span>
                    )}
                  </span>
                  <span className="text-center">
                    {row.premium === true ? (
                      <Check className="w-4 h-4 text-primary inline" />
                    ) : row.premium === false ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span className="text-xs font-medium text-primary">{row.premium}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="font-heading font-semibold">{t("subscriptions.faq.title")}</h2>
        {FAQ.map(item => (
          <div key={item.q} className="bg-card border border-card-border rounded-xl p-4">
            <h4 className="font-medium text-sm mb-1.5">{item.q}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
