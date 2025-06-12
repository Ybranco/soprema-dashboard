# Guide de Déploiement - Application Soprema Dashboard

## Option 1 : Déploiement sur Render (RECOMMANDÉ - Simple et Gratuit)

### Étapes :

1. **Créer un compte sur Render**
   - Allez sur https://render.com
   - Inscrivez-vous avec GitHub (recommandé)

2. **Préparer votre code sur GitHub**
   ```bash
   # Dans votre projet
   git add .
   git commit -m "Préparation pour déploiement"
   git push origin main
   ```

3. **Créer un nouveau Web Service sur Render**
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre repo GitHub
   - Configuration :
     - **Name**: soprema-dashboard
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run server`
     - **Instance Type**: Free

4. **Variables d'environnement**
   Dans Render, ajoutez ces variables :
   ```
   NODE_ENV=production
   PORT=3001
   VITE_API_URL=https://votre-app.onrender.com
   ANTHROPIC_API_KEY=votre-clé-api
   ILOVEPDF_PUBLIC_KEY=votre-clé-publique
   ILOVEPDF_SECRET_KEY=votre-clé-secrète
   ```

5. **Déployer**
   - Cliquez sur "Create Web Service"
   - L'application sera disponible à : https://soprema-dashboard.onrender.com

## Option 2 : Déploiement Local avec Ngrok (Pour tests rapides)

1. **Installer Ngrok**
   ```bash
   brew install ngrok
   ```

2. **Lancer votre app localement**
   ```bash
   npm run dev
   ```

3. **Exposer avec Ngrok**
   ```bash
   ngrok http 5173
   ```

4. **Partager le lien**
   - Ngrok vous donnera un lien comme : https://abc123.ngrok.io
   - Ce lien est temporaire (8h gratuit)

## Option 3 : Déploiement sur Railway (Simple, $5/mois)

1. **Créer un compte sur Railway**
   - https://railway.app

2. **Déployer depuis GitHub**
   - New Project → Deploy from GitHub
   - Sélectionnez votre repo
   - Railway détecte automatiquement Node.js

3. **Configuration automatique**
   - Railway configure tout automatiquement
   - Ajoutez vos variables d'environnement
   - Obtenez un domaine : soprema-dashboard.up.railway.app

## Configuration pour Production

### 1. Modifier le fichier `.env` pour la production :
```env
NODE_ENV=production
VITE_API_URL=https://votre-domaine.com
```

### 2. Sécuriser l'API :
Modifiez `server.js` pour ajouter l'authentification :

```javascript
// Ajoutez après les imports
const API_KEY = process.env.API_SECRET_KEY || 'votre-clé-secrète';

// Middleware d'authentification
app.use('/api/*', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
});
```

### 3. Build de production :
```bash
npm run build
```

## Partage avec vos collègues

Une fois déployé, partagez :
1. **L'URL de l'application**
2. **Un compte de démonstration** (si authentification)
3. **Guide d'utilisation rapide**

## Monitoring et Logs

- **Render** : Logs disponibles dans le dashboard
- **Railway** : Logs en temps réel dans l'interface
- **Ngrok** : Inspection du trafic sur http://localhost:4040

## Support

Pour des questions sur le déploiement :
- Documentation Render : https://render.com/docs
- Documentation Railway : https://docs.railway.app
- Documentation Ngrok : https://ngrok.com/docs