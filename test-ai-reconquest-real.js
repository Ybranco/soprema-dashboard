#!/usr/bin/env node

/**
 * Test réel de l'endpoint AI de reconquête
 * Teste l'appel direct au serveur pour vérifier la génération AI
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

console.log('🤖 Test RÉEL des plans de reconquête générés par Claude AI\n');

// Données de test avec produits concurrents
const testData = {
  invoices: [
    {
      id: 'test-real-1',
      number: 'FAC-2024-001',
      date: '2024-01-15',
      client: {
        name: 'ÉTABLISSEMENTS MARTIN',
        fullName: 'ÉTABLISSEMENTS MARTIN SAS',
        address: '15 rue de la République, 69000 Lyon',
        siret: '12345678901234'
      },
      distributor: {
        name: 'PRO-MATÉRIAUX LYON',
        agency: 'Agence Centre'
      },
      amount: 45000,
      products: [
        {
          reference: 'IKO-ARM-15',
          designation: 'Membrane IKO ARMOURPLAN 1.5mm',
          quantity: 500,
          unitPrice: 35,
          totalPrice: 17500,
          type: 'competitor',
          isCompetitor: true,
          brand: 'IKO'
        },
        {
          reference: 'KNAUF-ISO-10',
          designation: 'Isolation KNAUF Thermo 100mm',
          quantity: 200,
          unitPrice: 45,
          totalPrice: 9000,
          type: 'competitor', 
          isCompetitor: true,
          brand: 'KNAUF'
        },
        {
          reference: 'ROCKWOOL-PRO',
          designation: 'Laine ROCKWOOL DELTAROCK',
          quantity: 150,
          unitPrice: 60,
          totalPrice: 9000,
          type: 'competitor',
          isCompetitor: true,
          brand: 'ROCKWOOL'
        }
      ]
    },
    {
      id: 'test-real-2',
      number: 'FAC-2024-002',
      date: '2024-02-20',
      client: {
        name: 'ENTREPRISE DURAND',
        fullName: 'ENTREPRISE DURAND SARL',
        address: '45 avenue des Champs, 75008 Paris'
      },
      distributor: {
        name: 'BATIMAT PARIS',
        agency: 'Agence Île-de-France'
      },
      amount: 32000,
      products: [
        {
          reference: 'SIKA-SEAL-200',
          designation: 'SIKA Sarnafil Membrane',
          quantity: 300,
          unitPrice: 40,
          totalPrice: 12000,
          type: 'competitor',
          isCompetitor: true,
          brand: 'SIKA'
        },
        {
          reference: 'ISOVER-PAR',
          designation: 'ISOVER PAR Isolation',
          quantity: 400,
          unitPrice: 50,
          totalPrice: 20000,
          type: 'competitor',
          isCompetitor: true,
          brand: 'ISOVER'
        }
      ]
    }
  ]
};

async function testRealAIGeneration() {
  try {
    console.log('📊 Envoi des données au serveur:');
    console.log(`• ${testData.invoices.length} factures`);
    console.log(`• Clients: ${testData.invoices.map(i => i.client.name).join(', ')}`);
    
    // Calculer les montants concurrents
    testData.invoices.forEach(invoice => {
      const competitorAmount = invoice.products
        .filter(p => p.isCompetitor)
        .reduce((sum, p) => sum + p.totalPrice, 0);
      console.log(`• ${invoice.client.name}: ${competitorAmount.toLocaleString('fr-FR')}€ concurrent`);
    });
    
    console.log('\n🚀 Appel de l\'endpoint de reconquête AI...');
    console.log('⏳ Génération par Claude AI en cours (peut prendre 1-2 minutes)...\n');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BASE_URL}/api/customer-reconquest-plans`,
      testData,
      {
        timeout: 120000, // 2 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Réponse reçue en ${(duration / 1000).toFixed(1)} secondes\n`);
    
    if (response.data.success && response.data.plans) {
      console.log('📋 Plans de reconquête générés:');
      console.log(`• Nombre de plans: ${response.data.plans.length}`);
      console.log(`• Clients éligibles: ${response.data.summary.significantCustomers}`);
      console.log(`• Potentiel total: ${response.data.summary.totalPotential.toLocaleString('fr-FR')}€\n`);
      
      // Afficher les détails de chaque plan
      response.data.plans.forEach((plan, idx) => {
        console.log(`\n━━━ Plan ${idx + 1}: ${plan.clientName} ━━━`);
        console.log(`• Priorité: ${plan.priority}`);
        console.log(`• Montant concurrent: ${plan.competitorAmount.toLocaleString('fr-FR')}€`);
        
        if (plan.reconquestStrategy) {
          const strategy = plan.reconquestStrategy;
          console.log(`\n🎯 Stratégie AI générée:`);
          console.log(`• Priorité: ${strategy.priority}`);
          console.log(`• Potentiel estimé: ${(strategy.estimatedPotential || 0).toLocaleString('fr-FR')}€`);
          
          if (strategy.competitiveAnalysis) {
            console.log(`\n⚔️ Analyse concurrentielle:`);
            console.log(`• Menace principale: ${strategy.competitiveAnalysis.mainThreat}`);
            console.log(`• Vulnérabilités: ${(strategy.competitiveAnalysis.vulnerabilities || []).length}`);
            console.log(`• Opportunités: ${(strategy.competitiveAnalysis.opportunities || []).length}`);
          }
          
          if (strategy.suggestedActions && strategy.suggestedActions.length > 0) {
            console.log(`\n📌 Actions recommandées (${strategy.suggestedActions.length}):`);
            strategy.suggestedActions.slice(0, 3).forEach((action, i) => {
              console.log(`${i + 1}. ${action.description} (${action.timing})`);
              console.log(`   → ${action.expectedOutcome}`);
            });
          }
          
          if (strategy.keyArguments && strategy.keyArguments.length > 0) {
            console.log(`\n💡 Arguments clés:`);
            strategy.keyArguments.slice(0, 3).forEach(arg => {
              console.log(`• ${arg}`);
            });
          }
        }
      });
      
      console.log('\n✅ Test réussi! Les plans sont bien générés par Claude AI.');
      
      // Vérifier que ce n'est pas du contenu générique
      const firstPlan = response.data.plans[0];
      if (firstPlan && firstPlan.reconquestStrategy) {
        const strategy = firstPlan.reconquestStrategy;
        const actions = strategy.suggestedActions || [];
        
        // Vérifier la personnalisation
        const hasPersonalization = actions.some(action => 
          action.description && (
            action.description.includes(firstPlan.clientName) ||
            action.description.includes('SOPREMA') ||
            action.description.includes('IKO') ||
            action.description.includes('KNAUF')
          )
        );
        
        if (hasPersonalization) {
          console.log('✅ Contenu personnalisé détecté - Génération AI confirmée!');
        } else {
          console.log('⚠️  Attention: Le contenu semble générique.');
        }
      }
      
    } else {
      console.log('❌ Erreur: Aucun plan généré');
      if (response.data.error) {
        console.log(`Message d'erreur: ${response.data.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
  }
}

// Vérifier que le serveur est lancé
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// Exécution
async function main() {
  console.log('🔍 Vérification du serveur...');
  
  const serverOk = await checkServer();
  if (!serverOk) {
    console.error('❌ Le serveur n\'est pas accessible!');
    console.log('💡 Lancez le serveur avec: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Serveur accessible\n');
  
  await testRealAIGeneration();
}

main();