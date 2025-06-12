import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

/**
 * Extrait le texte d'un fichier PDF
 * @param {string} pdfPath - Chemin vers le fichier PDF
 * @returns {Promise<string>} - Texte extrait du PDF
 */
export async function extractTextFromPDF(pdfPath) {
  try {
    console.log('📄 Extraction du texte du PDF:', pdfPath);
    
    // Lire le fichier PDF
    const dataBuffer = await fs.readFile(pdfPath);
    
    // Vérifier que le fichier n'est pas vide
    if (dataBuffer.length === 0) {
      throw new Error('Le fichier PDF est vide');
    }
    
    // Vérifier la signature PDF
    const header = dataBuffer.toString('ascii', 0, 5);
    if (header !== '%PDF-') {
      throw new Error('Le fichier n\'est pas un PDF valide');
    }
    
    // Parser le PDF
    const data = await pdfParse(dataBuffer);
    
    // Vérifier qu'on a du texte
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('Aucun texte extractible trouvé dans le PDF');
    }
    
    console.log(`✅ Texte extrait: ${data.text.length} caractères, ${data.numpages} pages`);
    
    // Retourner le texte avec quelques métadonnées utiles
    return {
      text: data.text,
      numpages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error('❌ Erreur extraction texte PDF:', error.message);
    throw error;
  }
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