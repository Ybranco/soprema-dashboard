# Guide de Diagnostic - Plans de Reconquête Client

## 🎯 Pourquoi aucun plan de reconquête n'est généré ?

### Seuils Minimums Requis

Pour qu'un plan de reconquête soit généré, un client doit remplir **AU MOINS UN** de ces critères :

1. **5000€ minimum de produits concurrents** (total sur toutes les factures du client)
2. **OU 2 factures minimum** (peu importe le montant)

### 🔍 Points de Vérification

#### 1. Les produits concurrents sont-ils correctement identifiés ?

Les produits doivent avoir :
- `isCompetitor: true` OU
- `type: 'competitor'`

**Marques concurrentes reconnues :**
- IKO
- KNAUF
- ISOVER
- U-THERM
- SMARTROOF
- ENERTHERM
- ROCKWOOL
- URSA
- KINGSPAN
- RECTICEL

**Marques SOPREMA (ne comptent PAS comme concurrents) :**
- EFYOS
- FLAGON
- SOPRASTICK
- ELASTOPHENE
- PARAFOR
- COLLTACK

#### 2. Les noms de clients sont-ils identiques ?

Les factures sont regroupées par nom de client **EXACT** :
- ❌ "DUPONT SA" et "DUPONT S.A." = 2 clients différents
- ❌ "ABC Construction" et "ABC CONSTRUCTION" = 2 clients différents
- ✅ Les noms doivent être parfaitement identiques (majuscules, espaces, ponctuation)

#### 3. Structure des données

Vérifiez que vos factures contiennent bien :
```json
{
  "client": {
    "name": "Nom exact du client"
  },
  "products": [
    {
      "designation": "Produit IKO",
      "totalPrice": 3000,
      "isCompetitor": true,  // ou "type": "competitor"
      "brand": "IKO"
    }
  ]
}
```

## 🧪 Tests de Diagnostic

### Test 1 : Vérifier les clés iLovePDF
```bash
npm run test:verify
```
✅ Les clés sont valides et fonctionnelles

### Test 2 : Tester la génération de plans
```bash
npm run test:reconquest
```
Ce test crée des factures d'exemple et montre quels clients devraient avoir des plans.

### Test 3 : Tester avec des factures réelles
1. Démarrez le serveur : `npm run dev`
2. Importez le fichier `test-invoices.json` généré
3. Cliquez sur "Générer les plans de reconquête"

## 📊 Exemples Concrets

### ✅ Client qui AURA un plan :
```
Client A : 1 facture avec 6000€ de produits IKO → Plan généré
Client B : 3 factures avec 1000€ chacune de KNAUF → Plan généré
```

### ❌ Client qui N'AURA PAS de plan :
```
Client C : 1 facture avec 2000€ de produits concurrents → Pas de plan
Client D : 5 factures avec uniquement des produits SOPREMA → Pas de plan
```

## 🛠️ Solutions

### Si iLovePDF ne fonctionne pas :
Le système utilise automatiquement d'autres méthodes de conversion :
1. Ghostscript (si installé)
2. pdf2pic
3. pdf-poppler
4. jimp (image de substitution)

### Pour déboguer vos 10 factures :
1. Exportez vos factures en JSON depuis l'application
2. Analysez-les pour vérifier :
   - Les montants de produits concurrents par client
   - Le nombre de factures par client
   - L'orthographe exacte des noms de clients
3. Utilisez le test de diagnostic pour voir ce qui devrait être généré

## 📝 Commandes Utiles

```bash
# Vérifier l'API iLovePDF
npm run test:verify

# Tester la logique de reconquête
npm run test:reconquest

# Lancer les tests unitaires
npm test

# Démarrer l'application
npm run dev
```

## ⚠️ Erreur 401 iLovePDF ?

Si vous avez une erreur 401 :
1. Vérifiez votre compte sur https://developer.ilovepdf.com/
2. Assurez-vous que votre compte est actif (payant)
3. Régénérez de nouvelles clés API si nécessaire
4. Mettez à jour le fichier `.env`

Le système continuera à fonctionner même sans iLovePDF grâce aux méthodes de conversion alternatives.