#!/usr/bin/env bash
# ==============================================================================
#  deploy_prod.sh — Déploiement complet de JeryMotro en production
#
#  Ce script fait TOUT en une seule commande :
#    1. Installe les dépendances
#    2. Build le frontend Vite
#    3. Démarre Vite preview avec PM2
#    4. Sauvegarde la config PM2
#    5. Pousse les changements sur Git
#
#  Variables d'environnement disponibles (optionnelles) :
#    APP_DIR        Chemin vers le dossier du frontend  (défaut: répertoire du script)
#    VITE_PORT      Port de Vite preview                (défaut: 4173)
#    GIT_MSG        Message du commit Git                (défaut: généré automatiquement)
#
#  Usage :
#    chmod +x deploy_prod.sh
#    ./deploy_prod.sh
#    ou avec options :
#    VITE_PORT=8080 GIT_MSG="feat: update map" ./deploy_prod.sh
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
VITE_PORT="${VITE_PORT:-4173}"
GIT_MSG="${GIT_MSG:-"chore: deploy production $(date '+%Y-%m-%d %H:%M')"}"

PM2_VITE="jerymotro-vite"

# ── Bannière ───────────────────────────────────────────────────────────────────
echo -e ""
echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔥  JeryMotro — Déploiement Production             ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  %-60s║\n" "  Frontend : $APP_DIR"
printf "║  %-60s║\n" "  Vite     : http://localhost:$VITE_PORT"
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
check_cmd pm2
check_cmd git

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

# ── Étape 2 : Build Vite ──────────────────────────────────────────────────────
log_step "Build de production Vite"
log_info "$(TS) pnpm run build ..."

(cd "$APP_DIR" && pnpm run build 2>&1 | sed 's/^/    /')

if [[ ! -d "$APP_DIR/dist" ]]; then
  log_err "Le dossier dist/ n'existe pas après le build. Arrêt."
  exit 1
fi

BUILD_SIZE=$(du -sh "$APP_DIR/dist" 2>/dev/null | cut -f1 || echo "?")
log_ok "$(TS) Build terminé (dist/ = $BUILD_SIZE)"

# ── Étape 3 : Arrêt des anciennes instances PM2 ───────────────────────────────
log_step "Nettoyage des anciennes instances PM2"

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

stop_pm2 "$PM2_VITE"

# ── Étape 4 : Lancement Vite preview avec PM2 ─────────────────────────────────
log_step "Lancement de Vite preview (port $VITE_PORT)"
log_info "$(TS) Démarrage PM2 : $PM2_VITE ..."

pm2 start pnpm \
  --name "$PM2_VITE" \
  --cwd "$APP_DIR" \
  -- run serve 2>&1 | sed 's/^/    /'

log_ok "$(TS) Vite preview démarré → http://localhost:$VITE_PORT"

# Attendre que Vite soit prêt (max 15s)
log_info "Attente que Vite soit prêt..."
VITE_READY=false
for i in $(seq 1 15); do
  if curl -sf "http://localhost:$VITE_PORT" &>/dev/null; then
    VITE_READY=true
    log_ok "Vite répond sur le port $VITE_PORT (délai: ${i}s)"
    break
  fi
  sleep 1
done

if [[ "$VITE_READY" == false ]]; then
  log_warn "Vite ne répond pas encore."
fi

# Le build-time prerendering a généré les fichiers dans dist/public/
# pnpm run serve va directement les servir.

# ── Étape 6 : Sauvegarde PM2 ──────────────────────────────────────────────────
log_step "Sauvegarde de la configuration PM2"
pm2 save 2>&1 | sed 's/^/    /'
log_ok "Configuration PM2 sauvegardée (redémarrage automatique au boot actif)"

# ── Étape 7 : Commit & Push Git ───────────────────────────────────────────────
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
printf "║  %-60s║\n" "  🌐 Application disponible : http://localhost:$VITE_PORT"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Commandes utiles :                                          ║"
echo "║    pm2 status          — état des services                   ║"
echo "║    pm2 logs            — voir tous les logs en live          ║"
echo "║    pm2 restart all     — redémarrer tout                     ║"
echo "║    pm2 stop all        — arrêter tout                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

# Afficher l'état PM2 en fin de script
pm2 status
