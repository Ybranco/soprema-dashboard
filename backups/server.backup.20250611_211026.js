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
import { sopremaProductMatcher } from './soprema-product-matcher.js';

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

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    features: {
      claudeAI: !!process.env.ANTHROPIC_API_KEY,
      textExtraction: true
    },
    timestamp: new Date().toISOString()
  });
});

// Route principale d'analyse avec extraction de texte
app.post('/api/analyze-invoice', upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier fourni'
      });
    }

    console.log('📄 Analyse de:', req.file.originalname, 'Taille:', req.file.size, 'Type:', req.file.mimetype);

    let contentForAnalysis = '';
    let isPDF = req.file.mimetype === 'application/pdf' || 
                req.file.originalname.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      console.log('📝 Extraction du texte du PDF...');
      
      try {
        // Extraire le texte du PDF
        const extractedData = await extractTextFromPDF(req.file.path);
        contentForAnalysis = formatTextForAnalysis(extractedData);
        
        console.log(`✅ Texte extrait avec succès: ${extractedData.text.length} caractères`);
        
        // Si le texte extrait est vide ou trop court, c'est probablement un PDF scanné
        if (!extractedData.text || extractedData.text.trim().length < 50) {
          console.log('⚠️ Texte extrait trop court, probablement un PDF scanné. Tentative OCR...');
          throw new Error('PDF scanné détecté, OCR nécessaire');
        }
        
      } catch (extractError) {
        console.error('⚠️ Erreur extraction ou PDF scanné:', extractError.message);
        
        // Tenter l'OCR avec ILovePDF (outil pdfocr)
        if (process.env.ILOVEPDF_PUBLIC_KEY && process.env.ILOVEPDF_SECRET_KEY) {
          console.log('🔍 Tentative OCR avec ILovePDF (outil pdfocr)...');
          
          try {
            const ocrPath = req.file.path + '_ocr.pdf';
            await ocrWithILovePDF(
              process.env.ILOVEPDF_PUBLIC_KEY,
              process.env.ILOVEPDF_SECRET_KEY,
              req.file.path,
              ocrPath
            );
            
            console.log('✅ OCR terminé, extraction du texte du PDF OCR...');
            
            // Extraire le texte du PDF avec OCR
            try {
              const ocrData = await extractTextFromPDF(ocrPath);
              contentForAnalysis = formatTextForAnalysis(ocrData);
              console.log(`✅ Texte extrait après OCR: ${ocrData.text.length} caractères`);
            } catch (extractOcrError) {
              console.error('⚠️ Erreur extraction du PDF OCR, tentative lecture directe...');
              // Si l'extraction du PDF OCR échoue, on lit le fichier OCR comme texte brut
              try {
                const ocrBuffer = await fs.promises.readFile(ocrPath);
                // Essayer de traiter le PDF OCR comme du texte (peut contenir du texte extractible)
                contentForAnalysis = ocrBuffer.toString('utf-8').substring(0, 50000) || 'PDF traité par OCR - contenu extractible limité';
                console.log(`⚠️ Fallback: utilisation du contenu brut du PDF OCR (${contentForAnalysis.length} caractères)`);
              } catch (readError) {
                // En dernier recours, on indique qu'on a un PDF OCR mais pas d'extraction
                contentForAnalysis = 'PDF traité par OCR ILovePDF - extraction automatique échouée. Veuillez analyser manuellement.';
                console.log('⚠️ Impossible d\'extraire le texte du PDF OCR, envoi d\'un message d\'erreur à Claude');
              }
            }
            
            // Nettoyer le fichier OCR temporaire
            fs.unlink(ocrPath, (err) => {
              if (err) console.error('Erreur suppression fichier OCR:', err);
            });
            
          } catch (ocrError) {
            console.error('❌ Erreur OCR:', ocrError.message);
            
            // Fallback sur extraction simple
            try {
              const simpleData = await extractTextSimple(req.file.path);
              contentForAnalysis = formatTextForAnalysis(simpleData);
              console.log('✅ Extraction simple réussie après échec OCR');
              
              // NOUVEAU: Vérifier si l'extraction simple n'a donné que des métadonnées PDF
              if (contentForAnalysis.includes('%PDF-') || contentForAnalysis.includes('endobj') || contentForAnalysis.length < 100) {
                console.log('⚠️ Extraction simple n\'a donné que des métadonnées PDF - Fallback vers base64');
                throw new Error('Extraction simple insuffisante - contenu PDF brut détecté');
              }
            } catch (simpleError) {
              console.error('❌ Toutes les méthodes d\'extraction ont échoué, envoi du PDF en base64 à Claude');
              
              // En dernier recours, on envoie le PDF original en base64 à Claude
              // Claude peut parfois lire directement des PDFs
              try {
                const pdfBuffer = await fs.promises.readFile(req.file.path);
                contentForAnalysis = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
                console.log('📄 PDF envoyé en base64 à Claude comme fallback ultime');
                
                // IMPORTANT: On traite maintenant ce PDF comme une image pour Claude
                // Cela permet d'utiliser la logique d'analyse visuelle
                isPDF = false;
              } catch (base64Error) {
                console.error('❌ Impossible même de lire le fichier en base64');
                
                return res.status(422).json({
                  error: 'Fichier illisible',
                  message: `Fichier corrompu ou inaccessible: ${base64Error.message}`,
                  requiresReprocessing: false,
                  rejected: true
                });
              }
            }
          }
        } else {
          console.log('⚠️ Clés ILovePDF non configurées, essai extraction simple...');
          
          try {
            // Essayer la méthode simple
            const simpleData = await extractTextSimple(req.file.path);
            contentForAnalysis = formatTextForAnalysis(simpleData);
            console.log('✅ Extraction simple réussie');
            
            // NOUVEAU: Vérifier si l'extraction simple n'a donné que des métadonnées PDF
            if (contentForAnalysis.includes('%PDF-') || contentForAnalysis.includes('endobj') || contentForAnalysis.length < 100) {
              console.log('⚠️ Extraction simple n\'a donné que des métadonnées PDF - Fallback vers base64');
              throw new Error('Extraction simple insuffisante - contenu PDF brut détecté');
            }
            
          } catch (simpleError) {
            console.error('❌ Extraction simple échouée, envoi du PDF en base64 à Claude');
            
            // En dernier recours, on envoie le PDF original en base64 à Claude
            try {
              const pdfBuffer = await fs.promises.readFile(req.file.path);
              contentForAnalysis = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
              console.log('📄 PDF envoyé en base64 à Claude (pas d\'OCR disponible)');
              
              // IMPORTANT: On traite maintenant ce PDF comme une image pour Claude
              isPDF = false;
            } catch (base64Error) {
              console.error('❌ Impossible de lire le fichier');
              
              return res.status(422).json({
                error: 'Fichier illisible',
                message: `Fichier corrompu: ${base64Error.message}`,
                requiresReprocessing: false,
                rejected: true
              });
            }
          }
        }
      }
      
    } else {
      // Pour les images, on garde l'ancien système avec base64
      console.log('🖼️ Image détectée, conversion en base64...');
      const fileBuffer = await fs.promises.readFile(req.file.path);
      contentForAnalysis = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    }

    // Préparer le prompt pour Claude
    const systemPrompt = `Tu es un expert en analyse de factures pour SOPREMA. Tu dois extraire les informations de la facture fournie et les retourner au format JSON structuré.

INSTRUCTIONS IMPORTANTES:
1. Extrais TOUTES les informations disponibles de la facture
2. Pour chaque produit, identifie s'il appartient à SOPREMA ou à un CONCURRENT
3. Si des informations sont manquantes, utilise des valeurs par défaut appropriées
4. Les montants doivent être des nombres (pas de symboles monétaires)
5. Les dates doivent être au format YYYY-MM-DD

IDENTIFICATION DES MARQUES - TRÈS IMPORTANT:

MARQUES CONCURRENTES (isCompetitor = true):
- IKO (membranes d'étanchéité)
- ROCKWOOL (isolation)
- ISOVER (isolation)
- URSA (isolation)
- KNAUF (isolation)
- FIRESTONE (membranes EPDM)
- CARLISLE (membranes)
- SIPLAST (étanchéité)
- ICOPAL (membranes bitumineuses)
- BAUDER (systèmes d'étanchéité)
- RHEPANOL (membranes)
- RESITRIX (membranes)
- POLYGLASS (membranes)
- DERBIGUM (membranes)
- TECHNONICOL (membranes)
- IMPERBIT (étanchéité)
- EVERGUARD (membranes TPO)
- SARNAFIL (membranes)
- DANOSA (membranes)
- CHOVA (membranes)

MARQUES SOPREMA (isCompetitor = false):
- SOPREMA
- SOPRALENE
- SOPRASTAR
- SOPRADUR
- SARNAVAP
- PAVAFLEX
- PAVATEX
- SOPRASMART
- Tout produit avec "SOPRA" dans le nom

RÈGLE PAR DÉFAUT:
- Si la marque n'est PAS explicitement SOPREMA/SOPRA*, alors c'est un CONCURRENT
- Si tu n'es pas sûr, marque comme CONCURRENT (isCompetitor = true)
- SOIS STRICT: seuls les produits clairement SOPREMA doivent avoir isCompetitor = false

Format de sortie attendu:
{
  "invoiceNumber": "string",
  "date": "YYYY-MM-DD",
  "client": {
    "name": "string",
    "fullName": "string",
    "address": "string",
    "siret": "string ou null",
    "contact": "string ou null",
    "phone": "string ou null"
  },
  "distributor": {
    "name": "string",
    "agency": "string",
    "seller": "string ou null"
  },
  "products": [
    {
      "reference": "string",
      "designation": "string", 
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "isCompetitor": boolean,
      "brand": "string ou null"
    }
  ],
  "totalAmount": number
}

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

    let userPrompt = '';
    
    // Debug complet pour comprendre ce qui est envoyé
    console.log(`🔍 DEBUG: isPDF = ${isPDF}`);
    console.log(`🔍 DEBUG: contentForAnalysis type = ${typeof contentForAnalysis}`);
    console.log(`🔍 DEBUG: contentForAnalysis length = ${contentForAnalysis.length}`);
    console.log(`🔍 DEBUG: contentForAnalysis starts with = "${contentForAnalysis.substring(0, 50)}"`);
    
    if (isPDF) {
      console.log(`🔍 DEBUG: TRAITEMENT TEXTE - Envoi du texte à Claude (${contentForAnalysis.length} caractères)`);
      console.log(`📝 DEBUG: Aperçu du texte: "${contentForAnalysis.substring(0, 200)}..."`);
      userPrompt = `Voici le texte extrait de la facture PDF. Analyse-le et extrais toutes les informations au format JSON demandé:

