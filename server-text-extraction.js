import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { extractTextFromPDF, formatTextForAnalysis } from './pdf-text-extractor.js';

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
    const isPDF = req.file.mimetype === 'application/pdf' || 
                  req.file.originalname.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      console.log('📝 Extraction du texte du PDF...');
      
      try {
        // Extraire le texte du PDF
        const extractedData = await extractTextFromPDF(req.file.path);
        contentForAnalysis = formatTextForAnalysis(extractedData);
        
        console.log(`✅ Texte extrait avec succès: ${extractedData.text.length} caractères`);
        
      } catch (extractError) {
        console.error('❌ Erreur extraction texte:', extractError.message);
        
        // Si l'extraction échoue, retourner une erreur claire
        return res.status(422).json({
          error: 'Extraction échouée',
          message: `Impossible d'extraire le texte du PDF: ${extractError.message}`,
          requiresReprocessing: false,
          rejected: true
        });
      }
      
    } else {
      // Pour les images, on garde l'ancien système avec base64
      console.log('🖼️ Image détectée, conversion en base64...');
      const fileBuffer = await fs.promises.readFile(req.file.path);
      contentForAnalysis = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    }

    // Préparer le prompt pour Claude
    const systemPrompt = `Tu es un expert en analyse de factures. Tu dois extraire les informations de la facture fournie et les retourner au format JSON structuré.

INSTRUCTIONS IMPORTANTES:
1. Extrais TOUTES les informations disponibles de la facture
2. Pour chaque produit, identifie s'il appartient à un concurrent (non-Soprema)
3. Si des informations sont manquantes, utilise des valeurs par défaut appropriées
4. Les montants doivent être des nombres (pas de symboles monétaires)
5. Les dates doivent être au format YYYY-MM-DD

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
    
    if (isPDF) {
      userPrompt = `Voici le texte extrait de la facture PDF. Analyse-le et extrais toutes les informations au format JSON demandé:

${contentForAnalysis}`;
    } else {
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
              media_type: req.file.mimetype,
              data: contentForAnalysis.split(',')[1]
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

    // Nettoyer et parser le JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Aucun JSON valide trouvé dans la réponse');
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    console.log('✅ Données extraites avec succès');

    // Retourner les données
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
1. Une analyse de la situation actuelle
2. Des objectifs chiffrés et réalistes
3. Des actions concrètes et spécifiques
4. Un calendrier de mise en œuvre
5. Les ressources nécessaires
6. Les indicateurs de succès

Retourne UNIQUEMENT un tableau JSON avec un objet plan pour chaque client.`;

    const userPrompt = `Génère des plans de reconquête détaillés pour ces ${customers.length} clients SOPREMA:

${JSON.stringify(customers, null, 2)}

Pour chaque client, crée un plan complet au format JSON suivant:
{
  "clientId": "string",
  "planId": "string unique",
  "priority": "high|medium|low",
  "status": "new",
  "potentialValue": number,
  "successProbability": number (0-100),
  "timeframe": "string (ex: 3 mois)",
  "objectives": ["objectif 1", "objectif 2", ...],
  "actions": [
    {
      "id": "string",
      "type": "visit|call|email|demo|training|promotion",
      "description": "string",
      "responsible": "string",
      "deadline": "YYYY-MM-DD",
      "status": "pending"
    }
  ],
  "resources": {
    "budget": number,
    "team": ["membre 1", "membre 2"],
    "materials": ["ressource 1", "ressource 2"]
  },
  "kpis": [
    {
      "name": "string",
      "target": number,
      "unit": "string"
    }
  ],
  "risks": ["risque 1", "risque 2"],
  "notes": "string"
}`;

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
    console.log(`✅ ${plans.length} plans de reconquête générés`);

    res.json({
      success: true,
      plans: plans,
      summary: {
        totalPlans: plans.length,
        highPriority: plans.filter(p => p.priority === 'high').length,
        totalPotentialValue: plans.reduce((sum, p) => sum + (p.potentialValue || 0), 0)
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