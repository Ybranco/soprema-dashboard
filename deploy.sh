#!/bin/bash

echo "🚀 Préparation du déploiement..."

# Vérifier si on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Êtes-vous dans le bon dossier?"
    exit 1
fi

# Build de production
echo "📦 Build de production..."
npm run build

# Initialiser git si nécessaire
if [ ! -d ".git" ]; then
    echo "📝 Initialisation de Git..."
    git init
fi

# Ajouter tous les fichiers
echo "📁 Ajout des fichiers..."
git add .
git commit -m "Initial commit - Application Soprema Dashboard prête pour déploiement"

# Instructions pour l'utilisateur
echo ""
echo "✅ Code prêt pour GitHub!"
echo ""
echo "👉 Maintenant, copiez et exécutez ces commandes:"
echo ""
echo "git remote add origin https://github.com/VOTRE-USERNAME/soprema-dashboard.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "Remplacez VOTRE-USERNAME par votre nom d'utilisateur GitHub"