/**
 * scripts/prerender.mjs
 *
 * Prerendering statique au build pour les pages PUBLIQUES de JeryMotro.
 *
 * Stratégie :
 *   - Lance `vite preview` sur un port temporaire
 *   - Pour chaque route publique × chaque langue (fr, mg, en) :
 *       • Ouvre la page dans Puppeteer
 *       • Injecte la langue via localStorage avant navigation
 *       • Attend networkidle0 (données chargées)
 *       • Capture le HTML final via page.content()
 *       • Écrit dans dist/public/<lang>/<route>/index.html
 *   - Génère dist/public/sitemap.xml avec balises hreflang
 *   - Ferme proprement navigateur et serveur preview
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
 *
 * ─── Pour ajouter une route publique ──────────────────────────────────────────
 * Ajoutez un objet dans le tableau PUBLIC_ROUTES ci-dessous :
 *   { path: '/ma-route', slug: 'ma-route', title: 'Ma page' }
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage : node scripts/prerender.mjs
 * Variables d'environnement :
 *   PRERENDER_BASE_URL   URL de base pour le sitemap (défaut: https://jerymotro.mg)
 *   PRERENDER_PORT       Port vite preview temporaire (défaut: 4174)
 *   PRERENDER_TIMEOUT    Timeout Puppeteer par page en ms (défaut: 20000)
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR  = join(resolve(__dirname, '..'), 'artifacts', 'jerymotro');
const DIST_DIR  = join(ROOT_DIR, 'dist', 'public');  // sortie de vite build

// ─── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL        = process.env.PRERENDER_BASE_URL || 'https://jerymotro.mg';
const PREVIEW_PORT    = parseInt(process.env.PRERENDER_PORT    || '4174', 10);
const TIMEOUT         = parseInt(process.env.PRERENDER_TIMEOUT || '20000', 10);
const PREVIEW_URL     = `http://localhost:${PREVIEW_PORT}`;

/** Langues supportées et leurs codes BCP-47 pour hreflang */
const LANGS = [
  { key: 'fr', bcp47: 'fr-MG', label: 'Français' },
  { key: 'mg', bcp47: 'mg',    label: 'Malagasy'  },
  { key: 'en', bcp47: 'en',    label: 'English'   },
];

/**
 * Routes PUBLIQUES à prerendre.
 * ──────────────────────────────────────────────────────────────────────────────
 * POUR AJOUTER UNE ROUTE : ajoutez un objet ici.
 *   path  : chemin de la route (tel qu'il apparaît dans wouter)
 *   slug  : sous-dossier de sortie dans dist/public/<lang>/<slug>/
 *            → utilisez '' pour la route racine '/'
 *   title : description pour les logs
 * ──────────────────────────────────────────────────────────────────────────────
 */
