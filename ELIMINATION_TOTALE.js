// 🚨 ÉLIMINATION TOTALE - DESTRUCTION DE TOUTE CORRUPTION
// Copiez-collez ce code dans la console (F12) et appuyez sur Entrée

console.log('💥 ÉLIMINATION TOTALE EN COURS - DESTRUCTION DE LA CORRUPTION');

// 1. SUPPRIMER TOUT LE LOCALSTORAGE
console.log('🗑️ Destruction complète du localStorage...');
localStorage.clear();
sessionStorage.clear();

// 2. SUPPRIMER SPÉCIFIQUEMENT TOUTES LES CLÉS POSSIBLES
const possibleKeys = [
  'soprema-dashboard-storage',
  'soprema-dashboard-v1-storage', 
  'soprema-dashboard-v2-storage',
  'dashboard-store',
  'zustand-storage',
  'invoices',
  'dashboard-data',
  'soprema-data'
];

possibleKeys.forEach(key => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`🗑️ Clé détruite: ${key}`);
  } catch (e) {
    console.log(`⚠️ Impossible de supprimer: ${key}`);
  }
});

// 3. VÉRIFICATION TOTALE
console.log('🔍 Vérification que TOUT est supprimé...');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('soprema') || key.includes('dashboard') || key.includes('invoice'))) {
    console.log(`🗑️ Suppression résiduelle: ${key}`);
    localStorage.removeItem(key);
  }
}

// 4. CRÉATION D'UN STATE ULTRA-PROPRE
console.log('✨ Création d\'un état complètement neuf...');
const ultraCleanState = {
  state: {
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
  },
  version: 2
};

// 5. SAUVEGARDER LE NOUVEL ÉTAT
localStorage.setItem('soprema-dashboard-v2-storage', JSON.stringify(ultraCleanState));

// 6. VÉRIFICATION FINALE ULTIME
console.log('🔍 VÉRIFICATION FINALE - Recherche de toute trace de corruption...');
let foundCorruption = false;

// Vérifier localStorage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  if (value && (
    value.toLowerCase().includes('conversion alternative') ||
    value.toLowerCase().includes('document pdf')
  )) {
    console.error(`❌ CORRUPTION TROUVÉE dans ${key}:`, value.substring(0, 100));
    foundCorruption = true;
  }
}

// Vérifier sessionStorage
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  const value = sessionStorage.getItem(key);
  if (value && (
    value.toLowerCase().includes('conversion alternative') ||
    value.toLowerCase().includes('document pdf')
  )) {
    console.error(`❌ CORRUPTION TROUVÉE dans sessionStorage ${key}:`, value.substring(0, 100));
    foundCorruption = true;
  }
}

if (foundCorruption) {
  console.error('💀 CORRUPTION PERSISTANTE DÉTECTÉE - RECHARGEMENT FORCÉ');
  setTimeout(() => {
    window.location.href = window.location.href + '?clean=' + Date.now();
  }, 1000);
} else {
  console.log('✅ AUCUNE CORRUPTION DÉTECTÉE - ÉTAT ULTRA-PROPRE');
  console.log('🎉 ÉLIMINATION RÉUSSIE - RECHARGEMENT DANS 2 SECONDES');
  setTimeout(() => {
    window.location.reload(true);
  }, 2000);
}

// 7. AFFICHER L'ÉTAT FINAL
const finalState = JSON.parse(localStorage.getItem('soprema-dashboard-v2-storage') || '{}');
console.log('📊 État final:', finalState);

console.log('💥 ÉLIMINATION TOTALE TERMINÉE !');