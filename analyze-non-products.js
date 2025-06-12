// Script pour analyser et identifier les non-produits dans la base Soprema
import fs from 'fs/promises';

// Mots-clés pour identifier les non-produits
const NON_PRODUCT_KEYWORDS = {
  // Services et frais
  services: [
    // Termes exacts pour éviter les faux positifs
    'transport tms', 'plus value transport', 'transport sur achats',
    'frais d\'inspection', 'frais de reconditionnement', 'frais d\'assurance',
    'frais coface', 'frais financiers', 'frais de construction', 'frais de personnel',
    'ventes diverses', 'prestations de services', 'formation',
    'maintenance', 'reparation', 'refacturation', 'avoir commercial'
  ],
  
  // Vêtements et EPI promotionnels
  clothing: [
    'casquette', 'polo', 'chandail', 'sweat', 'shirt', 'tee-shirt',
    't-shirt', 'blouson', 'gilet', 'bonnet', 'echarpe', 'veste',
    'pantalon', 'vetement', 'textile'
  ],
  
  // Équipements de protection (à garder ou non?)
  safety_equipment: [
    'chaussure', 'surchaussure', 'gant', 'lunette', 'masque'
  ],
  
  // Matériel promotionnel et goodies
  promotional: [
    'badge', 'autocollant', 'stylo', 'porte-cle', 'porte-clé',
    'parapluie', 'cadeau', 'promotion', 'publicitaire', 'goodies'
  ],
  
  // Emballage et logistique (à garder ou non?)
  packaging: [
    'palettes traitees', 'palette perdue', 'consigne',
    'emballage', 'conditionnement', 'carton vide', 'reprise', 'retour'
    // Note: 'palette' seule est trop générique, car beaucoup de produits sont vendus par palette
  ],
  
  // Autres
  other: [
    'sac a gravois', 'boisseau', 'dechet'
  ]
};

// Mots-clés qui semblent non-produits mais sont en fait des produits légitimes
const LEGITIMATE_PRODUCTS = [
  'geotextile', // Produit d'étanchéité légitime
  'film pare-vapeur', // Produit d'étanchéité
  'film paillage', // Produit horticole Sopranature
  'plots', // Accessoires de toiture-terrasse (PLOTS FIXES, PLOTS A VIS, etc.)
  'plot', // Singulier aussi
  'carton', // Quand c'est un conditionnement pour plots/accessoires
  'cales amortisseurs', // Accessoires techniques
  'support peripherique', // Accessoires de toiture
  'embase auto nivelant', // Accessoires techniques
  'tete de plot', // Accessoires de toiture-terrasse
  'kit de bordure', // Accessoires techniques
  'cornieres', // Accessoires techniques
  'rondelles', // Fixations
  'bandes releves', // Produits d'étanchéité
  'sac' // Quand c'est suivi de matériaux (VERMEX, PERLISOL, etc.)
];

