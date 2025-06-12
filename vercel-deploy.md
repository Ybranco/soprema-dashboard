# 🚀 Déploiement GRATUIT avec Vercel (Sans carte de crédit)

## Étape 1 : Installer Vercel CLI

Dans votre Terminal :
```bash
npm install -g vercel
```

## Étape 2 : Déployer

Dans le dossier de votre projet :
```bash
vercel
```

## Étape 3 : Répondre aux questions

1. **Set up and deploy "~/Downloads/.../project"?** → Tapez `Y` (Yes)
2. **Which scope?** → Appuyez sur Entrée
3. **Link to existing project?** → Tapez `N` (No)
4. **What's your project's name?** → Tapez `soprema-dashboard`
5. **In which directory is your code located?** → Appuyez sur Entrée (./
6. **Want to override the settings?** → Tapez `N` (No)

## Étape 4 : Configuration automatique

Vercel va :
- Détecter que c'est une app Vite
- Construire votre application
- Vous donner un lien comme : https://soprema-dashboard.vercel.app

## Étape 5 : Ajouter les variables d'environnement

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur votre projet
3. Settings → Environment Variables
4. Ajoutez :
   - ANTHROPIC_API_KEY
   - ILOVEPDF_PUBLIC_KEY
   - ILOVEPDF_SECRET_KEY
   - NODE_ENV = production

## 🎉 C'est tout !

Votre app sera accessible à tous sans carte de crédit !