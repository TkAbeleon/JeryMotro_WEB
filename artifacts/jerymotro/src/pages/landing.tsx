import { Link } from "wouter";
import { Flame, Activity, Brain, Bell, Shield, ChevronRight, Map, BarChart3, Bot, Zap, Globe } from "lucide-react";

const features = [
  { icon: Activity, title: "Détections Live FIRMS", desc: "Données MODIS & VIIRS en temps réel, mise à jour toutes les heures depuis les satellites NASA." },
  { icon: Brain, title: "Prédictions XGBoost", desc: "Modèle ML entraîné sur 3 ans de données pour anticiper les risques incendie J+1 avec 89% de précision." },
  { icon: Bot, title: "JeryMotro AI", desc: "Assistant RAG entraîné sur les données feux malgaches. Posez vos questions en langage naturel." },
  { icon: Bell, title: "Alertes Multi-Canal", desc: "Notifications email, SMS et WhatsApp dès qu'un feu critique est détecté dans votre zone." },
  { icon: Map, title: "Cartographie Avancée", desc: "Visualisation interactive des clusters, zones de risque, et historique géospatial." },
  { icon: Shield, title: "Zones Prioritaires", desc: "Définissez vos zones sensibles et recevez des alertes hyper-ciblées (Premium)." },
];

const tiers = [
  {
    name: "Gratuit",
    price: "0",
    desc: "Pour découvrir la plateforme",
    features: ["Détections en temps réel", "Carte interactive", "Clusters FireEvents", "Statistiques 30 jours", "1 alerte email"],
    cta: "Commencer",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "29",
    desc: "Pour les professionnels",
    features: ["Tout le niveau Gratuit", "Prédictions J+1", "JeryMotro AI illimité", "Alertes SMS & WhatsApp", "Zones prioritaires illimitées", "Export données CSV", "Support prioritaire"],
    cta: "Essai gratuit 14j",
    highlighted: true,
  },
];

const stats = [
  { value: "50K+", label: "Détections traitées/jour" },
  { value: "89%", label: "Précision XGBoost" },
  { value: "22", label: "Régions couvertes" },
  { value: "<2s", label: "Temps de réponse AI" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md h-[58px] flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="JeryMotro" className="h-8 rounded" />
          <span className="font-heading font-bold text-base sm:text-lg">JeryMotro</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Se connecter</Link>
          <Link href="/register" className="text-sm bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md hover:opacity-90 transition-opacity font-medium">
            Commencer
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
            <span>Plateforme de surveillance en temps réel</span>
          </div>
          
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Surveillance des feux<br />
            <span className="text-primary">de brousse à Madagascar</span>
          </h1>
          
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            JeryMotro agrège les données satellites FIRMS, applique des modèles ML avancés 
            et vous alerte en temps réel pour protéger les forêts malgaches.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Démarrer gratuitement
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors">
              Se connecter
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
                { label: "Détections aujourd'hui", value: "127", color: "text-primary", sub: "+12% vs hier" },
                { label: "Clusters actifs", value: "23", color: "text-destructive", sub: "8 critiques" },
                { label: "Alertes envoyées", value: "8", color: "text-[#f59e0b]", sub: "dernières 24h" },
                { label: "Précision IA", value: "89%", color: "text-accent", sub: "XGBoost v2.1" },
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
          <h2 className="font-heading text-3xl font-bold mb-4">Une plateforme complète</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">De la détection satellite à l'alerte sur votre téléphone, en passant par l'analyse IA.</p>
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
            <h3 className="font-heading text-xl font-bold mb-2">Couverture complète de Madagascar</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La plateforme surveille l'ensemble des 22 régions de Madagascar grâce aux satellites MODIS Terra/Aqua et VIIRS Suomi-NPP. 
              Chaque détection est enrichie avec données météo, NDVI, et classification de couverture terrestre.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive inline-block" /> Critique</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Élevé</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block" /> Moyen</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent inline-block" /> Bas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold mb-4">Plans simples et transparents</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map(tier => (
            <div key={tier.name} className={`p-8 rounded-xl border ${tier.highlighted ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
              {tier.highlighted && (
                <div className="inline-block text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded mb-4">RECOMMANDÉ</div>
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
            <span>— Surveillance feux Madagascar</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Données: NASA FIRMS</span>
            <span>IA: XGBoost + RAG</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
