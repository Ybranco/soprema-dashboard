// 🚨 NETTOYAGE TOTAL - RESET COMPLET DU LOCALSTORAGE
// Copiez-collez ce code dans la console (F12) de votre navigateur

console.log('🧹 NETTOYAGE TOTAL EN COURS...');

// 1. SUPPRIMER COMPLÈTEMENT le localStorage de l'application
const STORAGE_KEY = 'soprema-dashboard-v2-storage';
localStorage.removeItem(STORAGE_KEY);
console.log('🗑️ localStorage supprimé');

// 2. SUPPRIMER aussi les anciennes versions si elles existent
const possibleKeys = [
  'soprema-dashboard-storage',
  'soprema-dashboard-v1-storage', 
  'soprema-dashboard-v2-storage',
  'dashboard-store',
  'zustand-storage'
];

possibleKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`🗑️ Clé supprimée: ${key}`);
  }
});

// 3. CRÉER un nouveau state complètement vide
const cleanState = {
  invoices: [],
  opportunities: [],
  stats: {
    invoicesAnalyzed: { value: 0, trend: 0, trendDirection: 'up' },
    clientsIdentified: { value: 0, trend: 0, trendDirection: 'up' },
    businessPotential: { value: 0, trend: 0, trendDirection: 'up' }
  },
  competitorProducts: [],
  analysisResults: {
    lastInvoice: 'Aucune analyse effectuée',
    detectedProducts: 'Aucun produit analysé',
    competitorBrands: 'Aucune marque détectée',
    clientProfilesGenerated: 'Aucun profil client créé',
    estimatedPotential: 0
  },
  reconquestPlans: [],
  reconquestSummary: null
};

// 4. SAUVEGARDER le state propre
const zustandWrapper = {
  state: cleanState,
  version: 2
};

localStorage.setItem(STORAGE_KEY, JSON.stringify(zustandWrapper));
console.log('✅ Nouveau state propre créé');

// 5. VÉRIFICATION FINALE
const verification = localStorage.getItem(STORAGE_KEY);
if (verification) {
  const parsed = JSON.parse(verification);
  console.log('📊 Vérification du nouveau state:', {
    invoices: parsed.state.invoices.length,
    opportunities: parsed.state.opportunities.length,
    plans: parsed.state.reconquestPlans.length
  });
  
  // Vérifier s'il reste des traces de corruption
  const hasCorruption = JSON.stringify(parsed).toLowerCase().includes('conversion alternative');
  if (hasCorruption) {
    console.error('❌ CORRUPTION ENCORE DÉTECTÉE!');
  } else {
    console.log('✅ AUCUNE CORRUPTION - STATE COMPLÈTEMENT PROPRE');
  }
} else {
  console.error('❌ Erreur lors de la création du nouveau state');
}

// 6. FORCER LE RECHARGEMENT DE LA PAGE
console.log('🔄 Rechargement automatique dans 2 secondes...');
setTimeout(() => {
  window.location.reload();
}, 2000);

console.log('🎉 NETTOYAGE TOTAL TERMINÉ!');