${contentForAnalysis}`;
    } else {
      console.log(`🔍 DEBUG: TRAITEMENT IMAGE/BASE64 - Envoi d'une image à Claude`);
      userPrompt = `Analyse cette image de facture et extrais toutes les informations au format JSON demandé.`;
    }

    // Appel à Claude
    console.log('🤖 Analyse avec Claude 3.5 Sonnet...');
    
    const messages = isPDF ? [
      {
        role: 'user',
        content: userPrompt
      }
    ] : [
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { 
            type: 'image', 
            source: {
              type: 'base64',
              media_type: contentForAnalysis.startsWith('data:application/pdf') ? 'image/png' : req.file.mimetype,
              data: contentForAnalysis.includes(',') ? contentForAnalysis.split(',')[1] : contentForAnalysis
            }
          }
        ]
      }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: messages
    });

    // Extraire et parser la réponse
    const responseText = response.content[0].text;
    console.log('📝 Réponse Claude reçue');
    console.log(`🔍 DEBUG: Réponse brute Claude (${responseText.length} caractères): "${responseText.substring(0, 500)}..."`);
    console.log('🔍 DEBUG: Recherche de JSON dans la réponse...');

    // Nettoyer et parser le JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('❌ DEBUG: Aucun JSON trouvé dans la réponse Claude!');
      console.log('🔍 DEBUG: Réponse complète:', responseText);
      throw new Error('Aucun JSON valide trouvé dans la réponse');
    }

    console.log(`🔍 DEBUG: JSON extrait: "${jsonMatch[0].substring(0, 300)}..."`);
    const extractedData = JSON.parse(jsonMatch[0]);
    console.log('✅ Données extraites avec succès');
    console.log(`🔍 DEBUG: Produits extraits: ${extractedData.products?.length || 0}`);

    // NOUVELLE ÉTAPE: Vérification des produits avec la base Soprema
    console.log('🔍 Vérification des produits avec la base Soprema...');
    
    if (extractedData.products && extractedData.products.length > 0) {
      try {
        const verificationResult = await sopremaProductMatcher.verifyProducts(extractedData.products);
        
        // Remplacer les produits par les produits vérifiés
        extractedData.products = verificationResult.products;
        extractedData._productVerification = verificationResult.summary;
        
        console.log(`✅ Vérification terminée: ${verificationResult.summary.reclassifiedCount} produits reclassifiés`);
        console.log(`📊 Soprema: ${verificationResult.summary.sopremaTotal}€ | Concurrent: ${verificationResult.summary.competitorTotal}€`);
        
      } catch (verificationError) {
        console.error('⚠️ Erreur vérification produits:', verificationError.message);
        // On continue avec les données de Claude sans vérification
      }
    }

    // Retourner les données vérifiées
    res.json(extractedData);

  } catch (error) {
    console.error('❌ Erreur traitement:', error);
    
    if (error.message.includes('ANTHROPIC_API_KEY')) {
      return res.status(400).json({
        error: 'Configuration manquante',
        message: 'ANTHROPIC_API_KEY non configurée dans .env'
      });
    }

    res.status(500).json({
      error: 'Erreur d\'analyse',
      message: error.message
    });
    
  } finally {
    // Nettoyer le fichier uploadé
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur suppression fichier:', err);
      });
    }
  }
});

