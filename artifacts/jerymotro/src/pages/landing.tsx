import { Link } from "wouter";
import { Flame, Activity, Brain, Bell, Shield, ChevronRight, Map, Bot, Zap, Globe, Sun, Moon, Languages, Mail } from "lucide-react";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();
  const features = [
    { icon: Activity, title: t("landing.features.1.title"), desc: t("landing.features.1.desc") },
    { icon: Brain, title: t("landing.features.2.title"), desc: t("landing.features.2.desc") },
    { icon: Bot, title: t("landing.features.3.title"), desc: t("landing.features.3.desc") },
    { icon: Bell, title: t("landing.features.4.title"), desc: t("landing.features.4.desc") },
    { icon: Map, title: t("landing.features.5.title"), desc: t("landing.features.5.desc") },
    { icon: Shield, title: t("landing.features.6.title"), desc: t("landing.features.6.desc") },
  ];
  const tiers = [
    { name: t("landing.pricing.tier.free.name"), price: "0", desc: t("landing.pricing.tier.free.desc"), features: [t("landing.pricing.tier.free.features.1"), t("landing.pricing.tier.free.features.2"), t("landing.pricing.tier.free.features.3"), t("landing.pricing.tier.free.features.4"), t("landing.pricing.tier.free.features.5")], cta: t("landing.pricing.tier.free.cta"), highlighted: false },
    { name: t("landing.pricing.tier.premium.name"), price: "29", desc: t("landing.pricing.tier.premium.desc"), features: [t("landing.pricing.tier.premium.features.1"), t("landing.pricing.tier.premium.features.2"), t("landing.pricing.tier.premium.features.3"), t("landing.pricing.tier.premium.features.4"), t("landing.pricing.tier.premium.features.5"), t("landing.pricing.tier.premium.features.6"), t("landing.pricing.tier.premium.features.7")], cta: t("landing.pricing.tier.premium.cta"), highlighted: true },
  ];
  const stats = [
    { value: "50K+", label: t("landing.stats.dailyProcessed") },
    { value: "89%", label: t("landing.stats.precision") },
    { value: "22", label: t("landing.stats.coverage") },
    { value: "<2s", label: t("landing.stats.responseTime") },
  ];
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header>
        <nav aria-label="Navigation principale" className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md h-[58px] flex items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="JeryMotro — accueil">
            <img src="/logo.png" alt="Logo JeryMotro" className="h-8 rounded" />
            <span className="font-heading font-bold text-base sm:text-lg hidden sm:block">JeryMotro</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.features")}</a>
              <a href="#coverage" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.coverage")}</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.pricing")}</a>
              <Link href="/map" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.map")}</Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.dashboard")}</Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.about")}</Link>
              <Link href="/cv" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CV</Link>
            </div>
            <div className="hidden md:block w-px h-5 bg-border" />
            <button onClick={toggleTheme} aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"} className="p-2 rounded-md hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="language-select" className="sr-only">Langue</label>
              <select id="language-select" value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-transparent text-xs sm:text-sm text-muted-foreground hover:text-foreground outline-none cursor-pointer max-w-[60px] sm:max-w-full">
                {Object.entries(LANG_LABELS).map(([key]) => <option key={key} value={key}>{key.toUpperCase()}</option>)}
              </select>
            </div>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">{t("auth.login.title")}</Link>
            <Link href="/register" className="text-sm bg-primary text-primary-foreground px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:opacity-90 transition-opacity font-medium">{t("auth.register.title")}</Link>
          </div>
        </nav>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="pt-[58px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center relative">
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6"><Zap className="w-3 h-3" /><span>{t("landing.tagline")}</span></div>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6" aria-label="Technologies et données utilisées">
              <span className="inline-flex items-center gap-1.5 text-xs bg-secondary/70 border border-border px-2.5 py-1 rounded-full text-muted-foreground"><span aria-hidden="true" className="text-base">🛰️</span> Données NASA FIRMS</span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-secondary/70 border border-border px-2.5 py-1 rounded-full text-muted-foreground"><span aria-hidden="true" className="text-base">🤖</span> XGBoost v2.1 — 89% de précision</span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-secondary/70 border border-border px-2.5 py-1 rounded-full text-muted-foreground"><span aria-hidden="true" className="text-base">🎓</span> Mémoire L3 Génie Logiciel 2026</span>
            </div>
            <h1 id="hero-title" className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">{t("landing.hero.title")}<br /><span className="text-primary">{t("landing.hero.subtitle")}</span></h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">{t("landing.hero.description")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/map" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"><Map className="w-4 h-4" aria-hidden="true" />{t("landing.hero.cta.map")}</Link>
              <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-card px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors"><Activity className="w-4 h-4" aria-hidden="true" />{t("landing.hero.cta.dashboard")}</Link>
            </div>
            <aside aria-label="Compte de démonstration" className="mt-6 inline-flex items-center gap-2 border border-border bg-card/80 px-4 py-2.5 rounded-lg text-sm"><span className="text-accent font-semibold">Demo :</span><code className="text-xs font-mono text-muted-foreground">demo@jerymotro.mg</code><span className="text-muted-foreground/50" aria-hidden="true">/</span><code className="text-xs font-mono text-muted-foreground">demo1234</code><Link href="/login" className="ml-1 text-xs text-primary hover:underline">Essayer →</Link></aside>
          </div>
          <figure className="max-w-5xl mx-auto px-4 sm:px-8 pb-20" aria-label="Aperçu du tableau de bord JeryMotro">
            <div className="rounded-xl border border-border overflow-hidden shadow-2xl bg-card">
              <div className="border-b border-border px-4 py-3 flex items-center gap-2 bg-secondary/30"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-destructive" /><span aria-hidden="true" className="w-3 h-3 rounded-full bg-[#f59e0b]" /><span aria-hidden="true" className="w-3 h-3 rounded-full bg-accent" /><span className="text-xs text-muted-foreground ml-2 font-mono truncate">jerymotro.duckdns.org</span></div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t("landing.mock.detectionsToday"), value: "127", sub: t("landing.mock.sub") },
                  { label: t("landing.mock.activeClusters"), value: "23", sub: t("landing.mock.sub.critical") },
                  { label: t("landing.mock.alertsSent"), value: "8", sub: t("landing.mock.sub.last24h") },
                  { label: t("landing.mock.precision"), value: "89%", sub: t("landing.mock.sub.xgboost") },
                ].map(s => <div key={s.label} className="bg-background/50 rounded-lg p-4 border border-border"><div className="font-heading text-2xl font-bold text-primary">{s.value}</div><div className="text-xs text-muted-foreground mt-1">{s.label}</div><div className="text-xs text-muted-foreground/70 mt-1">{s.sub}</div></div>)}
              </div>
            </div>
          </figure>
        </section>

        <section aria-labelledby="stats-title" className="border-y border-border bg-secondary/20 py-12">
          <div className="max-w-4xl mx-auto px-8"><h2 id="stats-title" className="sr-only">Indicateurs de la plateforme</h2><dl className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => <div key={s.label} className="text-center"><dt className="text-sm text-muted-foreground mt-1">{s.label}</dt><dd className="font-heading text-3xl font-bold text-primary order-first">{s.value}</dd></div>)}
          </dl></div>
        </section>

        <section id="features" aria-labelledby="features-title" className="max-w-5xl mx-auto px-8 py-24 scroll-mt-16">
          <div className="text-center mb-16"><h2 id="features-title" className="font-heading text-3xl font-bold mb-4">{t("landing.features.title")}</h2><p className="text-muted-foreground max-w-xl mx-auto">{t("landing.features.subtitle")}</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(f => { const Icon = f.icon; return <article key={f.title} className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-primary" aria-hidden="true" /></div><h3 className="font-heading font-semibold mb-2">{f.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p></article>; })}
          </div>
        </section>

        <section id="coverage" aria-labelledby="coverage-title" className="max-w-5xl mx-auto px-8 pb-24 scroll-mt-16">
          <article className="rounded-xl border border-border bg-card p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0"><Globe className="w-8 h-8 text-accent" aria-hidden="true" /></div>
            <div className="flex-1"><h2 id="coverage-title" className="font-heading text-xl font-bold mb-2">{t("landing.coverage.title")}</h2><p className="text-muted-foreground text-sm leading-relaxed">{t("landing.coverage.description")}</p></div>
            <div className="flex-shrink-0" aria-label="Niveaux de risque"><div className="flex items-center gap-3 text-sm"><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-destructive inline-block" /> {t("landing.coverage.legends.critical")}</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-primary inline-block" /> {t("landing.coverage.legends.high")}</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block" /> {t("landing.coverage.legends.medium")}</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-accent inline-block" /> {t("landing.coverage.legends.low")}</span></div></div>
          </article>
        </section>

        <section id="pricing" aria-labelledby="pricing-title" className="max-w-4xl mx-auto px-8 pb-24 scroll-mt-16">
          <div className="text-center mb-16"><h2 id="pricing-title" className="font-heading text-3xl font-bold mb-4">{t("landing.pricing.title")}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiers.map(tier => <article key={tier.name} className={`p-8 rounded-xl border ${tier.highlighted ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
              {tier.highlighted && <p className="inline-block text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded mb-4">{t("landing.pricing.recommended")}</p>}
              <div className="mb-6"><h3 className="font-heading text-xl font-bold">{tier.name}</h3><div className="flex items-end gap-1 mt-2"><span className="font-heading text-4xl font-bold">{tier.price}€</span><span className="text-muted-foreground mb-1">/mois</span></div><p className="text-sm text-muted-foreground mt-1">{tier.desc}</p></div>
              <ul className="space-y-3 mb-8">{tier.features.map(f => <li key={f} className="flex items-start gap-2 text-sm"><span className="text-accent mt-0.5" aria-hidden="true">✓</span><span>{f}</span></li>)}</ul>
              <Link href="/register" className={`block text-center py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${tier.highlighted ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>{tier.cta}</Link>
              {tier.highlighted && <p className="text-xs text-center text-muted-foreground mt-3">{t("landing.pricing.trialNote")}</p>}
            </article>)}
          </div>
        </section>
      </main>

      <footer id="about" className="border-t border-border bg-secondary/10 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <section aria-labelledby="footer-about-title"><div className="flex items-center gap-3 mb-4"><img src="/logo.png" alt="Logo JeryMotro" className="h-8 rounded" /><span id="footer-about-title" className="font-heading font-bold text-lg text-foreground">JeryMotro</span></div><p className="text-sm text-muted-foreground leading-relaxed">{t("landing.footer.about.desc")}</p></section>
            <nav aria-labelledby="footer-links-title"><h2 id="footer-links-title" className="font-heading font-semibold text-foreground mb-4">{t("landing.footer.links")}</h2><ul className="space-y-2 text-sm"><li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.features")}</a></li><li><a href="#coverage" className="text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.coverage")}</a></li><li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.pricing")}</a></li><li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">{t("auth.login.title")}</Link></li><li><Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">{t("auth.register.title")}</Link></li></ul></nav>
            <section aria-labelledby="footer-contact-title"><h2 id="footer-contact-title" className="font-heading font-semibold text-foreground mb-4">{t("landing.footer.contact")}</h2><address className="not-italic"><ul className="space-y-2 text-sm"><li className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" aria-hidden="true" /><a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="hover:text-foreground transition-colors">{t("landing.footer.contact.email")}</a></li><li className="text-muted-foreground">{t("landing.footer.data")}</li><li className="text-muted-foreground">{t("landing.footer.ai")}</li></ul></address></section>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground"><span>© 2026 JeryMotro — {t("landing.footer.surveillance")}</span><nav aria-label="Liens juridiques" className="flex items-center gap-4"><Link href="/about" className="hover:text-foreground cursor-pointer transition-colors">{t("landing.nav.about")}</Link><Link href="/cv" className="hover:text-foreground cursor-pointer transition-colors">{lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"}</Link><Link href="/legal" className="hover:text-foreground cursor-pointer transition-colors">{t("landing.footer.legal")}</Link><Link href="/privacy" className="hover:text-foreground cursor-pointer transition-colors">{t("landing.footer.privacy")}</Link></nav></div>
        </div>
      </footer>
    </div>
  );
}
