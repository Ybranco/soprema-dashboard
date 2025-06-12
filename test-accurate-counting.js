#!/usr/bin/env node

/**
 * Test du système de comptage précis
 * Simule l'upload de factures et vérifie les statistiques
 */

console.log('🧪 Test du système de comptage précis\n');

// Simuler les résultats d'un traitement de 10 fichiers
const simulationResults = {
  totalFiles: 10,
  serverResponses: [
    { success: true, invoice: { id: '1', number: 'FAC001', products: [{ designation: 'Produit 1', type: 'competitor' }] } },
    { success: true, invoice: { id: '2', number: 'FAC002', products: [{ designation: 'Produit 2', type: 'soprema' }] } },
    { success: true, invoice: { id: '3', number: 'FAC003', products: [{ designation: 'Produit 3', type: 'competitor' }] } },
    { success: true, invoice: { id: '4', number: 'FAC004', products: [{ designation: 'conversion alternative', type: 'competitor' }] } }, // Sera rejetée
    { success: true, invoice: { id: '5', number: 'FAC005', products: [] } }, // Sera rejetée (aucun produit)
    { success: true, invoice: { id: '6', number: 'FAC006', products: [{ designation: 'Produit 6', type: 'competitor' }] } },
    { success: true, invoice: { id: '7', number: 'FAC007', products: [{ designation: 'Produit 7', type: 'soprema' }] } },
    { success: true, invoice: { id: '8', number: 'FAC008', products: [{ designation: 'document pdf', type: 'competitor' }] } }, // Sera rejetée
    { success: true, invoice: { id: '9', number: 'FAC009', products: [{ designation: 'Produit 9', type: 'competitor' }] } },
    { success: false, error: 'Server error' } // Erreur serveur
  ]
};

// Simuler le processus de validation côté client
function simulateClientValidation(serverResponse) {
  if (!serverResponse.success) {
    return { wasAdded: false, reason: 'Server error' };
  }

  const invoice = serverResponse.invoice;

  // Vérifier s'il y a des erreurs de conversion
  const hasConversionError = invoice.products.some(product => {
    const text = (product.designation || '').toLowerCase();
    return text.includes('conversion alternative') || 
           text.includes('document pdf') ||
           text.includes('non extrait');
  });

  // Vérifier s'il n'y a aucun produit
  const hasNoProducts = !invoice.products || invoice.products.length === 0;

  if (hasConversionError || hasNoProducts) {
    return { 
      wasAdded: false, 
      reason: hasConversionError ? 'Conversion error detected' : 'No valid products'
    };
  }

  return { wasAdded: true, reason: 'Valid invoice' };
}

// Simuler le traitement complet
console.log('📊 Simulation du traitement de 10 fichiers:\n');

let processedCount = 0;
let successCount = 0; // Fichiers traités avec succès par le serveur
let validatedCount = 0; // Factures réellement ajoutées au store
let errorCount = 0;

simulationResults.serverResponses.forEach((response, index) => {
  processedCount++;
  
  console.log(`📄 Fichier ${index + 1}:`);
  
  if (response.success) {
    successCount++;
    console.log(`  ✅ Serveur: Extraction réussie (${response.invoice.number})`);
    
    const validation = simulateClientValidation(response);
    
    if (validation.wasAdded) {
      validatedCount++;
      console.log(`  ✅ Client: Facture validée et ajoutée au store`);
    } else {
      console.log(`  ❌ Client: Facture rejetée (${validation.reason})`);
    }
  } else {
    errorCount++;
    console.log(`  ❌ Serveur: Erreur de traitement`);
  }
  
  console.log('');
});

// Afficher les statistiques finales
console.log('📈 STATISTIQUES FINALES:');
console.log('========================');
console.log(`📁 Fichiers traités: ${processedCount}/${simulationResults.totalFiles}`);
console.log(`✅ Extractions serveur réussies: ${successCount}`);
console.log(`💾 Factures validées dans le store: ${validatedCount}`);
console.log(`🚫 Factures rejetées par validation: ${successCount - validatedCount}`);
console.log(`❌ Erreurs de traitement: ${errorCount}`);

console.log('\n🔍 ANALYSE:');
console.log('===========');
console.log(`• ${successCount} fichiers traités avec succès par le serveur`);
console.log(`• ${validatedCount} factures réellement ajoutées au store`);
console.log(`• ${successCount - validatedCount} factures rejetées par la validation client`);
console.log(`• Taux de validation: ${Math.round((validatedCount / successCount) * 100)}%`);

console.log('\n✅ Cette distinction explique pourquoi on peut avoir:');
console.log('   - 9 extractions serveur réussies');
console.log('   - mais seulement 6 factures dans le store');
console.log('   - Les 3 autres ayant été rejetées par la validation client');

console.log('\n🎯 Le nouveau système de comptage affiche maintenant:');
console.log(`   - "${validatedCount} factures validées sur ${successCount} traitées"`);
console.log('   - Au lieu de la confusion précédente entre extraction et validation');

if (validatedCount === 6 && successCount === 9) {
  console.log('\n✅ Test RÉUSSI: Le comptage correspond aux attentes!');
} else {
  console.log('\n❌ Test échoué: Vérifiez la logique de comptage');
}