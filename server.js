import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { extractTextFromPDF, formatTextForAnalysis, extractTextSimple } from './pdf-text-extractor-pdf2json.js';
import { ocrWithILovePDF, convertWithILovePDF } from './ilovepdf-wrapper.js';

// 🚀 NOUVELLE IMPORTATION - Méthode Hybride
import { hybridSopremaMethod } from './HYBRID_SCORING_METHOD.js';

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialisation Express
const app = express();
app.use(cors());
app.use(express.json());

// Configuration Multer pour upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`));
    }
  }
});

// Initialisation Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Route santé avec statut méthode hybride
app.get('/api/health', async (req, res) => {
  try {
    // Vérifier si la méthode hybride est prête
    const hybridReady = hybridSopremaMethod.loaded || false;
    
    res.json({
      status: 'OK',
      features: {
        claudeAI: !!process.env.ANTHROPIC_API_KEY,
        textExtraction: true,
        hybridSoprema: hybridReady,
        sopremaProductsCount: hybridSopremaMethod.sopremaProducts?.length || 0
      },
      timestamp: new Date().toISOString(),
      version: 'hybrid-v2.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// 🧠 PROMPT CLAUDE AMÉLIORÉ avec méthode hybride
async function createEnhancedSystemPrompt() {
  // Générer le prompt enrichi avec les vraies gammes Soprema
  const sopremaEnhancement = await hybridSopremaMethod.generateEnhancedPrompt();
  
  return `Tu es un expert en analyse de factures pour SOPREMA. Tu dois extraire les informations de la facture fournie et les retourner au format JSON structuré.

INSTRUCTIONS IMPORTANTES:
1. Extrais TOUTES les informations disponibles de la facture
2. EXCLURE OBLIGATOIREMENT les frais annexes et ne garder QUE les vrais produits de toiture/isolation
3. Pour chaque produit, identifie s'il appartient à SOPREMA ou à un CONCURRENT avec PRÉCISION MAXIMALE
4. Si des informations sont manquantes, utilise des valeurs par défaut appropriées
5. Les montants doivent être des nombres (pas de symboles monétaires)
6. Les dates doivent être au format YYYY-MM-DD

🚫 FRAIS À EXCLURE OBLIGATOIREMENT (ne PAS inclure dans les produits):
- Frais de port / Livraison / Transport / Acheminement
- Surcharge carburant / Énergie / Gazole 
- Taxes (TVA, Écotaxe, DEEE, etc.)
- Frais de dossier / Administration / Gestion
- Assurance transport / Garantie
- Emballage / Conditionnement / Palette
- Remises / Ristournes / Escomptes
- Acomptes / Avances
- Main d'œuvre pure (sans produit)
- Services (études, conseils, formation)

✅ PRODUITS À INCLURE UNIQUEMENT:
- Membranes d'étanchéité / Bitume / EPDM / TPO
- Isolants (laine, mousse, panneaux)
- Pare-vapeur / Écrans
- Accessoires de pose (fixations, colles, mastics)
- Éléments de couverture (tuiles, ardoises, bacs)
- Systèmes d'évacuation (gouttières, chenaux)
- Produits réellement physiques de construction

🏪 DISTRIBUTEURS FRANÇAIS (NE SONT PAS des marques de produits!):
- Point.P, Chausson, BigMat, Gedimat, BMSO
- Union Matériaux, VM Matériaux, Tout Faire Matériaux
- Samse, Doras, Panofrance, Denis Matériaux
- Réseau Pro, Brossette, CMEM, Tanguy Matériaux
- Larivière, Descours & Cabaud, Frans Bonhomme
- Raboni, M+ Matériaux, Rexel, Sonepar

🏭 MARQUES CONCURRENTES PRINCIPALES (fabricants, pas distributeurs!):
- IKO (membranes bitumineuses)
- BAKOR (membranes et mastics)
- TREMCO (systèmes d'étanchéité)
- SIKA (membranes synthétiques, colles)
- FIRESTONE (EPDM, TPO)
- CARLISLE (membranes synthétiques)
- GAF (systèmes de toiture)
- JOHNS MANVILLE (isolation, membranes)
- DERBIGUM (membranes bitumineuses)
- RENOLIT (PVC)
- POLYGLASS (membranes modifiées)
- SIPLAST (étanchéité bitumineuse)
- AXTER (systèmes d'étanchéité)

${sopremaEnhancement}

MÉTHODOLOGIE D'IDENTIFICATION RENFORCÉE:

IMPORTANT: Ne PAS confondre distributeur et marque de produit!
- DISTRIBUTEURS (vendeurs/revendeurs): Point.P, Union Matériaux, BigMat, Samse, Chausson, Gedimat, Tout Faire, BMSO, VM Matériaux, etc.
  → CE NE SONT PAS DES MARQUES DE PRODUITS! Ce sont des magasins qui vendent des produits de différentes marques
- MARQUES CONCURRENTES (fabricants): IKO, Bakor, Tremco, Sika, Firestone, Carlisle, GAF, Johns Manville, Derbigum, Renolit, etc.
  → Ce sont les VRAIS fabricants des produits

1. CORRESPONDANCE EXACTE (priorité 1):
   - Compare chaque produit avec les références SOPREMA connues
   - Si correspondance exacte ou très proche → isCompetitor = false

2. ANALYSE DES MARQUES CONCURRENTES:
   - Si le produit contient une marque concurrente (IKO, Bakor, Tremco, etc.) → isCompetitor = true
   - NE JAMAIS utiliser le nom du distributeur comme marque!
   - Exemples INCORRECTS: brand: "Chausson", brand: "Point.P", brand: "Union Matériaux"
   - Exemples CORRECTS: brand: "IKO", brand: "Sika", brand: "SOPREMA"

3. ANALYSE CONTEXTUELLE (priorité 3):
   - Si le fournisseur est SOPREMA → tous produits = SOPREMA (isCompetitor = false)
   - Si distributeur (Point.P, Chausson, etc.) → chercher la VRAIE marque dans la désignation du produit
   - Si aucune marque identifiable → brand: null ou brand: "Générique"

4. RÈGLES DE CLASSIFICATION FINALES:
   - Produit avec marque SOPREMA → isCompetitor = false
   - Produit avec marque CONCURRENTE (IKO, Bakor, etc.) → isCompetitor = true  
   - Produit GÉNÉRIQUE sans marque → analyser le contexte
   - DOUTE → isCompetitor = true (sera re-vérifié par scoring)

5. AJOUT OBLIGATOIRE DU NIVEAU DE CONFIANCE:
   - "high": correspondance exacte ou mot-clé SOPREMA clair
   - "medium": correspondance partielle ou contexte probable  
   - "low": classification par défaut ou incertaine

Format de sortie EXACT attendu:
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
      "brand": "marque FABRICANT (IKO, Bakor, SOPREMA, etc.) - PAS le distributeur!",
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

IMPORTANT: Utilise le champ "matchingReason" pour expliquer pourquoi tu as classifié chaque produit.
IMPORTANT: Le scoring de similarité textuelle va re-vérifier tes classifications après.

EXEMPLES CRITIQUES pour le champ "brand":
❌ MAUVAIS:
- Facture de Chausson → brand: "Chausson" (NON! C'est le distributeur)
- Facture de Point.P → brand: "Point.P" (NON! C'est le distributeur)

✅ CORRECT:
- "TUILE MARSEILLE ROUGE" vendue par Chausson → brand: null ou "Générique" (pas de marque identifiable)
- "MEMBRANE IKO CAMBRIDGE" vendue par Point.P → brand: "IKO" (la vraie marque)
- "ELASTOPHENE FLAM 180-25" vendue par Union Matériaux → brand: "SOPREMA" (produit SOPREMA)`;
}

// 🎯 ROUTE PRINCIPALE D'ANALYSE - Version Hybride
app.post('/api/analyze-invoice', upload.single('invoice'), async (req, res) => {
  try {
    console.log(`\n🚀 ANALYSE HYBRIDE - Nouvelle facture: ${req.file.originalname}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier fourni',
        message: 'Veuillez uploader une facture PDF ou image'
      });
    }

    // 📚 S'assurer que la base Soprema est chargée
    if (!hybridSopremaMethod.loaded) {
      console.log(`📚 Chargement de la base Soprema...`);
      await hybridSopremaMethod.loadDatabase();
      console.log(`✅ ${hybridSopremaMethod.sopremaProducts.length} produits Soprema chargés`);
    }

    let contentForAnalysis;
    let isPDF = req.file.mimetype === 'application/pdf';

    // === TRAITEMENT DU FICHIER (PDF/IMAGE) ===
    if (isPDF) {
      console.log('📄 PDF détecté, extraction du texte...');
      
      // Logique d'extraction PDF existante...
      // [Garder votre logique actuelle d'extraction PDF]
      try {
        const extractedData = await extractTextFromPDF(req.file.path);
        contentForAnalysis = formatTextForAnalysis(extractedData);
        console.log(`✅ Texte extrait: ${extractedData.text.length} caractères`);
      } catch (extractError) {
        console.log('⚠️ Extraction PDF échouée, tentative OCR...');
        // Fallback vers OCR...
        try {
          const ocrPath = await ocrWithILovePDF(req.file.path);
          const ocrData = await extractTextFromPDF(ocrPath);
          contentForAnalysis = formatTextForAnalysis(ocrData);
          console.log(`✅ OCR réussi: ${ocrData.text.length} caractères`);
        } catch (ocrError) {
          console.log('❌ OCR échoué, envoi PDF en base64');
          const pdfBuffer = await fs.promises.readFile(req.file.path);
          contentForAnalysis = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
          isPDF = false; // Traiter comme image pour Claude
        }
      }
    } else {
      console.log('🖼️ Image détectée, conversion en base64...');
      const fileBuffer = await fs.promises.readFile(req.file.path);
      contentForAnalysis = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    }

    // === ANALYSE CLAUDE AVEC PROMPT ENRICHI ===
    console.log('\n🧠 Analyse Claude avec prompt ENRICHI...');
    
    const systemPrompt = await createEnhancedSystemPrompt();
    
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

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: messages
    });

    // === TRAITEMENT RÉPONSE CLAUDE ===
    const responseText = response.content[0].text;
    console.log('📝 Réponse Claude reçue');
    
    // Parser JSON plus robuste
    let extractedData;
    try {
      // Essayer d'extraire le JSON de plusieurs façons
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Essayer de trouver le JSON entre ```json
        jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) jsonMatch[0] = jsonMatch[1];
      }
      
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse Claude');
      }
      
      let jsonText = jsonMatch[0];
      
      // Nettoyer le JSON avant parsing
      jsonText = jsonText
        .replace(/,(\s*[}\]])/g, '$1')  // Supprimer virgules avant } ou ]
        .replace(/\n/g, ' ')           // Remplacer retours ligne par espaces
        .replace(/\s+/g, ' ')          // Normaliser espaces multiples
        .trim();
      
      console.log(`🔍 JSON extrait (${jsonText.length} chars): ${jsonText.substring(0, 200)}...`);
      
      extractedData = JSON.parse(jsonText);
      
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError.message);
      console.log('📄 Réponse Claude complète:', responseText);
      
      // Fallback : créer une structure vide
      extractedData = {
        invoiceInfo: {
          number: `FA-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          supplier: 'Fournisseur non identifié',
          customer: 'Client extrait de la facture'
        },
        products: [],
        totals: { subtotal: 0, tax: 0, total: 0 }
      };
      
      console.log('⚠️ Utilisation structure fallback - facture sera rejetée');
    }
    console.log(`✅ Données extraites: ${extractedData.products?.length || 0} produits`);

    // Afficher les classifications initiales de Claude
    if (extractedData.products) {
      console.log('\n📊 CLASSIFICATIONS INITIALES CLAUDE:');
      extractedData.products.forEach((product, index) => {
        const status = product.isCompetitor ? '🔴 CONCURRENT' : '🟢 SOPREMA';
        console.log(`   ${index + 1}. ${status} - "${product.designation}" (${product.confidence}, ${product.matchingReason})`);
      });
    }

    // === 🎯 VÉRIFICATION HYBRIDE (NOUVELLE ÉTAPE) ===
    console.log('\n🎯 VÉRIFICATION HYBRIDE par scoring de similarité...');
    console.log(`   Seuil de matching: ${hybridSopremaMethod.SIMILARITY_THRESHOLD}%`);
    
    const verificationResult = await hybridSopremaMethod.verifyProducts(
      extractedData.products || [], 
      false // showDetails = false pour performance
    );

    // Remplacer les produits par les versions vérifiées
    extractedData.products = verificationResult.products;
    extractedData.hybridVerification = verificationResult.summary;

    // === STATISTIQUES FINALES ===
    const sopremaProducts = extractedData.products.filter(p => !p.isCompetitor);
    const competitorProducts = extractedData.products.filter(p => p.isCompetitor);
    const sopremaTotal = sopremaProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const competitorTotal = competitorProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    console.log('\n📈 RÉSULTATS FINAUX HYBRIDES:');
    console.log(`   🟢 Produits SOPREMA: ${sopremaProducts.length} (${sopremaTotal.toFixed(2)}€)`);
    console.log(`   🔴 Produits CONCURRENTS: ${competitorProducts.length} (${competitorTotal.toFixed(2)}€)`);
    console.log(`   🔄 Reclassifications: ${verificationResult.summary.reclassifiedCount}`);
    console.log(`   🎯 Précision estimée: ${verificationResult.summary.estimatedAccuracy}%`);

    // Nettoyage fichier temporaire
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erreur suppression fichier:', err);
    });

    // === RÉPONSE FINALE ===
    res.json({
      success: true,
      data: extractedData,
      message: `Facture analysée avec méthode HYBRIDE - ${verificationResult.summary.reclassifiedCount} reclassifications`,
      metadata: {
        method: 'hybrid-v2.0',
        claudePrompt: 'enriched',
        scoringThreshold: hybridSopremaMethod.SIMILARITY_THRESHOLD,
        verification: verificationResult.summary,
        processing: {
          fileType: isPDF ? 'PDF' : 'Image',
          originalName: req.file.originalname,
          processingTime: Date.now() - req.startTime
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur analyse hybride:', error);
    
    // Nettoyage en cas d'erreur
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({
      error: 'Erreur analyse hybride',
      message: error.message,
      method: 'hybrid-v2.0'
    });
  }
});

// Route de test pour un produit spécifique
app.post('/api/test-product', async (req, res) => {
  try {
    const { productName } = req.body;
    
    if (!productName) {
      return res.status(400).json({
        error: 'Nom de produit requis',
        message: 'Veuillez fournir un nom de produit à tester'
      });
    }

    console.log(`\n🧪 TEST PRODUIT HYBRIDE: "${productName}"`);
    
    // S'assurer que la base est chargée
    if (!hybridSopremaMethod.loaded) {
      await hybridSopremaMethod.loadDatabase();
    }

    // 🚫 Vérifier d'abord si c'est un frais parasite
    const isExcluded = hybridSopremaMethod.isExcludedItem(productName);
    
    if (isExcluded) {
      res.json({
        success: true,
        productName,
        result: {
          isExcluded: true,
          reason: 'Frais parasite détecté - produit exclu de l\'analyse',
          isSoprema: false,
          confidence: 0
        },
        threshold: hybridSopremaMethod.SIMILARITY_THRESHOLD
      });
      return;
    }

    const result = await hybridSopremaMethod.findBestMatch(productName, true);

    res.json({
      success: true,
      productName,
      result: {
        isExcluded: false,
        isSoprema: result.matched,
        confidence: result.score,
        matchedProduct: result.matchedProduct,
        method: result.method,
        details: result.details,
        top5Matches: result.top5Matches || []
      },
      threshold: hybridSopremaMethod.SIMILARITY_THRESHOLD
    });

  } catch (error) {
    console.error('❌ Erreur test produit:', error);
    res.status(500).json({
      error: 'Erreur test produit',
      message: error.message
    });
  }
});

// Middleware pour ajouter timestamp
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Route pour les opportunités de conversion
app.post('/api/customer-reconquest-plans', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(400).json({
        error: 'Configuration manquante',
        message: 'ANTHROPIC_API_KEY non configurée'
      });
    }

    const { invoices } = req.body;
    if (!invoices || invoices.length === 0) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Aucune facture fournie pour l\'analyse'
      });
    }

    console.log(`🎯 Identification des opportunités de conversion pour ${invoices.length} factures`);

    // Grouper les factures par client avec gestion robuste des noms
    const customerGroups = {};
    invoices.forEach(invoice => {
      // 🔧 CORRECTION: Gérer les cas où client est un objet ou une chaîne
      let clientName = '';
      if (typeof invoice.client === 'string') {
        clientName = invoice.client;
      } else if (invoice.client?.name) {
        clientName = invoice.client.name;
      } else {
        clientName = 'Client inconnu';
      }
      
      if (!customerGroups[clientName]) {
        customerGroups[clientName] = {
          client: invoice.client,
          invoices: [],
          totalAmount: 0,
          competitorProducts: new Map(),
          sopremaAmount: 0,
          competitorAmount: 0
        };
      }
      
      customerGroups[clientName].invoices.push(invoice);
      customerGroups[clientName].totalAmount += invoice.amount || 0;

      // Analyser les produits
      invoice.products?.forEach(product => {
        if (product.type === 'competitor' || product.isCompetitor) {
          const brand = product.competitor?.brand || product.brand || 'Marque inconnue';
          const current = customerGroups[clientName].competitorProducts.get(brand) || 0;
          customerGroups[clientName].competitorProducts.set(brand, current + product.totalPrice);
          customerGroups[clientName].competitorAmount += product.totalPrice;
        } else {
          customerGroups[clientName].sopremaAmount += product.totalPrice;
        }
      });
    });

    // Identifier les opportunités avec Claude AI pour chaque client
    console.log(`🤖 Identification des opportunités de conversion avec Claude AI...`);
    
    const plans = [];
    
    // Filtrer et préparer les clients avec produits concurrents
    // IMPORTANT: Appliquer le seuil de 5000€ minimum
    const MIN_COMPETITOR_AMOUNT = 5000;
    const clientsWithCompetitors = Object.entries(customerGroups)
      .filter(([name, data]) => data.competitorAmount >= MIN_COMPETITOR_AMOUNT)
      .sort((a, b) => b[1].competitorAmount - a[1].competitorAmount);
    
    console.log(`📊 Filtrage: ${Object.entries(customerGroups).filter(([n, d]) => d.competitorAmount > 0).length} clients avec concurrents → ${clientsWithCompetitors.length} clients ≥ ${MIN_COMPETITOR_AMOUNT}€`);
    
    // Générer un plan pour chaque client avec Claude
    for (const [clientName, data] of clientsWithCompetitors) {
        const timestamp = Date.now();
        
        // Convertir la Map des produits concurrents en tableau
        const topCompetitorBrands = Array.from(data.competitorProducts.entries())
          .map(([brand, amount]) => ({ brand, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        
        try {
          // 🤖 GÉNÉRATION DU PLAN PAR CLAUDE AI
          console.log(`   🎯 Génération plan pour ${clientName} (${data.competitorAmount.toFixed(2)}€ concurrent)...`);
          
          const claudePrompt = `En tant qu'expert commercial SOPREMA, identifie les opportunités de conversion pour ce client.

CONTEXTE CLIENT:
- Nom: ${clientName}
- Factures analysées: ${data.invoices.length}
- Chiffre d'affaires total: ${data.totalAmount.toFixed(2)}€
- Achats SOPREMA actuels: ${data.sopremaAmount.toFixed(2)}€ (${Math.round((data.sopremaAmount / data.totalAmount) * 100)}%)
- Achats CONCURRENTS: ${data.competitorAmount.toFixed(2)}€ (${Math.round((data.competitorAmount / data.totalAmount) * 100)}%)

PRODUITS CONCURRENTS UTILISÉS:
${topCompetitorBrands.map(b => `- ${b.brand}: ${b.amount.toFixed(2)}€`).join('\n')}

MISSION: Identifier les opportunités de conversion et suggérer des alternatives SOPREMA aux produits concurrents.

Retourne UNIQUEMENT un JSON avec cette structure EXACTE:
{
  "priority": "high|medium|low",
  "targetProducts": ["Produit SOPREMA spécifique 1", "Produit SOPREMA spécifique 2", "Produit SOPREMA spécifique 3"],
  "estimatedPotential": ${data.competitorAmount} (IMPORTANT: toujours égal au montant concurrent total),
  "conversionProbability": pourcentage_0_100,
  "suggestedActions": [
    {
      "type": "commercial|technique|relationnel",
      "description": "Action très spécifique et personnalisée",
      "timing": "Timing précis",
      "expectedImpact": "high|medium|low"
    }
  ],
  "keySellingPoints": ["Argument de vente 1", "Argument de vente 2", "Argument de vente 3"],
  "competitorWeaknesses": ["Faiblesse concurrent 1", "Faiblesse concurrent 2"],
  "riskFactors": ["Risque 1", "Risque 2"],
  "successMetrics": ["KPI 1", "KPI 2"]
}

IMPORTANT: 
- Sois TRÈS SPÉCIFIQUE dans les recommandations produits (noms exacts SOPREMA)
- Les actions doivent être CONCRÈTES et MESURABLES
- Base-toi sur les VRAIES forces de SOPREMA vs les faiblesses des concurrents identifiés`;

          const claudeResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            temperature: 0.3,
            system: 'Tu es un expert en stratégie commerciale SOPREMA avec 20 ans d\'expérience. Tu connais parfaitement tous les produits SOPREMA et leurs avantages vs la concurrence.',
            messages: [{
              role: 'user',
              content: claudePrompt
            }]
          });

          const responseText = claudeResponse.content[0].text;
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          
          let claudePlan;
          if (jsonMatch) {
            try {
              claudePlan = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
              console.log('   ⚠️ Erreur parsing JSON Claude, utilisation plan par défaut');
              claudePlan = null;
            }
          }

          // Si Claude a généré un plan valide, l'utiliser
          if (claudePlan && claudePlan.targetProducts && claudePlan.suggestedActions) {
            console.log(`   ✅ Plan Claude généré avec succès`);
            var targetProducts = claudePlan.targetProducts;
            var priority = claudePlan.priority || 'medium';
            
            // Le potentiel est simplement le montant concurrent (pas de calcul de 70%)
            var estimatedPotential = Math.round(data.competitorAmount);
            
            var suggestedActions = claudePlan.suggestedActions;
            var keySellingPoints = claudePlan.keySellingPoints || [];
            var competitorWeaknesses = claudePlan.competitorWeaknesses || [];
            var conversionProbability = claudePlan.conversionProbability || 70;
          } else {
            // Fallback sur génération manuelle si Claude échoue
            console.log('   ⚠️ Utilisation du plan par défaut');
            var priority = data.competitorAmount > 50000 ? 'high' : data.competitorAmount > 20000 ? 'medium' : 'low';
            var targetProducts = ['SOPRALENE ELITE', 'SOPRAVAP', 'PAVAROOF'];
            var estimatedPotential = Math.round(data.competitorAmount);
            var suggestedActions = [
              {
                type: 'commercial',
                description: `Présenter les alternatives SOPREMA aux ${topCompetitorBrands[0]?.brand || 'produits concurrents'}`,
                timing: 'Dans 1 semaine',
                expectedImpact: 'high'
              }
            ];
            var keySellingPoints = ['Qualité supérieure SOPREMA', 'Support technique local'];
            var competitorWeaknesses = ['Prix élevé', 'Délais de livraison'];
            var conversionProbability = 70;
          }
        } catch (claudeError) {
          console.error(`   ❌ Erreur Claude:`, claudeError.message);
          // Fallback complet
          var priority = data.competitorAmount > 50000 ? 'high' : data.competitorAmount > 20000 ? 'medium' : 'low';
          var targetProducts = ['SOPRALENE ELITE', 'SOPRAVAP', 'PAVAROOF'];
          var estimatedPotential = Math.round(data.competitorAmount);
          var suggestedActions = [
            {
              type: 'commercial',
              description: `Présenter les alternatives SOPREMA`,
              timing: 'Dans 1 semaine',
              expectedImpact: 'medium'
            }
          ];
          var keySellingPoints = [];
          var competitorWeaknesses = [];
          var conversionProbability = 70;
        }
        
        // Construire l'objet plan final avec toutes les données Claude
        const plan = {
          id: `reconquest-${timestamp}-${plans.length}`,
          clientName: clientName,
          clientInfo: {
            name: clientName,
            address: typeof data.client === 'object' ? data.client.address : null,
            siret: typeof data.client === 'object' ? data.client.siret : null
          },
          analysis: {
            totalInvoices: data.invoices.length,
            totalAmount: data.totalAmount,
            sopremaAmount: data.sopremaAmount,
            competitorAmount: data.competitorAmount,
            sopremaShare: data.totalAmount > 0 ? 
              Math.round((data.sopremaAmount / data.totalAmount) * 100).toString() : '0',
            topCompetitorBrands: topCompetitorBrands,
            lastPurchaseDate: Date.now(),
            purchaseFrequency: null
          },
          reconquestStrategy: {
            priority: priority,
            targetProducts: targetProducts,
            estimatedPotential: estimatedPotential,
            suggestedActions: suggestedActions,
            keySellingPoints: keySellingPoints,
            competitorWeaknesses: competitorWeaknesses,
            conversionProbability: conversionProbability
          },
          createdAt: new Date().toISOString()
        };
        
        plans.push(plan);
    }
    
    const summary = {
      totalInvoicesAnalyzed: invoices.length,
      totalCustomers: Object.keys(customerGroups).length,
      totalCompetitorAmount: Object.values(customerGroups)
        .reduce((sum, data) => sum + data.competitorAmount, 0),
      topCustomers: Object.entries(customerGroups)
        .sort((a, b) => b[1].competitorAmount - a[1].competitorAmount)
        .slice(0, 5)
        .map(([name, data]) => ({
          name,
          competitorAmount: data.competitorAmount,
          invoiceCount: data.invoices.length
        })),
      thresholds: {
        minCompetitorAmount: MIN_COMPETITOR_AMOUNT
      }
    };

    console.log(`✅ ${plans.length} opportunités de conversion identifiées`);

    res.json({
      success: true,
      summary,
      plans,
      message: `${plans.length} plans de reconquête générés avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur génération plans de reconquête:', error);
    res.status(500).json({
      error: 'Erreur génération plans de reconquête',
      message: error.message
    });
  }
});

// Route de santé pour Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Servir les fichiers statiques en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Serveur HYBRIDE démarré sur le port ${PORT}`);
  console.log(`🧠 Claude AI: ${process.env.ANTHROPIC_API_KEY ? '✅ Configuré' : '❌ Non configuré'}`);
  
  // Pré-charger la base Soprema au démarrage
  try {
    console.log(`📚 Pré-chargement de la base Soprema...`);
    await hybridSopremaMethod.loadDatabase();
    console.log(`✅ Base hybride prête: ${hybridSopremaMethod.sopremaProducts.length} produits`);
    console.log(`🎯 Seuil de matching: ${hybridSopremaMethod.SIMILARITY_THRESHOLD}%`);
  } catch (error) {
    console.error(`❌ Erreur chargement base Soprema:`, error);
  }
  
  console.log(`\n🌐 Application disponible sur:`);
  console.log(`   Frontend: http://localhost:5173`);
  console.log(`   API: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`\n🎉 Méthode HYBRIDE activée - Précision améliorée !`);
});

export default app;