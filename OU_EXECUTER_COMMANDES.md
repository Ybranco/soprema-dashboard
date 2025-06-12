# 🖥️ OÙ EXÉCUTER LES COMMANDES GIT

## 📍 Vous devez être dans le Terminal, dans le dossier de votre projet

### Comment vérifier que vous êtes au bon endroit :

1. **Ouvrez le Terminal** (sur Mac : Cmd+Espace, tapez "Terminal")

2. **Naviguez vers votre projet** :
```bash
cd /Users/yvesbranconier/Downloads/01_Analyse_Factures/Projet_Principal/Application_fatures_representants/project
```

3. **Vérifiez que vous êtes au bon endroit** :
```bash
pwd
```
Ça doit afficher : `/Users/yvesbranconier/Downloads/01_Analyse_Factures/Projet_Principal/Application_fatures_representants/project`

## 🎯 MAINTENANT, exécutez les commandes dans l'ordre :

### Étape 1 : Préparer votre code
```bash
./deploy.sh
```

### Étape 2 : Trouver VOTRE nom d'utilisateur GitHub
- Allez sur GitHub.com
- Regardez en haut à droite, cliquez sur votre avatar
- Votre nom d'utilisateur est affiché (ex: yvesbranconier, john123, etc.)

### Étape 3 : Ajouter le remote (REMPLACEZ "VOTRE-USERNAME")
Si votre nom GitHub est par exemple "yvesbranconier", la commande sera :
```bash
git remote add origin https://github.com/yvesbranconier/soprema-dashboard.git
```

⚠️ IMPORTANT : Remplacez "yvesbranconier" par VOTRE vrai nom d'utilisateur GitHub !

### Étape 4 : Pousser le code
```bash
git branch -M main
git push -u origin main
```

## 📝 Exemple complet :

Si votre nom GitHub est "jean123", voici TOUTES les commandes :
```bash
# 1. Aller dans le bon dossier
cd /Users/yvesbranconier/Downloads/01_Analyse_Factures/Projet_Principal/Application_fatures_representants/project

# 2. Préparer le code
./deploy.sh

# 3. Ajouter GitHub (avec VOTRE nom)
git remote add origin https://github.com/jean123/soprema-dashboard.git

# 4. Pousser
git branch -M main
git push -u origin main
```

## ❓ Comment trouver votre nom GitHub ?

1. Allez sur github.com
2. Une fois connecté, l'URL sera : github.com/VOTRE-NOM
3. OU cliquez sur votre photo en haut à droite
4. Votre nom est affiché sous "Signed in as"

## 🚨 Si vous avez une erreur

Si Git vous demande votre mot de passe, utilisez :
- Username : votre nom GitHub
- Password : votre TOKEN GitHub (pas votre mot de passe normal)

Pour créer un token : GitHub → Settings → Developer settings → Personal access tokens