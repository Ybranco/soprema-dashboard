#!/usr/bin/env node

// Script de debug pour analyser les factures dans le store
// Utilisage: node debug-invoices-analysis.js

console.log('🔍 DEBUG: Analyse des factures dans le localStorage');

// Simuler l'environnement localStorage (pour Node.js)
const localStorageKey = 'soprema-dashboard-v2-storage';

// Fonction pour analyser les données du localStorage
function analyzeInvoicesData() {
  try {
    // En production, vous devriez copier-coller le contenu du localStorage ici
    console.log('📋 Instructions:');
    console.log('1. Ouvrez la console du navigateur (F12)');
    console.log('2. Tapez: localStorage.getItem("soprema-dashboard-v2-storage")');
    console.log('3. Copiez le résultat JSON ici pour analyse');
    console.log('');
    console.log('📊 Analyses à faire:');
    console.log('- Nombre total de factures stockées');
    console.log('- Structure des produits dans chaque facture');
    console.log('- Présence des champs type/isCompetitor');
    console.log('- Validation des factures');
    console.log('');
    
    // Exemple de ce qu'on cherche
    const exampleAnalysis = {
      totalInvoices: 'Nombre dans store.invoices',
      factures: [
        {
          number: 'Numéro facture',
          client: 'Nom client',
          products: [
            {
              designation: 'Nom produit',
              type: 'competitor|soprema',
              isCompetitor: 'true|false|boolean',
              totalPrice: 'Prix'
            }
          ]
        }
      ]
    };
    
    console.log('🎯 Structure attendue:', JSON.stringify(exampleAnalysis, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Fonction pour analyser un JSON de factures
function analyzeInvoicesJSON(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    const state = data.state || data;
    const invoices = state.invoices || [];
    
    console.log('\n🔍 ANALYSE DES FACTURES:');
    console.log('=====================================');
    console.log(`📊 Nombre total de factures: ${invoices.length}`);
    
    invoices.forEach((invoice, index) => {
      console.log(`\n📄 Facture ${index + 1}:`);
      console.log(`   Numéro: ${invoice.number || 'N/A'}`);
      console.log(`   Client: ${invoice.client?.name || 'N/A'}`);
      console.log(`   Produits: ${invoice.products?.length || 0}`);
      
      if (invoice.products && invoice.products.length > 0) {
        let competitorCount = 0;
        let sopremaCount = 0;
        let unknownCount = 0;
        
        invoice.products.forEach((product, pIndex) => {
          const isCompetitor = product.type === 'competitor' || 
                             product.isCompetitor === true ||
                             product.isCompetitor === 'true';
          const isSoprema = product.type === 'soprema' ||
                          product.isSoprema === true ||
                          product.isSoprema === 'true';
          
          if (isCompetitor) competitorCount++;
          else if (isSoprema) sopremaCount++;
          else unknownCount++;
          
          // Log les premiers produits pour debug
          if (pIndex < 3) {
            console.log(`     Produit ${pIndex + 1}: ${product.designation || 'N/A'}`);
            console.log(`       Type: ${product.type || 'N/A'}`);
            console.log(`       isCompetitor: ${product.isCompetitor}`);
            console.log(`       Prix: ${product.totalPrice || 0}€`);
          }
        });
        
        console.log(`   📊 Répartition: ${competitorCount} concurrent(s), ${sopremaCount} Soprema, ${unknownCount} inconnu(s)`);
        
        if (competitorCount > 0) {
          console.log(`   ✅ ÉLIGIBLE pour reconquête (${competitorCount} produits concurrents)`);
        } else {
          console.log(`   ❌ Non éligible (aucun produit concurrent)`);
        }
      }
    });
    
    // Analyse globale
    const eligibleInvoices = invoices.filter(invoice => {
      if (!invoice.products) return false;
      return invoice.products.some(product => 
        product.type === 'competitor' || 
        product.isCompetitor === true ||
        product.isCompetitor === 'true'
      );
    });
    
    console.log('\n📈 RÉSUMÉ GLOBAL:');
    console.log('=====================================');
    console.log(`📊 Factures totales: ${invoices.length}`);
    console.log(`🎯 Factures éligibles: ${eligibleInvoices.length}`);
    console.log(`❌ Factures non éligibles: ${invoices.length - eligibleInvoices.length}`);
    
    // Clients uniques
    const uniqueClients = new Set(invoices.map(inv => inv.client?.name).filter(Boolean));
    console.log(`👥 Clients uniques: ${uniqueClients.size}`);
    
  } catch (error) {
    console.error('❌ Erreur analyse JSON:', error.message);
  }
}

// Export pour utilisation en tant que module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeInvoicesJSON };
}

// Exécution si script appelé directement
if (require.main === module) {
  analyzeInvoicesData();
}