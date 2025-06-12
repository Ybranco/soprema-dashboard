import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
config();

console.log('🔍 DEBUG: Analyse des problèmes de génération des plans de reconquête\n');

// Créer des factures de test pour vérifier les seuils
async function createTestInvoices() {
  const testInvoices = [
    // Cas 1: Client avec 6000€ de produits concurrents (1 facture) → DEVRAIT générer un plan
    {
      id: 'test-1',
      number: 'FA-2024-001',
      date: '2024-01-15',
      amount: 10000,
      potential: 11500,
      client: {
        name: 'CLIENT TEST A - GROS CONCURRENT',
        address: '123 rue de Paris, 75001 Paris'
      },
      distributor: {
        name: 'Distributeur A',
        agency: 'Agence Paris'
      },
      products: [
        {
          designation: 'Membrane SOPREMA',
          quantity: 100,
          unitPrice: 40,
          totalPrice: 4000,
          isCompetitor: false,
          type: 'soprema'
        },
        {
          designation: 'Membrane IKO Premium',
          quantity: 100,
          unitPrice: 60,
          totalPrice: 6000,
          isCompetitor: true,
          type: 'competitor',
          brand: 'IKO',
          competitor: { brand: 'IKO', category: 'Étanchéité' }
        }
      ],
      region: 'Île-de-France',
      status: 'analyzed'
    },
    
    // Cas 2: Client avec 3 factures mais seulement 3000€ concurrent → DEVRAIT générer un plan
    {
      id: 'test-2',
      number: 'FA-2024-002',
      date: '2024-01-20',
      amount: 3000,
      potential: 3450,
      client: {
        name: 'CLIENT TEST B - MULTI FACTURES',
        address: '456 avenue Lyon, 69001 Lyon'
      },
      distributor: {
        name: 'Distributeur B',
        agency: 'Agence Lyon'
      },
      products: [
        {
          designation: 'Isolant KNAUF',
          quantity: 50,
          unitPrice: 20,
          totalPrice: 1000,
          isCompetitor: true,
          type: 'competitor',
          brand: 'KNAUF',
          competitor: { brand: 'KNAUF', category: 'Isolation' }
        }
      ],
      region: 'Auvergne-Rhône-Alpes',
      status: 'analyzed'
    },
    {
      id: 'test-3',
      number: 'FA-2024-003',
      date: '2024-02-20',
      amount: 3000,
      potential: 3450,
      client: {
        name: 'CLIENT TEST B - MULTI FACTURES',
        address: '456 avenue Lyon, 69001 Lyon'
      },
      distributor: {
        name: 'Distributeur B',
        agency: 'Agence Lyon'
      },
      products: [
        {
          designation: 'Membrane ISOVER',
          quantity: 50,
          unitPrice: 20,
          totalPrice: 1000,
          isCompetitor: true,
          type: 'competitor',
          brand: 'ISOVER',
          competitor: { brand: 'ISOVER', category: 'Isolation' }
        }
      ],
      region: 'Auvergne-Rhône-Alpes',
      status: 'analyzed'
    },
    {
      id: 'test-4',
      number: 'FA-2024-004',
      date: '2024-03-20',
      amount: 3000,
      potential: 3450,
      client: {
        name: 'CLIENT TEST B - MULTI FACTURES',
        address: '456 avenue Lyon, 69001 Lyon'
      },
      distributor: {
        name: 'Distributeur B',
        agency: 'Agence Lyon'
      },
      products: [
        {
          designation: 'Produit ROCKWOOL',
          quantity: 50,
          unitPrice: 20,
          totalPrice: 1000,
          isCompetitor: true,
          type: 'competitor',
          brand: 'ROCKWOOL',
          competitor: { brand: 'ROCKWOOL', category: 'Isolation' }
        }
      ],
      region: 'Auvergne-Rhône-Alpes',
      status: 'analyzed'
    },
    
    // Cas 3: Client avec peu de concurrent et 1 seule facture → PAS de plan
    {
      id: 'test-5',
      number: 'FA-2024-005',
      date: '2024-01-25',
      amount: 5000,
      potential: 5750,
      client: {
        name: 'CLIENT TEST C - PEU CONCURRENT',
        address: '789 rue Marseille, 13001 Marseille'
      },
      distributor: {
        name: 'Distributeur C',
        agency: 'Agence Marseille'
      },
      products: [
        {
          designation: 'Produit SOPREMA Premium',
          quantity: 100,
          unitPrice: 45,
          totalPrice: 4500,
          isCompetitor: false,
          type: 'soprema'
        },
        {
          designation: 'Accessoire URSA',
          quantity: 10,
          unitPrice: 50,
          totalPrice: 500,
          isCompetitor: true,
          type: 'competitor',
          brand: 'URSA',
          competitor: { brand: 'URSA', category: 'Accessoires' }
        }
      ],
      region: 'Provence-Alpes-Côte d\'Azur',
      status: 'analyzed'
    }
  ];
  
  return testInvoices;
}

