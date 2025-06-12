```
# 🚀 SOPREMA Commercial Dashboard - Conversion PDF PREMIUM avec Ghostscript

## 📋 **Vue d'ensemble**

Le **SOPREMA Commercial Dashboard** est une application web avancée utilisant l'intelligence artificielle pour analyser automatiquement des factures de distributeurs et identifier les opportunités commerciales. L'application peut traiter jusqu'à **100 factures simultanément** avec des conversions PDF **PREMIUM** via Ghostscript et génère automatiquement des plans d'action géographiques.

### **🎯 Objectifs Principaux**

- **Analyse automatique** des factures PDF/images par Claude 3.5 Sonnet
- **Conversion PDF premium** avec Ghostscript (300 DPI, qualité professionnelle)
- **Identification des produits concurrents** et opportunités SOPREMA
- **Génération de plans d'action géographiques** personnalisés
- **Interface moderne** avec persistance automatique des données
- **Traitement par lots** pour des volumes importants (100 factures)
- **Conversion ultra-robuste** avec 4 méthodes de fallback dont Ghostscript

---

## 🔧 **Installation et Configuration**

### **Prérequis**

- **Node.js** 18+ et npm
- **Clés API** : Claude 3.5 Sonnet (Anthropic) + Google Maps
- **👑 Ghostscript** (RECOMMANDÉ pour conversion PDF premium)
- **macOS/Linux/Windows** supportés
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)

### **🚀 Installation Rapide**

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd soprema-dashboard

# 2. Installation des dépendances
npm install

# 3. 👑 INSTALLATION GHOSTSCRIPT PREMIUM (RECOMMANDÉ)
brew install ghostscript

# 4. Configuration automatique
npm run setup

# 5. Démarrage complet
npm run dev
```

---

## 🔑 **Configuration des Clés API - IMPORTANTE**

### **🧠 Claude 3.5 Sonnet (Anthropic) - OBLIGATOIRE**

1. **Créer un compte** : https://console.anthropic.com/
2. **Générer une clé API** : Dashboard > API Keys > Create Key
3. **⚠️ IMPORTANT: Configurer dans .env avec le BON nom** :
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   ```
4. **❌ NE PAS utiliser** : `CLAUDE_API_KEY` (nom incorrect)
5. **✅ Utiliser** : `ANTHROPIC_API_KEY` (nom officiel)
6. **Modèle utilisé** : `claude-3-5-sonnet-20241022` (le plus récent)

### **🗺️ Google Maps API - OPTIONNEL (pour la carte)**

1. **Console Google Cloud** : https://console.cloud.google.com/
2. **Créer/sélectionner un projet**
3. **Activer les APIs** :
   - Maps JavaScript API
   - Geocoding API
   - Places API (optionnel)
4. **Créer des identifiants** : API Key
5. **Configurer dans .env** :
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxx
   ```

### **⚙️ Configuration Complète .env - NOMS CORRECTS**

```env
# ==========================================
# CONFIGURATION COMPLÈTE SOPREMA DASHBOARD
# ==========================================

# 🧠 CLAUDE 3.5 SONNET (OBLIGATOIRE)
# ⚠️ IMPORTANT: Utilisez ANTHROPIC_API_KEY (pas CLAUDE_API_KEY)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# 🗺️ GOOGLE MAPS (OPTIONNEL)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxx

# 📱 APPLICATION
VITE_APP_TITLE=SOPREMA Commercial Dashboard
VITE_API_BASE_URL=http://localhost:3001/api

# 🚀 SERVEUR
PORT=3001
NODE_ENV=development
```

### **🛠️ Script de Correction Automatique**

Si vous avez utilisé `CLAUDE_API_KEY` par erreur, le script de setup le corrige automatiquement :

```bash
npm run setup
# ✅ Correction automatique: CLAUDE_API_KEY → ANTHROPIC_API_KEY
```

---

## 🔍 **Vérification de Configuration**

### **📊 Health Check Complet**

```bash
curl -s http://localhost:3001/api/health | jq '.'
```

**Réponse avec configuration correcte** :
```json
{
  "status": "OK",
  "features": {
    "claudeAI": true,
    "googleMaps": true,
    "ghostscriptPDF": true
  },
  "errors": []
}
```

**Réponse avec erreur de configuration** :
```json
{
  "status": "CONFIGURATION_REQUIRED",
  "features": {
    "claudeAI": false
  },
  "errors": [
    "ANTHROPIC_API_KEY manquante dans .env"
  ]
}
```

### **🔧 Tests de Fonctionnement**

#### **Test 1 : Variables d'environnement**
```bash
# Vérifier que les variables sont bien définies
echo $ANTHROPIC_API_KEY
echo $VITE_GOOGLE_MAPS_API_KEY
```

