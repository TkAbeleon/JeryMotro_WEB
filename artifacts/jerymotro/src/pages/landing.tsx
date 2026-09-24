import { Link } from "wouter";
import { useState } from "react";
import { Flame, Activity, Brain, Bell, Shield, ChevronRight, Map, Bot, Zap, Globe, Sun, Moon, Languages, Mail, Menu, X } from "lucide-react";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const features = [
    { icon: Activity, title: t("landing.features.1.title"), desc: t("landing.features.1.desc") },
    { icon: Brain, title: t("landing.features.2.title"), desc: t("landing.features.2.desc") },
    { icon: Bot, title: t("landing.features.3.title"), desc: t("landing.features.3.desc") },
    { icon: Bell, title: t("landing.features.4.title"), desc: t("landing.features.4.desc") },
    { icon: Map, title: t("landing.features.5.title"), desc: t("landing.features.5.desc") },
    { icon: Shield, title: t("landing.features.6.title"), desc: t("landing.features.6.desc") },
  ];
  const stats = [
    { value: "50K+", label: t("landing.stats.dailyProcessed") },
    { value: "89%", label: t("landing.stats.precision") },
    { value: "22", label: t("landing.stats.coverage") },
    { value: "<2s", label: t("landing.stats.responseTime") },
  ];
  const { theme, toggleTheme } = useTheme();
  const workflowSteps = lang === "mg" ? [
    { icon: Activity, title: "Angona", desc: "Angona avy amin'ny zanabolana sy loharano azo itokisana." },
    { icon: Brain, title: "Famakafakana", desc: "Ny modely ML dia manampy amin'ny fanombanana ny loza." },
    { icon: Map, title: "Fanamarihana", desc: "Ny fahitana dia apetraka amin'ny sarintany mba ho mora vakiana." },
    { icon: Bell, title: "Fampandrenesana", desc: "Ny rafitra dia manomana fampandrenesana amin'ny toe-javatra voafantina." },
  ] : lang === "en" ? [
    { icon: Activity, title: "Collect", desc: "Satellite detections and trusted environmental data are gathered." },
    { icon: Brain, title: "Analyze", desc: "ML models help estimate the level of wildfire risk." },
    { icon: Map, title: "Visualize", desc: "Signals are placed on the map so they can be understood quickly." },
    { icon: Bell, title: "Alert", desc: "Configured notifications can surface the events that matter." },
  ] : [
    { icon: Activity, title: "Collecter", desc: "Les détections satellites et données environnementales sont centralisées." },
    { icon: Brain, title: "Analyser", desc: "Les modèles ML aident à estimer le niveau de risque des feux." },
    { icon: Map, title: "Visualiser", desc: "Les signaux sont placés sur la carte pour une lecture rapide." },
    { icon: Bell, title: "Alerter", desc: "Les notifications configurées mettent en avant les événements importants." },
  ];
  const audienceCards = lang === "mg" ? [
    { icon: Map, title: "Mpandinika terrain", desc: "Mahita haingana ireo fahitana sy faritra mila fanaraha-maso." },
    { icon: Brain, title: "Mpandinika data", desc: "Mampitaha famantarana, risika ary fironana ao amin'ny sehatra iray." },
    { icon: Shield, title: "Fikambanana", desc: "Mametraka fanaraha-maso sy fampandrenesana mifanaraka amin'ny filàna." },
  ] : lang === "en" ? [
    { icon: Map, title: "Field observers", desc: "See detections and priority areas quickly from one interface." },
    { icon: Brain, title: "Data analysts", desc: "Compare signals, risk levels and trends without losing context." },
    { icon: Shield, title: "Organizations", desc: "Set up monitoring and notifications around operational needs." },
  ] : [
    { icon: Map, title: "Observateurs terrain", desc: "Consultez rapidement les détections et les zones à surveiller." },
    { icon: Brain, title: "Analystes data", desc: "Comparez signaux, niveaux de risque et tendances au même endroit." },
    { icon: Shield, title: "Organisations", desc: "Configurez une surveillance et des notifications adaptées à vos besoins." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header>
        <nav aria-label="Navigation principale" className="jm-landing-nav fixed top-0 left-0 right-0 z-50 h-[64px] flex items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="JeryMotro — accueil">
            <img src="/logo.png" alt="Logo JeryMotro" className="h-8 rounded" />
            <span className="font-heading font-bold text-base sm:text-lg hidden sm:block">JeryMotro</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.features")}</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{lang === "mg" ? "Fomba fiasa" : lang === "en" ? "How it works" : "Fonctionnement"}</a><a href="#coverage" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.coverage")}</a>
              <a href="#access" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{(lang === "mg" ? "Fidirana" : lang === "en" ? "Access" : "Accès")}</a>
              <Link href="/map" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.map")}</Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.dashboard")}</Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.about")}</Link>
              <Link href="/cv" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CV</Link>
            </div>
            <div className="hidden md:block w-px h-5 bg-border" />
            <button onClick={toggleTheme} aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"} className="jm-landing-icon-button flex h-11 w-11 items-center justify-center rounded-2xl transition-colors">
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
            <Link href="/register" className="jm-landing-primary-button inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 sm:px-5 py-2.5 text-sm font-semibold text-primary-foreground">{t("auth.register.title")}</Link>
            <button
              type="button"
              aria-label={mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(v => !v)}
              className="jm-public-menu-trigger flex h-11 w-11 items-center justify-center rounded-2xl md:hidden"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        {mobileNavOpen && (
          <div className="jm-public-mobile-menu fixed left-3 right-3 top-[72px] z-40 md:hidden" role="dialog" aria-label="Navigation mobile">
            <nav className="grid gap-2 p-3">
              <a href="#features" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">{t("landing.nav.features")}</a>
              <a href="#how-it-works" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">{lang === "mg" ? "Fomba fiasa" : lang === "en" ? "How it works" : "Fonctionnement"}</a>
              <a href="#coverage" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">{t("landing.nav.coverage")}</a>
              <a href="#access" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">{lang === "mg" ? "Fidirana" : lang === "en" ? "Access" : "Accès"}</a>
              <Link href="/map" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">{t("nav.map")}</Link>
              <Link href="/dashboard" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">{t("nav.dashboard")}</Link>
              <Link href="/about" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">{t("landing.nav.about")}</Link>
              <Link href="/cv" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">CV</Link>
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="jm-public-mobile-action inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground"><span>{t("auth.login.title")}</span></Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section aria-labelledby="hero-title" className="jm-landing-hero relative overflow-hidden pt-[64px]">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center relative sm:px-8 sm:pb-20 sm:pt-20">
            <div className="jm-landing-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-primary mb-7"><Zap className="w-3 h-3" /><span>{t("landing.tagline")}</span></div>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6" aria-label="Technologies et données utilisées">
              <span className="jm-landing-pill inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-2 text-muted-foreground"><span aria-hidden="true" className="text-base">🛰️</span> Données NASA FIRMS</span>
              <span className="jm-landing-pill inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-2 text-muted-foreground"><span aria-hidden="true" className="text-base">🤖</span> XGBoost v2.1 — 89% de précision</span>
              <span className="jm-landing-pill inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-2 text-muted-foreground"><span aria-hidden="true" className="text-base">🎓</span> Mémoire L3 Génie Logiciel 2026</span>
            </div>
            <h1 id="hero-title" className="mx-auto max-w-5xl font-heading text-4xl font-bold leading-[1.05] tracking-tight mb-6 sm:text-5xl md:text-6xl lg:text-7xl">{t("landing.hero.title")}<br /><span className="text-primary">{t("landing.hero.subtitle")}</span></h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">{t("landing.hero.description")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/map" className="jm-landing-primary-button w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-3.5 font-semibold"><Map className="w-4 h-4" aria-hidden="true" />{t("landing.hero.cta.map")}</Link>
              <Link href="/dashboard" className="jm-landing-secondary-button w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-semibold"><Activity className="w-4 h-4" aria-hidden="true" />{t("landing.hero.cta.dashboard")}</Link>
            </div>
            <aside aria-label="Compte de démonstration" className="jm-landing-inset mt-7 inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"><span className="text-accent font-semibold">Demo :</span><code className="text-xs font-mono text-muted-foreground">demo@jerymotro.mg</code><span className="text-muted-foreground/50" aria-hidden="true">/</span><code className="text-xs font-mono text-muted-foreground">demo1234</code><Link href="/login" className="ml-1 text-xs text-primary hover:underline">Essayer →</Link></aside>
          </div>
          <figure className="max-w-5xl mx-auto px-4 sm:px-8 pb-20" aria-label="Aperçu du tableau de bord JeryMotro">
            <div className="jm-landing-preview overflow-hidden">
              <div className="jm-landing-preview-bar px-4 py-3 flex items-center gap-2"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-destructive" /><span aria-hidden="true" className="w-3 h-3 rounded-full bg-[#f59e0b]" /><span aria-hidden="true" className="w-3 h-3 rounded-full bg-accent" /><span className="text-xs text-muted-foreground ml-2 font-mono truncate">jerymotro.duckdns.org</span></div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:p-6 md:gap-5">
                {[
                  { label: t("landing.mock.detectionsToday"), value: "127", sub: t("landing.mock.sub") },
                  { label: t("landing.mock.activeClusters"), value: "23", sub: t("landing.mock.sub.critical") },
                  { label: t("landing.mock.alertsSent"), value: "8", sub: t("landing.mock.sub.last24h") },
                  { label: t("landing.mock.precision"), value: "89%", sub: t("landing.mock.sub.xgboost") },
                ].map(s => <div key={s.label} className="jm-landing-mini-card p-4 sm:p-5"><div className="font-heading text-2xl font-bold text-primary">{s.value}</div><div className="text-xs text-muted-foreground mt-1">{s.label}</div><div className="text-xs text-muted-foreground/70 mt-1">{s.sub}</div></div>)}
              </div>
            </div>
          </figure>
        </section>

        <section aria-labelledby="stats-title" className="jm-landing-stat-strip py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-8"><h2 id="stats-title" className="sr-only">Indicateurs de la plateforme</h2><dl className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => <div key={s.label} className="text-center"><dt className="text-sm text-muted-foreground mt-1">{s.label}</dt><dd className="font-heading text-3xl font-bold text-primary order-first">{s.value}</dd></div>)}
          </dl></div>
        </section>

        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-20 scroll-mt-16 sm:px-8 sm:py-24">
          <div className="text-center mb-16"><h2 id="features-title" className="font-heading text-3xl font-bold mb-4">{t("landing.features.title")}</h2><p className="text-muted-foreground max-w-xl mx-auto">{t("landing.features.subtitle")}</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(f => { const Icon = f.icon; return <article key={f.title} className="jm-landing-card p-5 sm:p-6"><div className="jm-landing-icon-well mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"><Icon className="w-5 h-5 text-primary" aria-hidden="true" /></div><h3 className="font-heading font-semibold mb-2">{f.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p></article>; })}
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="workflow-title" className="jm-landing-section scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
            <div className="mb-12 max-w-2xl">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{lang === "mg" ? "Fomba tsotra" : lang === "en" ? "Simple workflow" : "Un parcours simple"}</span>
              <h2 id="workflow-title" className="mt-2 font-heading text-3xl font-bold tracking-tight">{lang === "mg" ? "Avy amin'ny fahitana ka hatramin'ny fanapahan-kevitra" : lang === "en" ? "From detection to decision" : "De la détection à la décision"}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{lang === "mg" ? "JeryMotro dia mampifandray ny angona, ny famakafakana ary ny fanaraha-maso ao anatin'ny workflow tokana." : lang === "en" ? "JeryMotro connects data, analysis and monitoring in one operational workflow." : "JeryMotro relie les données, l’analyse et la surveillance dans un seul parcours opérationnel."}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map((step, index) => { const Icon = step.icon; return <article key={step.title} className="jm-landing-card relative p-5 sm:p-6">
                <div className="flex items-center justify-between"><div className="jm-landing-icon-well flex h-10 w-10 items-center justify-center rounded-2xl text-primary"><Icon className="h-5 w-5" /></div><span className="font-heading text-2xl font-bold text-muted-foreground/25">{String(index + 1).padStart(2, "0")}</span></div>
                <h3 className="mt-5 font-heading font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
                {index < workflowSteps.length - 1 ? <ChevronRight className="absolute -right-2 top-9 z-10 hidden h-4 w-4 rounded-full bg-background text-muted-foreground xl:block" aria-hidden="true" /> : null}
              </article>; })}
            </div>
          </div>
        </section>

        <section id="coverage" aria-labelledby="coverage-title" className="max-w-5xl mx-auto px-4 pb-24 scroll-mt-16 sm:px-8">
          <article className="jm-landing-card p-6 flex flex-col md:flex-row items-center gap-8 sm:p-8">
            <div className="jm-landing-icon-well flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl"><Globe className="w-8 h-8 text-accent" aria-hidden="true" /></div>
            <div className="flex-1"><h2 id="coverage-title" className="font-heading text-xl font-bold mb-2">{t("landing.coverage.title")}</h2><p className="text-muted-foreground text-sm leading-relaxed">{t("landing.coverage.description")}</p></div>
            <div className="flex-shrink-0" aria-label="Niveaux de risque"><div className="flex items-center gap-3 text-sm"><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-destructive inline-block" /> {t("landing.coverage.legends.critical")}</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-primary inline-block" /> {t("landing.coverage.legends.high")}</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block" /> {t("landing.coverage.legends.medium")}</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-accent inline-block" /> {t("landing.coverage.legends.low")}</span></div></div>
          </article>
        </section>

        <section aria-labelledby="audience-title" className="mx-auto max-w-6xl px-4 pb-20 scroll-mt-16 sm:px-8 sm:pb-24">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{lang === "mg" ? "Ho an'iza" : lang === "en" ? "Built for" : "Pensé pour"}</span>
              <h2 id="audience-title" className="mt-2 font-heading text-3xl font-bold tracking-tight">{lang === "mg" ? "Fampiasana samihafa, sehatra iray" : lang === "en" ? "Different users, one platform" : "Des usages différents, une même plateforme"}</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{lang === "mg" ? "Hanomboka" : lang === "en" ? "Get started" : "Commencer"} <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {audienceCards.map(card => { const Icon = card.icon; return <article key={card.title} className="jm-landing-card p-5 sm:p-6">
              <div className="jm-landing-icon-well flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-heading font-semibold">{card.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{card.desc}</p>
            </article>; })}
          </div>
        </section>

        <section id="access" aria-labelledby="access-title" className="mx-auto max-w-5xl px-4 pb-20 scroll-mt-16 sm:px-8 sm:pb-24">
          <div className="jm-landing-featured-card p-6 sm:p-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{lang === "mg" ? "Fidirana miitatra" : lang === "en" ? "Extended access" : "Accès étendu"}</span>
              <h2 id="access-title" className="mt-2 font-heading text-3xl font-bold">{lang === "mg" ? "Fidirana mifanaraka amin'ny filànao" : lang === "en" ? "Access adapted to your needs" : "Un accès adapté à vos besoins"}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{lang === "mg" ? "Ny kaonty Standard dia ahafahanao mahita ny sehatra. Ho an'ny fampiasana miasa na andrim-panjakana, mandefasa fangatahana mba ho dinihin'ny mpitantana." : lang === "en" ? "A Standard account lets you discover the platform. For operational or institutional use, submit a request for an administrator to review." : "Le compte Standard permet de découvrir la plateforme. Pour un usage opérationnel ou institutionnel, envoyez une demande à un administrateur."}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="jm-landing-secondary-button inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold">{lang === "mg" ? "Mamorona kaonty Standard" : lang === "en" ? "Create a Standard account" : "Créer un compte Standard"}</Link>
                <Link href="/login" className="jm-landing-primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{lang === "mg" ? "Efa manana kaonty" : lang === "en" ? "I already have an account" : "J’ai déjà un compte"} <ChevronRight className="h-4 w-4"/></Link>
              </div>
            </div>
            <div className="mt-7 grid gap-3 border-t border-primary/15 pt-6 sm:grid-cols-3">
              {[lang === "mg" ? "Mandefa fangatahana" : lang === "en" ? "Submit a request" : "Envoyer une demande", lang === "mg" ? "Dinihin'ny admin" : lang === "en" ? "Administrative review" : "Examen administratif", lang === "mg" ? "Fidirana miitatra" : lang === "en" ? "Extended access" : "Accès étendu"].map((label,index)=><div key={label} className="jm-landing-mini-card p-4"><div className="text-xs font-bold text-primary">0{index+1}</div><div className="mt-2 text-sm font-semibold">{label}</div></div>)}
            </div>
          </div>
        </section>

        <section aria-labelledby="final-cta-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 sm:pb-24">
          <div className="jm-landing-featured-card relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{lang === "mg" ? "Vonona hijery" : lang === "en" ? "Ready to explore" : "Prêt à explorer"}</div>
                <h2 id="final-cta-title" className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{lang === "mg" ? "Jereo ny zava-misy, avy eo raiso ny fepetra." : lang === "en" ? "See the situation clearly, then act." : "Voir la situation clairement, puis agir."}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{lang === "mg" ? "Midira amin'ny sarintany ary fantaro ny fomba fiasan'ny JeryMotro." : lang === "en" ? "Open the map and explore how JeryMotro can support your monitoring workflow." : "Ouvrez la carte et découvrez comment JeryMotro peut soutenir votre surveillance."}</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Link href="/map" className="jm-landing-primary-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{lang === "mg" ? "Hijery ny sarintany" : lang === "en" ? "Open live map" : "Ouvrir la carte"} <Map className="h-4 w-4" /></Link>
                <Link href="/register" className="jm-landing-secondary-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">{lang === "mg" ? "Misoratra anarana" : lang === "en" ? "Create account" : "Créer un compte"}</Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer id="about" className="jm-landing-footer scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            <section aria-labelledby="footer-about-title"><div className="flex items-center gap-3 mb-4"><img src="/logo.png" alt="Logo JeryMotro" className="h-8 rounded" /><span id="footer-about-title" className="font-heading font-bold text-lg text-foreground">JeryMotro</span></div><p className="text-sm text-muted-foreground leading-relaxed">{t("landing.footer.about.desc")}</p></section>
            <nav aria-labelledby="footer-links-title"><h2 id="footer-links-title" className="font-heading font-semibold text-foreground mb-4">{t("landing.footer.links")}</h2><ul className="space-y-2 text-sm"><li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.features")}</a></li><li><a href="#coverage" className="text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.coverage")}</a></li><li><a href="#access" className="text-muted-foreground hover:text-foreground transition-colors">{(lang === "mg" ? "Fidirana" : lang === "en" ? "Access" : "Accès")}</a></li><li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">{t("auth.login.title")}</Link></li><li><Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">{t("auth.register.title")}</Link></li></ul></nav>
            <section aria-labelledby="footer-contact-title"><h2 id="footer-contact-title" className="font-heading font-semibold text-foreground mb-4">{t("landing.footer.contact")}</h2><address className="not-italic"><ul className="space-y-2 text-sm"><li className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" aria-hidden="true" /><a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="hover:text-foreground transition-colors">{t("landing.footer.contact.email")}</a></li><li className="text-muted-foreground">{t("landing.footer.data")}</li><li className="text-muted-foreground">{t("landing.footer.ai")}</li></ul></address></section>
          </div>
          <div className="mt-10 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground"><span>© 2026 JeryMotro — {t("landing.footer.surveillance")}</span><nav aria-label="Liens juridiques" className="flex items-center gap-4"><Link href="/about" className="hover:text-foreground cursor-pointer transition-colors">{t("landing.nav.about")}</Link><Link href="/cv" className="hover:text-foreground cursor-pointer transition-colors">{lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"}</Link><Link href="/legal" className="hover:text-foreground cursor-pointer transition-colors">{t("landing.footer.legal")}</Link><Link href="/privacy" className="hover:text-foreground cursor-pointer transition-colors">{t("landing.footer.privacy")}</Link></nav></div>
        </div>
      </footer>
    </div>
  );
}
