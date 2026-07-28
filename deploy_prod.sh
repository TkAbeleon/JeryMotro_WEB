#!/usr/bin/env bash
# ==============================================================================
#  deploy_prod.sh — Déploiement complet de JeryMotro en production
#
#  Ce script fait TOUT en une seule commande :
#    1. Installe les dépendances
#    2. Build le frontend Vite (+ prerendering automatique via postbuild)
#    3. Recharge nginx pour servir les nouveaux fichiers
#    4. Pousse les changements sur Git
#
#  Nginx sert directement les fichiers statiques depuis dist/public/.
#  Aucun process Node en background n'est nécessaire.
#
#  Variables d'environnement disponibles (optionnelles) :
#    APP_DIR        Chemin vers le dossier du frontend  (défaut: répertoire du script)
#    GIT_MSG        Message du commit Git                (défaut: généré automatiquement)
#
#  Usage :
#    chmod +x deploy_prod.sh
#    ./deploy_prod.sh
#    ou avec options :
#    GIT_MSG="feat: update map" ./deploy_prod.sh
# ==============================================================================

set -euo pipefail

# ── Couleurs & helpers ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

STEP=0
log_step() { STEP=$((STEP+1)); echo -e "\n${BOLD}${BLUE}━━━ Étape ${STEP} : $1${RESET}"; }
log_ok()   { echo -e "  ${GREEN}✔  $1${RESET}"; }
log_warn() { echo -e "  ${YELLOW}⚠  $1${RESET}"; }
log_err()  { echo -e "  ${RED}✖  $1${RESET}"; }
log_info() { echo -e "  ${CYAN}ℹ  $1${RESET}"; }

# Horodatage pour les logs
TS() { date '+%H:%M:%S'; }

# ── Configuration ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Si le script est à la racine du workspace, APP_DIR pointe vers le frontend
if [[ -d "$SCRIPT_DIR/artifacts/jerymotro" ]]; then
  DEFAULT_APP_DIR="$SCRIPT_DIR/artifacts/jerymotro"
else
  DEFAULT_APP_DIR="$SCRIPT_DIR"  # si le script est déjà dans jerymotro/
fi

APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
GIT_MSG="${GIT_MSG:-"chore: deploy production $(date '+%Y-%m-%d %H:%M')"}"

# ── Bannière ───────────────────────────────────────────────────────────────────
echo -e ""
echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔥  JeryMotro — Déploiement Production             ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  %-60s║\n" "  Frontend : $APP_DIR"
printf "║  %-60s║\n" "  Serveur  : nginx (fichiers statiques)"
printf "║  %-60s║\n" "  Heure    : $(date '+%Y-%m-%d %H:%M:%S')"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Vérifications préalables ───────────────────────────────────────────────────
log_step "Vérification des prérequis"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    log_ok "$1 disponible ($(command -v "$1"))"
  else
    log_err "$1 est introuvable. Veuillez l'installer."
    exit 1
  fi
}

check_cmd pnpm
check_cmd node
check_cmd git

# Vérifier nginx (pas obligatoire, juste un warning)
if command -v nginx &>/dev/null; then
  log_ok "nginx disponible ($(command -v nginx))"
else
  log_warn "nginx non trouvé — le rechargement automatique sera ignoré"
fi

if [[ ! -d "$APP_DIR" ]]; then
  log_err "Dossier frontend introuvable : $APP_DIR"
  exit 1
fi

if [[ ! -f "$APP_DIR/package.json" ]]; then
  log_err "package.json introuvable dans $APP_DIR"
  exit 1
fi

# ── Étape 1 : Installation des dépendances ────────────────────────────────────
log_step "Installation des dépendances pnpm"
log_info "$(TS) pnpm install dans $APP_DIR ..."

# On installe depuis la racine du workspace pour respecter le monorepo
WORKSPACE_ROOT="$(cd "$APP_DIR/../.." && pwd)"
if [[ -f "$WORKSPACE_ROOT/pnpm-workspace.yaml" ]]; then
  log_info "Monorepo détecté, installation depuis la racine : $WORKSPACE_ROOT"
  (cd "$WORKSPACE_ROOT" && pnpm install --frozen-lockfile 2>&1 | \
    sed 's/^/    /')
else
  (cd "$APP_DIR" && pnpm install --frozen-lockfile 2>&1 | sed 's/^/    /')
fi

log_ok "$(TS) Dépendances installées"

# ── Étape 2 : Build Vite + Prerendering ───────────────────────────────────────
log_step "Build de production Vite (+ prerendering postbuild)"
log_info "$(TS) pnpm run build ..."

