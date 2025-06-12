# 🚀 Instructions de Déploiement Complètes

## Étape 1: Créer un compte GitHub (5 minutes)

1. Allez sur **[github.com](https://github.com)**
2. Cliquez sur **"Sign up"** (bouton vert en haut à droite)
3. Entrez:
   - Votre email
   - Un mot de passe
   - Un nom d'utilisateur (ex: yvesbranconier)
4. Validez votre email

## Étape 2: Créer un repository (2 minutes)

1. Une fois connecté, cliquez sur le **"+"** en haut à droite
2. Choisissez **"New repository"**
3. Configuration:
   - Repository name: `soprema-dashboard`
   - Description: "Dashboard commercial Soprema avec analyse IA"
   - Laissez en **Public**
   - ⚠️ **NE PAS** cocher "Add a README file"
4. Cliquez sur **"Create repository"**
5. **GARDEZ CETTE PAGE OUVERTE** - vous aurez besoin des commandes

## Étape 3: Pousser votre code (5 minutes)

Dans le terminal de votre projet:

```bash
# 1. Exécuter le script de préparation
./deploy.sh

# 2. Ajouter le remote GitHub (remplacez VOTRE-USERNAME)
git remote add origin https://github.com/VOTRE-USERNAME/soprema-dashboard.git

# 3. Pousser le code
git branch -M main
git push -u origin main
```

## Étape 4: Déployer sur Render (10 minutes)

### 4.1 Créer un compte Render
1. Allez sur **[render.com](https://render.com)**
2. Cliquez sur **"Get Started for Free"**
3. Choisissez **"Connect with GitHub"**
4. Autorisez Render à accéder à votre GitHub

### 4.2 Créer le service
1. Cliquez sur **"New +"** → **"Web Service"**
2. Sélectionnez votre repo `soprema-dashboard`
3. Configuration:
   - **Name**: soprema-dashboard
   - **Region**: EU (Frankfurt)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 4.3 Variables d'environnement
Cliquez sur "Environment" et ajoutez:

```
NODE_ENV = production
PORT = 3001
ANTHROPIC_API_KEY = [votre clé Claude]
ILOVEPDF_PUBLIC_KEY = [votre clé iLovePDF publique]
ILOVEPDF_SECRET_KEY = [votre clé iLovePDF secrète]
VITE_GOOGLE_MAPS_API_KEY = [votre clé Google Maps]
```

### 4.4 Déployer
1. Cliquez sur **"Create Web Service"**
2. Attendez 5-10 minutes pour le déploiement
3. Votre app sera disponible à: `https://soprema-dashboard.onrender.com`

## 📱 Partager avec vos collègues

Une fois déployé, partagez simplement le lien:
- **URL**: https://soprema-dashboard.onrender.com
- **Note**: Le premier chargement peut prendre 30 secondes (serveur gratuit)

## 🔧 Mises à jour futures

Pour déployer des changements:
```bash
git add .
git commit -m "Description des changements"
git push
```
Render redéploiera automatiquement!

## ❓ Besoin d'aide?

- **GitHub**: support@github.com
- **Render**: https://render.com/docs
- **Problème technique**: Créez une issue sur votre repo GitHub

## 🎉 C'est tout!

Votre application sera en ligne et accessible à tous vos collègues en 20 minutes maximum.