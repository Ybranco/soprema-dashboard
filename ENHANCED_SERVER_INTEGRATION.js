// Exemple d'intégration de la base Soprema dans le prompt Claude
// À intégrer dans server.js

import { improvedSopremaProductMatcher } from './IMPROVED_PRODUCT_MATCHER.js';

// Fonction pour créer un prompt enrichi avec la base Soprema
async function createEnhancedPrompt() {
  // Charger les produits les plus représentatifs
  const topProducts = await improvedSopremaProductMatcher.getTopProductsForPrompt(300);
  
  const enhancedSystemPrompt = `Tu es un expert en analyse de factures pour SOPREMA. Tu dois extraire les informations de la facture fournie et les retourner au format JSON structuré.

INSTRUCTIONS IMPORTANTES:
1. Extrais TOUTES les informations disponibles de la facture
2. Pour chaque produit, identifie s'il appartient à SOPREMA ou à un CONCURRENT avec PRÉCISION
3. Si des informations sont manquantes, utilise des valeurs par défaut appropriées
4. Les montants doivent être des nombres (pas de symboles monétaires)
5. Les dates doivent être au format YYYY-MM-DD

IDENTIFICATION DES MARQUES - MÉTHODOLOGIE RENFORCÉE:

🎯 RÈGLE PRINCIPALE: Un produit est SOPREMA seulement s'il correspond aux références SOPREMA connues.

MARQUES SOPREMA (isCompetitor = false) - RÉFÉRENCES PRINCIPALES:
- SOPREMA (toute variation)
- SOPRALENE (membranes bitumineuses) 
- SOPRASTAR (autoprotégées)
- SOPRADUR (PVC)
- SARNAVAP (pare-vapeur)
- PAVAFLEX (isolation)
- PAVATEX (isolation bois)
- SOPRASMART (systèmes intelligents)
- ELASTOPHENE (membranes SBS)
- SOPRFIX / SOPRAFIX (fixations)
- MAMMOUTH (membranes haute performance)
- ALSAN (résines liquides)
- CURAL (étanchéité liquide)
- EFISARKING (isolation toiture)
- SOPRASOLAR (photovoltaïque)
- EFISOL (isolation)

RÉFÉRENCES SOPREMA EXACTES FRÉQUENTES:
${topProducts.slice(0, 200).map(product => `- ${product}`).join('\n')}

EXEMPLES DE PRODUITS SOPREMA SPÉCIFIQUES:
${topProducts.slice(200, 300).map(product => `- ${product}`).join('\n')}

CONCURRENTS PRINCIPAUX (isCompetitor = true):
- IKO (membranes d'étanchéité)
- ROCKWOOL (isolation)
- ISOVER (isolation Saint-Gobain)
- URSA (isolation)
- KNAUF (isolation)
- FIRESTONE (membranes EPDM)
- CARLISLE (membranes)
- SIPLAST (étanchéité Icopal)
- ICOPAL (membranes bitumineuses)
- BAUDER (systèmes d'étanchéité)
- RHEPANOL (membranes FPO)
- RESITRIX (membranes EPDM)

MÉTHODOLOGIE D'IDENTIFICATION PRÉCISE:

1. CORRESPONDANCE EXACTE (priorité 1):
   - Compare chaque produit avec la liste des références SOPREMA ci-dessus
   - Si correspondance exacte ou très proche → isCompetitor = false

2. ANALYSE DES MOTS-CLÉS (priorité 2):
   - Recherche des marques/références SOPREMA dans le nom du produit
   - Attention aux variantes (SOPRALENE vs SOPRA LENE)

3. ANALYSE CONTEXTUELLE (priorité 3):
   - Si le fournisseur est SOPREMA → tous produits = SOPREMA (isCompetitor = false)
   - Si distributeur mixte → analyser chaque référence individuellement

4. RÈGLES DE CLASSIFICATION FINALES:
   - EXPLICITEMENT DANS LA LISTE SOPREMA → isCompetitor = false
   - EXPLICITEMENT CONCURRENT → isCompetitor = true  
   - GÉNÉRIQUE SANS MARQUE + fournisseur SOPREMA → isCompetitor = false
   - DOUTE OU GÉNÉRIQUE + autre fournisseur → isCompetitor = true

5. AJOUT DU NIVEAU DE CONFIANCE:
   - "high": correspondance exacte ou mot-clé SOPREMA clair
   - "medium": correspondance partielle ou contexte probable
   - "low": classification par défaut ou incertaine

Format de sortie attendu:
{
  "invoiceInfo": {
    "number": "string",
    "date": "YYYY-MM-DD",
    "supplier": "string",
    "customer": "string"
  },
  "products": [
    {
      "designation": "nom exact du produit",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "isCompetitor": boolean,
      "brand": "marque identifiée ou null",
      "category": "type de produit",
      "confidence": "high|medium|low",
      "matchingReason": "exact_match|keyword_match|supplier_context|default_classification"
    }
  ],
  "totals": {
    "subtotal": number,
    "tax": number,
    "total": number
  }
}

IMPORTANT: Utilise le champ "matchingReason" pour expliquer pourquoi tu as classifié chaque produit.`;

  return enhancedSystemPrompt;
}

