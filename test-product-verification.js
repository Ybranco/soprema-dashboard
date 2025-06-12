import { sopremaProductMatcher } from './soprema-product-matcher.js';

// Tester le système de vérification des produits Soprema
async function testProductVerification() {
  console.log('🧪 Test du système de vérification des produits Soprema\n');

  // Produits de test avec différents cas
  const testProducts = [
    // Cas 1: Produit Soprema correctement orthographié
    {
      designation: "ELASTOPHENE FLAM 40 AR - GRIS - 10 m x 1 m",
      quantity: 10,
      totalPrice: 500,
      isCompetitor: true,  // Mal classifié !
      type: 'competitor'
    },
    
    // Cas 2: Produit Soprema mal orthographié
    {
      designation: "SOPRALENE flam 180",
      quantity: 5,
      totalPrice: 300,
      isCompetitor: true,  // Mal classifié !
      type: 'competitor'
    },
    
    // Cas 3: Produit vraiment concurrent
    {
      designation: "Membrane IKO Premium",
      quantity: 20,
      totalPrice: 1200,
      isCompetitor: true,
      type: 'competitor'
    },
    
    // Cas 4: Produit Soprema avec faute de frappe
    {
      designation: "SOPRFIX HP",  // SOPRAFIX mal écrit
      quantity: 8,
      totalPrice: 400,
      isCompetitor: true,  // Mal classifié !
      type: 'competitor'
    },
    
    // Cas 5: Produit concurrent avec mot-clé ambigü
    {
      designation: "FLASHING UNIVERSEL KNAUF",
      quantity: 15,
      totalPrice: 600,
      isCompetitor: true,
      type: 'competitor'
    },
    
    // Cas 6: Produit Soprema correctement classifié
    {
      designation: "MAMMOUTH 120 mm",
      quantity: 30,
      totalPrice: 1500,
      isCompetitor: false,
      type: 'soprema'
    }
  ];

  console.log('📋 Produits à vérifier:');
  testProducts.forEach((p, i) => {
    console.log(`${i + 1}. "${p.designation}" - Classé comme: ${p.type}`);
  });

  console.log('\n' + '='.repeat(80) + '\n');

  // Tester la vérification
  const result = await sopremaProductMatcher.verifyProducts(testProducts);
  
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('📊 RÉSUMÉ FINAL:');
  console.log(`   - Produits vérifiés: ${result.summary.totalProducts}`);
  console.log(`   - Produits reclassifiés: ${result.summary.reclassifiedCount}`);
  console.log(`   - Total Soprema: ${result.summary.sopremaTotal.toFixed(2)}€`);
  console.log(`   - Total Concurrent: ${result.summary.competitorTotal.toFixed(2)}€`);
  
  console.log('\n📋 Détails des produits après vérification:');
  result.products.forEach((p, i) => {
    console.log(`\n${i + 1}. "${p.designation}"`);
    console.log(`   Type final: ${p.type}`);
    if (p.verificationDetails) {
      if (p.verificationDetails.reclassified) {
        console.log(`   ✅ RECLASSIFIÉ de ${p.verificationDetails.originalClassification} → ${p.type}`);
        console.log(`   Correspondance: "${p.verificationDetails.matchedName}" (${p.verificationDetails.confidence}%)`);
      } else if (p.verificationDetails.lowConfidence) {
        console.log(`   ⚠️  Faible confiance: ${p.verificationDetails.confidence}%`);
      } else {
        console.log(`   ✓ Classification confirmée (confiance: ${p.verificationDetails.confidence}%)`);
      }
    }
  });

  // Test de cas individuels
  console.log('\n\n🔬 Tests de correspondance individuels:\n');
  
  const testCases = [
    "ELASTOPHENE FLAM 40 AR",
    "SOPRALENE",
    "SOPRFIX",  // Faute de frappe
    "MAMMOUTH",
    "IKO Premium",
    "KNAUF Insulation",
    "VAPOR FLAG",
    "ALSAN 500"
  ];

  for (const testCase of testCases) {
    const match = await sopremaProductMatcher.findBestMatch(testCase);
    console.log(`"${testCase}":`);
    console.log(`   → Soprema: ${match.matched ? 'OUI' : 'NON'} (${match.confidence}%)`);
    if (match.matched) {
      console.log(`   → Produit trouvé: "${match.matchedProduct}"`);
    }
  }
}

// Exécuter le test
testProductVerification().catch(console.error);