import { Link } from "wouter";
import { Flame, Activity, Brain, Bell, Shield, ChevronRight, Map, Bot, Zap, Globe, Sun, Moon, Languages } from "lucide-react";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const features = [
    { icon: Activity, title: t("landing.features.1.title"), desc: t("landing.features.1.desc") },
    { icon: Brain, title: t("landing.features.2.title"), desc: t("landing.features.2.desc") },
    { icon: Bot, title: t("landing.features.3.title"), desc: t("landing.features.3.desc") },
    { icon: Bell, title: t("landing.features.4.title"), desc: t("landing.features.4.desc") },
    { icon: Map, title: t("landing.features.5.title"), desc: t("landing.features.5.desc") },
    { icon: Shield, title: t("landing.features.6.title"), desc: t("landing.features.6.desc") },
  ];

  const tiers = [
    {
      name: t("landing.pricing.tier.free.name"),
      price: "0",
      desc: t("landing.pricing.tier.free.desc"),
      features: [
        t("landing.pricing.tier.free.features.1"),
        t("landing.pricing.tier.free.features.2"),
        t("landing.pricing.tier.free.features.3"),
        t("landing.pricing.tier.free.features.4"),
        t("landing.pricing.tier.free.features.5"),
      ],
      cta: t("landing.pricing.tier.free.cta"),
      highlighted: false,
    },
    {
      name: t("landing.pricing.tier.premium.name"),
      price: "29",
      desc: t("landing.pricing.tier.premium.desc"),
      features: [
        t("landing.pricing.tier.premium.features.1"),
        t("landing.pricing.tier.premium.features.2"),
        t("landing.pricing.tier.premium.features.3"),
        t("landing.pricing.tier.premium.features.4"),
        t("landing.pricing.tier.premium.features.5"),
        t("landing.pricing.tier.premium.features.6"),
        t("landing.pricing.tier.premium.features.7"),
      ],
      cta: t("landing.pricing.tier.premium.cta"),
      highlighted: true,
    },
  ];

  const stats = [
    { value: "50K+", label: t("landing.stats.dailyProcessed") },
    { value: "89%", label: t("landing.stats.precision") },
    { value: "22", label: t("landing.stats.coverage") },
    { value: "<2s", label: t("landing.stats.responseTime") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md h-[58px] flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="JeryMotro" className="h-8 rounded" />
          <span className="font-heading font-bold text-base sm:text-lg">JeryMotro</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="bg-transparent text-sm text-muted-foreground hover:text-foreground outline-none cursor-pointer"
            >
              {Object.entries(LANG_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("auth.login.title")}</Link>
          <Link href="/register" className="text-sm bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md hover:opacity-90 transition-opacity font-medium">
            {t("auth.register.title")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-[58px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" />
            <span>{t("landing.tagline")}</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            {t("landing.hero.title")}<br />
            <span className="text-primary">{t("landing.hero.subtitle")}</span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("landing.hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              {t("landing.hero.cta.getStarted")}
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors">
              {t("landing.hero.cta.login")}
            </Link>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
          <div className="rounded-xl border border-border overflow-hidden shadow-2xl bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2 bg-secondary/30">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground ml-2 font-mono truncate">dashboard.jerymotro.mg</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t("landing.mock.detectionsToday"), value: "127", color: "text-primary", sub: t("landing.mock.sub") },
                { label: t("landing.mock.activeClusters"), value: "23", color: "text-destructive", sub: t("landing.mock.sub.critical") },
                { label: t("landing.mock.alertsSent"), value: "8", color: "text-[#f59e0b]", sub: t("landing.mock.sub.last24h") },
                { label: t("landing.mock.precision"), value: "89%", color: "text-accent", sub: t("landing.mock.sub.xgboost") },
              ].map(s => (
                <div key={s.label} className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/20 py-12">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="font-heading text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold mb-4">{t("landing.features.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.features.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Coverage Map Info */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="rounded-xl border border-border bg-card p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Globe className="w-8 h-8 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-xl font-bold mb-2">{t("landing.coverage.title")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("landing.coverage.description")}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive inline-block" /> {t("landing.coverage.legends.critical")}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> {t("landing.coverage.legends.high")}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block" /> {t("landing.coverage.legends.medium")}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent inline-block" /> {t("landing.coverage.legends.low")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold mb-4">{t("landing.pricing.title")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map(tier => (
            <div key={tier.name} className={`p-8 rounded-xl border ${tier.highlighted ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
              {tier.highlighted && (
                <div className="inline-block text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded mb-4">{t("landing.pricing.recommended")}</div>
              )}
              <div className="mb-6">
                <h3 className="font-heading text-xl font-bold">{tier.name}</h3>
                <div className="flex items-end gap-1 mt-2">
                  <span className="font-heading text-4xl font-bold">{tier.price}€</span>
                  <span className="text-muted-foreground mb-1">/mois</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{tier.desc}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-accent mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`block text-center py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${tier.highlighted ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="JeryMotro" className="h-6 rounded" />
            <span className="font-heading font-semibold text-foreground">JeryMotro</span>
            <span>— {t("landing.footer.surveillance")}</span>
          </div>
          <div className="flex items-center gap-6">
            <span>{t("landing.footer.data")}</span>
            <span>{t("landing.footer.ai")}</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