const PUBLIC_ROUTES = [
  { path: '/',          slug: '',         title: 'Landing page'  },
  { path: '/login',     slug: 'login',    title: 'Login'         },
  { path: '/register',  slug: 'register', title: 'Register'      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';

const log     = (msg)  => console.log(`  ${msg}`);
const ok      = (msg)  => console.log(`  ${GREEN}✔${RESET}  ${msg}`);
const warn    = (msg)  => console.warn(`  ${YELLOW}⚠${RESET}  ${msg}`);
const err     = (msg)  => console.error(`  ${RED}✖${RESET}  ${msg}`);
const info    = (msg)  => console.log(`  ${CYAN}ℹ${RESET}  ${msg}`);
const header  = (msg)  => console.log(`\n${BOLD}${CYAN}━━━ ${msg}${RESET}`);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Vite preview ─────────────────────────────────────────────────────────────

/**
 * Démarre `vite preview` sur PREVIEW_PORT et attend qu'il réponde.
 * @returns {Promise<ChildProcess>}
 */
async function startVitePreview() {
  return new Promise((resolve, reject) => {
    info(`Démarrage de vite preview sur le port ${PREVIEW_PORT}...`);

    const vite = spawn('pnpm', ['run', 'serve'], {
      cwd: ROOT_DIR,
      env: { ...process.env, PORT: String(PREVIEW_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    vite.stdout.on('data', d => { output += d.toString(); });
    vite.stderr.on('data', d => { output += d.toString(); });

    vite.on('error', reject);

    // Poll jusqu'à ce que le serveur réponde (max 30s)
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${PREVIEW_URL}/`, { signal: AbortSignal.timeout(1000) });
        if (res.ok || res.status === 200 || res.status === 304) {
          clearInterval(poll);
          ok(`Vite preview prêt sur ${PREVIEW_URL}`);
          resolve(vite);
        }
      } catch {
        // pas encore prêt
      }
      if (attempts > 30) {
        clearInterval(poll);
        reject(new Error(`Vite preview n'a pas démarré après 30s.\nSortie: ${output}`));
      }
    }, 1000);
  });
}

/**
 * Arrête le processus vite preview proprement.
 * @param {ChildProcess} proc
 */
function stopVitePreview(proc) {
  if (!proc) return;
  proc.kill('SIGTERM');
  info('Vite preview arrêté.');
}

// ─── Puppeteer helpers ────────────────────────────────────────────────────────

/**
 * Vérifie les balises SEO présentes dans le HTML capturé.
 * Émet des warnings si des balises importantes sont absentes.
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
    warn(`[${lang}${path}] Balises SEO ABSENTES du HTML rendu : ${missing.join(', ')}`);
    warn(`  → Ces balises doivent être injectées dynamiquement par votre app React`);
    warn(`  → ou ajoutées dans index.html (pour les balises statiques communes).`);
  } else {
    ok(`[${lang}${path}] Toutes les balises SEO sont présentes.`);
  }
}

/**
 * Rend une URL dans Chrome headless avec la langue définie via localStorage.
 * @param {import('puppeteer').Browser} browser
 * @param {string} url   URL complète à charger
 * @param {string} lang  Clé de langue ('fr' | 'mg' | 'en')
 * @returns {Promise<string>} HTML complet de la page rendue
 */
async function renderPage(browser, url, lang) {
  const page = await browser.newPage();

  try {
    // 1. Aller sur l'app une première fois (juste pour initialiser localStorage)
    //    On charge la page racine pour s'assurer que le storage est disponible
    await page.goto(`${PREVIEW_URL}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });

    // 2. Injecter la langue dans localStorage (simule le choix utilisateur)
    await page.evaluate((lang) => {
      localStorage.setItem('jerymotro_lang', lang);
    }, lang);

    // 3. Désactiver le chargement d'images et fonts pour aller plus vite
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 4. Naviguer vers la route cible et attendre networkidle0
    await page.goto(url, { waitUntil: 'networkidle0', timeout: TIMEOUT });

    // 5. Attendre un tick supplémentaire pour les rendus React différés
    await sleep(500);

    const html = await page.content();
    return html;

  } finally {
    await page.close();
  }
}

// ─── Écriture fichiers ────────────────────────────────────────────────────────

/**
 * Écrit le HTML prerendu dans dist/public/<lang>/<slug>/index.html.
 * @param {string} html
 * @param {string} lang  ex: 'fr'
 * @param {string} slug  ex: '' (racine) ou 'login'
 */
function writeHtml(html, lang, slug) {
  const dir = join(DIST_DIR, lang, slug);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'index.html');
  writeFileSync(file, html, 'utf-8');
  const sizeKb = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  ok(`Écrit : dist/public/${lang}/${slug ? slug + '/' : ''}index.html (${sizeKb} KB)`);
}

// ─── Génération du sitemap ────────────────────────────────────────────────────

/**
 * Génère le sitemap.xml avec les balises hreflang pour toutes les langues.
 */
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  // Toutes les combinaisons route × langue
  const urlEntries = PUBLIC_ROUTES.flatMap(route => {
    // URL canonique pour chaque langue
    return LANGS.map(lang => {
      const langPath = `/${lang.key}${route.slug ? '/' + route.slug : ''}`;
      const canonical = `${BASE_URL}${langPath}/`;

      // Alternates pour les autres langues
      const alternates = LANGS.map(l => {
        const altPath = `/${l.key}${route.slug ? '/' + route.slug : ''}`;
        return `    <xhtml:link rel="alternate" hreflang="${l.bcp47}" href="${BASE_URL}${altPath}/"/>`;
      }).join('\n');

      // x-default pointe vers /fr/ (langue par défaut)
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
  console.log('║        🔥  JeryMotro — Prerendering statique             ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Routes   : ${String(PUBLIC_ROUTES.length).padEnd(47)}║`);
  console.log(`║  Langues  : ${LANGS.map(l => l.key).join(', ').padEnd(47)}║`);
  console.log(`║  Total    : ${String(PUBLIC_ROUTES.length * LANGS.length).padEnd(47)}║`);
  console.log(`║  Base URL : ${BASE_URL.padEnd(47)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(RESET);

  // Vérifications
  if (!existsSync(DIST_DIR)) {
    err(`dist/public/ introuvable. Lancez d'abord : pnpm run build`);
    process.exit(1);
  }

  let viteProc = null;
  let browser  = null;

  try {
    // ── 1. Démarrer vite preview ─────────────────────────────────────────────
    header('Démarrage de Vite preview');
    viteProc = await startVitePreview();

    // ── 2. Lancer Puppeteer ──────────────────────────────────────────────────
    header('Démarrage de Chrome headless');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    ok('Chrome headless prêt.');

    // ── 3. Prerendre chaque route × langue ───────────────────────────────────
    header(`Rendu des pages (${PUBLIC_ROUTES.length} routes × ${LANGS.length} langues)`);

    let successCount = 0;
    let failCount    = 0;

    for (const route of PUBLIC_ROUTES) {
      for (const lang of LANGS) {
        const url     = `${PREVIEW_URL}${route.path}`;
        const label   = `[${lang.key}] ${route.title} (${route.path})`;

        process.stdout.write(`  ${DIM}→ Rendu ${label}...${RESET}`);

        try {
          const html = await renderPage(browser, url, lang.key);

          // Audit des balises SEO (non bloquant)
          process.stdout.write('\n');
          auditSeoTags(html, { path: route.path, lang: lang.key });

          // Écriture du fichier
          writeHtml(html, lang.key, route.slug);
          successCount++;

        } catch (e) {
          process.stdout.write('\n');
          err(`Échec du rendu ${label} : ${e.message}`);
          failCount++;
        }
      }
    }

    // ── 4. Sitemap ────────────────────────────────────────────────────────────
    header('Génération du sitemap');
    generateSitemap();

    // ── 5. Résumé ─────────────────────────────────────────────────────────────
    console.log(`\n${BOLD}${successCount > 0 ? GREEN : RED}`);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              ✅  Prerendering terminé                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Succès   : ${String(successCount).padEnd(47)}║`);
    if (failCount > 0)
    console.log(`║  Échecs   : ${String(failCount).padEnd(47)}║`);
    console.log(`║  Sitemap  : dist/public/sitemap.xml                      ║`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  Pour vérifier un fichier :                              ║');
    console.log('║    cat dist/public/fr/index.html | head -n 30            ║');
    console.log('║    cat dist/public/mg/login/index.html | grep "<title>"  ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(RESET);

    if (failCount > 0) process.exitCode = 1;

  } finally {
    // ── Nettoyage ─────────────────────────────────────────────────────────────
    if (browser) {
      await browser.close();
      info('Chrome headless fermé.');
    }
    stopVitePreview(viteProc);
  }
}

main().catch(e => {
  err(`Erreur fatale : ${e.message}`);
  console.error(e);
  process.exit(1);
});