// Fonction modifiée pour l'analyse des factures avec prompt enrichi
async function analyzeInvoiceWithEnhancedPrompt(req, res) {
  try {
    console.log(`📋 Analyse d'une facture avec prompt ENRICHI...`);
    
    // ... [code existant pour traitement du fichier] ...
    
    // Créer le prompt enrichi avec la base Soprema
    const systemPrompt = await createEnhancedPrompt();
    
    // Préparer les messages pour Claude
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: isPDF 
              ? `Analyse cette facture et extrais les informations au format JSON. Contenu: ${contentForAnalysis}`
              : 'Analyse cette facture et extrais les informations au format JSON.'
          }
        ]
      }
    ];

    if (!isPDF) {
      messages[0].content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: req.file.mimetype,
          data: contentForAnalysis.split(',')[1]
        }
      });
    }

    // Appel à Claude avec le prompt enrichi
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: messages
    });

    // Traitement de la réponse
    const responseText = response.content[0].text;
    console.log('📝 Réponse Claude reçue avec prompt enrichi');
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Aucun JSON valide trouvé dans la réponse');
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    console.log('✅ Données extraites avec prompt enrichi');
    console.log(`🎯 Produits avec raisons de classification: ${extractedData.products?.length || 0}`);

    // Log des raisons de classification
    if (extractedData.products) {
      extractedData.products.forEach(product => {
        console.log(`📊 ${product.designation}: ${product.isCompetitor ? 'CONCURRENT' : 'SOPREMA'} (${product.confidence}, ${product.matchingReason})`);
      });
    }

    // ÉTAPE DE VÉRIFICATION OPTIONNELLE avec le matcher amélioré
    console.log('\n🔍 Vérification post-traitement avec matcher amélioré...');
    const verificationResult = await improvedSopremaProductMatcher.verifyProducts(extractedData.products || []);
    
    // Utiliser les produits vérifiés
    extractedData.products = verificationResult.products;
    extractedData.verificationSummary = verificationResult.summary;

    // Nettoyage du fichier temporaire
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erreur suppression fichier:', err);
    });

    // Statistiques finales
    const sopremaProducts = extractedData.products.filter(p => !p.isCompetitor);
    const competitorProducts = extractedData.products.filter(p => p.isCompetitor);
    
    console.log(`\n📈 RÉSULTATS FINAUX:`);
    console.log(`   🟢 Produits SOPREMA: ${sopremaProducts.length}`);
    console.log(`   🔴 Produits CONCURRENTS: ${competitorProducts.length}`);
    console.log(`   💰 CA Potentiel: ${competitorProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0).toFixed(2)}€`);

    res.json({
      success: true,
      data: extractedData,
      message: 'Facture analysée avec prompt enrichi et vérification automatique',
      enhanced: true,
      verification: verificationResult.summary
    });

  } catch (error) {
    console.error('❌ Erreur analyse facture enrichie:', error);
    res.status(500).json({
      error: 'Erreur analyse',
      message: error.message
    });
  }
}

// Export pour intégration dans server.js
export { createEnhancedPrompt, analyzeInvoiceWithEnhancedPrompt };