#!/usr/bin/env bash
# ============================================================
#  JeryMotro API — Test automatisé
#  Usage : ./test_jerymotro.sh [BASE_URL] [JWT_TOKEN]
#  Ex    : ./test_jerymotro.sh http://35.192.27.164/jerymotro-api
# ============================================================

BASE_URL="${1:-http://35.192.27.164/jerymotro-api}"
MANUAL_TOKEN="${2:-}"

# ── Couleurs ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; PURPLE='\033[0;35m'
BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

# ── Compteurs ───────────────────────────────────────────────
PASS=0; FAIL=0; SKIP=0; WARN=0
TOKEN=""
RESULTS=()   # "id|status|code|duration|note"

# ── Comptes de test réels
TEST_PASSWORD="password123"
ADMIN_EMAIL="randriamanantenatsikynyantsa@gmail.com"
PREMIUM_EMAIL="tkabeleon@gmail.com"
PREMIUM_EMAIL_2="rtsikynyantsa@gmail.com"
STANDARD_EMAIL="tsikynyantsa1@outlook.fr"

# ── Helpers ─────────────────────────────────────────────────
ts()   { date '+%H:%M:%S'; }
sep()  { echo -e "${DIM}$(printf '─%.0s' {1..60})${RESET}"; }
title(){ echo -e "\n${BOLD}${CYAN}$1${RESET}"; sep; }

log_ok()   { echo -e "  ${GREEN}✔ PASS${RESET}  $*"; }
log_fail() { echo -e "  ${RED}✘ FAIL${RESET}  $*"; }
log_skip() { echo -e "  ${YELLOW}⊘ SKIP${RESET}  $*"; }
log_warn() { echo -e "  ${YELLOW}⚠ WARN${RESET}  $*"; }
log_info() { echo -e "  ${DIM}ℹ${RESET}       $*"; }

login_user() {
  local email="$1"
  local password="$2"
  log_info "Connexion en tant que ${email}"
  local res
  res=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}" "${BASE_URL}/auth/login")
  local code
  code=$(echo "$res" | tail -n1)
  local body
  body=$(echo "$res" | sed '$d')
  if [ "$code" = "200" ]; then
    TOKEN=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))")
    echo -e "           ${PURPLE}🔑 Token JWT capturé pour ${email}${RESET}"
    return 0
  fi
  echo -e "           ${RED}Échec login ${email} (HTTP ${code})${RESET}"
  echo "$body" | sed 's/^/           /'
  return 1
}

