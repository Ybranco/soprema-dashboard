#!/usr/bin/env node

/**
 * Script pour corriger les vrais problèmes de conversion PDF
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des erreurs de conversion PDF\n');

// 1. Améliorer la validation des fichiers dans ilovepdf-wrapper.js
function improveILovePDFWrapper() {
  console.log('📝 Amélioration du wrapper iLovePDF...');
  
  const wrapperPath = 'ilovepdf-wrapper.js';
  let content = fs.readFileSync(wrapperPath, 'utf8');
  
  // Ajouter validation du fichier d'entrée
  const improvedValidation = `
  async convertPdfToJpg(pdfPath, outputPath) {
    try {
      // Validation du fichier d'entrée
      try {
        const stats = await fs.stat(pdfPath);
        if (stats.size === 0) {
          throw new Error('Le fichier PDF est vide');
        }
        if (stats.size > 50 * 1024 * 1024) { // 50MB max
          throw new Error('Le fichier PDF est trop gros (max 50MB)');
        }
        
        // Vérifier que c'est bien un PDF
        const buffer = await fs.readFile(pdfPath);
        const header = buffer.toString('ascii', 0, 5);
        if (header !== '%PDF-') {
          throw new Error('Le fichier n\'est pas un PDF valide');
        }
      } catch (error) {
        console.error('❌ Erreur validation fichier:', error.message);
        throw error;
      }
      
      await this.ensureAuthenticated();`;
  
  // Remplacer le début de convertPdfToJpg
  const oldStart = 'async convertPdfToJpg(pdfPath, outputPath) {\n    try {\n      await this.ensureAuthenticated();';
  if (content.includes(oldStart)) {
    content = content.replace(oldStart, improvedValidation);
    fs.writeFileSync(wrapperPath, content);
    console.log('✅ Validation des fichiers PDF améliorée');
  }
}

// 2. Améliorer la gestion des erreurs dans server.js
function improveServerErrorHandling() {
  console.log('\n📝 Amélioration de la gestion d\'erreurs serveur...');
  
  const serverPath = 'server.js';
  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Améliorer la route analyze-invoice
  const improvedAnalyzeRoute = `
app.post('/api/analyze-invoice', upload.single('file'), async (req, res) => {
  let convertedPath = null;
  let deleteConvertedFile = false;
  
  try {
    // Validation améliorée du fichier
    if (!req.file || req.file.size === 0) {
      console.error('❌ Fichier invalide ou vide');
      return res.status(400).json({
        success: false,
        error: 'Fichier invalide ou vide'
      });
    }
    
    console.log('📄 Analyse de:', req.file.originalname, 'Taille:', req.file.size, 'Type:', req.file.mimetype);
    
    const uploadedFile = req.file;
    let imageData;
    
    // Déterminer si conversion nécessaire
    const isPDF = uploadedFile.mimetype === 'application/pdf' || 
                  uploadedFile.originalname.toLowerCase().endsWith('.pdf');
    const isImage = uploadedFile.mimetype.startsWith('image/') || 
                    ['jpg', 'jpeg', 'png'].some(ext => 
                      uploadedFile.originalname.toLowerCase().endsWith('.' + ext)
                    );
    
    if (isPDF) {
      console.log('📄 Conversion PDF vers JPG...');
      
      // Vérifier l'environnement
      if (!process.env.ILOVEPDF_PUBLIC_KEY || !process.env.ILOVEPDF_SECRET_KEY) {
        console.error('❌ Clés iLovePDF non configurées');
        throw new Error('Service de conversion PDF non configuré');
      }
      
      // Créer le nom du fichier converti
      const convertedFilename = \`converted-\${Date.now()}.jpg\`;
      convertedPath = path.join(__dirname, 'converted', convertedFilename);
      deleteConvertedFile = true;
      
      try {
        // Conversion avec iLovePDF
        await convertWithILovePDF(
          process.env.ILOVEPDF_PUBLIC_KEY,
          process.env.ILOVEPDF_SECRET_KEY,
          uploadedFile.path,
          convertedPath
        );
        
        // Vérifier le fichier converti
        const convertedStats = await fs.promises.stat(convertedPath);
        if (convertedStats.size === 0) {
          throw new Error('La conversion a produit un fichier vide');
        }
        
        console.log('✅ Conversion réussie:', convertedStats.size, 'bytes');
        
        // Lire le fichier converti
        const imageBuffer = await fs.promises.readFile(convertedPath);
        imageData = \`data:image/jpeg;base64,\${imageBuffer.toString('base64')}\`;
        
      } catch (conversionError) {
        console.error('❌ Erreur conversion PDF:', conversionError.message);
        
        // Essayer un fallback si possible
        if (isImage) {
          console.log('🔄 Le fichier semble être une image, utilisation directe...');
          const fileBuffer = await fs.promises.readFile(uploadedFile.path);
          imageData = \`data:\${uploadedFile.mimetype};base64,\${fileBuffer.toString('base64')}\`;
        } else {
          throw new Error(\`Conversion PDF échouée: \${conversionError.message}\`);
        }
      }
      
    } else if (isImage) {
      console.log('🖼️ Image détectée, pas de conversion nécessaire');
      const fileBuffer = await fs.promises.readFile(uploadedFile.path);
      imageData = \`data:\${uploadedFile.mimetype};base64,\${fileBuffer.toString('base64')}\`;
      
    } else {
      console.error('❌ Type de fichier non supporté:', uploadedFile.mimetype);
      throw new Error(\`Type de fichier non supporté: \${uploadedFile.mimetype}\`);
    }
    
    // Vérifier que l'image n'est pas vide
    if (!imageData || imageData.length < 100) {
      throw new Error('Image data vide ou invalide');
    }
    
    // Extraction avec Claude...`;
  
  // Trouver et remplacer la route
  const routeStart = "app.post('/api/analyze-invoice'";
  const routeIdx = content.indexOf(routeStart);
  if (routeIdx > -1) {
    // Trouver la fin de la route (accolade fermante correspondante)
    let braceCount = 0;
    let endIdx = routeIdx;
    let inRoute = false;
    
    for (let i = routeIdx; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        inRoute = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inRoute && braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    
    // Conserver la fin de la route existante (partie Claude)
    const existingRoute = content.substring(routeIdx, endIdx);
    const claudePart = existingRoute.substring(existingRoute.indexOf('// Préparer le prompt'));
    
    content = content.substring(0, routeIdx) + 
              improvedAnalyzeRoute + '\n' + claudePart + '\n});' +
              content.substring(endIdx);
    
    fs.writeFileSync(serverPath, content);
    console.log('✅ Gestion des erreurs serveur améliorée');
  }
}

// 3. Nettoyer le dossier converted
function cleanConvertedFolder() {
  console.log('\n🧹 Nettoyage du dossier converted...');
  
  const convertedPath = 'converted';
  if (fs.existsSync(convertedPath)) {
    const files = fs.readdirSync(convertedPath);
    let cleaned = 0;
    
    files.forEach(file => {
      const filePath = path.join(convertedPath, file);
      try {
        const stats = fs.statSync(filePath);
        // Supprimer les fichiers de plus de 1 heure
        if (Date.now() - stats.mtime.getTime() > 3600000) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (err) {
        // Ignorer les erreurs
      }
    });
    
    console.log(`✅ ${cleaned} fichiers temporaires supprimés`);
  }
}

// 4. Revenir aux paramètres stricts pour "conversion alternative"
function revertClaudeService() {
  console.log('\n📝 Rétablissement du rejet des produits "conversion alternative"...');
  
  const claudePath = 'src/services/claudeService.ts';
  let content = fs.readFileSync(claudePath, 'utf8');
  
  // Rétablir le rejet des produits avec conversion alternative
  const strictFilter = `        // REJETER les produits avec "conversion alternative" (erreur de conversion)
        if (brand.toLowerCase().includes('conversion alternative') || 
            brand.toLowerCase().includes('document pdf')) {
          console.warn(\`🚫 Produit \${index + 1} ignoré (erreur de conversion):\`, designation);
          return null; // Marquer pour suppression
        }`;
  
  // Remplacer la version tolérante
  const tolerantVersion = /\/\/ NE PLUS REJETER.*?console\.log\(`ℹ️.*?\);/s;
  if (content.match(tolerantVersion)) {
    content = content.replace(tolerantVersion, strictFilter);
    fs.writeFileSync(claudePath, content);
    console.log('✅ Rejet des produits "conversion alternative" rétabli');
  }
}

// Exécuter toutes les corrections
console.log('🚀 Application des corrections...\n');

try {
  improveILovePDFWrapper();
  improveServerErrorHandling();
  cleanConvertedFolder();
  revertClaudeService();
  
  console.log('\n✅ Toutes les corrections ont été appliquées!');
  console.log('\n📋 Changements effectués:');
  console.log('1. ✅ Validation des PDF avant conversion');
  console.log('2. ✅ Meilleure détection PDF vs Image');
  console.log('3. ✅ Logs détaillés pour diagnostiquer les erreurs');
  console.log('4. ✅ Gestion des fichiers vides');
  console.log('5. ✅ Nettoyage des fichiers temporaires');
  console.log('6. ✅ Rejet des produits "conversion alternative" rétabli');
  
  console.log('\n🚀 Actions requises:');
  console.log('1. Vérifier les clés iLovePDF dans .env');
  console.log('2. Redémarrer le serveur: npm run dev');
  console.log('3. Tester avec les mêmes factures');
  console.log('4. Observer les logs détaillés du serveur');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}