# 📸 Étape 2 : Créer un Repository GitHub (Expliqué en détail)

## Qu'est-ce qu'un repository ?
Un "repository" (ou "repo") est comme un dossier en ligne où votre code sera stocké sur GitHub.

## Instructions détaillées :

### 1️⃣ Une fois connecté à GitHub, regardez en haut à droite
Vous verrez votre photo de profil et juste à côté un bouton **"+"**

```
[Votre nom] [🔔] [➕] [👤]
```

### 2️⃣ Cliquez sur le "+" puis sur "New repository"
Un menu apparaît :
- New repository ← CLIQUEZ ICI
- Import repository
- New gist
- New organization

### 3️⃣ Sur la page "Create a new repository"

Vous verrez un formulaire. Voici EXACTEMENT quoi mettre :

**Repository name** *
```
soprema-dashboard
```
↑ Tapez exactement ça dans la case

**Description** (optional)
```
Dashboard commercial Soprema avec analyse IA des factures
```
↑ C'est optionnel mais recommandé

**Public / Private**
```
(•) Public      ( ) Private
```
↑ Laissez sur Public (c'est gratuit)

**Initialize this repository with:**
```
[ ] Add a README file         ← NE PAS COCHER
[ ] Add .gitignore           ← NE PAS COCHER  
[ ] Choose a license         ← NE PAS COCHER
```
↑ TRÈS IMPORTANT : Ne cochez AUCUNE case !

### 4️⃣ Cliquez sur le gros bouton vert
```
[Create repository]
```

### 5️⃣ Page suivante TRÈS IMPORTANTE

Après avoir cliqué, GitHub vous montre une page avec des commandes.
**NE FERMEZ PAS CETTE PAGE !**

Vous verrez quelque chose comme :
```
Quick setup — if you've done this kind of thing before

...or create a new repository on the command line
echo "# soprema-dashboard" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM/soprema-dashboard.git
git push -u origin main
```

**GARDEZ CETTE PAGE OUVERTE** - vous aurez besoin de copier la ligne qui commence par `git remote add origin`

## ❓ Pourquoi c'est important ?

- Le repository est l'endroit où votre code sera stocké en ligne
- Render (l'hébergeur) va chercher le code depuis GitHub
- C'est comme ça que vos collègues pourront voir les mises à jour

## 🆘 Si vous êtes bloqué

Dites-moi à quelle étape vous êtes et je vous aiderai !