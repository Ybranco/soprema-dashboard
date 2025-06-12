// Script pour filtrer les non-produits de la base Soprema
import fs from 'fs/promises';

// Liste définitive des non-produits à exclure
const NON_PRODUCTS_TO_EXCLUDE = {
  // SERVICES ET FRAIS - À EXCLURE
  services: [
    /^transport$/i,
    /transport tms/i,
    /plus value transport/i,
    /transport sur achats/i,
    /frais d'inspection/i,
    /frais de reconditionnement/i,
    /frais d'assurance/i,
    /frais coface/i,
    /frais financiers/i,
    /ventes diverses/i,
    /prestations? de services?/i,
    /formation/i,
    /maintenance/i,
    /reparation/i,
    /refacturation/i,
    /avoir commercial/i,
    /livraison/i,
    /location/i,
    /deplacements/i,
    /reception/i
  ],
  
  // VÊTEMENTS - À EXCLURE (incluant textiles non-techniques)
  clothing: [
    /casquette/i,
    /polo/i,
    /chandail/i,
    /sweat/i,
    /t-shirt/i,
    /tee-shirt/i,
    /blouson/i,
    /gilet/i,
    /bonnet/i,
    /echarpe/i,
    /veste/i,
    /pantalon/i,
    /vetement/i,
    /parka/i,
    /combinaison de travail/i,
    /tenue de travail/i,
    /salopette/i,
    /bermuda/i,
    /short/i
  ],
  
  // ÉQUIPEMENTS DE SÉCURITÉ - À EXCLURE
  safety: [
    /chaussure/i,
    /surchaussure/i,
    /gant/i,
    /lunette/i,
    /masque/i,
    /cartouche pour masque/i,
    /casque de chantier/i,
    /harnais/i,
    /protection auditive/i,
    /bouchons d'oreilles/i
  ],
  
  // EMBALLAGE ET LOGISTIQUE - À EXCLURE
  packaging: [
    /palettes? traitees?/i,
    /palette perdue/i,
    /reprise \d+ palettes?/i,
    /consigne/i,
    /emballage/i,
    /conditionnement/i,
    /carton vide/i,
    /retour/i,
    /feuillard/i,
    /cerclage/i,
    /fut acier/i,
    /fut plastique/i,
    /conteneur/i,
    /bac de retention/i,
    /housse pour palette/i
  ],
  
  // ARTICLES PROMOTIONNELS - ATTENTION, CERTAINS SONT DES PRODUITS!
  promotional_only: [
    /client - cadeau/i,
    /divers - cadeau/i,
    /goodies/i,
    /stylo/i,
    /porte-cle/i,
    /badge/i,
    /parapluie/i,
    /sac publicitaire/i,
    /calendrier/i,
    /agenda/i,
    /cle usb/i,
    /mug/i,
    /tasse/i
  ],
  
  // AUTRES NON-PRODUITS
  other: [
    /dechets/i,
    /non-conformite/i,
    /sac a gravois/i,
    /big bag vide/i,
    /container vide/i,
    /rebuts/i,
    /chutes/i
  ]
};

// Produits qui pourraient sembler promotionnels mais sont de VRAIS PRODUITS
const REAL_PRODUCTS_EXCEPTIONS = [
  /bande d'etancheite autocollante/i,  // Vrais produits d'étanchéité
  /autocollant.*consignes/i,            // Autocollants de sécurité/consignes (à garder?)
  /film autocollant/i,                  // Films techniques
  /membrane autocollante/i              // Membranes d'étanchéité
];

