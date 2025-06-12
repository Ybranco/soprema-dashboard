#!/bin/bash

# Script pour exécuter tous les tests et vérifier que l'application fonctionne

echo "🧪 EXÉCUTION DE TOUS LES TESTS"
echo "=============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Vérifier que npm est installé
echo -e "${BLUE}📦 Vérification des dépendances...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm n'est pas installé!${NC}"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installation des dépendances...${NC}"
    npm install
fi

# 1. Test des composants UI
echo ""
echo -e "${BLUE}1️⃣ TEST DES COMPOSANTS UI${NC}"
echo "------------------------"
node test-ui-components.js
UI_RESULT=$?
print_result $UI_RESULT "Test des composants UI"

# 2. Test de l'AI reconquest (simulation)
echo ""
echo -e "${BLUE}2️⃣ TEST AI RECONQUEST (SIMULATION)${NC}"
echo "--------------------------------"
node test-ai-reconquest.js
AI_SIM_RESULT=$?
print_result $AI_SIM_RESULT "Test AI reconquest (simulation)"

# 3. Vérifier si le serveur est lancé
echo ""
echo -e "${BLUE}3️⃣ VÉRIFICATION DU SERVEUR${NC}"
echo "------------------------"
SERVER_RUNNING=0
curl -s http://localhost:3001/health > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Le serveur n'est pas lancé${NC}"
    echo -e "${YELLOW}   Démarrage du serveur en arrière-plan...${NC}"
    npm run dev > server.log 2>&1 &
    SERVER_PID=$!
    echo "   PID du serveur: $SERVER_PID"
    echo "   Attente du démarrage (20 secondes)..."
    sleep 20
    SERVER_RUNNING=1
fi

# 4. Test AI reconquest réel (avec serveur)
echo ""
echo -e "${BLUE}4️⃣ TEST AI RECONQUEST (RÉEL)${NC}"
echo "--------------------------"
node test-ai-reconquest-real.js
AI_REAL_RESULT=$?
print_result $AI_REAL_RESULT "Test AI reconquest (réel)"

# 5. Tests complets (si serveur disponible)
echo ""
echo -e "${BLUE}5️⃣ TESTS COMPLETS DE L'APPLICATION${NC}"
echo "--------------------------------"
node test-comprehensive.js
COMP_RESULT=$?
print_result $COMP_RESULT "Tests complets"

# Arrêter le serveur si on l'a démarré
if [ $SERVER_RUNNING -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Arrêt du serveur de test...${NC}"
    kill $SERVER_PID 2>/dev/null
fi

# Résumé final
echo ""
echo "=============================="
echo -e "${BLUE}📊 RÉSUMÉ DES TESTS${NC}"
echo "=============================="
echo ""

TOTAL_TESTS=4
PASSED_TESTS=0

[ $UI_RESULT -eq 0 ] && ((PASSED_TESTS++))
[ $AI_SIM_RESULT -eq 0 ] && ((PASSED_TESTS++))
[ $AI_REAL_RESULT -eq 0 ] && ((PASSED_TESTS++))
[ $COMP_RESULT -eq 0 ] && ((PASSED_TESTS++))

echo "Tests réussis: $PASSED_TESTS/$TOTAL_TESTS"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 SUCCÈS ! Tous les tests sont passés.${NC}"
    echo -e "${GREEN}✅ L'application fonctionne correctement avec l'IA Claude.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Certains tests ont échoué.${NC}"
    echo -e "${YELLOW}Vérifiez les erreurs ci-dessus et assurez-vous que:${NC}"
    echo "  - La clé API Claude est configurée dans .env"
    echo "  - Le serveur peut être lancé avec 'npm run dev'"
    echo "  - Toutes les dépendances sont installées"
    exit 1
fi