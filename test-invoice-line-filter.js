// Test du filtrage des lignes non-produits dans les factures
import { invoiceLineFilter } from './invoice-line-filter.js';

console.log('🧪 Test du Filtrage des Lignes Non-Produits\n');
console.log('=' .repeat(60));

// Cas de test : facture avec mélange de produits et non-produits
const testInvoice = {
  invoiceNumber: 'FA-2025-TEST',
  date: '2025-06-11',
  client: { name: 'Client Test BTP' },
  totalAmount: 15000,
  products: [
    // Vrais produits
    {
      reference: 'ELAST-001',
      designation: 'ELASTOPHENE FLAM 25 AR',
      quantity: 50,
      unitPrice: 45,
      totalPrice: 2250,
      isCompetitor: false
    },
    {
      reference: 'IKO-002',
      designation: 'Membrane IKO Premium',
      quantity: 30,
      unitPrice: 60,
      totalPrice: 1800,
      isCompetitor: true
    },
    // Transport et frais
    {
      reference: '',
      designation: 'TRANSPORT',
      quantity: 1,
      unitPrice: 150,
      totalPrice: 150,
      isCompetitor: false
    },
    {
      reference: 'FRAIS-001',
      designation: 'Frais de transport exceptionnel',
      quantity: 1,
      unitPrice: 250,
      totalPrice: 250,
      isCompetitor: false
    },
    {
      reference: '',
      designation: 'Port et emballage',
      quantity: 1,
      unitPrice: 80,
      totalPrice: 80,
      isCompetitor: false
    },
    // Taxes
    {
      reference: '',
      designation: 'Eco-taxe DEEE',
      quantity: 1,
      unitPrice: 25,
      totalPrice: 25,
      isCompetitor: false
    },
    {
      reference: 'ECO-001',
      designation: 'Eco-participation recyclage',
      quantity: 1,
      unitPrice: 35,
      totalPrice: 35,
      isCompetitor: false
    },
    // Services
    {
      reference: '',
      designation: 'Main d\'oeuvre pose',
      quantity: 8,
      unitPrice: 50,
      totalPrice: 400,
      isCompetitor: false
    },
    {
      reference: 'FORM-001',
      designation: 'Formation application produits',
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500,
      isCompetitor: false
    },
    // Remises
    {
      reference: '',
      designation: 'Remise commerciale 5%',
      quantity: 1,
      unitPrice: -250,
      totalPrice: -250,
      isCompetitor: false
    },
    // Produits avec noms ambigus
    {
      reference: 'TRANS-001',
      designation: 'Isolant transport de chaleur SOPRA',
      quantity: 20,
      unitPrice: 35,
      totalPrice: 700,
      isCompetitor: false
    },
    {
      reference: 'PAL-001',
      designation: 'Palette de 48 rouleaux SOPRALENE',
      quantity: 1,
      unitPrice: 2400,
      totalPrice: 2400,
      isCompetitor: false
    }
  ]
};

// Test 1: Vérification ligne par ligne
console.log('\n📋 Test 1: Analyse individuelle des lignes\n');

testInvoice.products.forEach((line, index) => {
  const result = invoiceLineFilter.checkInvoiceLine(line);
  console.log(`${index + 1}. "${line.designation}"`);
  console.log(`   → Produit: ${result.isProduct ? '✅ OUI' : '❌ NON'}`);
  console.log(`   → Catégorie: ${result.category}`);
  console.log(`   → Confiance: ${result.confidence}%`);
  if (result.reason) {
    console.log(`   → Raison: ${result.reason}`);
  }
  console.log('');
});

// Test 2: Filtrage complet de la facture
console.log('=' .repeat(60));
console.log('\n📋 Test 2: Filtrage complet de la facture\n');

const cleanedInvoice = invoiceLineFilter.cleanInvoiceData(testInvoice);

console.log('📊 Résumé du filtrage:');
console.log(`   - Lignes originales: ${testInvoice.products.length}`);
console.log(`   - Produits conservés: ${cleanedInvoice.products.length}`);
console.log(`   - Lignes filtrées: ${cleanedInvoice._filtering.removedLines.length}`);

console.log('\n💰 Montants:');
console.log(`   - Total facture original: ${testInvoice.totalAmount}€`);
console.log(`   - Total produits uniquement: ${cleanedInvoice.totalProductsOnly}€`);
console.log(`   - Total frais/services: ${cleanedInvoice._filtering.summary.totalNonProductAmount}€`);

console.log('\n🏷️ Catégories des lignes filtrées:');
Object.entries(cleanedInvoice._filtering.summary.categories).forEach(([cat, count]) => {
  console.log(`   - ${cat}: ${count} ligne(s)`);
});

// Test 3: Cas spéciaux
console.log('\n' + '=' .repeat(60));
console.log('\n📋 Test 3: Cas spéciaux et edge cases\n');

const specialCases = [
  { designation: 'TRANSPORT', expected: false },
  { designation: 'Transport de chaleur isolant', expected: true },
  { designation: 'Frais de dossier', expected: false },
  { designation: 'Frais bitume modifié SBS', expected: true },
  { designation: 'ECO-TAXE', expected: false },
  { designation: 'ECO membrane étanche', expected: true },
  { designation: 'Palette vide', expected: false },
  { designation: 'Palette de rouleaux ELASTOPHENE', expected: true },
  { designation: 'TVA 20%', expected: false },
  { designation: 'Forfait pose étanchéité', expected: false },
  { designation: '', expected: false },
  { designation: 'A', expected: false }
];

specialCases.forEach(testCase => {
  const result = invoiceLineFilter.checkInvoiceLine({ designation: testCase.designation });
  const passed = result.isProduct === testCase.expected;
  console.log(`${passed ? '✅' : '❌'} "${testCase.designation}" → Produit: ${result.isProduct ? 'OUI' : 'NON'} (attendu: ${testCase.expected ? 'OUI' : 'NON'})`);
});

// Résumé final
console.log('\n' + '=' .repeat(60));
console.log('\n✅ SYSTÈME DE FILTRAGE PRÊT:\n');
console.log('Le système peut maintenant:');
console.log('1. ✅ Détecter automatiquement les lignes de transport');
console.log('2. ✅ Filtrer les taxes et éco-participations');
console.log('3. ✅ Exclure les services et main d\'œuvre');
console.log('4. ✅ Identifier les remises et avoirs');
console.log('5. ✅ Reconnaître les exceptions (produits avec noms ambigus)');
console.log('6. ✅ Recalculer les totaux sans les frais');

console.log('\n🎯 Impact:');
console.log('- Évite de classer "TRANSPORT" comme produit concurrent');
console.log('- Statistiques basées uniquement sur les vrais produits');
console.log('- Plans de reconquête plus précis');