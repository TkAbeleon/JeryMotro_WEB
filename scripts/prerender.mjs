/**
 * scripts/prerender.mjs
 *
 * Prerendering statique (SSG) au build pour les pages PUBLIQUES de JeryMotro.
 *
 * Stratégie hybride :
 *   ① Pages React SSR (landing, login, register)
 *      → Compilées via react-dom/server (bundle entry-server.js).
 *      → HTML complet avec contenu React rendu.
 *
 *   ② Pages Leaflet / complexes (map, dashboard)
 *      → HTML statique léger écrit directement en JS.
 *      → Leaflet NE S'EXÉCUTE PAS côté Node (évite window is not defined).
 *      → Lisibles par curl/bots (meta SEO, contenu textuel pertinent).
 *      → Les vrais utilisateurs reçoivent le SPA hydraté normalement.
 *
 * Sortie :
 *   dist/public/
 *     fr/index.html              ← landing fr (SSR React)
 *     fr/login/index.html        ← login fr (SSR React)
 *     fr/register/index.html     ← register fr (SSR React)
 *     fr/map/index.html          ← carte fr (HTML statique léger)
 *     fr/dashboard/index.html    ← dashboard fr (HTML statique léger)
 *     (idem pour mg et en)
 *     sitemap.xml
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR  = join(resolve(__dirname, '..'), 'artifacts', 'jerymotro');
const DIST_DIR  = join(ROOT_DIR, 'dist', 'public');

// ─── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.PRERENDER_BASE_URL || 'https://jerymotro.duckdns.org';

const LANGS = [
  { key: 'fr', bcp47: 'fr-MG', label: 'Français' },
  { key: 'mg', bcp47: 'mg',    label: 'Malagasy'  },
  { key: 'en', bcp47: 'en',    label: 'English'   },
];

// Routes compilées via React SSR (pas de dépendance browser au module-load)
const REACT_ROUTES = [
  { path: '/',         slug: '',         title: 'Landing page' },
  { path: '/login',    slug: 'login',    title: 'Login'        },
  { path: '/register', slug: 'register', title: 'Register'     },
  { path: '/legal',    slug: 'legal',    title: 'Mentions légales' },
  { path: '/privacy',  slug: 'privacy',  title: 'Politique de confidentialité' },
  { path: '/about',    slug: 'about',    title: 'Méthodologie & Sources' },
  { path: '/cv',       slug: 'cv',       title: 'CV Développeur' },
];

// Routes rendues en HTML statique (évite Leaflet/window crash dans Node)
const STATIC_ROUTES = [
  { path: '/map',       slug: 'map',       title: 'Carte des feux'  },
  { path: '/dashboard', slug: 'dashboard', title: 'Tableau de bord' },
];

const ALL_ROUTES = [...REACT_ROUTES, ...STATIC_ROUTES];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';

const ok      = (msg) => console.log(`  ${GREEN}✔${RESET}  ${msg}`);
const warn    = (msg) => console.warn(`  ${YELLOW}⚠${RESET}  ${msg}`);
const err     = (msg) => console.error(`  ${RED}✖${RESET}  ${msg}`);
const info    = (msg) => console.log(`  ${CYAN}ℹ${RESET}  ${msg}`);
const header  = (msg) => console.log(`\n${BOLD}${CYAN}━━━ ${msg}${RESET}`);

function auditSeoTags(html, { path, lang }) {
  const checks = [
    { name: '<title>',           regex: /<title>[^<]{1,}/i },
    { name: 'meta description',  regex: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{1,}/i },
    { name: 'og:title',          regex: /<meta[^>]+property=["']og:title["']/i },
    { name: '<h1>',              regex: /<h1[\s>]/i },
  ];
  const missing = checks.filter(c => !c.regex.test(html)).map(c => c.name);
  if (missing.length > 0) {
    warn(`[${lang}${path}] Balises SEO ABSENTES : ${missing.join(', ')}`);
  } else {
    ok(`[${lang}${path}] SEO Audit : OK`);
  }
}

function writeHtml(html, lang, slug) {
  const dir = join(DIST_DIR, lang, slug);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'index.html');
  writeFileSync(file, html, 'utf-8');
  const sizeKb = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  ok(`Écrit : dist/public/${lang}/${slug ? slug + '/' : ''}index.html (${sizeKb} KB)`);
}

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  const urlEntries = ALL_ROUTES.flatMap(route => {
    return LANGS.map(lang => {
      const langPath = `/${lang.key}${route.slug ? '/' + route.slug : ''}`;
      const canonical = `${BASE_URL}${langPath}/`;

      const alternates = LANGS.map(l => {
        const altPath = `/${l.key}${route.slug ? '/' + route.slug : ''}`;
        return `    <xhtml:link rel="alternate" hreflang="${l.bcp47}" href="${BASE_URL}${altPath}/"/>`;
      }).join('\n');

      const defaultPath = `/fr${route.slug ? '/' + route.slug : ''}`;
      const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${defaultPath}/"/>`;

      const isHigh = (route.slug === '' || route.slug === 'map' || route.slug === 'dashboard');

      return `  <url>
    <loc>${canonical}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${isHigh ? 'daily' : 'weekly'}</changefreq>
    <priority>${isHigh ? '1.0' : '0.8'}</priority>
${alternates}
${xDefault}
  </url>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>
`;
  const sitemapPath = join(DIST_DIR, 'sitemap.xml');
  writeFileSync(sitemapPath, xml, 'utf-8');
  ok(`Sitemap généré : dist/public/sitemap.xml (${LANGS.length * ALL_ROUTES.length} URLs)`);
}

// ─── HTML statique léger pour pages Leaflet ──────────────────────────────────
// Lisible par curl et robots. Les vrais navigateurs reçoivent le SPA hydraté.

const STATIC_CONTENT = {
  fr: {
    map: {
      title: 'Carte des feux de brousse — JeryMotro',
      description: 'Visualisez en temps réel les feux de brousse à Madagascar sur notre carte interactive. Données satellitaires NASA FIRMS, détections MODIS et VIIRS, clustering par zone.',
      h1: 'Carte des feux de brousse à Madagascar en temps réel',
      body: `
        <p>JeryMotro agrège les données satellitaires NASA FIRMS pour détecter et visualiser les feux de brousse à Madagascar en temps réel.</p>
        <h2>Fonctionnalités de la carte</h2>
        <ul>
          <li>Détections MODIS et VIIRS en temps réel</li>
          <li>Clustering géographique par région (Antananarivo, Fianarantsoa, Toamasina, Mahajanga, Toliara, Antsiranana)</li>
          <li>Filtrage par niveau de risque : Critique, Élevé, Moyen, Faible</li>
          <li>Historique sur 24h, 7 jours, 30 jours, 90 jours ou 1 an</li>
          <li>Précision de détection IA : 89% (XGBoost v2.1)</li>
        </ul>
        <p><a href="/dashboard">Voir le tableau de bord →</a></p>`,
    },
    dashboard: {
      title: 'Tableau de bord — JeryMotro',
      description: 'Statistiques et analyses des feux de brousse à Madagascar. Nombre de détections, clusters actifs, alertes envoyées, précision de l\'IA XGBoost.',
      h1: 'Tableau de bord de surveillance des feux à Madagascar',
      body: `
        <p>Le tableau de bord JeryMotro centralise toutes les statistiques de surveillance des feux de brousse à Madagascar.</p>
        <h2>Indicateurs clés</h2>
        <ul>
          <li><strong>50 000+</strong> détections traitées par jour</li>
          <li><strong>89%</strong> de précision de détection par IA</li>
          <li><strong>22</strong> régions surveillées à Madagascar</li>
          <li><strong>&lt; 2 secondes</strong> de délai de traitement</li>
        </ul>
        <h2>Sources de données</h2>
        <p>Données satellitaires : NASA FIRMS (Fire Information for Resource Management System), capteurs MODIS et VIIRS.</p>
        <p><a href="/map">Voir la carte en temps réel →</a></p>`,
    },
  },
  mg: {
    map: {
      title: 'Sarintany ny afo — JeryMotro',
      description: 'Jereo amin\'izao fotoana izao ny afo any Madagasikara amin\'ny alalan\'ny sarintany mifandraika. Angona sateraita NASA FIRMS, MODIS sy VIIRS.',
      h1: 'Sarintany ny afo any Madagasikara amin\'izao fotoana izao',
      body: `
        <p>Ny JeryMotro dia mampivory ny angon-drakitra sateraita NASA FIRMS mba hahitana sy hisehoan'ny afo any Madagasikara amin'izao fotoana izao.</p>
        <ul>
          <li>Fahitana MODIS sy VIIRS amin'izao fotoana izao</li>
          <li>Fahitana voalamina amin'ny faritra (Antananarivo, Fianarantsoa, Toamasina...)</li>
          <li>Fanavahana ny habetsahana: Mampidi-doza, Avo, Antonony, Ambany</li>
          <li>Fahamarinana 89% (XGBoost v2.1)</li>
        </ul>
        <p><a href="/dashboard">Hijery ny tabilao →</a></p>`,
    },
    dashboard: {
      title: 'Tabilao — JeryMotro',
      description: 'Statistika sy fandalinana ny afo any Madagasikara. Isan\'ny fahitana, vondrona mavitrika, fampitandremana nalefa, fahamarinana AI.',
      h1: 'Tabilao fanaraha-maso ny afo any Madagasikara',
      body: `
        <p>Ny tabilao JeryMotro dia mampivory ny antontan'isa rehetra momba ny fanaraha-maso ny afo any Madagasikara.</p>
        <ul>
          <li><strong>50 000+</strong> fahitana voakarakara isan'andro</li>
          <li><strong>89%</strong> fahamarinana AI</li>
          <li><strong>22</strong> faritra fanaraha-maso</li>
        </ul>
        <p><a href="/map">Hijery ny sarintany →</a></p>`,
    },
  },
  en: {
    map: {
      title: 'Wildfire Map — JeryMotro',
      description: 'View real-time wildfire detections in Madagascar on our interactive map. NASA FIRMS satellite data, MODIS and VIIRS sensors, regional clustering.',
      h1: 'Real-time Wildfire Map of Madagascar',
      body: `
        <p>JeryMotro aggregates NASA FIRMS satellite data to detect and visualize wildfires across Madagascar in real time.</p>
        <h2>Map features</h2>
        <ul>
          <li>Real-time MODIS and VIIRS detections</li>
          <li>Geographic clustering by region (Antananarivo, Fianarantsoa, Toamasina, Mahajanga, Toliara, Antsiranana)</li>
          <li>Filter by risk level: Critical, High, Medium, Low</li>
          <li>History: 24h, 7 days, 30 days, 90 days, or 1 year</li>
          <li>AI detection accuracy: 89% (XGBoost v2.1)</li>
        </ul>
        <p><a href="/dashboard">View dashboard →</a></p>`,
    },
    dashboard: {
      title: 'Dashboard — JeryMotro',
      description: 'Wildfire statistics and analytics for Madagascar. Detections, active clusters, sent alerts and AI accuracy metrics.',
      h1: 'Wildfire Surveillance Dashboard — Madagascar',
      body: `
        <p>The JeryMotro dashboard centralises all wildfire surveillance statistics for Madagascar.</p>
        <h2>Key metrics</h2>
        <ul>
          <li><strong>50,000+</strong> detections processed per day</li>
          <li><strong>89%</strong> AI detection accuracy</li>
          <li><strong>22</strong> regions monitored in Madagascar</li>
          <li><strong>&lt; 2 seconds</strong> processing delay</li>
        </ul>
        <h2>Data sources</h2>
        <p>Satellite data: NASA FIRMS (Fire Information for Resource Management System), MODIS and VIIRS sensors.</p>
        <p><a href="/map">View real-time map →</a></p>`,
    },
  },
};

/**
 * Génère une page HTML statique légère pour les pages utilisant Leaflet.
 * Les moteurs de recherche et curl voient un contenu sémantique riche.
 * Les vrais navigateurs reçoivent ensuite le SPA JavaScript normalement.
 */