async function filterNonProducts() {
  console.log('🔧 Filtrage des non-produits de la base Soprema\n');
  console.log('=' .repeat(60));

  try {
    // Charger le fichier JSON original
    const data = await fs.readFile('./Produits_Soprema_France.json', 'utf8');
    const productData = JSON.parse(data);
    
    console.log(`📊 Produits dans la base originale: ${productData.total_produits}`);
    
    const excludedProducts = [];
    const keptProducts = [];
    const uncertainProducts = [];
    
    // Analyser chaque produit
    for (const product of productData.produits) {
      const productName = product.nom_complet;
      let shouldExclude = false;
      let excludeReason = '';
      
      // Vérifier d'abord si c'est une exception (vrai produit)
      const isRealProduct = REAL_PRODUCTS_EXCEPTIONS.some(pattern => 
        pattern.test(productName)
      );
      
      if (isRealProduct) {
        keptProducts.push(product);
        continue;
      }
      
      // Vérifier toutes les catégories d'exclusion
      for (const [category, patterns] of Object.entries(NON_PRODUCTS_TO_EXCLUDE)) {
        for (const pattern of patterns) {
          if (pattern.test(productName)) {
            shouldExclude = true;
            excludeReason = category;
            break;
          }
        }
        if (shouldExclude) break;
      }
      
      // Cas spéciaux nécessitant une vérification manuelle
      if (!shouldExclude && productName.toLowerCase().includes('autocollant')) {
        uncertainProducts.push({
          product: product,
          reason: 'Autocollant - pourrait être un produit technique ou promotionnel'
        });
      } else if (!shouldExclude && productName.toLowerCase().includes('textile')) {
        // Vérifier si c'est un textile technique (ROTATEX, etc.)
        if (productName.includes('ROTATEX') || productName.includes('RTEX')) {
          uncertainProducts.push({
            product: product,
            reason: 'Textile technique - vérifier si c\'est un renfort ou un vêtement'
          });
        } else {
          shouldExclude = true;
          excludeReason = 'clothing';
        }
      } else if (shouldExclude) {
        excludedProducts.push({
          product: product.nom_complet,
          reason: excludeReason
        });
      } else {
        keptProducts.push(product);
      }
    }
    
    // Afficher les résultats
    console.log('\n📋 RÉSUMÉ DU FILTRAGE:\n');
    console.log(`✅ Produits conservés: ${keptProducts.length}`);
    console.log(`❌ Non-produits exclus: ${excludedProducts.length}`);
    console.log(`❓ Produits incertains: ${uncertainProducts.length}`);
    
    // Afficher quelques exemples d'exclusions
    console.log('\n🚫 Exemples de non-produits exclus:');
    const categories = {};
    excludedProducts.forEach(item => {
      if (!categories[item.reason]) categories[item.reason] = [];
      categories[item.reason].push(item.product);
    });
    
    Object.entries(categories).forEach(([cat, products]) => {
      console.log(`\n${cat.toUpperCase()} (${products.length} exclus):`);
      products.slice(0, 5).forEach(p => console.log(`  - ${p}`));
      if (products.length > 5) console.log(`  ... et ${products.length - 5} autres`);
    });
    
    // Afficher les produits incertains
    if (uncertainProducts.length > 0) {
      console.log('\n❓ PRODUITS NÉCESSITANT VALIDATION:');
      uncertainProducts.slice(0, 10).forEach(item => {
        console.log(`\n- ${item.product.nom_complet}`);
        console.log(`  Raison: ${item.reason}`);
      });
      if (uncertainProducts.length > 10) {
        console.log(`\n... et ${uncertainProducts.length - 10} autres produits incertains`);
      }
    }
    
    // Créer le nouveau fichier JSON filtré
    const filteredData = {
      total_produits: keptProducts.length,
      produits: keptProducts,
      metadata: {
        original_count: productData.total_produits,
        excluded_count: excludedProducts.length,
        uncertain_count: uncertainProducts.length,
        filtered_date: new Date().toISOString()
      }
    };
    
    await fs.writeFile(
      'Produits_Soprema_France_Filtered.json',
      JSON.stringify(filteredData, null, 2)
    );
    
    // Sauvegarder aussi les listes d'exclusion et d'incertains
    await fs.writeFile(
      'excluded-products.json',
      JSON.stringify({
        total: excludedProducts.length,
        products: excludedProducts
      }, null, 2)
    );
    
    await fs.writeFile(
      'uncertain-products.json',
      JSON.stringify({
        total: uncertainProducts.length,
        products: uncertainProducts
      }, null, 2)
    );
    
    console.log('\n✅ Fichiers créés:');
    console.log('  - Produits_Soprema_France_Filtered.json (base filtrée)');
    console.log('  - excluded-products.json (liste des exclusions)');
    console.log('  - uncertain-products.json (produits à vérifier)');
    
    // Statistiques finales
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log(`Réduction: ${((excludedProducts.length / productData.total_produits) * 100).toFixed(2)}%`);
    console.log(`Base originale: ${productData.total_produits} produits`);
    console.log(`Base filtrée: ${keptProducts.length} produits`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le filtrage
filterNonProducts();