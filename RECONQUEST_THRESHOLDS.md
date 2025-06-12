# Seuils de Génération des Plans de Reconquête

## ✅ Modification Effectuée

La condition des "2 factures minimum" a été supprimée. 

## 📊 Seuil Actuel

**Un seul critère :** Les plans de reconquête sont générés uniquement pour les clients ayant :
- **Au moins 5 000€ de produits concurrents** (produits non-Soprema)

## 🎯 Pourquoi ce seuil ?

- **Concentration sur le potentiel significatif** : 5 000€ représente un volume d'affaires suffisant pour justifier un effort commercial de reconquête
- **ROI optimisé** : Les ressources commerciales sont allouées aux opportunités les plus rentables
- **Approche qualitative** : Mieux vaut se concentrer sur quelques gros clients que disperser les efforts

## 📝 Impact de la Modification

Avant :
- Plans générés si : 5000€ de produits concurrents **OU** 2+ factures

Maintenant :
- Plans générés si : 5000€ de produits concurrents **uniquement**

## 💡 Conseils

Si aucun plan n'est généré après analyse de vos factures :

1. **Vérifiez que les produits concurrents sont bien identifiés** 
   - Les produits doivent avoir `isCompetitor: true` ou `type: 'competitor'`
   - Claude AI identifie automatiquement les marques concurrentes

2. **Analysez plus de factures**
   - Plus vous avez de factures, plus vous avez de chances d'identifier des clients à fort potentiel

3. **Vérifiez les montants**
   - Un client peut avoir plusieurs factures qui, cumulées, dépassent le seuil de 5000€

## 🔧 Pour Modifier le Seuil

Si vous souhaitez ajuster le seuil de 5000€, modifiez la ligne suivante dans `server.js` :

```javascript
const MIN_COMPETITOR_AMOUNT = 5000; // Modifier cette valeur
```

Par exemple :
- `3000` pour des marchés plus petits
- `10000` pour se concentrer uniquement sur les très gros clients