async function testReconquestGeneration() {
  console.log('📋 Création de factures de test...\n');
  
  const testInvoices = await createTestInvoices();
  
  console.log('📊 Analyse des factures:');
  console.log('─────────────────────────────────────────────────');
  
  // Analyser chaque client
  const clientAnalysis = {};
  
  testInvoices.forEach(invoice => {
    const clientName = invoice.client.name;
    if (!clientAnalysis[clientName]) {
      clientAnalysis[clientName] = {
        invoices: 0,
        totalAmount: 0,
        competitorAmount: 0,
        competitorProducts: []
      };
    }
    
    clientAnalysis[clientName].invoices++;
    clientAnalysis[clientName].totalAmount += invoice.amount;
    
    invoice.products.forEach(product => {
      if (product.isCompetitor || product.type === 'competitor') {
        clientAnalysis[clientName].competitorAmount += product.totalPrice;
        clientAnalysis[clientName].competitorProducts.push({
          brand: product.brand,
          amount: product.totalPrice
        });
      }
    });
  });
  
  // Afficher l'analyse et vérifier les seuils
  Object.entries(clientAnalysis).forEach(([clientName, data]) => {
    console.log(`\n👤 ${clientName}`);
    console.log(`   Factures: ${data.invoices}`);
    console.log(`   Montant total: ${data.totalAmount}€`);
    console.log(`   Montant concurrent: ${data.competitorAmount}€`);
    console.log(`   Produits concurrents:`);
    data.competitorProducts.forEach(p => {
      console.log(`     - ${p.brand}: ${p.amount}€`);
    });
    
    // Vérifier les seuils
    const meetsCompetitorThreshold = data.competitorAmount >= 5000;
    const meetsInvoiceThreshold = data.invoices >= 2;
    const shouldGeneratePlan = meetsCompetitorThreshold || meetsInvoiceThreshold;
    
    console.log(`\n   ✓ Seuil 5000€ concurrent: ${meetsCompetitorThreshold ? '✅ OUI' : '❌ NON'}`);
    console.log(`   ✓ Seuil 2 factures: ${meetsInvoiceThreshold ? '✅ OUI' : '❌ NON'}`);
    console.log(`   → Plan de reconquête: ${shouldGeneratePlan ? '✅ DEVRAIT ÊTRE GÉNÉRÉ' : '❌ PAS DE PLAN'}`);
  });
  
  console.log('\n─────────────────────────────────────────────────');
  console.log('\n🔍 DIAGNOSTIC POUR VOS 10 FACTURES:\n');
  console.log('Si aucun plan n\'a été généré, vérifiez:');
  console.log('\n1. Les produits concurrents sont-ils bien identifiés?');
  console.log('   - Vérifiez que "isCompetitor: true" ou "type: \'competitor\'"');
  console.log('   - Marques concurrentes: IKO, KNAUF, ISOVER, U-THERM, SMARTROOF,');
  console.log('     ENERTHERM, ROCKWOOL, URSA, KINGSPAN, RECTICEL');
  console.log('\n2. Les montants sont-ils suffisants?');
  console.log('   - Chaque client doit avoir AU MOINS 5000€ de produits concurrents');
  console.log('   - OU au moins 2 factures (peu importe le montant)');
  console.log('\n3. Les factures sont-elles bien groupées par client?');
  console.log('   - Le nom du client doit être EXACTEMENT identique');
  console.log('   - Attention aux majuscules et espaces');
  
  // Sauvegarder les factures de test
  await fs.writeFile(
    path.join(__dirname, 'test-invoices.json'),
    JSON.stringify(testInvoices, null, 2)
  );
  
  console.log('\n💾 Factures de test sauvegardées dans: test-invoices.json');
  console.log('   Vous pouvez les importer dans l\'application pour tester');
}

async function checkServerEndpoint() {
  console.log('\n\n🌐 Test de l\'endpoint serveur...');
  
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const health = await response.json();
    
    console.log('✅ Serveur accessible');
    console.log(`   Claude AI: ${health.features.claudeAI ? '✅' : '❌'}`);
    console.log(`   iLovePDF: ${health.features.ilovepdfAPI ? '✅' : '❌'}`);
    
    // Tester l'endpoint de reconquête
    console.log('\n📡 Test endpoint reconquête...');
    const testInvoices = await createTestInvoices();
    
    const reconquestResponse = await fetch('http://localhost:3001/api/customer-reconquest-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoices: testInvoices })
    });
    
    if (reconquestResponse.ok) {
      const result = await reconquestResponse.json();
      console.log('✅ Endpoint reconquête fonctionnel');
      console.log(`   Plans générés: ${result.summary.plansGenerated}`);
      console.log(`   Clients significatifs: ${result.summary.significantCustomers}/${result.summary.totalCustomers}`);
      
      if (result.plans.length > 0) {
        console.log('\n📋 Plans générés:');
        result.plans.forEach(plan => {
          console.log(`   - ${plan.clientName}: ${plan.analysis.competitorAmount}€ concurrent`);
        });
      }
    } else {
      console.log('❌ Erreur endpoint reconquête');
    }
    
  } catch (error) {
    console.log('❌ Serveur non accessible');
    console.log('   Assurez-vous que le serveur est démarré: npm run dev');
  }
}

// Exécuter les tests
console.log('═══════════════════════════════════════════════════');
console.log('   DEBUG PLANS DE RECONQUÊTE CLIENT');
console.log('═══════════════════════════════════════════════════');

testReconquestGeneration()
  .then(() => checkServerEndpoint())
  .catch(console.error);