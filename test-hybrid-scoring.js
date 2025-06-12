#!/usr/bin/env node

/**
 * SCRIPT DE TEST POUR LA MÉTHODE HYBRIDE SOPREMA
 * 
 * Teste le nouveau système de scoring sur des exemples réels
 * pour valider l'amélioration de précision
 */

import { HybridSopremaMethod } from './HYBRID_SCORING_METHOD.js';
import { OptimizedScoringAlgorithms } from './OPTIMIZED_SCORING_ALGORITHM.js';

const hybridMethod = new HybridSopremaMethod();

// Exemples de test réalistes (basés sur des factures types)
const testCases = [
  // === CAS ÉVIDENTS SOPREMA ===
  {
    category: 'Évidents Soprema',
    products: [
      'ALSAN 500 Polyuréthane monocomposant 25kg',
      'ELASTOPHENE FLAM 40 AR rouleau 8m²',
      'SOPRALENE STICK 30 membrane autocollante',
      'SOPRAXPS 30mm panneau isolation XPS',
      'PAVATEX ISOLAIR 160mm fibre bois'
    ]
  },
  
  // === CAS CONCURRENTS ÉVIDENTS ===
  {
    category: 'Évidents Concurrents',
    products: [
      'IKO SPECTRAL membrane EPDM 1.2mm',
      'ROCKWOOL DELTAROCK 100mm',
      'ISOVER GR32 rouleau 200mm',
      'FIRESTONE EPDM RubberCover 1.5mm',
      'KNAUF THANE SOL isolation'
    ]
  },
  
  // === CAS AMBIGUS / DIFFICILES ===
  {
    category: 'Cas Difficiles',
    products: [
      'Membrane EPDM 1.2mm rouleau 20m', // Générique - pourrait être Soprema ou concurrent
      'Polyuréthane liquide 25kg bidon', // Générique - ALSAN ou concurrent ?
      'Isolation XPS 30mm panneau', // Générique - SOPRAXPS ou concurrent ?
      'Solin alu préfabriqué 200mm', // Générique - SOPRASOLIN ou concurrent ?
      'Pare-vapeur polyéthylène 200µ' // Générique - SARNAVAP ou concurrent ?
    ]
  },
  
  // === VARIANTES ORTHOGRAPHIQUES ===
  {
    category: 'Variantes Orthographe',
    products: [
      'ALSAN500 Polyurethane 25 kg', // Sans espace
      'ELASTOFENE FLAM 40', // Faute de frappe
      'SOPRA LENE STICK 30', // Avec espace
      'SOPRAXPS30MM', // Tout attaché
      'PAVATEX ISOLAIR160' // Partiellement attaché
    ]
  },
  
  // === PRODUITS AVEC RÉFÉRENCES TECHNIQUES ===
  {
    category: 'Références Techniques',
    products: [
      'SOPREMA ALSAN 970 PMMA résine 20kg RAL 7035',
      'SOPRALENE FLAM 180 AR ARDOISE protection lourde',
      'ELASTOPHENE POLY 40 FV étanchéité bicouche',
      'SOPRAXPS SL 30-L panneau rainuré languette',
      'PAVATEX ISOLAIR FLEX 160mm lambda 0.038'
    ]
  }
];