#### **Test 2 : Serveur et API**
```bash
# Test santé serveur
curl http://localhost:3001/api/health

# Test analyse (avec vraie facture)
# Upload via l'interface web à http://localhost:5173
```

#### **Test 3 : Application complète**
1. Démarrer : `npm run dev`
2. Ouvrir : http://localhost:5173
3. Vérifier les indicateurs verts dans l'interface
4. Uploader une facture test

---

## 🐛 **Dépannage Configuration**

### **❌ Erreur : "ANTHROPIC_API_KEY manquante"**

**Cause** : Variable d'environnement mal nommée ou absente

**Solutions** :
```bash
# 1. Vérifier le nom exact (sensible à la casse)
grep ANTHROPIC_API_KEY .env

# 2. Corriger si vous aviez CLAUDE_API_KEY
sed -i 's/CLAUDE_API_KEY/ANTHROPIC_API_KEY/g' .env

# 3. Ou utiliser le script automatique
npm run setup

# 4. Redémarrer le serveur
npm run dev
```

### **❌ Erreur : "Claude AI non configuré"**

**Cause** : Clé API invalide ou mal formatée

**Solutions** :
```bash
# 1. Vérifier le format de la clé (doit commencer par sk-ant-api03-)
echo $ANTHROPIC_API_KEY

# 2. Vérifier qu'il n'y a pas d'espaces ou de guillemets
cat .env | grep ANTHROPIC_API_KEY

# 3. Régénérer une nouvelle clé sur https://console.anthropic.com/
```

### **❌ Erreur : "Serveur non accessible"**

**Cause** : Serveur Node.js non démarré

**Solutions** :
```bash
# 1. Démarrer le serveur
npm run dev

# 2. Ou démarrer seulement le backend
npm run server

# 3. Vérifier que le port 3001 est libre
lsof -i :3001
```

---

## 🎉 **Démarrage et Vérification**

### **🎬 Séquence de Démarrage Correcte**

```bash
# 1. Configuration (une seule fois)
npm run setup
# ✅ Variables corrigées automatiquement

# 2. Installation dépendances
npm install

# 3. Vérification configuration
cat .env | grep ANTHROPIC_API_KEY
# Doit afficher: ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# 4. Démarrage
npm run dev
# ✅ Serveur: http://localhost:3001
# ✅ Frontend: http://localhost:5173

# 5. Test santé
curl http://localhost:3001/api/health
# ✅ {"status":"OK","features":{"claudeAI":true}}
```

### **🌐 URLs de l'Application**

- **🖥️ Frontend** : http://localhost:5173
- **🔧 API Backend** : http://localhost:3001
- **🏥 Health Check** : http://localhost:3001/api/health

### **✅ Indicateurs de Bon Fonctionnement**

1. **Console serveur** :
   ```
   ✅ Claude 3.5 Sonnet API: Initialisé
   ✅ Google Maps: Configuré (optionnel)
   👑 Ghostscript: PREMIUM ACTIVÉ (optionnel)
   ```

2. **Health check** :
   ```json
   {"status":"OK","features":{"claudeAI":true}}
   ```

3. **Interface web** :
   - Indicateur vert "Serveur prêt" lors de l'upload
   - Pas de message d'erreur rouge dans l'interface

---

## 📋 **Résumé des Noms Corrects**

### **✅ Variables d'Environnement Correctes**

| Variable | Nom Correct | Nom Incorrect |
|----------|-------------|---------------|
| Claude API | `ANTHROPIC_API_KEY` | ~~`CLAUDE_API_KEY`~~ |
| Google Maps | `VITE_GOOGLE_MAPS_API_KEY` | ✅ Correct |
| URL API | `VITE_API_BASE_URL` | ✅ Correct |
| Port serveur | `PORT` | ✅ Correct |

### **🔧 Commandes de Correction**

```bash
# Correction manuelle
sed -i 's/CLAUDE_API_KEY/ANTHROPIC_API_KEY/g' .env

# Correction automatique
npm run setup

# Vérification
grep -E "(ANTHROPIC|CLAUDE)_API_KEY" .env
```

---

## 🚀 **Fonctionnalités Garanties**

Avec la configuration correcte, votre application dispose de :

- ✅ **Claude 3.5 Sonnet** : Analyse réelle des factures avec IA
- ✅ **Ghostscript Premium** : Conversion PDF 300 DPI professionnelle
- ✅ **100 factures simultanées** : Traitement par lots optimisé
- ✅ **Plans d'action géographiques** : Générés automatiquement
- ✅ **Persistance automatique** : Données sauvegardées dans le navigateur
- ✅ **Interface moderne** : React TypeScript avec animations

**🎯 Avec la variable `ANTHROPIC_API_KEY` correctement configurée, votre application fonctionne parfaitement !**

---

*Documentation mise à jour le 10 décembre 2024 - Version 4.0 avec correction variables d'environnement*
```