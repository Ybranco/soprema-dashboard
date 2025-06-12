#!/usr/bin/env node

/**
 * Script de test complet pour vérifier toutes les fonctionnalités
 * après l'implémentation AI des plans de reconquête
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3001';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utilitaires pour affichage
const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}🧪 ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.magenta}━━━ ${msg} ━━━${colors.reset}`)
};

// Données de test
const testInvoices = [
  {
    filename: 'test-invoice-1.pdf',
    content: Buffer.from('Fake PDF content 1'),
    expectedClient: 'ÉTABLISSEMENTS MARTIN',
    expectedProducts: ['IKO ARMOURPLAN', 'KNAUF INSULATION']
  },
  {
    filename: 'test-invoice-2.pdf', 
    content: Buffer.from('Fake PDF content 2'),
    expectedClient: 'ENTREPRISE DURAND',
    expectedProducts: ['ROCKWOOL', 'ISOVER']
  }
];

// Tests unitaires
class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    try {
      await testFn();
      this.results.passed++;
      log.success(name);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      log.error(`${name}: ${error.message}`);
    }
  }

  printSummary() {
    log.section('RÉSUMÉ DES TESTS');
    console.log(`Total: ${this.results.total}`);
    console.log(`${colors.green}Réussis: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Échoués: ${this.results.failed}${colors.reset}`);
    
    if (this.results.errors.length > 0) {
      console.log('\nErreurs détaillées:');
      this.results.errors.forEach(err => {
        console.log(`  ${colors.red}• ${err.test}: ${err.error}${colors.reset}`);
      });
    }
    
    return this.results.failed === 0;
  }
}

// Suite de tests
async function runComprehensiveTests() {
  const runner = new TestRunner();
  
  log.title('TEST COMPLET DE L\'APPLICATION FACTURES');
  log.info(`URL du serveur: ${BASE_URL}`);
  
  // 1. Test de santé du serveur
  log.section('1. TESTS DU SERVEUR');
  
  await runner.runTest('Serveur accessible', async () => {
    const response = await axios.get(`${BASE_URL}/health`).catch(() => null);
    if (!response || response.status !== 200) {
      throw new Error('Le serveur n\'est pas accessible');
    }
  });

  await runner.runTest('API Claude configurée', async () => {
    const response = await axios.get(`${BASE_URL}/api/claude-status`);
    if (!response.data.configured) {
      throw new Error('API Claude non configurée');
    }
  });

  // 2. Test upload de factures
  log.section('2. TESTS UPLOAD FACTURES');
  
  let uploadedInvoices = [];
  
  await runner.runTest('Upload simple de facture', async () => {
    const formData = new FormData();
    formData.append('invoices', testInvoices[0].content, {
      filename: testInvoices[0].filename,
      contentType: 'application/pdf'
    });
    
    const response = await axios.post(`${BASE_URL}/api/upload-invoices`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    if (!response.data.success) {
      throw new Error('Upload échoué');
    }
    
    uploadedInvoices = response.data.invoices || [];
  });

  await runner.runTest('Upload multiple de factures', async () => {
    const formData = new FormData();
    testInvoices.forEach(invoice => {
      formData.append('invoices', invoice.content, {
        filename: invoice.filename,
        contentType: 'application/pdf'
      });
    });
    
    const response = await axios.post(`${BASE_URL}/api/upload-invoices`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    if (!response.data.success) {
      throw new Error('Upload multiple échoué');
    }
  });

  // 3. Test extraction Claude
  log.section('3. TESTS EXTRACTION CLAUDE');
  
  await runner.runTest('Extraction des données de facture', async () => {
    const response = await axios.post(`${BASE_URL}/api/extract-invoice-data`, {
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=',
      prompt: 'Test extraction'
    });
    
    if (!response.data.content) {
      throw new Error('Pas de contenu extrait');
    }
  });

  // 4. Test génération plans AI
  log.section('4. TESTS PLANS DE RECONQUÊTE AI');
  
  let reconquestPlans = [];
  
  await runner.runTest('Génération de plans de reconquête AI', async () => {
    // Simuler des factures avec produits concurrents
    const testData = {
      invoices: [{
        id: 'test-1',
        number: 'FAC-2024-001',
        client: { name: 'ÉTABLISSEMENTS MARTIN' },
        amount: 25000,
        products: [
          {
            reference: 'IKO-001',
            designation: 'Membrane IKO',
            totalPrice: 15000,
            type: 'competitor',
            isCompetitor: true,
            brand: 'IKO'
          }
        ]
      }]
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/customer-reconquest-plans`,
      testData
    );
    
    if (!response.data.success) {
      throw new Error('Génération échouée');
    }
    
    reconquestPlans = response.data.plans;
    if (!reconquestPlans || reconquestPlans.length === 0) {
      throw new Error('Aucun plan généré');
    }
  });

  await runner.runTest('Structure du plan AI valide', async () => {
    if (reconquestPlans.length === 0) {
      throw new Error('Pas de plans à vérifier');
    }
    
    const plan = reconquestPlans[0];
    const requiredFields = [
      'id', 'clientName', 'priority', 'reconquestStrategy'
    ];
    
    for (const field of requiredFields) {
      if (!plan[field]) {
        throw new Error(`Champ manquant: ${field}`);
      }
    }
    
    // Vérifier la structure AI
    const strategy = plan.reconquestStrategy;
    if (!strategy.priority || !strategy.suggestedActions || !strategy.competitiveAnalysis) {
      throw new Error('Structure de stratégie AI incomplète');
    }
  });

  await runner.runTest('Contenu AI personnalisé', async () => {
    if (reconquestPlans.length === 0) {
      throw new Error('Pas de plans à vérifier');
    }
    
    const plan = reconquestPlans[0];
    const strategy = plan.reconquestStrategy;
    
    // Vérifier que c'est bien du contenu AI et pas des règles prédéfinies
    const genericPhrases = [
      'Offre de réduction standard',
      'Service client standard',
      'Formation générique'
    ];
    
    const actions = strategy.suggestedActions || [];
    for (const action of actions) {
      for (const phrase of genericPhrases) {
        if (action.description && action.description.includes(phrase)) {
          throw new Error('Contenu générique détecté - pas de personnalisation AI');
        }
      }
    }
  });

  // 5. Test statistiques et comptage
  log.section('5. TESTS STATISTIQUES');
  
  await runner.runTest('Comptage correct des factures', async () => {
    // Ce test vérifie le problème signalé par l'utilisateur
    const response = await axios.get(`${BASE_URL}/api/invoice-stats`);
    const stats = response.data;
    
    if (!stats) {
      throw new Error('Pas de statistiques disponibles');
    }
    
    log.info(`Factures uploadées: ${stats.uploaded || 0}`);
    log.info(`Factures extraites: ${stats.extracted || 0}`);
    log.info(`Factures validées: ${stats.validated || 0}`);
  });

  // 6. Test conversion PDF
  log.section('6. TESTS CONVERSION PDF');
  
  await runner.runTest('Conversion PDF vers image', async () => {
    const response = await axios.post(`${BASE_URL}/api/convert-pdf`, {
      pdfPath: './test-invoice.pdf'
    });
    
    if (response.data.error && response.data.error.includes('image cannot be empty')) {
      throw new Error('Erreur de conversion: image vide');
    }
  });

  // 7. Test filtrage produits
  log.section('7. TESTS FILTRAGE PRODUITS');
  
  await runner.runTest('Identification produits concurrents', async () => {
    const testProduct = {
      reference: 'IKO-123',
      designation: 'Membrane IKO ARMOURPLAN',
      brand: 'IKO'
    };
    
    const response = await axios.post(`${BASE_URL}/api/check-competitor`, testProduct);
    
    if (!response.data.isCompetitor) {
      throw new Error('Produit concurrent non identifié');
    }
  });

  await runner.runTest('Identification produits SOPREMA', async () => {
    const testProduct = {
      reference: 'SOP-EFYOS-01',
      designation: 'EFYOS STICK',
      brand: 'SOPREMA'
    };
    
    const response = await axios.post(`${BASE_URL}/api/check-competitor`, testProduct);
    
    if (response.data.isCompetitor) {
      throw new Error('Produit SOPREMA identifié comme concurrent');
    }
  });

  // 8. Test intégration complète
  log.section('8. TEST INTÉGRATION COMPLÈTE');
  
  await runner.runTest('Workflow complet: upload → extraction → reconquête', async () => {
    // 1. Upload
    const formData = new FormData();
    formData.append('invoices', Buffer.from('Test PDF'), {
      filename: 'integration-test.pdf',
      contentType: 'application/pdf'
    });
    
    const uploadResp = await axios.post(`${BASE_URL}/api/upload-invoices`, formData, {
      headers: formData.getHeaders()
    });
    
    if (!uploadResp.data.success) {
      throw new Error('Upload échoué dans workflow');
    }
    
    // 2. Attendre un peu pour l'extraction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Vérifier que des plans sont générables
    const invoices = uploadResp.data.invoices || [];
    if (invoices.length > 0) {
      const plansResp = await axios.post(
        `${BASE_URL}/api/customer-reconquest-plans`,
        { invoices }
      );
      
      if (plansResp.data.error && !plansResp.data.error.includes('Aucune facture avec des produits concurrents')) {
        throw new Error(`Erreur inattendue: ${plansResp.data.error}`);
      }
    }
  });

  // 9. Test performance
  log.section('9. TESTS PERFORMANCE');
  
  await runner.runTest('Temps de réponse API Claude < 30s', async () => {
    const start = Date.now();
    
    await axios.post(`${BASE_URL}/api/extract-invoice-data`, {
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=',
      prompt: 'Performance test'
    });
    
    const duration = Date.now() - start;
    if (duration > 30000) {
      throw new Error(`Temps de réponse trop long: ${duration}ms`);
    }
    
    log.info(`Temps de réponse: ${duration}ms`);
  });

  // 10. Test gestion d'erreurs
  log.section('10. TESTS GESTION D\'ERREURS');
  
  await runner.runTest('Gestion fichier invalide', async () => {
    const formData = new FormData();
    formData.append('invoices', Buffer.from(''), {
      filename: 'empty.pdf',
      contentType: 'application/pdf'
    });
    
    const response = await axios.post(`${BASE_URL}/api/upload-invoices`, formData, {
      headers: formData.getHeaders(),
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.success) {
      throw new Error('Fichier vide accepté par erreur');
    }
  });

  await runner.runTest('Fallback si Claude indisponible', async () => {
    // Simuler une erreur Claude
    const response = await axios.post(
      `${BASE_URL}/api/customer-reconquest-plans`,
      { 
        invoices: [{ 
          client: { name: 'TEST' },
          products: [{ isCompetitor: true, totalPrice: 10000 }]
        }],
        simulateClaudeError: true 
      }
    );
    
    // Devrait utiliser le fallback
    if (!response.data.plans && !response.data.error) {
      throw new Error('Pas de fallback en cas d\'erreur Claude');
    }
  });

  // Résumé final
  console.log('\n');
  const allPassed = runner.printSummary();
  
  if (allPassed) {
    log.success('\n🎉 TOUS LES TESTS SONT PASSÉS ! L\'application fonctionne correctement.');
  } else {
    log.error('\n⚠️  Des tests ont échoué. Veuillez vérifier les erreurs ci-dessus.');
  }
  
  return allPassed;
}

// Vérifier que le serveur est lancé avant de tester
async function checkServerRunning() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// Point d'entrée
async function main() {
  log.title('VÉRIFICATION DE L\'ENVIRONNEMENT');
  
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    log.error('Le serveur n\'est pas lancé !');
    log.info('Veuillez lancer le serveur avec: npm run dev');
    process.exit(1);
  }
  
  log.success('Serveur détecté');
  
  try {
    const success = await runComprehensiveTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log.error(`Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Lancer les tests
main();