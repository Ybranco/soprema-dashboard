# 🧪 Guide des Tests - SOPREMA Dashboard

## ✅ Installation Complète

Toutes les dépendances de test ont été installées ! Vous êtes prêt à lancer les tests.

## 🚀 Comment Lancer les Tests

### 1. Tests Unitaires et d'Intégration

```bash
# Lancer tous les tests une fois
npm test

# Mode watch (relance automatique quand vous modifiez le code)
npm run test:watch

# Interface graphique interactive
npm run test:ui

# Avec rapport de couverture
npm run test:coverage
```

### 2. Tests End-to-End (E2E)

```bash
# Lancer les tests E2E
npm run test:e2e

# Interface graphique Playwright
npm run test:e2e:ui

# Lancer TOUS les tests (unitaires + E2E)
npm run test:all
```

## 📊 État Actuel des Tests

Les tests sont installés et configurés. Certains tests échouent actuellement car ils testent des fonctionnalités spécifiques qui nécessitent des ajustements dans le code.

### Ce qui fonctionne :
- ✅ Infrastructure de test complète
- ✅ Vitest pour les tests unitaires
- ✅ Playwright pour les tests E2E
- ✅ Configuration et setup
- ✅ Scripts npm configurés

### Tests disponibles :
1. **Tests du Store** (`src/store/__tests__/dashboardStore.test.ts`)
   - Ajout/suppression de factures
   - Calculs de statistiques
   - Reconquête client

2. **Tests des Services** (`src/services/__tests__/claudeService.test.ts`)
   - Analyse de factures
   - Validation des données
   - Détection des concurrents

3. **Tests des Composants** (`src/components/__tests__/InvoiceUpload.test.tsx`)
   - Upload de fichiers
   - Interface utilisateur
   - Gestion des erreurs

4. **Tests de Migration** (`src/__tests__/reconquest-migration.test.ts`)
   - Compatibilité ancien/nouveau système
   - Vérification de la terminologie

5. **Tests E2E** (`e2e/invoice-workflow.spec.ts`)
   - Workflow complet d'analyse
   - Upload multiple
   - Filtres et recherche

## 🎯 Commandes Rapides

```bash
# Test rapide pendant le développement
npm run test:watch

# Avant de commiter
npm test

# Test complet avant déploiement
npm run test:coverage

# Vérifier l'interface utilisateur
npm run test:ui
```

## 🔧 Résolution des Erreurs de Test

Si vous voyez des erreurs dans les tests, c'est normal ! Les tests vérifient que tout fonctionne correctement. Pour corriger :

1. **Erreurs de types** : Vérifiez que les interfaces correspondent
2. **Erreurs de données** : Assurez-vous que les mocks sont complets
3. **Erreurs E2E** : Lancez d'abord le serveur de développement

## 📈 Rapport de Couverture

Après avoir lancé `npm run test:coverage`, ouvrez le rapport :

```bash
# Mac
open coverage/index.html

# Windows
start coverage/index.html
```

## 🏃 Prochaines Étapes

1. Lancez `npm run test:watch` pour voir les tests en temps réel
2. Corrigez les tests qui échouent en modifiant le code
3. Ajoutez de nouveaux tests pour les nouvelles fonctionnalités
4. Visez 80% de couverture de code

## 💡 Tips

- Les tests sont votre filet de sécurité
- Écrivez des tests avant de coder (TDD)
- Un test qui échoue = une opportunité d'amélioration
- Les tests documentent le comportement attendu

---

**Tout est prêt !** Lancez `npm test` pour commencer. 🚀