# ── Fonction principale de test ──────────────────────────────
# run_test ID "Nom" METHOD /path AUTH SKIP "SKIP_REASON" EXPECT_CODES BODY [TIMEOUT]
run_test() {
  local id="$1" name="$2" method="$3" path="$4"
  local auth="$5" skip="$6" skip_reason="$7"
  local expect="$8"   # codes acceptés séparés par | ex: "200|201|404"
  local body="$9"
  local timeout="${10:-15}"

  # ── SKIP ──
  if [ "$skip" = "true" ]; then
    log_skip "${DIM}${method} ${path}${RESET}  →  ${YELLOW}${skip_reason}${RESET}"
    RESULTS+=("${id}|skip|—|—|${skip_reason}")
    ((SKIP++))
    return
  fi

  # ── Headers ──
  local headers=(-s -w "\n%{http_code}\n%{time_total}" -X "$method")
  headers+=(-H "Content-Type: application/json")
  headers+=(--max-time "$timeout" --connect-timeout 8)

  if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
    headers+=(-H "Authorization: Bearer $TOKEN")
  fi

  if [ -n "$body" ]; then
    headers+=(-d "$body")
  fi

  # ── Requête ──
  local t0=$(date +%s%3N)
  local raw
  raw=$(curl "${headers[@]}" "${BASE_URL}${path}" 2>&1)
  local curl_exit=$?
  local t1=$(date +%s%3N)
  local duration=$(( t1 - t0 ))

  # ── Erreur réseau ──
  if [ $curl_exit -ne 0 ]; then
    log_fail "${BOLD}${name}${RESET}  ${DIM}${method} ${path}${RESET}"
    echo -e "           ${RED}Erreur réseau (curl exit ${curl_exit}) — ${raw}${RESET}"
    RESULTS+=("${id}|fail|ERR|${duration}|réseau")
    ((FAIL++))
    return
  fi

  # ── Parse code HTTP (dernière ligne) ──
  local http_code
  http_code=$(echo "$raw" | tail -2 | head -1)
  local body_resp
  body_resp=$(echo "$raw" | head -n -2)

  # ── Couleur du code ──
  local code_color="$GREEN"
  [[ "$http_code" -ge 400 ]] && code_color="$YELLOW"
  [[ "$http_code" -ge 500 ]] && code_color="$RED"

  # ── Vérifie si le code est attendu ──
  local ok=false
  IFS='|' read -ra expected_arr <<< "$expect"
  for expected_code in "${expected_arr[@]}"; do
    if [ "$http_code" = "$expected_code" ]; then
      ok=true; break
    fi
  done

  # ── Extrait message d'erreur si JSON ──
  local note=""
  if echo "$body_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('detail', d.get('message','')))[:50])" 2>/dev/null; then
    note=$(echo "$body_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('detail', d.get('message','')))[:50])" 2>/dev/null)
  fi

  # ── Capture token si login réussi ──
  if echo "$body_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('access_token',''); print(t) if t else exit(1)" 2>/dev/null; then
    TOKEN=$(echo "$body_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)
    echo -e "           ${PURPLE}🔑 Token JWT capturé et sauvegardé${RESET}"
  fi

  local dur_color="$GREEN"
  [[ $duration -gt 1500 ]] && dur_color="$YELLOW"
  [[ $duration -gt 4000 ]] && dur_color="$RED"

  if [ "$ok" = "true" ]; then
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
      log_ok "${BOLD}${name}${RESET}  ${DIM}${method} ${path}${RESET}  ${code_color}${http_code}${RESET}  ${dur_color}${duration}ms${RESET}${note:+  ${DIM}${note}${RESET}}"
      RESULTS+=("${id}|ok|${http_code}|${duration}|${note}")
      ((PASS++))
    else
      log_warn "${BOLD}${name}${RESET}  ${DIM}${method} ${path}${RESET}  ${code_color}${http_code}${RESET}  ${dur_color}${duration}ms${RESET}${note:+  ${DIM}${note}${RESET}}"
      RESULTS+=("${id}|warn|${http_code}|${duration}|${note}")
      ((WARN++))
    fi
  else
    log_fail "${BOLD}${name}${RESET}  ${DIM}${method} ${path}${RESET}  ${code_color}${http_code}${RESET}  ${dur_color}${duration}ms${RESET}${note:+  ${DIM}${note}${RESET}}"
    echo -e "           ${DIM}Attendu : ${expect}${RESET}"
    RESULTS+=("${id}|fail|${http_code}|${duration}|${note}")
    ((FAIL++))
  fi
}

# ════════════════════════════════════════════════════════════
#  DÉBUT DES TESTS
# ════════════════════════════════════════════════════════════

clear
echo -e "${BOLD}${CYAN}"
echo "  ____  ___  ____  __ __  _  _   ___  ____  ____   ___  "
echo " (_  _)(  _)(  _ \(  )  \( \/ ) /   \(_  _)(  _ \ /   \ "
echo "   )(   ) _)  )   / )(__/ )  (  \  O ) )(   )   /( O O )"
echo "   (__) (___)(__\_)(____/(_/\_)  \___/(__) (__\_) \___/ "
echo -e "${RESET}"
echo -e "  ${BOLD}API Tester${RESET} — Script bash automatisé"
echo -e "  ${DIM}$(date '+%d/%m/%Y %H:%M:%S')${RESET}"
sep
echo -e "  ${DIM}Base URL :${RESET} ${BOLD}${BASE_URL}${RESET}"
if [ -n "$MANUAL_TOKEN" ]; then
  TOKEN="$MANUAL_TOKEN"
  echo -e "  ${DIM}Token    :${RESET} ${PURPLE}fourni manuellement${RESET}"
else
  echo -e "  ${DIM}Token    :${RESET} ${YELLOW}sera capturé via /auth/login${RESET}"
fi
sep

# ─── 1. Santé & Docs ────────────────────────────────────────
title "🩺  Santé & Documentation"
run_test "health" "Health check"  GET "/health" false false "" "200" ""
run_test "docs"   "Swagger UI"    GET "/docs"   false false "" "200" ""
run_test "redoc"  "ReDoc"         GET "/redoc"  false false "" "200" ""

# ─── 2. Auth ────────────────────────────────────────────────
title "🔐  Authentification"
TS_EMAIL="ci_$(date +%s)@jerymotro.mg"
run_test "register" "Inscription (nouvel email)" \
  POST "/auth/register" false false "" "200|201|409" \
  "{\"email\":\"${TS_EMAIL}\",\"password\":\"TestCI123!\",\"full_name\":\"Test CI\",\"organization\":\"Auto Test\"}"

run_test "login_admin" "Connexion admin réel" \
  POST "/auth/login" false false "" "200" \
  "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}"

run_test "me"     "Mon profil (GET /auth/me)" GET "/auth/me" true false "" "200|401" ""
run_test "otp"    "OTP SMS"                   POST "/auth/otp/request" false true "SMS non impl." "" ""

# ─── 3. Détections ──────────────────────────────────────────
title "🔥  Détections FIRMS"
run_test "det_list"   "Liste des détections"  GET "/detections?limit=10"                     false false "" "200" ""
run_test "det_region" "Filtre région Menabe"  GET "/detections?region=Menabe&limit=5"        false false "" "200" ""
run_test "det_risk"   "Filtre min_risk=0.7"   GET "/detections?min_risk=0.7&limit=5"         false false "" "200" ""
run_test "det_date"   "Filtre date_from"      GET "/detections?date_from=2026-01-01&limit=5" false false "" "200" ""
run_test "det_stats"  "Stats quotidiennes"    GET "/detections/stats/daily"                   false false "" "200" ""
run_test "det_meta"   "Métadonnées dataset"   GET "/detections/meta"                          false false "" "200|404" ""

# ─── 4. Clusters ────────────────────────────────────────────
title "🗺️   Clusters (FireEvents)"
run_test "cls_list"   "Liste des clusters"        GET "/clusters?limit=10"              false false "" "200" ""
run_test "cls_active" "Clusters ACTIVE"            GET "/clusters?cluster_status=ACTIVE" false false "" "200" ""
run_test "cls_one"    "Détail cluster #1"          GET "/clusters/1"                     false false "" "200|404" ""
run_test "cls_dets"   "Détections du cluster #1"   GET "/clusters/1/detections"          false false "" "200|404" ""

# ─── 5. Prédictions ─────────────────────────────────────────
title "📡  Prédictions"
run_test "pred_latest"  "Dernière prédiction"   GET "/predictions/latest"                false false "" "200|404" ""
run_test "pred_riskmap" "Carte risque GeoJSON"  GET "/predictions/risk-map?min_risk=0.4" false false "" "200|404" ""

# ─── 6. Chat IA ─────────────────────────────────────────────
title "🤖  Chat IA (RAG)"
run_test "chat" "Message chatbot" \
  POST "/chat" false false "" "200|500|503" \
  '{"message":"Résumé de la situation à Madagascar.","temperature":0.1,"zone_id":null}'

# ─── 7. Alertes ─────────────────────────────────────────────
run_test "login_standard" "Connexion standard réel" \
  POST "/auth/login" false false "" "200" \
  "{\"email\":\"${STANDARD_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}"
title "🔔  Alertes"
run_test "alerts_me"  "Mes alertes"        GET  "/alerts/me"        true  false "" "200|401" ""
run_test "alerts_sub" "Abonnement email"   POST "/alerts/subscribe" true  false "" "200|201|401|409" \
  '{"channel":"EMAIL","destination":"ci@jerymotro.mg","min_risk":0.7,"min_frp":30.0}'
run_test "alerts_sms" "Abonnement SMS"     POST "/alerts/subscribe" true  true  "SMS non impl."  "" ""
run_test "alerts_wa"  "Abonnement WA"      POST "/alerts/subscribe" true  true  "WA non impl."   "" ""

# ─── 8. Zones Premium ───────────────────────────────────────
run_test "login_premium" "Connexion premium réel" \
  POST "/auth/login" false false "" "200" \
  "{\"email\":\"${PREMIUM_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}"
title "📌  Zones Premium"
run_test "zones_list"   "Mes zones"        GET  "/zones/" true false "" "200|401|403" ""
run_test "zones_create" "Créer une zone"   POST "/zones/" true false "" "200|201|401|403" \
  '{"name":"Zone CI Test","latitude":-19.5,"longitude":44.5,"radius_km":10.0,"min_risk":0.6,"min_frp":20.0}'

# ─── 9. Pipeline interne ────────────────────────────────────
run_test "login_admin_again" "Connexion admin réel" \
  POST "/auth/login" false false "" "200" \
  "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}"
title "⚙️   Pipeline interne"
run_test "int_firms"    "Process FIRMS"     POST "/internal/process-firms"    true false "" "200|202|401|403"     "" 60
run_test "int_clusters" "Rebuild clusters"  POST "/internal/rebuild-clusters" true false "" "200|202|401|403|404" "" 300
run_test "int_scoring"  "Run scoring ML"    POST "/internal/run-scoring"      true true  "ML non impl." "" "" 15

# ════════════════════════════════════════════════════════════
#  RAPPORT FINAL
# ════════════════════════════════════════════════════════════
TOTAL=$(( PASS + FAIL + WARN + SKIP ))
RUNNABLE=$(( PASS + FAIL + WARN ))

echo ""
sep
echo -e "${BOLD}  RAPPORT FINAL${RESET}"
sep
echo ""
printf "  %-12s ${GREEN}%d${RESET}\n"    "✔ Réussis"  $PASS
printf "  %-12s ${RED}%d${RESET}\n"      "✘ Échoués"  $FAIL
printf "  %-12s ${YELLOW}%d${RESET}\n"   "⚠ Warnings" $WARN
printf "  %-12s ${YELLOW}%d${RESET}\n"   "⊘ Ignorés"  $SKIP
printf "  %-12s ${BOLD}%d${RESET}\n"     "  Total"     $TOTAL
echo ""

# ── Barre de progression ──
if [ $RUNNABLE -gt 0 ]; then
  PCT=$(( PASS * 100 / RUNNABLE ))
  BAR_LEN=40
  FILLED=$(( PCT * BAR_LEN / 100 ))
  EMPTY=$(( BAR_LEN - FILLED ))
  BAR="${GREEN}$(printf '█%.0s' $(seq 1 $FILLED))${RESET}$(printf '░%.0s' $(seq 1 $EMPTY))"
  echo -e "  [${BAR}] ${BOLD}${PCT}%${RESET} réussis"
  echo ""
fi

# ── Liste des échecs ──
if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}${BOLD}Endpoints en échec :${RESET}"
  for entry in "${RESULTS[@]}"; do
    IFS='|' read -r rid rstatus rcode rdur rnote <<< "$entry"
    if [ "$rstatus" = "fail" ]; then
      echo -e "    ${RED}✘${RESET} ${rid}  →  HTTP ${rcode}${rnote:+  (${rnote})}"
    fi
  done
  echo ""
fi

sep
echo -e "  ${DIM}Terminé à $(date '+%H:%M:%S')${RESET}"
echo ""

# ── Code de sortie ──
[ $FAIL -eq 0 ] && exit 0 || exit 1