(cd "$APP_DIR" && pnpm run build 2>&1 | sed 's/^/    /')

if [[ ! -d "$APP_DIR/dist" ]]; then
  log_err "Le dossier dist/ n'existe pas après le build. Arrêt."
  exit 1
fi

BUILD_SIZE=$(du -sh "$APP_DIR/dist" 2>/dev/null | cut -f1 || echo "?")
log_ok "$(TS) Build terminé (dist/ = $BUILD_SIZE)"

# Vérifier que le prerendering a produit les fichiers
if [[ -d "$APP_DIR/dist/public/fr" ]]; then
  PRERENDER_COUNT=$(find "$APP_DIR/dist/public/fr" "$APP_DIR/dist/public/mg" "$APP_DIR/dist/public/en" -name "index.html" 2>/dev/null | wc -l)
  log_ok "Fichiers prerendus détectés : $PRERENDER_COUNT fichiers HTML"
else
  log_warn "Aucun fichier prerendu détecté dans dist/public/fr/ — le prerendering a peut-être échoué"
fi

# ── Étape 3 : Nettoyage PM2 (anciennes instances, si existantes) ──────────────
if command -v pm2 &>/dev/null; then
  log_step "Nettoyage des anciennes instances PM2 (si existantes)"

  stop_pm2() {
    local name="$1"
    if pm2 describe "$name" &>/dev/null; then
      pm2 stop "$name"    &>/dev/null || true
      pm2 delete "$name"  &>/dev/null || true
      log_ok "Instance '$name' arrêtée et supprimée"
    else
      log_info "Instance '$name' n'existait pas (rien à faire)"
    fi
  }

  stop_pm2 "jerymotro-vite"
  stop_pm2 "jerymotro-render"
  pm2 save &>/dev/null || true
  log_info "PM2 nettoyé — nginx sert les fichiers statiques directement"
fi

# ── Étape 4 : Rechargement nginx ──────────────────────────────────────────────
if command -v nginx &>/dev/null; then
  log_step "Rechargement de nginx"
  if sudo nginx -t 2>&1 | sed 's/^/    /'; then
    sudo systemctl reload nginx 2>&1 | sed 's/^/    /'
    log_ok "$(TS) nginx rechargé — les nouveaux fichiers sont servis"
  else
    log_warn "La configuration nginx a une erreur de syntaxe"
    log_warn "Corrigez /etc/nginx/sites-available/default puis : sudo systemctl reload nginx"
  fi
else
  log_step "Rechargement nginx (ignoré — nginx non installé)"
  log_info "Rechargez nginx manuellement : sudo systemctl reload nginx"
fi

# ── Étape 5 : Commit & Push Git ───────────────────────────────────────────────
log_step "Commit & Push Git"
REPO_ROOT="$(cd "$APP_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo '')"

if [[ -z "$REPO_ROOT" ]]; then
  log_warn "Dossier non suivi par Git, étape ignorée"
else
  cd "$REPO_ROOT"
  log_info "Dépôt Git : $REPO_ROOT"

  # Vérifier s'il y a des changements à committer
  if git status --porcelain | grep -q .; then
    log_info "Fichiers modifiés détectés, création du commit..."
    git add -A 2>&1 | sed 's/^/    /'
    git commit -m "$GIT_MSG" 2>&1 | sed 's/^/    /'

    # Récupérer la branche courante
    BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')"
    log_info "Push vers origin/$BRANCH ..."
    git push origin "$BRANCH" 2>&1 | sed 's/^/    /'
    log_ok "$(TS) Push effectué sur origin/$BRANCH"
  else
    log_info "Aucun changement à committer (working tree propre)"
    log_info "Push de l'état actuel quand même..."
    BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')"
    git push origin "$BRANCH" 2>&1 | sed 's/^/    /' || log_warn "Push ignoré (déjà à jour ou pas de remote)"
  fi
fi

# ── Résumé final ──────────────────────────────────────────────────────────────
echo -e ""
echo -e "${BOLD}${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅  Déploiement terminé avec succès            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  %-60s║\n" "  🌐 https://jerymotro.duckdns.org"
printf "║  %-60s║\n" "  📁 Fichiers : $APP_DIR/dist/public/"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Commandes utiles :                                          ║"
echo "║    sudo nginx -t          — tester la config nginx           ║"
echo "║    sudo systemctl reload nginx — recharger nginx             ║"
echo "║    cat dist/public/fr/index.html | head -20  — vérifier SEO  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"