// Route pour les plans de reconquête
app.post('/api/customer-reconquest-plans', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(400).json({
        error: 'Configuration manquante',
        message: 'ANTHROPIC_API_KEY non configurée'
      });
    }

    const { customers } = req.body;
    
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Aucun client fourni pour l\'analyse'
      });
    }

    console.log(`🎯 Génération de plans de reconquête pour ${customers.length} clients`);

    const systemPrompt = `Tu es un expert en stratégie commerciale pour SOPREMA, leader des solutions d'étanchéité et d'isolation.
Ton rôle est d'analyser les données clients et de générer des plans de reconquête personnalisés.

Pour chaque client, tu dois créer un plan structuré avec:
1. Une analyse détaillée de la situation actuelle
2. Une stratégie de reconquête personnalisée
3. Des actions concrètes et spécifiques
4. Un calendrier de mise en œuvre

Retourne UNIQUEMENT un tableau JSON avec un objet plan pour chaque client qui respecte EXACTEMENT la structure demandée.`;

    const userPrompt = `Génère des plans de reconquête détaillés pour ces ${customers.length} clients SOPREMA.

DONNÉES CLIENTS:
${JSON.stringify(customers, null, 2)}

ATTENTION: TU DOIS RETOURNER EXACTEMENT UN TABLEAU JSON AVEC CETTE STRUCTURE - PAS D'AUTRE FORMAT:

[
  {
    "id": "reconquest-${Date.now()}-0",
    "clientName": "NOM_DU_CLIENT_ICI",
    "clientInfo": {
      "name": "NOM_DU_CLIENT_ICI",
      "address": null,
      "siret": null
    },
    "analysis": {
      "totalInvoices": NOMBRE_FACTURES,
      "totalAmount": MONTANT_TOTAL,
      "sopremaAmount": MONTANT_SOPREMA,
      "competitorAmount": MONTANT_CONCURRENT,
      "sopremaShare": "POURCENTAGE_SANS_PERCENT",
      "topCompetitorBrands": [
        {
          "brand": "NOM_MARQUE",
          "amount": MONTANT
        }
      ],
      "lastPurchaseDate": TIMESTAMP_UNIX,
      "purchaseFrequency": null
    },
    "reconquestStrategy": {
      "priority": "high|medium|low",
      "targetProducts": ["Produit SOPREMA recommandé 1", "Produit SOPREMA recommandé 2"],
      "estimatedPotential": MONTANT_POTENTIEL_RECUPERABLE,
      "suggestedActions": [
        {
          "type": "commercial",
          "description": "Action commerciale spécifique et détaillée",
          "timing": "Dans 2 semaines"
        },
        {
          "type": "technique", 
          "description": "Action technique spécifique",
          "timing": "Dans 1 mois"
        }
      ]
    },
    "createdAt": "${new Date().toISOString()}"
  }
]

GÉNÈRE UN PLAN POUR CHAQUE CLIENT EN RESPECTANT EXACTEMENT CETTE STRUCTURE.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Aucun JSON valide trouvé dans la réponse');
    }

    const plans = JSON.parse(jsonMatch[0]);
    
    // Transformer et valider les plans
    const processedPlans = plans.map((plan, index) => {
      const customer = customers[index];
      const timestamp = Date.now();
      
      // Si le plan a déjà la bonne structure, on le garde tel quel avec quelques ajouts
      if (plan.id && plan.clientName && plan.analysis && plan.reconquestStrategy) {
        return {
          ...plan,
          id: plan.id || `reconquest-${timestamp}-${index}`,
          createdAt: plan.createdAt || new Date().toISOString()
        };
      }
      
      // Sinon, transformer l'ancienne structure vers la nouvelle
      return {
        id: `reconquest-${timestamp}-${index}`,
        clientName: customer?.clientName || 'Client inconnu',
        clientInfo: {
          name: customer?.clientName || 'Client inconnu',
          address: null,
          siret: null
        },
        analysis: {
          totalInvoices: customer?.invoiceCount || 0,
          totalAmount: customer?.totalRevenue || 0,
          sopremaAmount: customer?.sopremaAmount || 0,
          competitorAmount: customer?.competitorAmount || 0,
          sopremaShare: customer?.totalRevenue > 0 ? Math.round((customer.sopremaAmount / customer.totalRevenue) * 100).toString() : '0',
          topCompetitorBrands: customer?.competitorProducts?.map(p => ({
            brand: p.brand,
            amount: p.amount
          })) || [],
          lastPurchaseDate: Date.parse(customer?.lastInvoiceDate) || Date.now(),
          purchaseFrequency: null
        },
        reconquestStrategy: {
          priority: customer?.priority || plan.priority || 'medium',
          targetProducts: plan.targetProducts || ['PAVAFLEX', 'SOPRAVAP'],
          estimatedPotential: plan.potentialValue || Math.round((customer?.competitorAmount || 0) * 0.7),
          suggestedActions: plan.actions?.map(action => ({
            type: action.type || 'commercial',
            description: action.description,
            timing: action.deadline ? `Avant le ${action.deadline}` : 'À définir'
          })) || []
        },
        createdAt: new Date().toISOString()
      };
    });
    
    console.log(`✅ ${processedPlans.length} plans de reconquête générés et traités`);

    // Calculer le summary basé sur les données réelles
    const totalCustomers = customers.length;
    const significantCustomers = customers.filter(c => c.competitorAmount >= 5000).length;
    const plansGenerated = processedPlans.length;

    res.json({
      success: true,
      plans: processedPlans,
      summary: {
        totalInvoicesAnalyzed: customers.reduce((sum, c) => sum + (c.invoiceCount || 0), 0),
        totalCustomers: totalCustomers,
        significantCustomers: significantCustomers,
        plansGenerated: plansGenerated,
        totalCompetitorAmount: customers.reduce((sum, c) => sum + (c.competitorAmount || 0), 0),
        thresholds: {
          minCompetitorAmount: 5000,
          minInvoices: 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur génération plans:', error);
    res.status(500).json({
      error: 'Erreur de génération',
      message: error.message
    });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📄 Extraction de texte PDF activée`);
  console.log(`🤖 Claude 3.5 Sonnet: ${process.env.ANTHROPIC_API_KEY ? 'Configuré ✅' : 'Non configuré ❌'}`);
});