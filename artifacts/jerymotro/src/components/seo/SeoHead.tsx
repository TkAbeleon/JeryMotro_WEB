/**
 * SeoHead.tsx
 *
 * Composant purement additif — injecte les balises <head> SEO pour les pages
 * PUBLIQUES uniquement (/  /login  /register).
 *
 * Utilise la fonctionnalité native de hoisting de React 19 (pas besoin de react-helmet-async).
 *
 * Balises injectées et hissées dans le <head> :
 *   <title>  <meta description>  <link canonical>
 *   og:*         twitter:*  <link hreflang> (fr / mg / en / x-default)
 *
 * Pour ajouter une route publique :
 *   1. Ajoutez le path dans PUBLIC_ROUTES_SET
 *   2. Ajoutez les traductions SEO dans SEO_DATA pour chaque langue
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/hooks/use-i18n';
import type { Lang } from '@/lib/i18n';

// ─── Configuration ──────────────────────────────────────────────────────────

/** URL de base du site — remplacer par la valeur de prod */
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://jerymotro.duckdns.org';

/** Image Open Graph partagée (placez /public/og-image.png dans le projet) */
const OG_IMAGE = `${SITE_URL}/og-image.png`;

/** Routes publiques qui bénéficient du prerendering SEO */
const PUBLIC_ROUTES_SET = new Set([
  '/', '/login', '/register', '/map', '/dashboard', '/about', '/legal', '/privacy', '/cv'
]);

/** Codes BCP-47 pour les balises hreflang */
const LANG_BCP47: Record<Lang, string> = {
  fr: 'fr-MG',
  mg: 'mg',
  en: 'en',
};

// ─── Données SEO par langue × route ─────────────────────────────────────────

type SeoConfig = {
  title:       string;
  description: string;
};

