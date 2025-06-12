# 🧪 Guide de Test Complet - Application Factures avec IA

## 🎯 Vue d'ensemble

Ce guide explique comment tester l'application après l'implémentation de la génération de plans de reconquête par Claude AI.

## 📋 Scripts de Test Disponibles

### 1. **test-ui-components.js**
- ✅ Vérifie que tous les composants React/TypeScript compilent
- ✅ Teste l'intégration du nouveau modal AI
- ✅ Vérifie le build de production
- ✅ Valide la structure des données AI

**Utilisation:**
```bash
node test-ui-components.js
```

### 2. **test-ai-reconquest.js** (Simulation)
- ✅ Simule la génération de plans AI
- ✅ Valide la structure du prompt
- ✅ Teste le format de sortie attendu

**Utilisation:**
```bash
node test-ai-reconquest.js
```

### 3. **test-ai-reconquest-real.js** (Test Réel)
- ✅ Appelle vraiment l'endpoint du serveur
- ✅ Teste la génération AI avec Claude
- ✅ Vérifie la personnalisation des plans
- ✅ Mesure les temps de réponse

**Utilisation:**
```bash
# D'abord lancer le serveur
npm run dev

# Dans un autre terminal
node test-ai-reconquest-real.js
```

### 4. **test-comprehensive.js** (Tests Complets)
- ✅ Test de santé du serveur
- ✅ Upload de factures
- ✅ Extraction Claude
- ✅ Génération de plans AI
- ✅ Statistiques et comptage
- ✅ Conversion PDF
- ✅ Filtrage produits
- ✅ Workflow complet
- ✅ Performance
- ✅ Gestion d'erreurs

**Utilisation:**
```bash
# Serveur doit être lancé
node test-comprehensive.js
```

### 5. **RUN_ALL_TESTS.sh** (Script Principal)
- 🚀 Lance TOUS les tests automatiquement
- 🚀 Démarre le serveur si nécessaire
- 🚀 Génère un rapport complet

**Utilisation:**
```bash
./RUN_ALL_TESTS.sh
```

## 🔧 Configuration Requise

### 1. Variables d'Environnement (.env)
```env
ANTHROPIC_API_KEY=votre_clé_claude
ILOVEPDF_PUBLIC_KEY=votre_clé_publique
ILOVEPDF_SECRET_KEY=votre_clé_secrète
PORT=3001
```

### 2. Dépendances
```bash
npm install
```

## 📊 Tests Manuels Recommandés

### Test 1: Upload et Génération AI
1. Lancer l'application: `npm run dev`
2. Ouvrir http://localhost:5173
3. Uploader des factures avec produits concurrents
4. Aller dans l'onglet "Reconquête"
5. Vérifier que les plans se génèrent automatiquement
6. Ouvrir un plan et vérifier le contenu AI personnalisé

### Test 2: Vérification des Statistiques
1. Noter le nombre de factures uploadées
2. Vérifier dans le dashboard:
   - Factures analysées
   - Factures validées
   - Clients uniques
   - Plans générés

### Test 3: Performance AI
1. Uploader 5-10 factures
2. Chronométrer la génération des plans
3. Devrait prendre 1-2 minutes max

## 🐛 Résolution de Problèmes

### Erreur: "Le serveur n'est pas accessible"
```bash
# Vérifier que le serveur est lancé
npm run dev

# Vérifier le port
lsof -i :3001
```

### Erreur: "API Claude non configurée"
```bash
# Vérifier le fichier .env
cat .env | grep ANTHROPIC

# Tester la clé
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Erreur: "image cannot be empty"
- Vérifier que iLovePDF est configuré
- Tester avec des PDFs valides
- Vérifier les logs du serveur

## ✅ Checklist de Validation

- [ ] Tous les tests UI passent
- [ ] Le serveur démarre sans erreur
- [ ] Upload de factures fonctionne
- [ ] Extraction Claude fonctionne
- [ ] Plans AI générés automatiquement
- [ ] Contenu personnalisé (pas générique)
- [ ] Statistiques correctes
- [ ] Performance acceptable (<2min)
- [ ] Pas d'erreurs console
- [ ] Build de production réussi

## 📈 Métriques de Succès

1. **Temps de génération AI**: < 2 minutes pour 10 clients
2. **Taux de succès**: > 95% des factures traitées
3. **Qualité des plans**: Contenu personnalisé et pertinent
4. **Stabilité**: Aucun crash sur 100 uploads

## 🚀 Lancement Rapide

Pour tester rapidement que tout fonctionne:

```bash
# 1. Installation
npm install

# 2. Configuration
cp .env.example .env
# Éditer .env avec vos clés

# 3. Tests automatiques
./RUN_ALL_TESTS.sh

# 4. Test manuel
npm run dev
# Ouvrir http://localhost:5173
```

## 📝 Notes Importantes

1. **Génération AI**: Les plans sont maintenant générés par Claude AI, pas par des règles prédéfinies
2. **Temps d'attente**: Normal d'attendre 1-2 minutes pour la génération
3. **Seuil minimum**: 1000€ de produits concurrents pour générer un plan
4. **Limite**: Maximum 15 plans générés à la fois (pour éviter timeout)

---

💡 **Astuce**: En cas de doute, lancez `./RUN_ALL_TESTS.sh` qui vérifiera automatiquement que tout fonctionne!