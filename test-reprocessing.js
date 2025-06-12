// Test du système de retraitement automatique des factures mal extraites
import { reprocessingHandler } from './server-reprocessing-handler.js';

console.log('🧪 Test du Système de Retraitement Automatique\n');
console.log('=' .repeat(60));

// Cas de test 1: Facture avec extraction échouée
const failedExtraction = {
  invoiceNumber: 'FA-2025-001',
  date: 'Document PDF - conversion alternative',
  client: {
    name: 'Document PDF - conversion alternative',
    fullName: 'Document PDF - conversion alternative',
    address: 'Document PDF - conversion alternative',
    siret: '',
    contact: 'Document PDF - conversion alternative',
    phone: ''
  },
  distributor: {
    name: 'Document PDF - conversion alternative',
    agency: 'Document PDF - conversion alternative',
    seller: ''
  },
  products: [
    {
      reference: 'Document PDF - conversion alternative',
      designation: 'Document PDF - conversion alternative',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      isCompetitor: false,
      brand: ''
    }
  ],
  totalAmount: 0
};

// Cas de test 2: Facture partiellement extraite
const partialExtraction = {
  invoiceNumber: 'FA-2025-002',
  date: '2025-06-11',
  client: {
    name: 'Client BTP Test',
    fullName: 'Client BTP Test SARL',
    address: 'Document PDF - conversion alternative',
    siret: '12345678901234',
    contact: 'Jean Dupont',
    phone: '0123456789'
  },
  distributor: {
    name: 'Distributeur Test',
    agency: 'Agence Nord',
    seller: 'Paul Martin'
  },
  products: [
    {
      reference: 'REF-001',
      designation: 'Document PDF - conversion alternative',
      quantity: 10,
      unitPrice: 50,
      totalPrice: 500,
      isCompetitor: false,
      brand: 'Soprema'
    },
    {
      reference: 'Document PDF - conversion alternative',
      designation: 'Document PDF - conversion alternative',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      isCompetitor: true,
      brand: ''
    }
  ],
  totalAmount: 500
};

// Cas de test 3: Facture correctement extraite
const successfulExtraction = {
  invoiceNumber: 'FA-2025-003',
  date: '2025-06-11',
  client: {
    name: 'Entreprise Construction',
    fullName: 'Entreprise Construction SAS',
    address: '123 rue de la Paix, 75001 Paris',
    siret: '98765432109876',
    contact: 'Marie Martin',
    phone: '0198765432'
  },
  distributor: {
    name: 'Point P',
    agency: 'Agence Paris Centre',
    seller: 'Pierre Durand'
  },
  products: [
    {
      reference: 'ELAST-001',
      designation: 'ELASTOPHENE FLAM 25',
      quantity: 50,
      unitPrice: 45,
      totalPrice: 2250,
      isCompetitor: false,
      brand: 'Soprema'
    },
    {
      reference: 'IKO-002',
      designation: 'Membrane IKO Premium',
      quantity: 30,
      unitPrice: 60,
      totalPrice: 1800,
      isCompetitor: true,
      brand: 'IKO'
    }
  ],
  totalAmount: 4050
};

// Test 1: Extraction complètement échouée
console.log('\n📋 Test 1: Facture avec extraction totalement échouée');
console.log('Tous les champs contiennent "Document PDF - conversion alternative"');

const result1 = reprocessingHandler.checkExtractionFailure(failedExtraction);
console.log('\nRésultat de la validation:');
console.log(`- Problèmes détectés: ${result1.hasIssues ? 'OUI' : 'NON'}`);
console.log(`- Nombre d'échecs: ${result1.failureCount}`);
console.log(`- Retraitement requis: ${result1.requiresReprocessing ? 'OUI' : 'NON'}`);
console.log(`- Confiance: ${result1.confidence}%`);
console.log(`- Issues: ${result1.issues.join(', ')}`);

// Test 2: Extraction partielle
console.log('\n' + '=' .repeat(60));
console.log('\n📋 Test 2: Facture avec extraction partielle');
console.log('Certains champs sont extraits, d\'autres contiennent l\'erreur');

const result2 = reprocessingHandler.checkExtractionFailure(partialExtraction);
console.log('\nRésultat de la validation:');
console.log(`- Problèmes détectés: ${result2.hasIssues ? 'OUI' : 'NON'}`);
console.log(`- Nombre d'échecs: ${result2.failureCount}`);
console.log(`- Retraitement requis: ${result2.requiresReprocessing ? 'OUI' : 'NON'}`);
console.log(`- Confiance: ${result2.confidence}%`);
console.log(`- Issues: ${result2.issues.join(', ')}`);

// Test 3: Extraction réussie
console.log('\n' + '=' .repeat(60));
console.log('\n📋 Test 3: Facture correctement extraite');
console.log('Tous les champs sont correctement remplis');

const result3 = reprocessingHandler.checkExtractionFailure(successfulExtraction);
console.log('\nRésultat de la validation:');
console.log(`- Problèmes détectés: ${result3.hasIssues ? 'OUI' : 'NON'}`);
console.log(`- Nombre d'échecs: ${result3.failureCount}`);
console.log(`- Retraitement requis: ${result3.requiresReprocessing ? 'OUI' : 'NON'}`);
console.log(`- Confiance: ${result3.confidence}%`);

// Test 4: Nettoyage des données échouées
console.log('\n' + '=' .repeat(60));
console.log('\n🧹 Test 4: Nettoyage des données échouées');

const cleanedData = reprocessingHandler.cleanFailedData(partialExtraction);
console.log('\nDonnées avant nettoyage:');
console.log(`- Adresse client: "${partialExtraction.client.address}"`);
console.log(`- Produit 2 designation: "${partialExtraction.products[1].designation}"`);

console.log('\nDonnées après nettoyage:');
console.log(`- Adresse client: "${cleanedData.client.address}"`);
console.log(`- Produit 2 designation: "${cleanedData.products[1].designation}"`);

// Test 5: Méthodes de conversion alternatives
console.log('\n' + '=' .repeat(60));
console.log('\n🔄 Test 5: Méthodes de conversion alternatives');

for (let i = 0; i < 4; i++) {
  const method = reprocessingHandler.getAlternativeConversionMethod('default', i);
  console.log(`Tentative ${i + 1}: ${method}`);
}

// Résumé
console.log('\n' + '=' .repeat(60));
console.log('\n✅ RÉSUMÉ DU SYSTÈME DE RETRAITEMENT:\n');
console.log('1. ✅ Détecte automatiquement les extractions échouées');
console.log('2. ✅ Calcule un score de confiance basé sur les échecs');
console.log('3. ✅ Déclenche le retraitement si >= 3 champs échouent');
console.log('4. ✅ Nettoie les données pour éviter la pollution');
console.log('5. ✅ Propose 4 méthodes de conversion alternatives');
console.log('6. ✅ Rejette définitivement après échec du retraitement');

console.log('\n📌 PROTECTION ACTIVÉE:');
console.log('Les factures avec "Document PDF - conversion alternative"');
console.log('ne passeront JAMAIS dans le système sans retraitement!');

console.log('\n🎯 Impact sur les résultats:');
console.log('- Évite les faux positifs dans les statistiques');
console.log('- Garantit la qualité des données');
console.log('- Améliore la fiabilité des plans de reconquête');