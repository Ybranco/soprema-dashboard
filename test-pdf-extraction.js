#!/usr/bin/env node

import { extractTextFromPDF, formatTextForAnalysis } from './pdf-text-extractor.js';
import fs from 'fs/promises';
import path from 'path';

console.log('🧪 Test d\'extraction de texte PDF\n');

async function testPDFExtraction() {
  try {
    // Chercher un PDF de test dans uploads/
    const uploadsDir = 'uploads';
    const files = await fs.readdir(uploadsDir);
    const pdfFile = files.find(f => f.endsWith('.pdf'));
    
    if (!pdfFile) {
      console.log('❌ Aucun fichier PDF trouvé dans uploads/');
      console.log('💡 Uploadez une facture PDF pour tester');
      return;
    }
    
    const pdfPath = path.join(uploadsDir, pdfFile);
    console.log('📄 Test avec:', pdfFile);
    
    // Extraire le texte
    const extractedData = await extractTextFromPDF(pdfPath);
    const formattedText = formatTextForAnalysis(extractedData);
    
    console.log('\n✅ Extraction réussie!');
    console.log('📊 Statistiques:');
    console.log('  - Nombre de pages:', extractedData.numpages);
    console.log('  - Longueur du texte:', extractedData.text.length, 'caractères');
    console.log('  - Titre:', extractedData.info?.Title || 'Non disponible');
    
    console.log('\n📝 Aperçu du texte (500 premiers caractères):');
    console.log('---');
    console.log(extractedData.text.substring(0, 500));
    console.log('---');
    
    // Sauvegarder le texte extrait
    const outputFile = pdfFile.replace('.pdf', '_extracted.txt');
    await fs.writeFile(path.join(uploadsDir, outputFile), formattedText);
    console.log('\n💾 Texte complet sauvegardé dans:', outputFile);
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testPDFExtraction();
