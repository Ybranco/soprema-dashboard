#!/bin/bash

# Commandes exactes pour Ybranco

# 1. Aller dans le bon dossier
cd /Users/yvesbranconier/Downloads/01_Analyse_Factures/Projet_Principal/Application_fatures_representants/project

# 2. Préparer le code
./deploy.sh

# 3. Ajouter GitHub avec VOTRE nom (Ybranco)
git remote add origin https://github.com/Ybranco/soprema-dashboard.git

# 4. Pousser le code
git branch -M main
git push -u origin main

echo "✅ Code envoyé sur GitHub !"
echo "🌐 Votre repo : https://github.com/Ybranco/soprema-dashboard"