async function analyzeProducts() {
  console.log('🔍 Analyse des produits Soprema pour identifier les non-produits\n');
  console.log('=' .repeat(60));

  try {
    // Charger le fichier JSON
    const data = await fs.readFile('./Produits_Soprema_France.json', 'utf8');
    const productData = JSON.parse(data);
    
    console.log(`📊 Total produits dans la base: ${productData.total_produits}`);
    
    const categorizedProducts = {
      services: [],
      clothing: [],
      safety_equipment: [],
      promotional: [],
      packaging: [],
      other: [],
      uncertain: []
    };
    
    let legitimateCount = 0;
    
    // Analyser chaque produit
    for (const product of productData.produits) {
      const productName = product.nom_complet.toLowerCase();
      let isNonProduct = false;
      let category = null;
      
      // Vérifier si c'est un produit légitime malgré les mots-clés
      const isLegitimate = LEGITIMATE_PRODUCTS.some(legit => 
        productName.includes(legit.toLowerCase())
      );
      
      // Vérifications spécifiques pour éviter les faux positifs
      const isRealProduct = 
        // Plots et accessoires de toiture
        (productName.includes('plot') && !productName.includes('transport')) ||
        // Produits en sac (matériaux)
        (productName.includes('sac') && (productName.includes('vermex') || productName.includes('perlisol') || 
         productName.includes('cemica') || productName.includes('efiperl') || productName.includes('vicucolle'))) ||
        // Accessoires techniques avec dimensions
        (productName.includes('carton') && productName.match(/\d+\s*mm/)) ||
        // Palettes de plantes (Sopranature)
        (productName.includes('palette') && productName.includes('plantes'));
      
      if (isLegitimate || isRealProduct) {
        legitimateCount++;
        continue;
      }
      
      // Vérifier chaque catégorie de non-produits
      for (const [cat, keywords] of Object.entries(NON_PRODUCT_KEYWORDS)) {
        if (keywords.some(keyword => productName.includes(keyword))) {
          isNonProduct = true;
          category = cat;
          break;
        }
      }
      
      if (isNonProduct && category) {
        categorizedProducts[category].push(product.nom_complet);
      }
    }
    
    // Afficher les résultats
    console.log('\n📋 RÉSULTATS DE L\'ANALYSE:\n');
    
    for (const [category, products] of Object.entries(categorizedProducts)) {
      if (products.length > 0) {
        console.log(`\n${getCategoryEmoji(category)} ${getCategoryName(category)} (${products.length} articles):`);
        console.log('-'.repeat(50));
        
        // Afficher les 10 premiers exemples
        const examples = products.slice(0, 10);
        examples.forEach(p => console.log(`  - ${p}`));
        
        if (products.length > 10) {
          console.log(`  ... et ${products.length - 10} autres`);
        }
      }
    }
    
    // Statistiques finales
    const totalNonProducts = Object.values(categorizedProducts)
      .reduce((sum, products) => sum + products.length, 0);
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n📊 STATISTIQUES FINALES:\n');
    console.log(`Total produits analysés: ${productData.total_produits}`);
    console.log(`Non-produits identifiés: ${totalNonProducts}`);
    console.log(`Produits légitimes: ${productData.total_produits - totalNonProducts}`);
    console.log(`Pourcentage de non-produits: ${((totalNonProducts / productData.total_produits) * 100).toFixed(2)}%`);
    
    // Questions pour l'utilisateur
    console.log('\n❓ QUESTIONS POUR VALIDATION:\n');
    console.log('1. Faut-il garder les équipements de sécurité (gants, lunettes, chaussures) ?');
    console.log('   → Ce sont des EPI vendus avec les produits d\'étanchéité');
    console.log('\n2. Faut-il garder les matériaux d\'emballage (palettes, cartons) ?');
    console.log('   → Certains peuvent être facturés séparément');
    console.log('\n3. Les services (transport, formation) doivent-ils être exclus ?');
    console.log('   → Ils apparaissent sur les factures mais ne sont pas des produits');
    
    // Sauvegarder la liste des non-produits identifiés
    const nonProductsList = [];
    for (const products of Object.values(categorizedProducts)) {
      nonProductsList.push(...products);
    }
    
    await fs.writeFile(
      'non-products-identified.json',
      JSON.stringify({
        total_non_products: totalNonProducts,
        categories: categorizedProducts,
        list: nonProductsList
      }, null, 2)
    );
    
    console.log('\n✅ Liste des non-produits sauvegardée dans: non-products-identified.json');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

function getCategoryEmoji(category) {
  const emojis = {
    services: '🚚',
    clothing: '👕',
    safety_equipment: '🦺',
    promotional: '🎁',
    packaging: '📦',
    other: '🔧',
    uncertain: '❓'
  };
  return emojis[category] || '📌';
}

function getCategoryName(category) {
  const names = {
    services: 'SERVICES ET FRAIS',
    clothing: 'VÊTEMENTS',
    safety_equipment: 'ÉQUIPEMENTS DE SÉCURITÉ',
    promotional: 'ARTICLES PROMOTIONNELS',
    packaging: 'EMBALLAGE ET LOGISTIQUE',
    other: 'AUTRES',
    uncertain: 'INCERTAINS'
  };
  return names[category] || category.toUpperCase();
}

// Exécuter l'analyse
analyzeProducts();