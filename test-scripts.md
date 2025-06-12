# 🧪 Guide des Tests Automatisés

## Installation

```bash
# Installer les dépendances de test
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom @playwright/test msw @vitest/coverage-v8

# Installer Playwright
npx playwright install
```

## Scripts de Test

Ajouter ces scripts dans votre `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

## Commandes Utiles

### Tests Unitaires et d'Intégration

```bash
# Lancer tous les tests
npm test

# Mode watch (relance automatique)
npm run test:watch

# Interface graphique
npm run test:ui

# Avec couverture de code
npm run test:coverage
```

### Tests E2E

```bash
# Lancer les tests E2E
npm run test:e2e

# Mode UI interactif
npm run test:e2e:ui

# Tests sur un navigateur spécifique
npx playwright test --project=chromium
```

## Structure des Tests

```
project/
├── src/
│   ├── components/
│   │   └── __tests__/        # Tests des composants
│   ├── services/
│   │   └── __tests__/        # Tests des services
│   ├── store/
│   │   └── __tests__/        # Tests du store
│   └── test/
│       └── setup.ts          # Configuration globale
├── e2e/                      # Tests End-to-End
├── vitest.config.ts         # Config Vitest
└── playwright.config.ts     # Config Playwright
```

## Best Practices

### 1. **Nommage des Tests**
```typescript
describe('ComponentName', () => {
  describe('feature/behavior', () => {
    it('should do something specific', () => {
      // Test
    })
  })
})
```

### 2. **Arrange-Act-Assert (AAA)**
```typescript
it('should calculate total correctly', () => {
  // Arrange
  const invoice = { amount: 100, tax: 20 }
  
  // Act
  const total = calculateTotal(invoice)
  
  // Assert
  expect(total).toBe(120)
})
```

### 3. **Mocking**
```typescript
// Mock d'un service
vi.mock('../services/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' })
}))

// Mock du localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock
```

### 4. **Tests Asynchrones**
```typescript
it('should load data', async () => {
  render(<MyComponent />)
  
  // Attendre que l'élément apparaisse
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

## Couverture de Code

```bash
# Générer un rapport de couverture
npm run test:coverage

# Ouvrir le rapport HTML
open coverage/index.html
```

### Objectifs de Couverture
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging

### Debug des Tests Unitaires
```bash
# Mode debug avec Node
node --inspect-brk ./node_modules/.bin/vitest run

# Avec VS Code: F5 avec cette config
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "program": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["run"],
  "console": "integratedTerminal"
}
```

### Debug des Tests E2E
```bash
# Mode debug Playwright
npx playwright test --debug

# Garder le navigateur ouvert
npx playwright test --headed --no-exit
```

## Exemples de Tests Critiques

### 1. Test du Flux d'Upload
- Upload de fichier unique
- Upload multiple (100 fichiers)
- Gestion des erreurs
- Affichage de la progression

### 2. Test de l'Analyse Claude
- Mock des réponses API
- Validation des données
- Gestion des timeouts
- Retry logic

### 3. Test du Store
- Ajout/suppression de factures
- Calculs de statistiques
- Persistance localStorage
- Réhydratation au démarrage

### 4. Test de la Reconquête Client
- Génération des plans
- Affichage sur la carte
- Export des données
- Mise à jour en temps réel

## Maintenance des Tests

### Checklist Hebdomadaire
- [ ] Vérifier les tests cassés
- [ ] Mettre à jour les snapshots si nécessaire
- [ ] Revoir la couverture de code
- [ ] Optimiser les tests lents
- [ ] Documenter les nouveaux tests

### Avant chaque Release
- [ ] Lancer la suite complète de tests
- [ ] Vérifier les tests E2E sur tous les navigateurs
- [ ] Valider la couverture minimale
- [ ] Tests de performance
- [ ] Tests de régression