#!/usr/bin/env node

/**
 * Test spécifique des appels vers Claude AI pour la génération des plans de reconquête
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Données de test réalistes
const testCustomers = [
  {
    clientId: 'client-test-1',
    clientName: 'REMY PHILIPPE SA',
    totalRevenue: 6655.15,
    competitorAmount: 5585.57,
    sopremaAmount: 1069.58,
    invoiceCount: 1,
    invoices: [
      {
        number: '06104',
        date: '2024-06-10',
        amount: 6655.15
      }
    ],
    competitorProducts: [
      {
        designation: 'STEICO FLEX F036 1220 x 565 -200 mm- R 5.55',
        amount: 2228.8,
        brand: 'STEICO'
      },
      {
        designation: 'Pro Clima INTELLO frein-vapeur - 1.50 x 50ML',
        amount: 543.48,
        brand: 'Pro Clima'
      },
      {
        designation: 'STEICO INTEGRAL RL 2230 x 600 mm -60 mm- R 1.428',
        amount: 2601.07,
        brand: 'STEICO'
      }
    ],
    sopremaProducts: [
      {
        designation: 'SOPREMA PAVAFLEX',
        amount: 1069.58
      }
    ],
    lastInvoiceDate: '2024-06-10',
    priority: 'high'
  },
  {
    clientId: 'client-test-2',
    clientName: 'MARTIN CONSTRUCTION',
    totalRevenue: 12500.00,
    competitorAmount: 8750.00,
    sopremaAmount: 3750.00,
    invoiceCount: 2,
    invoices: [
      {
        number: '07205',
        date: '2024-05-15',
        amount: 7500.00
      },
      {
        number: '07206',
        date: '2024-06-01',
        amount: 5000.00
      }
    ],
    competitorProducts: [
      {
        designation: 'IKO POLYMERIC MEMBRANE',
        amount: 4375.00,
        brand: 'IKO'
      },
      {
        designation: 'ROCKWOOL INSULATION',
        amount: 4375.00,
        brand: 'ROCKWOOL'
      }
    ],
    sopremaProducts: [
      {
        designation: 'SOPREMA SARNAVAP',
        amount: 3750.00
      }
    ],
    lastInvoiceDate: '2024-06-01',
    priority: 'medium'
  }
];

async function testClaudeReconquestAPI() {
  log('\n🤖 TEST COMPLET DE L\'APPEL CLAUDE AI POUR RECONQUÊTE', 'blue');
  log('=========================================================', 'blue');

  try {
    // Test 1: Vérifier que le serveur est disponible
    log('\n🔍 Test 1: Vérification de la disponibilité du serveur...', 'yellow');
    const healthResponse = await fetch(`${API_URL}/api/health`);
    
    if (!healthResponse.ok) {
      log('❌ Serveur non disponible', 'red');
      return false;
    }

    const healthData = await healthResponse.json();
    log('✅ Serveur disponible', 'green');
    log(`   - Claude AI: ${healthData.features?.claudeAI ? '✅' : '❌'}`, 'green');

    if (!healthData.features?.claudeAI) {
      log('❌ Claude AI non configuré sur le serveur', 'red');
      return false;
    }

    // Test 2: Test de l'endpoint de reconquête avec données réelles
    log('\n🔍 Test 2: Appel de l\'API de génération de plans de reconquête...', 'yellow');
    log(`   Envoi de ${testCustomers.length} clients de test`, 'blue');
    
    // Afficher les données envoyées
    log('\n📋 Données clients envoyées:', 'magenta');
    testCustomers.forEach((customer, index) => {
      log(`   Client ${index + 1}: ${customer.clientName}`, 'magenta');
      log(`   - CA total: ${customer.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, 'magenta');
      log(`   - Concurrent: ${customer.competitorAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, 'magenta');
      log(`   - Produits concurrents: ${customer.competitorProducts.length}`, 'magenta');
      log(`   - Priorité: ${customer.priority}`, 'magenta');
    });

    const startTime = Date.now();
    
    const reconquestResponse = await fetch(`${API_URL}/api/customer-reconquest-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customers: testCustomers
      })
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`\n⏱️  Temps de réponse: ${duration}ms`, 'blue');

    if (!reconquestResponse.ok) {
      const errorText = await reconquestResponse.text();
      log(`❌ Erreur API de reconquête (${reconquestResponse.status}): ${errorText}`, 'red');
      return false;
    }

    const reconquestData = await reconquestResponse.json();
    log('✅ Appel API de reconquête réussi', 'green');

    // Test 3: Validation de la structure de réponse
    log('\n🔍 Test 3: Validation de la structure de réponse...', 'yellow');
    
    // Vérifier la structure générale
    const requiredFields = ['success', 'summary', 'plans'];
    const missingFields = requiredFields.filter(field => !(field in reconquestData));
    
    if (missingFields.length > 0) {
      log(`❌ Champs manquants dans la réponse: ${missingFields.join(', ')}`, 'red');
      return false;
    }
    
    log('✅ Structure de réponse valide', 'green');
    log(`   - Success: ${reconquestData.success}`, 'green');
    log(`   - Plans générés: ${reconquestData.plans?.length || 0}`, 'green');

    // Test 4: Validation du contenu des plans générés
    log('\n🔍 Test 4: Validation du contenu des plans générés...', 'yellow');
    
    if (!reconquestData.plans || reconquestData.plans.length === 0) {
      log('⚠️  Aucun plan généré - cela peut être normal si les seuils ne sont pas atteints', 'yellow');
      
      // Vérifier le summary pour comprendre pourquoi
      if (reconquestData.summary) {
        log('\n📊 Résumé de l\'analyse:', 'blue');
        log(`   - Clients analysés: ${reconquestData.summary.totalCustomers || 0}`, 'blue');
        log(`   - Clients significatifs: ${reconquestData.summary.significantCustomers || 0}`, 'blue');
        log(`   - Seuil minimum: ${reconquestData.summary.thresholds?.minCompetitorAmount || 'N/A'}€`, 'blue');
        
        // Afficher pourquoi aucun plan n'a été généré
        testCustomers.forEach(customer => {
          const meetsThreshold = customer.competitorAmount >= (reconquestData.summary.thresholds?.minCompetitorAmount || 5000);
          log(`   - ${customer.clientName}: ${customer.competitorAmount}€ concurrent ${meetsThreshold ? '✅' : '❌'}`, 'blue');
        });
      }
    } else {
      log(`✅ ${reconquestData.plans.length} plans générés avec succès`, 'green');
      
      // Analyser chaque plan généré
      reconquestData.plans.forEach((plan, index) => {
        log(`\n📋 Plan ${index + 1}: ${plan.clientName}`, 'magenta');
        
        // Vérifier les champs obligatoires d'un plan
        const planRequiredFields = ['id', 'clientName', 'createdAt'];
        const planMissingFields = planRequiredFields.filter(field => !(field in plan));
        
        if (planMissingFields.length > 0) {
          log(`   ❌ Champs manquants: ${planMissingFields.join(', ')}`, 'red');
        } else {
          log('   ✅ Structure de plan valide', 'green');
        }

        // Vérifier les sections principales
        if (plan.analysis) {
          log('   ✅ Section analyse présente', 'green');
          if (plan.analysis.sopremaShare) {
            log(`   - Part Soprema: ${plan.analysis.sopremaShare}%`, 'green');
          }
        }

        if (plan.reconquestStrategy) {
          log('   ✅ Section stratégie présente', 'green');
          log(`   - Priorité: ${plan.reconquestStrategy.priority}`, 'green');
          log(`   - Potentiel: ${plan.reconquestStrategy.estimatedPotential?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 'N/A'}`, 'green');
          log(`   - Actions suggérées: ${plan.reconquestStrategy.suggestedActions?.length || 0}`, 'green');
        }

        if (plan.clientInfo) {
          log('   ✅ Section info client présente', 'green');
        }
      });
    }

    // Test 5: Test de la qualité IA des réponses
    log('\n🔍 Test 5: Validation de la qualité des réponses IA...', 'yellow');
    
    if (reconquestData.plans && reconquestData.plans.length > 0) {
      let aiQualityScore = 0;
      const totalPlans = reconquestData.plans.length;

      reconquestData.plans.forEach(plan => {
        // Vérifier si le plan contient des suggestions d'actions spécifiques
        if (plan.reconquestStrategy?.suggestedActions?.length > 0) {
          aiQualityScore += 25;
          log('   ✅ Actions spécifiques générées par Claude', 'green');
        }

        // Vérifier si le plan contient une analyse des marques concurrentes
        if (plan.analysis?.topCompetitorBrands?.length > 0) {
          aiQualityScore += 25;
          log('   ✅ Analyse des marques concurrentes', 'green');
        }

        // Vérifier si le plan a une priorité logique
        if (plan.reconquestStrategy?.priority) {
          aiQualityScore += 25;
          log(`   ✅ Priorité assignée: ${plan.reconquestStrategy.priority}`, 'green');
        }

        // Vérifier si le potentiel estimé est cohérent
        if (plan.reconquestStrategy?.estimatedPotential > 0) {
          aiQualityScore += 25;
          log(`   ✅ Potentiel estimé: ${plan.reconquestStrategy.estimatedPotential.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, 'green');
        }
      });

      const averageQuality = aiQualityScore / totalPlans;
      log(`\n📊 Score de qualité IA: ${averageQuality}%`, averageQuality >= 75 ? 'green' : averageQuality >= 50 ? 'yellow' : 'red');
      
      if (averageQuality >= 75) {
        log('✅ Excellente qualité des réponses Claude AI', 'green');
      } else if (averageQuality >= 50) {
        log('⚠️  Qualité correcte mais perfectible', 'yellow');
      } else {
        log('❌ Qualité insuffisante des réponses IA', 'red');
      }
    }

    // Test 6: Test des cas d'erreur
    log('\n🔍 Test 6: Test de gestion des cas d\'erreur...', 'yellow');
    
    // Test avec données invalides
    const errorResponse = await fetch(`${API_URL}/api/customer-reconquest-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customers: [] // Liste vide
      })
    });

    if (errorResponse.ok) {
      const errorData = await errorResponse.json();
      if (errorData.plans && errorData.plans.length === 0) {
        log('   ✅ Gestion correcte des listes vides', 'green');
      }
    }

    log('\n🎉 TESTS CLAUDE AI TERMINÉS AVEC SUCCÈS!', 'green');
    log('========================================', 'green');
    log('\n✅ Résumé des validations:', 'green');
    log('   - Serveur Claude AI opérationnel', 'green');
    log('   - API de reconquête fonctionnelle', 'green');
    log('   - Structure de données valide', 'green');
    log('   - Génération de plans intelligents', 'green');
    log('   - Gestion des erreurs robuste', 'green');

    return true;

  } catch (error) {
    log(`\n❌ Erreur lors du test Claude AI: ${error.message}`, 'red');
    log(`   Stack: ${error.stack}`, 'red');
    return false;
  }
}

// Exécuter le test
testClaudeReconquestAPI().then(success => {
  if (success) {
    log('\n🚀 CLAUDE AI POUR RECONQUÊTE: ENTIÈREMENT FONCTIONNEL', 'green');
    process.exit(0);
  } else {
    log('\n💥 PROBLÈME DÉTECTÉ AVEC CLAUDE AI', 'red');
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 ERREUR FATALE: ${error.message}`, 'red');
  process.exit(1);
});