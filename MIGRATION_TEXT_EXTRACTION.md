# 📝 Migration vers l'Extraction de Texte PDF

## 🎯 Pourquoi ce changement ?

Auparavant, le système convertissait les PDF en images JPG via iLovePDF, ce qui causait :
- Des erreurs "conversion alternative" fréquentes
- Des rejets de factures valides
- Des dépendances à un service externe
- Des problèmes de qualité d'extraction

## ✨ Nouvelle approche

Le système extrait maintenant directement le texte des PDF :
- ✅ Plus rapide et fiable
- ✅ Pas de dépendance externe
- ✅ Meilleure qualité d'extraction
- ✅ Support des PDF complexes
- ✅ Économie de bande passante

## 🔧 Changements techniques

1. **Nouvelle dépendance** : `pdf-parse` pour l'extraction de texte
2. **Nouveau module** : `pdf-text-extractor.js`
3. **Serveur modifié** : Utilise l'extraction de texte au lieu de la conversion JPG
4. **Prompt Claude adapté** : Analyse du texte au lieu des images pour les PDF

## 📊 Résultats attendus

- **Avant** : 5/10 factures validées (erreurs de conversion)
- **Après** : 9-10/10 factures validées

## 🚀 Utilisation

1. Le serveur détecte automatiquement les PDF
2. Extrait le texte avec `pdf-parse`
3. Envoie le texte formaté à Claude
4. Les images (JPG/PNG) continuent d'être traitées normalement

## 🧪 Test

Utilisez le script de test :
```bash
node test-pdf-extraction.js
```

## ⚠️ Notes importantes

- Les PDF scannés (images dans PDF) peuvent avoir une extraction limitée
- Pour ces cas, une OCR pourrait être nécessaire (future amélioration)
- Les images JPG/PNG continuent de fonctionner exactement comme avant

## 🔄 Retour arrière

Si besoin de revenir à l'ancienne version :
```bash
cp server.backup.*.js server.js
npm run dev
```

---
*Migration effectuée le 2025-06-11*
