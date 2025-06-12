// Script final pour créer la base de produits Soprema filtrée
import fs from 'fs/promises';

// Produits incertains à GARDER (validés par l'utilisateur)
const UNCERTAIN_TO_KEEP = [
  // Bandes relevés autocollantes - vrais produits d'étanchéité
  "BANDES RELEVES VELAPHONE AUTOCOLLANTES - 50 m x 100 mm x 3 mm",
  "BANDES RELEVES VELAPHONE AUTOCOLLANTES - 50 m x 145 mm x 3 mm",
  "BANDES RELEVES AUTOCOLLANTES BAVETTE - 3 mm - 50 m x 120 mm",
  "BANDES RELEVES AUTOCOLLANTES BAVETTE - 5 mm - 50 m x 150 mm",
  
  // Textiles techniques ROTATEX/RTEX - renforts pour membranes
  "ROTATEX G550 SUP E60 - CHOMARAT TEXTILES INDUSTRIES",
  "RTEX G900 AL 70-1080mm - CHOMARAT TEXTILES INDUSTRIES",
  "RTEX G900 AL 70 AMELIOREE 1080mm - CHOMARAT TEXTILES INDUSTRIES",
  "ROTATEX G550 E17 - 1030mm - CHOMARAT TEXTILES INDUSTRIES",
  "ROTATEX G550 E70 - CHOMARAT TEXTILES INDUSTRIES",
  "ROTATEX G550 E17 A - CHOMARAT TEXTILES INDUSTRIES"  // Le #10 à garder
];

// Produits incertains à EXCLURE (autocollants promotionnels/signalétique)
const UNCERTAIN_TO_EXCLUDE = [
  "AUTOCOLLANT - CASQUES DE CHANTIER 5*2 CM",
  "AUTOCOLLANT - CONTRATS D'ENTRETIEN DES TOITURES-TERRASSES 6*11 CM",
  "AUTOCOLLANT - ESPACE CONFINE 30*5 CM",
  "AUTOCOLLANT - SGS POUR VEHICULE 20*20 CM",
  "AUTOCOLLANT - SOPRASSISTANCE - LES 10 COMMANDEMENTS 15*21 CM",
  "AUTOCOLLANT - TRANSPORT MATERIEL CONTAMINE EN EXEMPTION D'ADR 16*16 CM",
  "ETIQUETTE AUTOCOLLANTE SOPREMA - 10*5 cm",
  "ETIQUETTE AUTOCOLLANTE SOPREMA - 20*10 cm",
  "REPERE AUTOCOLLANT COMPTEUR ELECTRIQUE 5 x 10 cm"
];

async function createFinalFilteredProducts() {
  console.log('🎯 Création de la base de produits Soprema filtrée finale\n');
  console.log('=' .repeat(60));

  try {
    // Charger les fichiers nécessaires
    const [filteredData, excludedData, uncertainData] = await Promise.all([
      fs.readFile('./Produits_Soprema_France_Filtered.json', 'utf8').then(JSON.parse),
      fs.readFile('./excluded-products.json', 'utf8').then(JSON.parse),
      fs.readFile('./uncertain-products.json', 'utf8').then(JSON.parse)
    ]);
    
    console.log(`📊 État actuel:`);
    console.log(`   - Produits filtrés: ${filteredData.total_produits}`);
    console.log(`   - Produits exclus: ${excludedData.total}`);
    console.log(`   - Produits incertains: ${uncertainData.total}`);
    
    // Ajouter les produits incertains à garder
    let productsToAdd = [];
    let additionalExclusions = [];
    
    uncertainData.products.forEach(item => {
      const productName = item.product.nom_complet;
      
      if (UNCERTAIN_TO_KEEP.includes(productName)) {
        productsToAdd.push(item.product);
      } else if (UNCERTAIN_TO_EXCLUDE.includes(productName)) {
        additionalExclusions.push({
          product: productName,
          reason: 'promotional_signage'
        });
      }
    });
    
    // Créer la base finale
    const finalProducts = [...filteredData.produits, ...productsToAdd];
    
    // Mettre à jour les exclusions
    const finalExclusions = [...excludedData.products, ...additionalExclusions];
    
    // Trier les produits par nom pour faciliter la recherche
    finalProducts.sort((a, b) => a.nom_complet.localeCompare(b.nom_complet));
    
    // Créer le fichier final
    const finalData = {
      total_produits: finalProducts.length,
      produits: finalProducts,
      metadata: {
        original_count: 14033,
        excluded_count: finalExclusions.length,
        filtered_date: new Date().toISOString(),
        filtering_notes: {
          excluded_categories: [
            "Services et frais (transport, formation, etc.)",
            "Vêtements et textiles non-techniques",
            "Équipements de sécurité (EPI)",
            "Emballages et palettes",
            "Articles promotionnels et signalétique",
            "Déchets et non-conformités"
          ],
          kept_exceptions: [
            "Bandes relevés autocollantes (produits d'étanchéité)",
            "Textiles techniques ROTATEX/RTEX (renforts pour membranes)"
          ]
        }
      }
    };
    
    // Sauvegarder la base finale
    await fs.writeFile(
      'Produits_Soprema_France_Final.json',
      JSON.stringify(finalData, null, 2)
    );
    
    // Mettre à jour le fichier d'exclusions
    await fs.writeFile(
      'excluded-products-final.json',
      JSON.stringify({
        total: finalExclusions.length,
        products: finalExclusions
      }, null, 2)
    );
    
    // Statistiques finales
    console.log('\n✅ BASE FINALE CRÉÉE:\n');
    console.log(`📊 Statistiques:`);
    console.log(`   - Base originale: 14,033 produits`);
    console.log(`   - Non-produits exclus: ${finalExclusions.length}`);
    console.log(`   - Produits conservés: ${finalProducts.length}`);
    console.log(`   - Réduction: ${((finalExclusions.length / 14033) * 100).toFixed(2)}%`);
    
    console.log('\n📋 Détails des exclusions finales:');
    const exclusionCategories = {};
    finalExclusions.forEach(item => {
      const cat = item.reason || 'other';
      exclusionCategories[cat] = (exclusionCategories[cat] || 0) + 1;
    });
    
    Object.entries(exclusionCategories).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} produits`);
    });
    
    console.log('\n✅ Fichier créé: Produits_Soprema_France_Final.json');
    console.log('🎯 Cette base contient uniquement les vrais produits de construction/étanchéité');
    
    // Créer aussi une version simplifiée pour le matcher
    const simplifiedProducts = finalProducts.map(p => p.nom_complet);
    await fs.writeFile(
      'soprema-products-list-final.json',
      JSON.stringify({
        total: simplifiedProducts.length,
        products: simplifiedProducts
      }, null, 2)
    );
    
    console.log('✅ Liste simplifiée créée: soprema-products-list-final.json');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la création
createFinalFilteredProducts();