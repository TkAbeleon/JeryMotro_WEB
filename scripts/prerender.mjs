/**
 * scripts/prerender.mjs
 *
 * Prerendering statique (SSG) au build pour les pages PUBLIQUES de JeryMotro.
 * Rend les composants React directement en HTML à l'aide de react-dom/server.
 * PLUS BESOIN de lancer Chrome/Puppeteer en tâche de fond !
 *
 * Sortie :
 *   dist/public/
 *     fr/index.html          ← landing en français
 *     fr/login/index.html
 *     fr/register/index.html
 *     mg/index.html          ← landing en malgache
 *     mg/login/index.html
 *     mg/register/index.html
 *     en/index.html          ← landing en anglais
 *     en/login/index.html
 *     en/register/index.html
 *     sitemap.xml
 *     index.html             ← INCHANGÉ : SPA shell pour routes authentifiées
 *     assets/                ← INCHANGÉ
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

const PUBLIC_ROUTES = [
  { path: '/',          slug: '',         title: 'Landing page'  },
  { path: '/login',     slug: 'login',    title: 'Login'         },
  { path: '/register',  slug: 'register', title: 'Register'      },
  { path: '/map',        slug: 'map',        title: 'Map'           },
  { path: '/dashboard',  slug: 'dashboard',  title: 'Dashboard'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';

const ok      = (msg)  => console.log(`  ${GREEN}✔${RESET}  ${msg}`);
const warn    = (msg)  => console.warn(`  ${YELLOW}⚠${RESET}  ${msg}`);
const err     = (msg)  => console.error(`  ${RED}✖${RESET}  ${msg}`);
const info    = (msg)  => console.log(`  ${CYAN}ℹ${RESET}  ${msg}`);
const header  = (msg)  => console.log(`\n${BOLD}${CYAN}━━━ ${msg}${RESET}`);

/**
 * Vérifie les balises SEO présentes dans le HTML généré.
 */
function auditSeoTags(html, { path, lang }) {
  const checks = [
    { name: '<title>',           regex: /<title>[^<]{1,}/i },
    { name: 'meta description',  regex: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{1,}/i },
    { name: 'og:title',          regex: /<meta[^>]+property=["']og:title["']/i },
    { name: 'og:description',    regex: /<meta[^>]+property=["']og:description["']/i },
    { name: 'hreflang',          regex: /<link[^>]+hreflang/i },
    { name: '<h1>',              regex: /<h1[\s>]/i },
  ];

  const missing = checks.filter(c => !c.regex.test(html)).map(c => c.name);
  if (missing.length > 0) {
    warn(`[${lang}${path}] Balises SEO ABSENTES du HTML : ${missing.join(', ')}`);
  } else {
    ok(`[${lang}${path}] SEO Audit : OK`);
  }
}

/**
 * Écrit le HTML dans dist/public/<lang>/<slug>/index.html.
 */
function writeHtml(html, lang, slug) {
  const dir = join(DIST_DIR, lang, slug);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'index.html');
  writeFileSync(file, html, 'utf-8');
  const sizeKb = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  ok(`Écrit : dist/public/${lang}/${slug ? slug + '/' : ''}index.html (${sizeKb} KB)`);
}

/**
 * Génère le sitemap.xml avec les balises hreflang pour toutes les langues.
 */
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  const urlEntries = PUBLIC_ROUTES.flatMap(route => {
    return LANGS.map(lang => {
      const langPath = `/${lang.key}${route.slug ? '/' + route.slug : ''}`;
      const canonical = `${BASE_URL}${langPath}/`;

      const alternates = LANGS.map(l => {
        const altPath = `/${l.key}${route.slug ? '/' + route.slug : ''}`;
        return `    <xhtml:link rel="alternate" hreflang="${l.bcp47}" href="${BASE_URL}${altPath}/"/>`;
      }).join('\n');

      const defaultPath = `/fr${route.slug ? '/' + route.slug : ''}`;
      const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${defaultPath}/"/>`;

      return `  <url>
    <loc>${canonical}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.slug === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route.slug === '' ? '1.0' : '0.8'}</priority>
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
  ok(`Sitemap généré : dist/public/sitemap.xml (${LANGS.length * PUBLIC_ROUTES.length} URLs)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       🔥  JeryMotro — SSG Hybride (sans browser)         ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Routes   : ${String(PUBLIC_ROUTES.length).padEnd(47)}║`);
  console.log(`║  Langues  : ${LANGS.map(l => l.key).join(', ').padEnd(47)}║`);
  console.log(`║  Total    : ${String(PUBLIC_ROUTES.length * LANGS.length).padEnd(47)}║`);
  console.log(`║  Base URL : ${BASE_URL.padEnd(47)}║`);
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

  // 1. Lire le template index.html client
  const template = readFileSync(templatePath, 'utf-8');

  // 2. Importer le bundle de rendu serveur compilé par Vite
  info(`Chargement du bundle serveur : ${serverBundlePath}`);
  
  // Mock window and document before importing server bundle so Leaflet doesn't crash on module load
  if (typeof global !== "undefined") {
    const domMock = {
      location: {
        pathname: "/",
        protocol: "https:",
        hostname: "jerymotro.duckdns.org",
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    };
    global.window = domMock;
    global.document = {
      createElement: () => ({
        style: {},
      }),
      documentElement: {
        style: {},
      },
    };
    global.navigator = {
      userAgent: "node",
    };
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }

  const { render } = await import(pathToFileURL(serverBundlePath).href);

  let successCount = 0;
  let failCount    = 0;

  // 3. Effectuer le rendu de chaque route publique dans chaque langue
  header(`Rendu direct (SSR/SSG React)`);
  for (const route of PUBLIC_ROUTES) {
    for (const lang of LANGS) {
      const label = `[${lang.key}] ${route.title} (${route.path})`;
      try {
        // Obtenir le HTML généré par le composant React
        const rendered = render(route.path, lang.key);

        // Injecter le rendu dans le template html client
        let pageHtml = template.replace('<div id="root"></div>', `<div id="root">${rendered}</div>`);

        // Ajuster l'attribut lang pour le SEO
        pageHtml = pageHtml.replace('<html lang="en">', `<html lang="${lang.key}">`);

        // Écrire le fichier
        writeHtml(pageHtml, lang.key, route.slug);
        auditSeoTags(pageHtml, { path: route.path, lang: lang.key });
        successCount++;
      } catch (e) {
        err(`Échec du rendu pour ${label} : ${e.message}`);
        console.error(e);
        failCount++;
      }
    }
  }

  // 4. Générer le sitemap
  header('Génération du sitemap');
  generateSitemap();

  // 5. Nettoyage : Supprimer le dossier temporaire dist/server
  header('Nettoyage des fichiers temporaires');
  try {
    const serverDir = join(ROOT_DIR, 'dist', 'server');
    rmSync(serverDir, { recursive: true, force: true });
    ok('Dossier dist/server temporaire supprimé avec succès.');
  } catch (e) {
    warn(`Impossible de supprimer dist/server : ${e.message}`);
  }

  // 6. Résumé final
  console.log(`\n${BOLD}${successCount > 0 ? GREEN : RED}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                ✅  SSG Terminé avec succès               ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Succès   : ${String(successCount).padEnd(47)}║`);
  if (failCount > 0)
    console.log(`║  Échecs   : ${String(failCount).padEnd(47)}║`);
  console.log(`║  Sitemap  : dist/public/sitemap.xml                      ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(RESET);

  if (failCount > 0) process.exitCode = 1;
}

main().catch(e => {
  err(`Erreur fatale : ${e.message}`);
  console.error(e);
  process.exit(1);
});
