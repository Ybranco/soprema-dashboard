// 🚨 SCRIPT DE NETTOYAGE COMPLET - À EXÉCUTER DANS LA CONSOLE
// Ouvrez http://localhost:5173 → F12 → Console → Copiez-collez ce code

console.log('🧹 DÉBUT DU NETTOYAGE COMPLET...');

const STORAGE_KEY = 'soprema-dashboard-v2-storage';
const data = localStorage.getItem(STORAGE_KEY);

if (data) {
  console.log('🔍 Recherche de factures corrompues...');
  const parsed = JSON.parse(data);
  const state = parsed.state || parsed;
  
  if (state.invoices) {
    const beforeCount = state.invoices.length;
    console.log('📊 Avant nettoyage:', beforeCount, 'factures');
    
    // ÉLIMINER toute facture contenant "conversion alternative" ou "Document PDF"
    state.invoices = state.invoices.filter(invoice => {
      const clientName = invoice.client?.name || '';
      const invoiceNumber = invoice.number || '';
      
      // Vérifier le nom du client
      const hasClientError = clientName.toLowerCase().includes('conversion alternative') ||
                            clientName.toLowerCase().includes('document pdf');
      
      // Vérifier les produits
      const hasProductError = invoice.products && invoice.products.some(product => {
        const text = (product.designation + product.reference + (product.description || '')).toLowerCase();
        return text.includes('conversion alternative') || text.includes('document pdf');
      });
      
      // Vérifier le numéro de facture
      const hasInvoiceError = invoiceNumber.toLowerCase().includes('conversion alternative') ||
                             invoiceNumber.toLowerCase().includes('document pdf');
      
      if (hasClientError || hasProductError || hasInvoiceError) {
        console.log('🗑️ ÉLIMINÉE - Facture corrompue:', {
          client: clientName,
          number: invoiceNumber,
          amount: invoice.amount
        });
        return false; // ÉLIMINER cette facture
      }
      
      return true; // Garder cette facture
    });
    
    const afterCount = state.invoices.length;
    console.log('✅ Après nettoyage:', afterCount, 'factures');
    console.log('🗑️ Factures éliminées:', beforeCount - afterCount);
    
    // REMETTRE TOUT À ZÉRO pour éviter les références corrompues
    state.competitorProducts = [];
    state.opportunities = [];
    state.reconquestPlans = [];
    state.reconquestSummary = null;
    state.stats = {
      invoicesAnalyzed: { value: 0, trend: 0, trendDirection: 'up' },
      clientsIdentified: { value: 0, trend: 0, trendDirection: 'up' },
      businessPotential: { value: 0, trend: 0, trendDirection: 'up' }
    };
    
    // Sauvegarder les données nettoyées
    if (parsed.state) {
      parsed.state = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    
    console.log('✅ NETTOYAGE TERMINÉ - Rechargez la page (F5)');
    console.log('📊 Résultat:', state.invoices.length, 'factures valides restantes');
    
  } else {
    console.log('ℹ️ Aucune facture dans localStorage');
  }
} else {
  console.log('ℹ️ localStorage vide');
}

// Vérification finale
console.log('🔍 Vérification finale...');
const finalData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
const finalState = finalData.state || finalData;
if (finalState.invoices) {
  const hasCorruption = finalState.invoices.some(inv => {
    const clientName = inv.client?.name || '';
    return clientName.includes('conversion alternative') || clientName.includes('Document PDF');
  });
  
  if (hasCorruption) {
    console.error('❌ CORRUPTION ENCORE PRÉSENTE!');
  } else {
    console.log('✅ AUCUNE CORRUPTION DÉTECTÉE');
    console.log('🎉 NETTOYAGE RÉUSSI - Rechargez avec F5');
  }
}