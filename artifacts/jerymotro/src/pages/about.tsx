import { Link } from "wouter";
import { ArrowLeft, Database, Brain, AlertCircle, Globe, Zap, FlaskConical, Github, Linkedin, Facebook, Mail } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { AppShell } from "@/components/layout/AppShell";

export default function AboutPage() {
  const { lang, t } = useI18n();

  const content = {
    fr: {
      title: "Méthodologie & Sources",
      subtitle: "Comment JeryMotro détecte, prédit et alerte sur les feux de brousse à Madagascar.",
      sections: [
        {
          icon: Database,
          title: "Sources de données — NASA FIRMS",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>
                JeryMotro s'appuie sur le système <strong className="text-foreground">NASA FIRMS</strong> (Fire Information for Resource Management System),
                qui agrège les détections de feux actifs issues de deux capteurs satellitaires :
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">MODIS</strong> (Moderate Resolution Imaging Spectroradiometer) — résolution 1 km, passage 2×/jour.</li>
                <li><strong className="text-foreground">VIIRS</strong> (Visible Infrared Imaging Radiometer Suite) — résolution 375 m, passage 2×/jour.</li>
              </ul>
              <p>
                Chaque détection est géolocalisée et inclut une mesure FRP (Fire Radiative Power, en MW) qui reflète l'intensité thermique de l'incendie.
                Les données sont actualisées toutes les heures environ.
              </p>
            </div>
          ),
        },
        {
          icon: Brain,
          title: "Modèle de prédiction — XGBoost v2.1",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>
                Le moteur de prédiction J+1 utilise un modèle <strong className="text-foreground">XGBoost</strong> entraîné sur :
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>3 ans de données FIRMS historiques pour Madagascar (2021–2024).</li>
                <li>Données météorologiques : température, humidité relative, vitesse du vent (sources ERA5/MERRA-2).</li>
                <li>Indice de végétation NDVI (capteur MODIS) pour évaluer la sécheresse de la biomasse.</li>
                <li>Classification d'occupation des sols (CORINE/ESA WorldCover).</li>
              </ul>
              <p>
                <strong className="text-foreground">Précision globale : 89%</strong> sur le jeu de test (validation croisée 5-fold).
                Cette précision varie selon la région et la saison. Elle est plus élevée pendant la saison sèche (avril–octobre).
              </p>
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500/80 text-xs">
                <strong>⚠️ Limite</strong> : les prédictions J+1 sont des estimations statistiques.
                Elles ne remplacent pas les observations terrain des agents de protection forestière.
              </div>
            </div>
          ),
        },
        {
          icon: Zap,
          title: "Pipeline de traitement",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>Le pipeline de traitement de JeryMotro fonctionne comme suit :</p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Récupération automatique des données FIRMS (API NASA) toutes les heures.</li>
                <li>Géocodage et rattachement de chaque détection à la région administrative concernée.</li>
                <li>Calcul du score de risque par le modèle XGBoost.</li>
                <li>Clustering géographique des détections proches.</li>
                <li>Déclenchement des alertes via n8n (Email, SMS via Twilio, WhatsApp via WAHA).</li>
              </ol>
              <p>Délai de traitement moyen : <strong className="text-foreground">&lt; 2 secondes</strong> par lot de détections.</p>
            </div>
          ),
        },
        {
          icon: FlaskConical,
          title: "Contexte académique",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              JeryMotro est un prototype développé dans le cadre d'un <strong className="text-foreground">mémoire de Licence (L3) en Génie Logiciel (2026)</strong>.
              Il démontre la faisabilité d'une plateforme de surveillance environnementale à faible coût pour les pays à ressources limitées,
              en combinant des données satellitaires open source, des algorithmes de machine learning, et une architecture cloud moderne (Symfony + PostgreSQL + n8n).
            </p>
          ),
        },
        {
          icon: AlertCircle,
          title: "Limites et avertissements",
          body: (
            <ul className="text-muted-foreground text-sm leading-relaxed list-disc list-inside space-y-2 pl-2">
              <li>Les détections peuvent inclure des <strong className="text-foreground">faux positifs</strong> (cultures brûlées intentionnellement, zones industrielles).</li>
              <li>La couverture nuageuse peut masquer des feux réels temporairement.</li>
              <li>Le délai entre l'allumage d'un feu et sa détection satellitaire est d'environ <strong className="text-foreground">1 à 3 heures</strong>.</li>
              <li>Les alertes SMS/WhatsApp dépendent de la disponibilité du réseau mobile local.</li>
            </ul>
          ),
        },
        {
          icon: Globe,
          title: "Contact & Open Source",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-2">
              <p>Pour toute question sur la méthodologie ou les données :</p>
              <p>
                <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">randriamanantenatsikynyantsa@gmail.com</a>
              </p>
              <p>Les données satellitaires utilisées sont publiées sous licence ouverte NASA. Les algorithmes de prédiction sont la propriété de l'équipe JeryMotro.</p>
            </div>
          ),
        },
      ],
    },
    mg: {
      title: "Fomba Fiasa sy Loharanon-angona",
      subtitle: "Ny fomba hahitan'ny JeryMotro, haminaniany ary hampandrenesany ny afo eto Madagasikara.",
      sections: [
        {
          icon: Database,
          title: "Loharanon-angona — NASA FIRMS",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>
                Ny JeryMotro dia miantehitra amin'ny <strong className="text-foreground">NASA FIRMS</strong>, izay manangona ny fahitana afo avy amin'ny sensor roa sateraita :
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">MODIS</strong> — fahamatorana 1 km, mandalo 2×/andro.</li>
                <li><strong className="text-foreground">VIIRS</strong> — fahamatorana 375 m, mandalo 2×/andro.</li>
              </ul>
              <p>Ny angona dia havaozina isaky ny adiny iray eo ho eo.</p>
            </div>
          ),
        },
        {
          icon: Brain,
          title: "Modely Faminaniana — XGBoost v2.1",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>
                Ny faminaniana J+1 dia mampiasa modely <strong className="text-foreground">XGBoost</strong> nampiofina tamin'ny angona 3 taona FIRMS
                ho an'i Madagasikara (2021–2024), angona toetr'andro, NDVI, ary fanasokajiana ny tany.
              </p>
              <p><strong className="text-foreground">Fahamarinan'ny ankapobeny: 89%</strong>.</p>
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500/80 text-xs">
                <strong>⚠️ Fetra</strong>: Ny faminaniana dia tsy novaliana ny fanarahamaso any an-tsaha.
              </div>
            </div>
          ),
        },
        {
          icon: FlaskConical,
          title: "Toe-karena Akademika",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ny JeryMotro dia prototype naorina ho an'ny <strong className="text-foreground">rakitsambatra L3 Génie Logiciel (2026)</strong>.
              Maneho ny fahafahana manao sehatra fanaraha-maso ny tontolo iainana amin'ny vidin'ny ambany,
              amin'ny fampiasana angon-drakitra open source sy ML.
            </p>
          ),
        },
        {
          icon: Globe,
          title: "Fifandraisana",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Fanontaniana momba ny fomba fiasa:{" "}
              <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">randriamanantenatsikynyantsa@gmail.com</a>.
            </p>
          ),
        },
      ],
    },
    en: {
      title: "Methodology & Data Sources",
      subtitle: "How JeryMotro detects, predicts and alerts on wildfires across Madagascar.",
      sections: [
        {
          icon: Database,
          title: "Data Sources — NASA FIRMS",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>
                JeryMotro relies on <strong className="text-foreground">NASA FIRMS</strong> (Fire Information for Resource Management System),
                aggregating active fire detections from two satellite sensors:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">MODIS</strong> — 1 km resolution, passes 2×/day.</li>
                <li><strong className="text-foreground">VIIRS</strong> — 375 m resolution, passes 2×/day.</li>
              </ul>
              <p>Data is refreshed approximately every hour.</p>
            </div>
          ),
        },
        {
          icon: Brain,
          title: "Prediction Model — XGBoost v2.1",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>
                The J+1 prediction engine uses an <strong className="text-foreground">XGBoost</strong> model trained on
                3 years of FIRMS historical data for Madagascar (2021–2024), weather data, NDVI, and land classification.
              </p>
              <p><strong className="text-foreground">Overall accuracy: 89%</strong> on the test set (5-fold cross-validation).</p>
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500/80 text-xs">
                <strong>⚠️ Limitation</strong>: Predictions are statistical estimates and do not replace on-ground observations.
              </div>
            </div>
          ),
        },
        {
          icon: Zap,
          title: "Processing Pipeline",
          body: (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Hourly automated retrieval from NASA FIRMS API.</li>
                <li>Geocoding and matching each detection to an administrative region.</li>
                <li>Risk score computation by XGBoost model.</li>
                <li>Geographic clustering of nearby detections.</li>
                <li>Alert dispatching via n8n (Email, SMS via Twilio, WhatsApp via WAHA).</li>
              </ol>
              <p>Average processing delay: <strong className="text-foreground">&lt; 2 seconds</strong> per detection batch.</p>
            </div>
          ),
        },
        {
          icon: FlaskConical,
          title: "Academic Context",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              JeryMotro is a prototype developed as part of a <strong className="text-foreground">Bachelor's thesis (L3) in Software Engineering (2026)</strong>.
              It demonstrates the feasibility of a low-cost environmental monitoring platform using open satellite data and modern ML techniques.
            </p>
          ),
        },
        {
          icon: AlertCircle,
          title: "Limitations & Warnings",
          body: (
            <ul className="text-muted-foreground text-sm leading-relaxed list-disc list-inside space-y-2 pl-2">
              <li>Detections may include <strong className="text-foreground">false positives</strong> (intentional burning, industrial areas).</li>
              <li>Cloud cover can temporarily mask real fires.</li>
              <li>Delay between ignition and satellite detection: approximately <strong className="text-foreground">1–3 hours</strong>.</li>
              <li>SMS/WhatsApp alerts depend on local mobile network availability.</li>
            </ul>
          ),
        },
        {
          icon: Globe,
          title: "Contact & Open Source",
          body: (
            <p className="text-muted-foreground text-sm leading-relaxed">
              For methodology or data questions:{" "}
              <a href="mailto:randriamanantenatsikynyantsa@gmail.com" className="text-primary hover:underline">randriamanantenatsikynyantsa@gmail.com</a>.
            </p>
          ),
        },
      ],
    },
  };

  const activeContent = content[lang as "fr" | "mg" | "en"] || content.fr;

  return (
    <AppShell isPublic>
      <div className="min-h-[calc(100vh-4rem)] bg-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t("common.back")}
            </Link>

            {/* NASA FIRMS badge */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full">
                🛰️ Données NASA FIRMS
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 rounded-full">
                🤖 XGBoost v2.1
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-secondary border border-border text-muted-foreground px-2.5 py-1 rounded-full">
                🎓 Mémoire L3 Génie Logiciel 2026
              </span>
            </div>

            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground mb-4">
              {activeContent.title}
            </h1>
            <p className="text-muted-foreground text-lg">{activeContent.subtitle}</p>
          </div>

          <div className="space-y-8">
            {activeContent.sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border/60 rounded-xl p-6 shadow-md backdrop-blur-md transition-all hover:border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-heading text-xl font-semibold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  {section.body}
                </div>
              );
            })}

            {/* Developer profile section */}
            <div className="bg-card border border-primary/20 rounded-xl p-6 shadow-lg backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <h2 className="font-heading text-xl font-bold text-foreground mb-6 pb-2 border-b border-border/60">
                {lang === "mg" ? "Mpamorona ny Tetikasa" : lang === "en" ? "About the Developer" : "À propos du développeur"}
              </h2>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md flex-shrink-0">
                  <img
                    src="/profil.jpg"
                    alt="RANDRIAMANANTENA Tsiky Ny Antsa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback image if profil.jpg is not found
                      e.currentTarget.src = "https://ibb.co/yBVMw3n0";
                    }}
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    RANDIAMANANTENA Tsiky Ny Antsa
                  </h3>
                  <p className="text-primary text-sm font-semibold mb-3">
                    {lang === "mg"
                      ? "Mpianatra Génie Logiciel L2 — Oniversiten'i Vakinakaratra"
                      : lang === "en"
                        ? "L2 Software Engineering Student — University of Vakinakaratra"
                        : "Étudiant L2 Génie Logiciel — Université de Vakinakaratra"}
                  </p>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {lang === "mg"
                      ? "Mpianatra amin'ny taona faharoa, liana sy mankafy ny matematika ampiharina, ny cryptographie ary ny intelligence artificielle. Mpamorona sy mpampiasa fototra ny JeryMotro."
                      : lang === "en"
                        ? "Second-year student passionate about applied mathematics, cryptography, and artificial intelligence. Creator and lead developer of the JeryMotro platform."
                        : "Étudiant de deuxième année, passionné par les mathématiques appliquées, la cryptographie et l'intelligence artificielle. Concepteur et développeur principal de la plateforme JeryMotro."}
                  </p>

                  {/* Social and Contact Links */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <a
                      href="mailto:randriamanantenatsikynyantsa@gmail.com"
                      className="inline-flex items-center gap-2 bg-secondary border border-border text-foreground hover:bg-primary hover:text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                      title="Envoyer un e-mail"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>

                    <a
                      href="https://github.com/TkAbeleon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-secondary border border-border text-foreground hover:bg-foreground hover:text-background text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>

                    <a
                      href="https://www.linkedin.com/in/tsiky-ny-antsa-randriamanantena-7451b328a/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-secondary border border-border text-foreground hover:bg-blue-600 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>

                    <a
                      href="https://www.facebook.com/abeleon.tk/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-secondary border border-border text-foreground hover:bg-blue-700 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