function buildStaticPage(lang, slug, content, spaScriptTag, spaCssTag) {
  const langContent = STATIC_CONTENT[lang]?.[slug];
  if (!langContent) throw new Error(`No static content for ${lang}/${slug}`);

  const hreflangLinks = LANGS.map(l =>
    `<link rel="alternate" hreflang="${l.bcp47}" href="${BASE_URL}/${l.key}/${slug}/" />`
  ).join('\n    ');

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="google-site-verification" content="lhD02WyGKArDRXo_JqWqiFK6-1NSapIBs5podDPvPgo" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>${langContent.title}</title>
    <meta name="description" content="${langContent.description}" />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="${langContent.title}" />
    <meta property="og:description" content="${langContent.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/logo.png" />
    <meta property="og:url" content="${BASE_URL}/${lang}/${slug}/" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${langContent.title}" />
    <meta name="twitter:description" content="${langContent.description}" />
    <link rel="canonical" href="${BASE_URL}/${lang}/${slug}/" />
    ${hreflangLinks}
    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/fr/${slug}/" />
    <link rel="icon" type="image/png" href="/logo.png" />
    ${spaCssTag}
  </head>
  <body>
    <!-- Contenu statique SEO — visible pour les bots et curl sans JavaScript -->
    <noscript>
      <header>
        <a href="/">
          <img src="/logo.png" alt="JeryMotro" width="32" height="32" />
          <strong>JeryMotro</strong>
        </a>
      </header>
      <main>
        <h1>${langContent.h1}</h1>
        ${langContent.body}
      </main>
    </noscript>

    <!-- Racine du SPA React — hydraté par le navigateur avec la carte Leaflet -->
    <div id="root"></div>

    ${spaScriptTag}
  </body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║    🔥  JeryMotro — SSG Hybride (React + HTML statique)   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Routes SSR   : ${String(REACT_ROUTES.length).padEnd(43)}║`);
  console.log(`║  Routes HTML  : ${String(STATIC_ROUTES.length).padEnd(43)}║`);
  console.log(`║  Langues      : ${LANGS.map(l => l.key).join(', ').padEnd(43)}║`);
  console.log(`║  Base URL     : ${BASE_URL.padEnd(43)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(RESET);

  const templatePath = join(DIST_DIR, 'index.html');
  const serverBundlePath = join(ROOT_DIR, 'dist', 'server', 'entry-server.js');

  if (!existsSync(templatePath)) {
    err(`Template client dist/public/index.html introuvable.`);
    process.exit(1);
  }
  if (!existsSync(serverBundlePath)) {
    err(`Bundle serveur dist/server/entry-server.js introuvable.`);
    process.exit(1);
  }

  const template = readFileSync(templatePath, 'utf-8');

  // Extraire les balises <script> et <link> du template SPA pour les réutiliser dans les pages statiques
  const scriptMatch = template.match(/<script[^>]+src="\/assets\/[^"]+\.js"[^>]*><\/script>/);
  const cssMatch    = template.match(/<link[^>]+href="\/assets\/[^"]+\.css"[^>]*>/);
  const spaScriptTag = scriptMatch ? scriptMatch[0] : '';
  const spaCssTag    = cssMatch    ? cssMatch[0]    : '';

  let successCount = 0;
  let failCount    = 0;

  // ── 1. SSR React pour landing, login, register ──────────────────────────────
  header(`SSR React (${REACT_ROUTES.length} routes)`);
  info(`Chargement du bundle serveur : ${serverBundlePath}`);

  const { render } = await import(pathToFileURL(serverBundlePath).href);

  for (const route of REACT_ROUTES) {
    for (const lang of LANGS) {
      const label = `[${lang.key}] ${route.title} (${route.path})`;
      try {
        const rendered = render(route.path, lang.key);
        let pageHtml = template.replace('<div id="root"></div>', `<div id="root">${rendered}</div>`);
        pageHtml = pageHtml.replace('<html lang="en">', `<html lang="${lang.key}">`);
        writeHtml(pageHtml, lang.key, route.slug);
        auditSeoTags(pageHtml, { path: route.path, lang: lang.key });
        successCount++;
      } catch (e) {
        err(`Échec SSR pour ${label} : ${e.message}`);
        failCount++;
      }
    }
  }

  // ── 2. HTML statique pour Map et Dashboard (évite crash Leaflet) ───────────
  header(`HTML statique léger (${STATIC_ROUTES.length} routes — Leaflet-safe)`);

  for (const route of STATIC_ROUTES) {
    for (const lang of LANGS) {
      const label = `[${lang.key}] ${route.title} (${route.path})`;
      try {
        const pageHtml = buildStaticPage(lang.key, route.slug, STATIC_CONTENT, spaScriptTag, spaCssTag);
        writeHtml(pageHtml, lang.key, route.slug);
        auditSeoTags(pageHtml, { path: route.path, lang: lang.key });
        successCount++;
      } catch (e) {
        err(`Échec HTML statique pour ${label} : ${e.message}`);
        failCount++;
      }
    }
  }

  // ── 3. Sitemap ─────────────────────────────────────────────────────────────
  header('Génération du sitemap');
  generateSitemap();

  // ── 4. Nettoyage ───────────────────────────────────────────────────────────
  header('Nettoyage des fichiers temporaires');
  try {
    rmSync(join(ROOT_DIR, 'dist', 'server'), { recursive: true, force: true });
    ok('Dossier dist/server temporaire supprimé.');
  } catch (e) {
    warn(`Impossible de supprimer dist/server : ${e.message}`);
  }

  // ── 5. Résumé ──────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}${successCount > 0 ? GREEN : RED}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              ✅  SSG Terminé avec succès                 ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Succès   : ${String(successCount).padEnd(47)}║`);
  if (failCount > 0)
    console.log(`║  Échecs   : ${String(failCount).padEnd(47)}║`);
  console.log(`║  Sitemap  : dist/public/sitemap.xml                      ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  curl /map        → HTML statique SEO + SPA scripts      ║');
  console.log('║  curl /dashboard  → HTML statique SEO + SPA scripts      ║');
  console.log('║  curl /           → React SSR complet                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(RESET);

  if (failCount > 0) process.exitCode = 1;
}

main().catch(e => {
  err(`Erreur fatale : ${e.message}`);
  console.error(e);
  process.exit(1);
});