const SEO_DATA: Record<Lang, Record<string, SeoConfig>> = {

  fr: {
    '/': {
      title:       'JeryMotro — Surveillance des feux de brousse à Madagascar en temps réel',
      description: 'JeryMotro agrège les données satellites NASA FIRMS, applique des modèles ML XGBoost et vous alerte en temps réel sur les feux de brousse à Madagascar. Couverture des 22 régions.',
    },
    '/login': {
      title:       'Connexion — JeryMotro',
      description: 'Connectez-vous à votre compte JeryMotro pour accéder à la surveillance satellite en temps réel des feux de brousse à Madagascar.',
    },
    '/register': {
      title:       'Créer un compte — JeryMotro',
      description: 'Créez votre compte JeryMotro gratuitement. Surveillez les feux de brousse à Madagascar, recevez des alertes Email/SMS/WhatsApp et exploitez les prédictions XGBoost.',
    },
    '/map': {
      title:       'Carte des feux en temps réel — JeryMotro',
      description: 'Carte interactive des feux de brousse à Madagascar. Détections MODIS/VIIRS en temps réel, clustering par région, filtrage par niveau de risque.',
    },
    '/dashboard': {
      title:       'Tableau de bord — JeryMotro',
      description: 'Statistiques et analyses des feux de brousse à Madagascar : détections, clusters actifs, alertes envoyées, précision IA XGBoost 89%.',
    },
    '/about': {
      title:       'Méthodologie & Sources — JeryMotro',
      description: 'Sources de données NASA FIRMS, modèle XGBoost v2.1, pipeline de traitement et limites de la plateforme de surveillance JeryMotro.',
    },
    '/legal': {
      title:       'Mentions légales — JeryMotro',
      description: 'Informations réglementaires et éditeur de la plateforme de surveillance des feux JeryMotro.',
    },
    '/privacy': {
      title:       'Politique de confidentialité — JeryMotro',
      description: 'Comment JeryMotro collecte, traite et protège vos données personnelles. Conforme RGPD.',
    },
    '/cv': {
      title:       'CV RANDRIAMANANTENA Tsiky Ny Antsa — JeryMotro',
      description: 'Curriculum Vitae de RANDRIAMANANTENA Tsiky Ny Antsa, étudiant en Licence 3 Génie Logiciel à l\'ESP-Antsirabe, concepteur de JeryMotro.',
    },
  },

  mg: {
    '/': {
      title:       'JeryMotro — Fanaraha-maso ny afo eto Madagasikara',
      description: 'JeryMotro dia manangona angona satalaita NASA FIRMS, mampiasa modely XGBoost ary mampandre anao amin\'izao fotoana izao momba ny afo eto Madagasikara. Faritra 22 no voasarihana.',
    },
    '/login': {
      title:       'Miditra — JeryMotro',
      description: 'Miditra amin\'ny kaontinao JeryMotro mba hahazoana ny fanaraha-maso satalaita ny afo eto Madagasikara amin\'izao fotoana izao.',
    },
    '/register': {
      title:       'Mamorona kaonty — JeryMotro',
      description: 'Mamorona kaonty JeryMotro maimaim-poana. Araho ny afo eto Madagasikara, handraisa fampitandremana Email/SMS/WhatsApp ary ampiasao faminaniana XGBoost.',
    },
    '/map': {
      title:       'Sarintany ny afo — JeryMotro',
      description: 'Sarintany mifandraika momba ny afo eto Madagasikara. Fahitana MODIS/VIIRS amin\'izao fotoana izao.',
    },
    '/dashboard': {
      title:       'Tabilao — JeryMotro',
      description: 'Statistika sy famakafakana ny afo eto Madagasikara: fahitana, vondrona mavitrika, fampitandremana nalefa, fahamarinan\'ny AI.',
    },
    '/about': {
      title:       'Fomba Fiasa sy Loharanon-angona — JeryMotro',
      description: 'Loharanon-angona NASA FIRMS, modely XGBoost v2.1, rafitra fandraharahana ary fetra.',
    },
    '/legal': {
      title:       'Filazana ara-dalàna — JeryMotro',
      description: 'Fampahalalana momba ny lalana mifehy ny sehatra JeryMotro.',
    },
    '/privacy': {
      title:       'Politika Tsiambaratelo — JeryMotro',
      description: 'Ny fomba fanangonana sy fikarakarana ny angon-drakitra manokana ao amin\'ny JeryMotro.',
    },
    '/cv': {
      title:       'CV RANDRIAMANANTENA Tsiky Ny Antsa — JeryMotro',
      description: 'Resaka momba ny fahaiza-manao sy ny diampianaran\'i RANDRIAMANANTENA Tsiky Ny Antsa, mpamorona ny JeryMotro.',
    },
  },

  en: {
    '/': {
      title:       'JeryMotro — Real-time wildfire surveillance in Madagascar',
      description: 'JeryMotro aggregates NASA FIRMS satellite data, applies XGBoost ML models and alerts you in real-time about wildfires across all 22 regions of Madagascar.',
    },
    '/login': {
      title:       'Login — JeryMotro',
      description: 'Log into your JeryMotro account to access real-time satellite wildfire monitoring across Madagascar.',
    },
    '/register': {
      title:       'Create an account — JeryMotro',
      description: 'Create your free JeryMotro account. Monitor Madagascar wildfires, receive Email/SMS/WhatsApp alerts and use XGBoost predictions.',
    },
    '/map': {
      title:       'Real-time wildfire map — JeryMotro',
      description: 'Interactive wildfire map of Madagascar. Real-time MODIS/VIIRS detections, regional clustering, risk-level filtering.',
    },
    '/dashboard': {
      title:       'Dashboard — JeryMotro',
      description: 'Wildfire statistics for Madagascar: detections, active clusters, alerts sent, 89% AI accuracy.',
    },
    '/about': {
      title:       'Methodology & Sources — JeryMotro',
      description: 'NASA FIRMS data sources, XGBoost v2.1 model, processing pipeline and platform limitations.',
    },
    '/legal': {
      title:       'Legal Notice — JeryMotro',
      description: 'Regulatory information about the JeryMotro wildfire surveillance platform.',
    },
    '/privacy': {
      title:       'Privacy Policy — JeryMotro',
      description: 'How JeryMotro collects, processes and protects your personal data. GDPR compliant.',
    },
    '/cv': {
      title:       'CV RANDRIAMANANTENA Tsiky Ny Antsa — JeryMotro',
      description: 'Curriculum Vitae of RANDRIAMANANTENA Tsiky Ny Antsa, L3 Software Engineering student at ESP-Antsirabe, creator of JeryMotro.',
    },
  },
};

// ─── Composant ──────────────────────────────────────────────────────────────

export function SeoHead() {
  const [location]  = useLocation();
  const { lang }    = useI18n();

  // Mettre à jour l'attribut lang du document HTML
  useEffect(() => {
    if (PUBLIC_ROUTES_SET.has(location)) {
      document.documentElement.lang = LANG_BCP47[lang];
    }
  }, [location, lang]);

  if (!PUBLIC_ROUTES_SET.has(location)) return null;

  const seo = SEO_DATA[lang]?.[location] ?? SEO_DATA['fr'][location];
  if (!seo) return null;

  // Chemin canonique : /fr/  ou  /fr/login/
  const suffix    = location === '/' ? '' : location;
  const canonical = `${SITE_URL}/${lang}${suffix}/`;

  // React 19 va automatiquement hisser ces éléments dans le <head>
  return (
    <>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={canonical} />

      {/* ── Open Graph ── */}
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={canonical} />
      <meta property="og:title"       content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image"       content={OG_IMAGE} />
      <meta property="og:locale"      content={LANG_BCP47[lang]} />
      <meta property="og:site_name"   content="JeryMotro" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image"       content={OG_IMAGE} />

      {/* ── hreflang alternates ── */}
      {(Object.keys(SEO_DATA) as Lang[]).map(l => (
        <link
          key={l}
          rel="alternate"
          hrefLang={LANG_BCP47[l]}
          href={`${SITE_URL}/${l}${suffix}/`}
        />
      ))}
      {/* x-default → version française */}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/fr${suffix}/`} />
    </>
  );
}
