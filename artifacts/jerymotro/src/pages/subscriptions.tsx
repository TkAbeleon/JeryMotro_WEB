import { Check, Zap, Shield, Bot, Bell, Map, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isPremium = user?.role === "admin" || user?.role === "premium";
  const FREE_FEATURES = [
    { icon: Bell, text: t("nav.detections") }, { icon: Map, text: t("nav.clusters") }, { icon: BarChart3, text: t("nav.stats") }, { icon: Bell, text: "1 alerte email / jour" },
  ];
  const PREMIUM_FEATURES = [
    { icon: BarChart3, text: `${t("common.free")} +` }, { icon: BarChart3, text: t("nav.predictions") }, { icon: Bot, text: `${t("nav.chat")} illimité` }, { icon: Bell, text: `${t("channel.sms")} & ${t("channel.whatsapp")}` }, { icon: Shield, text: `${t("nav.zones")} illimitées` }, { icon: BarChart3, text: "Export CSV/JSON" }, { icon: Zap, text: "Alertes < 5 min" }, { icon: Map, text: "Historique 12 mois" }, { icon: Shield, text: "Support prioritaire" },
  ];
  const FAQ = [
    { q: "Comment fonctionne l'essai gratuit ?", a: "14 jours avec toutes les fonctionnalités Premium, sans carte bancaire requise. Annulation à tout moment." },
    { q: "Les données sont-elles en temps réel ?", a: "Oui. Les satellites NASA MODIS et VIIRS transmettent des données toutes les heures, que nous traitons automatiquement." },
    { q: "Puis-je exporter mes données ?", a: "Avec le plan Premium, vous pouvez exporter toutes les détections et clusters en CSV ou JSON." },
    { q: "Comment annuler mon abonnement ?", a: "Depuis votre profil, onglet Abonnement. L'annulation prend effet à la fin de la période en cours." },
  ];
  return (
    <div className="w-full max-w-5xl space-y-8 p-4 sm:p-6">
      <div><h1 className="font-heading text-2xl font-bold">{t("subscriptions.title")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("subscriptions.subtitle")}</p></div>
      {isPremium && <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20"><Shield className="h-5 w-5 text-primary" /></div><div className="min-w-0"><div className="text-sm font-medium">{t("subscriptions.plan.premium")} actif</div><div className="text-xs text-muted-foreground">Toutes les fonctionnalités sont débloquées.</div></div></div><span className="w-fit shrink-0 rounded-full bg-primary/15 px-2 py-1 text-xs font-medium text-primary">{t("common.active")}</span></div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div className={`rounded-xl border bg-card p-5 sm:p-6 ${!isPremium ? "border-primary/30" : "border-card-border"}`}>
          {!isPremium && <div className="mb-3 text-xs font-bold text-primary">{t("subscriptions.cta.free").toUpperCase()}</div>}
          <div className="mb-5"><h3 className="font-heading text-xl font-bold">{t("subscriptions.plan.free")}</h3><div className="mt-2 flex items-end gap-1"><span className="font-heading text-4xl font-bold">0€</span><span className="mb-1 text-muted-foreground">/mois</span></div><p className="mt-1 text-sm text-muted-foreground">Pour découvrir la plateforme</p></div>
          <ul className="mb-8 space-y-3">{FREE_FEATURES.map(f => <li key={f.text} className="flex items-start gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{f.text}</span></li>)}</ul>
          <div className="rounded-lg border border-border py-2.5 text-center text-sm text-muted-foreground">{t("subscriptions.cta.free")}</div>
        </div>
        <div className={`rounded-xl border p-5 sm:p-6 ${isPremium ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
          {isPremium && <div className="mb-3 text-xs font-bold text-primary">{t("common.active").toUpperCase()}</div>}
          <div className="mb-5"><h3 className="flex flex-wrap items-center gap-2 font-heading text-xl font-bold">{t("subscriptions.plan.premium")}<span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">RECOMMANDÉ</span></h3><div className="mt-2 flex items-end gap-1"><span className="font-heading text-4xl font-bold">29€</span><span className="mb-1 text-muted-foreground">/mois</span></div><p className="mt-1 text-sm text-muted-foreground">Pour les professionnels et organisations</p></div>
          <ul className="mb-8 space-y-3">{PREMIUM_FEATURES.map(f => <li key={f.text} className="flex items-start gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f.text}</span></li>)}</ul>
          <div className="rounded-lg border border-primary/30 bg-primary/5 py-2.5 text-center text-sm font-medium text-primary">{isPremium ? t("common.active") : t("subscriptions.cta.premium")}</div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="border-b border-border p-4"><h2 className="font-heading font-semibold">Comparaison détaillée</h2></div>
        <div className="w-full overflow-x-auto"><div className="min-w-[500px]"><div className="grid grid-cols-3 border-b border-border bg-secondary/30 px-4 py-2 text-xs font-medium text-muted-foreground"><span>Fonctionnalité</span><span className="text-center">{t("subscriptions.plan.free")}</span><span className="text-center">{t("subscriptions.plan.premium")}</span></div><div className="divide-y divide-border">{[
          { feature: t("nav.detections"), free: true, premium: true }, { feature: t("nav.clusters"), free: true, premium: true }, { feature: t("nav.stats"), free: "30 jours", premium: "12 mois" }, { feature: "Alertes email", free: "1/jour", premium: "Illimité" }, { feature: `${t("channel.sms")}/${t("channel.whatsapp")}`, free: false, premium: true }, { feature: t("nav.predictions"), free: false, premium: true }, { feature: t("nav.chat"), free: false, premium: "Illimité" }, { feature: t("nav.zones"), free: false, premium: "Illimité" }, { feature: "Export données", free: false, premium: "CSV, JSON" }, { feature: "Délai alerte", free: "1h", premium: "<5 min" },
        ].map(row => <div key={row.feature} className="grid grid-cols-3 px-4 py-3 text-sm"><span className="text-muted-foreground">{row.feature}</span><span className="text-center">{row.free === true ? <Check className="inline h-4 w-4 text-accent" /> : row.free === false ? <span className="text-xs text-muted-foreground">—</span> : <span className="text-xs font-medium">{row.free}</span>}</span><span className="text-center">{row.premium === true ? <Check className="inline h-4 w-4 text-primary" /> : row.premium === false ? <span className="text-xs text-muted-foreground">—</span> : <span className="text-xs font-medium text-primary">{row.premium}</span>}</span></div>)}</div></div></div>
      </div>
      <div className="space-y-3"><h2 className="font-heading font-semibold">{t("subscriptions.faq.title")}</h2>{FAQ.map(item => <div key={item.q} className="rounded-xl border border-card-border bg-card p-4"><h4 className="mb-1.5 text-sm font-medium">{item.q}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p></div>)}</div>
    </div>
  );
}