// Fonction principale de test
async function runHybridTests() {
  console.log(`🧪 TESTS DE LA MÉTHODE HYBRIDE SOPREMA`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  console.log(`📊 Seuil de matching: ${hybridMethod.SIMILARITY_THRESHOLD}%`);
  console.log(`🎯 Objectif: Identifier correctement les produits Soprema vs Concurrents\n`);

  // Charger la base de données
  console.log(`📚 Chargement de la base Soprema...`);
  await hybridMethod.loadDatabase();
  console.log(`✅ ${hybridMethod.sopremaProducts.length} produits chargés\n`);

  let totalTests = 0;
  let correctMatches = 0;
  const results = [];

  // Tester chaque catégorie
  for (const testCase of testCases) {
    console.log(`\n🏷️  CATÉGORIE: ${testCase.category.toUpperCase()}`);
    console.log(`${'═'.repeat(80)}`);

    const categoryResults = {
      category: testCase.category,
      products: [],
      accuracy: 0
    };

    for (let i = 0; i < testCase.products.length; i++) {
      const product = testCase.products[i];
      const expectedSoprema = testCase.category.includes('Soprema') || testCase.category.includes('Variantes') || testCase.category.includes('Techniques');
      
      console.log(`\n[${i + 1}/${testCase.products.length}] 🔍 "${product}"`);
      console.log(`   💭 Attendu: ${expectedSoprema ? 'SOPREMA' : 'CONCURRENT'}`);
      
      // Test avec la méthode hybride
      const result = await hybridMethod.findBestMatch(product, true);
      const predictedSoprema = result.matched;
      const isCorrect = predictedSoprema === expectedSoprema;
      
      console.log(`   🤖 Prédit: ${predictedSoprema ? 'SOPREMA' : 'CONCURRENT'} (${result.score}%)`);
      console.log(`   ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (result.matchedProduct) {
        console.log(`   📝 Match: "${result.matchedProduct}"`);
      }
      
      // Test aussi avec l'algorithme de scoring optimisé pour comparaison
      if (result.matchedProduct) {
        console.log(`\n   📊 DÉTAIL ALGORITHMES:`);
        const algoTest = OptimizedScoringAlgorithms.testAlgorithms(product, result.matchedProduct);
      }

      totalTests++;
      if (isCorrect) correctMatches++;

      categoryResults.products.push({
        product,
        expected: expectedSoprema,
        predicted: predictedSoprema,
        correct: isCorrect,
        score: result.score,
        matchedProduct: result.matchedProduct
      });
    }

    // Calculer l'accuracy de la catégorie
    const categoryCorrect = categoryResults.products.filter(p => p.correct).length;
    categoryResults.accuracy = Math.round((categoryCorrect / categoryResults.products.length) * 100);
    
    console.log(`\n📈 RÉSUMÉ CATÉGORIE "${testCase.category}":`);
    console.log(`   Réussite: ${categoryCorrect}/${categoryResults.products.length} (${categoryResults.accuracy}%)`);
    
    results.push(categoryResults);
  }

  // Résumé global
  console.log(`\n\n🎯 RÉSUMÉ GLOBAL DES TESTS`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  console.log(`📊 Tests totaux: ${totalTests}`);
  console.log(`✅ Succès: ${correctMatches}`);
  console.log(`❌ Échecs: ${totalTests - correctMatches}`);
  console.log(`🎯 Précision globale: ${Math.round((correctMatches / totalTests) * 100)}%`);

  console.log(`\n📋 DÉTAIL PAR CATÉGORIE:`);
  results.forEach(cat => {
    console.log(`   ${cat.category}: ${cat.accuracy}%`);
  });

  // Identifier les points d'amélioration
  console.log(`\n🔧 POINTS D'AMÉLIORATION:`);
  const failedTests = results.flatMap(cat => 
    cat.products.filter(p => !p.correct)
  );

  if (failedTests.length > 0) {
    console.log(`   📉 ${failedTests.length} cas à améliorer:`);
    failedTests.forEach(test => {
      console.log(`      • "${test.product}"`);
      console.log(`        Attendu: ${test.expected ? 'SOPREMA' : 'CONCURRENT'}, `);
      console.log(`        Prédit: ${test.predicted ? 'SOPREMA' : 'CONCURRENT'} (${test.score}%)`);
    });
  } else {
    console.log(`   🎉 Tous les tests ont réussi !`);
  }

  console.log(`\n💡 RECOMMANDATIONS:`);
  const globalAccuracy = Math.round((correctMatches / totalTests) * 100);
  
  if (globalAccuracy >= 90) {
    console.log(`   🟢 Excellente performance (${globalAccuracy}%) - Prêt pour production`);
  } else if (globalAccuracy >= 80) {
    console.log(`   🟡 Bonne performance (${globalAccuracy}%) - Quelques ajustements possibles`);
    console.log(`   💡 Considérer ajuster le seuil de ${hybridMethod.SIMILARITY_THRESHOLD}% selon les cas difficiles`);
  } else {
    console.log(`   🔴 Performance à améliorer (${globalAccuracy}%)`);
    console.log(`   💡 Revoir l'algorithme de scoring ou enrichir la base de données`);
  }

  return {
    totalTests,
    correctMatches,
    accuracy: globalAccuracy,
    categoryResults: results,
    failedTests
  };
}

// Test spécifique d'un produit
async function testSingleProduct(productName) {
  console.log(`\n🔬 TEST PRODUIT INDIVIDUEL`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  await hybridMethod.loadDatabase();
  const result = await hybridMethod.testProduct(productName, true);
  
  console.log(`\n🎯 CONCLUSION:`);
  console.log(`   ${result.matched ? '✅ PRODUIT SOPREMA' : '❌ PRODUIT CONCURRENT'}`);
  console.log(`   Confiance: ${result.score}%`);
  
  return result;
}

// Test de performance sur un échantillon de la base
async function testPerformance(sampleSize = 100) {
  console.log(`\n⚡ TEST DE PERFORMANCE`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  await hybridMethod.loadDatabase();
  
  // Prendre un échantillon aléatoire de la base Soprema
  const sample = hybridMethod.sopremaProducts
    .sort(() => 0.5 - Math.random())
    .slice(0, sampleSize)
    .map(p => p.nom_complet || p.nom || p.name || p);

  console.log(`🧪 Test sur ${sample.length} produits de la base Soprema...`);
  
  const startTime = Date.now();
  let matches = 0;
  
  for (let i = 0; i < sample.length; i++) {
    const product = sample[i];
    const result = await hybridMethod.findBestMatch(product);
    
    if (result.matched) matches++;
    
    if ((i + 1) % 10 === 0) {
      console.log(`   Traité: ${i + 1}/${sample.length} (${matches} matches)`);
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`\n📊 RÉSULTATS PERFORMANCE:`);
  console.log(`   ⏱️  Durée: ${duration}ms (${Math.round(duration / sample.length)}ms/produit)`);
  console.log(`   🎯 Matches: ${matches}/${sample.length} (${Math.round((matches / sample.length) * 100)}%)`);
  console.log(`   ⚡ Vitesse: ${Math.round((sample.length / duration) * 1000)} produits/seconde`);
  
  return {
    sampleSize: sample.length,
    duration,
    matches,
    accuracy: Math.round((matches / sample.length) * 100)
  };
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Tests complets
    await runHybridTests();
  } else if (args[0] === '--performance') {
    // Test de performance
    const sampleSize = parseInt(args[1]) || 100;
    await testPerformance(sampleSize);
  } else if (args[0] === '--product') {
    // Test d'un produit spécifique
    const productName = args.slice(1).join(' ');
    if (!productName) {
      console.log('Usage: node test-hybrid-scoring.js --product "nom du produit"');
      process.exit(1);
    }
    await testSingleProduct(productName);
  } else {
    console.log(`Usage:
  node test-hybrid-scoring.js                           # Tests complets
  node test-hybrid-scoring.js --performance [nombre]    # Test performance
  node test-hybrid-scoring.js --product "nom produit"   # Test produit spécifique
    `);
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runHybridTests, testSingleProduct, testPerformance };