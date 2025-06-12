import PDFParser from 'pdf2json';
import fs from 'fs/promises';
import { createReadStream } from 'fs';

/**
 * Extrait le texte d'un fichier PDF en utilisant pdf2json
 * @param {string} pdfPath - Chemin vers le fichier PDF
 * @returns {Promise<object>} - Texte extrait du PDF
 */
export async function extractTextFromPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Extraction du texte du PDF avec pdf2json:', pdfPath);
      
      const pdfParser = new PDFParser();
      
      // Gestionnaire d'erreur
      pdfParser.on("pdfParser_dataError", errData => {
        console.error('❌ Erreur parsing PDF:', errData.parserError);
        reject(new Error(`Erreur parsing PDF: ${errData.parserError}`));
      });
      
      // Gestionnaire de succès
      pdfParser.on("pdfParser_dataReady", pdfData => {
        try {
          // Extraire le texte de toutes les pages
          let fullText = '';
          let pageCount = 0;
          
          if (pdfData && pdfData.Pages) {
            pageCount = pdfData.Pages.length;
            
            pdfData.Pages.forEach((page, pageIndex) => {
              fullText += `\n=== PAGE ${pageIndex + 1} ===\n`;
              
              if (page.Texts && Array.isArray(page.Texts)) {
                page.Texts.forEach(text => {
                  if (text.R && Array.isArray(text.R)) {
                    text.R.forEach(r => {
                      if (r.T) {
                        // Décoder le texte URL-encodé
                        const decodedText = decodeURIComponent(r.T);
                        fullText += decodedText + ' ';
                      }
                    });
                  }
                });
                fullText += '\n';
              }
            });
          }
          
          // Nettoyer le texte
          fullText = fullText
            .replace(/\s+/g, ' ')  // Normaliser les espaces
            .replace(/\n{3,}/g, '\n\n')  // Limiter les sauts de ligne
            .trim();
          
          if (!fullText || fullText.length < 10) {
            reject(new Error('Aucun texte extractible trouvé dans le PDF'));
            return;
          }
          
          console.log(`✅ Texte extrait: ${fullText.length} caractères, ${pageCount} pages`);
          
          resolve({
            text: fullText,
            numpages: pageCount,
            info: pdfData.Meta || {},
            metadata: pdfData.Meta || {}
          });
          
        } catch (error) {
          console.error('❌ Erreur traitement données PDF:', error);
          reject(error);
        }
      });
      
      // Charger le PDF
      pdfParser.loadPDF(pdfPath);
      
    } catch (error) {
      console.error('❌ Erreur initialisation extraction:', error);
      reject(error);
    }
  });
}

/**
 * Formatte le texte extrait pour Claude
 * @param {object} extractedData - Données extraites du PDF
 * @returns {string} - Texte formatté pour l'analyse
 */
export function formatTextForAnalysis(extractedData) {
  let formattedText = '=== DOCUMENT PDF - TEXTE EXTRAIT ===\n\n';
  
  // Ajouter les métadonnées si disponibles
  if (extractedData.info) {
    if (extractedData.info.Title) {
      formattedText += `Titre: ${extractedData.info.Title}\n`;
    }
    if (extractedData.info.Author) {
      formattedText += `Auteur: ${extractedData.info.Author}\n`;
    }
    if (extractedData.info.CreationDate) {
      formattedText += `Date création: ${extractedData.info.CreationDate}\n`;
    }
  }
  
  formattedText += `\nNombre de pages: ${extractedData.numpages}\n`;
  formattedText += '\n=== CONTENU DU DOCUMENT ===\n\n';
  formattedText += extractedData.text;
  
  return formattedText;
}

// Fonction alternative simple pour les PDF problématiques
export async function extractTextSimple(pdfPath) {
  try {
    console.log('📄 Tentative d\'extraction simple du texte...');
    
    // Lire le fichier comme buffer
    const buffer = await fs.readFile(pdfPath);
    
    // Vérifier la signature PDF
    const header = buffer.toString('ascii', 0, 5);
    if (header !== '%PDF-') {
      throw new Error('Le fichier n\'est pas un PDF valide');
    }
    
    // Extraire le texte brut (méthode basique)
    let text = buffer.toString('utf-8');
    
    // Nettoyer et extraire uniquement le texte lisible
    text = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Garder seulement les caractères ASCII imprimables
      .replace(/\s+/g, ' ')  // Normaliser les espaces
      .replace(/stream.*?endstream/gs, '')  // Enlever les streams binaires
      .replace(/<<.*?>>/gs, '')  // Enlever les dictionnaires PDF
      .trim();
    
    // Chercher des patterns de facture
    const patterns = {
      invoice: /(?:facture|invoice|bill)[\s:#]*([A-Z0-9-]+)/i,
      date: /(?:date|du|le)[\s:]*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i,
      total: /(?:total|montant)[\s:]*([0-9,. ]+)/i,
      client: /(?:client|customer|bill to)[\s:]*([^\n]+)/i
    };
    
    const extractedInfo = {
      invoice: text.match(patterns.invoice)?.[1] || '',
      date: text.match(patterns.date)?.[1] || '',
      total: text.match(patterns.total)?.[1] || '',
      client: text.match(patterns.client)?.[1] || ''
    };
    
    console.log('📊 Informations extraites (méthode simple):', extractedInfo);
    
    return {
      text: text.substring(0, 5000),  // Limiter la taille
      numpages: 1,
      info: extractedInfo,
      metadata: {}
    };
    
  } catch (error) {
    console.error('❌ Erreur extraction simple:', error.message);
    throw error;
  }
}