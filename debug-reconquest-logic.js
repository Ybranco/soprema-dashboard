#!/usr/bin/env node

/**
 * Script de diagnostic pour comprendre pourquoi la logique de reconquête ne fonctionne pas
 */

console.log('🔍 DIAGNOSTIC DE LA LOGIQUE DE RECONQUÊTE');
console.log('========================================');

// Simuler les données de la facture qui a été traitée d'après les logs
const testInvoice = {
  id: 'invoice-1749686144129-50h430',
  number: 'DN177600',
  client: {
    name: 'FEMAT'
  },
  amount: 910.25,
  products: [
    {
      designation: 'ECO-PARTICIPATION FRANCE',
      type: 'soprema',
      isCompetitor: false,
      isSoprema: true,
      totalPrice: 227.56
    },
    {
      designation: 'PRODUIT SOPREMA 2',
      type: 'soprema', 
      isCompetitor: false,
      isSoprema: true,
      totalPrice: 182.69
    },
    {
      designation: 'PRODUIT SOPREMA 3',
      type: 'soprema',
      isCompetitor: false, 
      isSoprema: true,
      totalPrice: 250.00
    },
    {
      designation: 'PRODUIT SOPREMA 4',
      type: 'soprema',
      isCompetitor: false,
      isSoprema: true, 
      totalPrice: 250.00
    }
  ]
};

// Test avec des factures concurrentes fictives pour voir la logique
const testInvoicesWithCompetitors = [
  {
    id: 'test-1',
    number: 'FAC001',
    client: { name: 'CLIENT_TEST_1' },
    amount: 3500,
    products: [
      {
        designation: 'Produit Concurrent ROCKWOOL',
        type: 'competitor',
        isCompetitor: true,
        isSoprema: false,
        totalPrice: 2000,
        brand: 'ROCKWOOL'
      },
      {
        designation: 'Produit Soprema',
        type: 'soprema',
        isCompetitor: false,
        isSoprema: true,
        totalPrice: 1500
      }
    ]
  },
  {
    id: 'test-2', 
    number: 'FAC002',
    client: { name: 'CLIENT_TEST_2' },
    amount: 8500,
    products: [
      {
        designation: 'Membrane IKO',
        type: 'competitor',
        isCompetitor: true,
        isSoprema: false,
        totalPrice: 6000,
        brand: 'IKO'
      },
      {
        designation: 'Produit Soprema',
        type: 'soprema',
        isCompetitor: false,
        isSoprema: true,
        totalPrice: 2500
      }
    ]
  }
];

console.log('\n📋 ANALYSE DE LA FACTURE RÉELLE TRAITÉE:');
console.log('=========================================');

function analyzeInvoice(invoice) {
  console.log(`\nFacture: ${invoice.number} - Client: ${invoice.client.name}`);
  console.log(`Montant total: ${invoice.amount}€`);
  console.log(`Nombre de produits: ${invoice.products.length}`);
  
  let competitorAmount = 0;
  let sopremaAmount = 0;
  let competitorProducts = [];
  let sopremaProducts = [];
  
  invoice.products.forEach((product, index) => {
    console.log(`\n  Produit ${index + 1}: ${product.designation}`);
    console.log(`    - Type: ${product.type}`);
    console.log(`    - isCompetitor: ${product.isCompetitor}`);
    console.log(`    - isSoprema: ${product.isSoprema}`);
    console.log(`    - Prix: ${product.totalPrice}€`);
    
    const isCompetitor = product.type === 'competitor' || 
                        product.isCompetitor === true ||
                        product.isCompetitor === 'true';
    
    const isSoprema = product.type === 'soprema' || 
                     product.isSoprema === true ||
                     product.isSoprema === 'true';
    
    console.log(`    - Détecté comme concurrent: ${isCompetitor}`);
    console.log(`    - Détecté comme Soprema: ${isSoprema}`);
    
    if (isCompetitor) {
      competitorAmount += product.totalPrice;
      competitorProducts.push(product);
    } else if (isSoprema) {
      sopremaAmount += product.totalPrice;
      sopremaProducts.push(product);
    }
  });
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`  - Montant concurrent: ${competitorAmount}€`);
  console.log(`  - Montant Soprema: ${sopremaAmount}€`);
  console.log(`  - Produits concurrents: ${competitorProducts.length}`);
  console.log(`  - Produits Soprema: ${sopremaProducts.length}`);
  
  const hasCompetitors = competitorProducts.length > 0;
  const meetsThreshold = competitorAmount >= 1000; // Nouveau seuil
  
  console.log(`\n🎯 ÉLIGIBILITÉ RECONQUÊTE:`);
  console.log(`  - A des concurrents: ${hasCompetitors ? '✅' : '❌'}`);
  console.log(`  - Dépasse le seuil (1000€): ${meetsThreshold ? '✅' : '❌'}`);
  console.log(`  - Éligible pour plan: ${hasCompetitors && meetsThreshold ? '✅' : '❌'}`);
  
  return {
    hasCompetitors,
    competitorAmount,
    sopremaAmount,
    meetsThreshold,
    eligible: hasCompetitors && meetsThreshold
  };
}

// Analyser la facture réelle
const realResult = analyzeInvoice(testInvoice);

console.log('\n📋 ANALYSE DES FACTURES TESTS AVEC CONCURRENTS:');
console.log('==============================================');

testInvoicesWithCompetitors.forEach(invoice => {
  analyzeInvoice(invoice);
});

console.log('\n🔍 DIAGNOSTIC FINAL:');
console.log('==================');

if (!realResult.hasCompetitors) {
  console.log('❌ PROBLÈME: La facture DN177600 ne contient QUE des produits Soprema');
  console.log('💡 SOLUTION: Cette facture ne peut pas générer de plan de reconquête car il n\'y a pas de concurrents à reconquérir');
  console.log('✅ COMPORTEMENT NORMAL: Le système fonctionne correctement');
} else if (!realResult.meetsThreshold) {
  console.log('❌ PROBLÈME: Montant concurrent trop faible');
  console.log(`💡 Le montant concurrent (${realResult.competitorAmount}€) est sous le seuil (1000€)`);
} else {
  console.log('✅ Cette facture devrait générer un plan de reconquête');
}

console.log('\n📝 RECOMMANDATIONS:');
console.log('=================');
console.log('1. Pour tester la reconquête, utilisez des factures avec des produits concurrents');
console.log('2. Le seuil a été baissé à 1000€ pour voir plus de clients');
console.log('3. Vérifiez que Claude identifie correctement les produits concurrents lors de l\'analyse');
console.log('4. Les produits doivent avoir isCompetitor: true ou type: "competitor"');

console.log('\n🎯 POUR TESTER, essayez d\'analyser une facture contenant:');
console.log('   - Des produits de marques comme: ROCKWOOL, IKO, FIRESTONE, SIPLAST, etc.');
console.log('   - Claude devrait automatiquement les identifier comme concurrents');