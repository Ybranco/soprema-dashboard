#!/usr/bin/env node

/**
 * Script pour analyser pourquoi on obtient des erreurs "conversion alternative"
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyse des erreurs de conversion PDF\n');

// Analyser les logs pour identifier les patterns d'erreur
const errorPatterns = {
  '422 Unprocessable Entity': 0,
  '500 Internal Server Error': 0,
  'Input file contains unsupported image format': 0,
  'image cannot be empty': 0,
  'ENOENT: no such file or directory': 0,
  'conversion alternative': 0
};

console.log('📊 Erreurs identifiées dans vos logs:\n');

console.log('1. **Erreur 500 - Format d\'image non supporté**');
console.log('   - Message: "Input file contains unsupported image format"');
console.log('   - Cause: PDF corrompu ou format non standard\n');

console.log('2. **Erreur 500 - Image vide**');
console.log('   - Message: "image cannot be empty"');
console.log('   - Cause: Échec de conversion PDF vers JPG\n');

console.log('3. **Erreur 500 - Fichier introuvable**');
console.log('   - Message: "ENOENT: no such file or directory"');
console.log('   - Cause: Fichier converti supprimé ou non créé\n');

console.log('4. **Erreur 422 - Extraction échouée**');
console.log('   - Cause: Claude ne peut pas extraire les données');
console.log('   - Résultat: Retraitement avec "conversion alternative"\n');

// Vérifier la configuration iLovePDF
function checkILovePDFConfig() {
  console.log('\n🔧 Vérification de la configuration iLovePDF...');
  
  const envPath = '.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasPublicKey = envContent.includes('ILOVEPDF_PUBLIC_KEY=') && !envContent.includes('ILOVEPDF_PUBLIC_KEY=your_');
    const hasSecretKey = envContent.includes('ILOVEPDF_SECRET_KEY=') && !envContent.includes('ILOVEPDF_SECRET_KEY=your_');
    
    if (hasPublicKey && hasSecretKey) {
      console.log('✅ Clés iLovePDF configurées');
    } else {
      console.log('❌ Clés iLovePDF manquantes ou invalides');
      console.log('   → C\'est la cause principale des erreurs de conversion!');
    }
  } else {
    console.log('❌ Fichier .env introuvable');
  }
}

// Vérifier le dossier converted
function checkConvertedFolder() {
  console.log('\n📁 Vérification du dossier converted...');
  
  const convertedPath = 'converted';
  if (fs.existsSync(convertedPath)) {
    const files = fs.readdirSync(convertedPath);
    console.log(`✅ Dossier existe avec ${files.length} fichiers`);
    
    // Vérifier les permissions
    try {
      fs.accessSync(convertedPath, fs.constants.W_OK);
      console.log('✅ Permissions d\'écriture OK');
    } catch (err) {
      console.log('❌ Pas de permission d\'écriture');
    }
  } else {
    console.log('❌ Dossier converted n\'existe pas');
    console.log('   → Création automatique...');
    fs.mkdirSync(convertedPath, { recursive: true });
    console.log('✅ Dossier créé');
  }
}

// Analyser le wrapper iLovePDF
function analyzeILovePDFWrapper() {
  console.log('\n📄 Analyse du wrapper iLovePDF...');
  
  const wrapperPath = 'ilovepdf-wrapper.js';
  if (fs.existsSync(wrapperPath)) {
    const content = fs.readFileSync(wrapperPath, 'utf8');
    
    // Vérifier la gestion des erreurs
    if (content.includes('catch') && content.includes('console.error')) {
      console.log('✅ Gestion d\'erreurs présente');
    } else {
      console.log('⚠️  Gestion d\'erreurs insuffisante');
    }
    
    // Vérifier la validation des fichiers
    if (content.includes('fileBuffer.length === 0')) {
      console.log('✅ Validation des fichiers vides');
    } else {
      console.log('❌ Pas de validation des fichiers vides');
    }
  }
}

// Proposer des solutions
function proposeSolutions() {
  console.log('\n💡 SOLUTIONS RECOMMANDÉES:\n');
  
  console.log('1. **Vérifier les clés iLovePDF**');
  console.log('   ```bash');
  console.log('   # Dans .env');
  console.log('   ILOVEPDF_PUBLIC_KEY=project_public_xxxxx');
  console.log('   ILOVEPDF_SECRET_KEY=secret_key_xxxxx');
  console.log('   ```\n');
  
  console.log('2. **Améliorer la gestion des erreurs de conversion**');
  console.log('   - Ajouter des logs détaillés dans ilovepdf-wrapper.js');
  console.log('   - Implémenter un fallback local si iLovePDF échoue\n');
  
  console.log('3. **Nettoyer régulièrement le dossier converted**');
  console.log('   - Les fichiers temporaires s\'accumulent');
  console.log('   - Peut causer des conflits de noms\n');
  
  console.log('4. **Améliorer la détection du type de fichier**');
  console.log('   - Vérifier que c\'est vraiment un PDF avant conversion');
  console.log('   - Gérer les images JPG/PNG sans conversion\n');
}

// Script de test pour vérifier la conversion
function createTestScript() {
  const testScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testPDFConversion() {
  console.log('🧪 Test de conversion PDF...\\n');
  
  // Créer un PDF de test simple
  const testPDF = Buffer.from('%PDF-1.4\\n1 0 obj\\n<<\\n/Type /Catalog\\n/Pages 2 0 R\\n>>\\nendobj\\n2 0 obj\\n<<\\n/Type /Pages\\n/Kids [3 0 R]\\n/Count 1\\n>>\\nendobj\\n3 0 obj\\n<<\\n/Type /Page\\n/Parent 2 0 R\\n/Resources <<\\n/Font <<\\n/F1 4 0 R\\n>>\\n>>\\n/MediaBox [0 0 612 792]\\n/Contents 5 0 R\\n>>\\nendobj\\n4 0 obj\\n<<\\n/Type /Font\\n/Subtype /Type1\\n/BaseFont /Helvetica\\n>>\\nendobj\\n5 0 obj\\n<<\\n/Length 44\\n>>\\nstream\\nBT\\n/F1 12 Tf\\n100 700 Td\\n(Test PDF) Tj\\nET\\nendstream\\nendobj\\nxref\\n0 6\\n0000000000 65535 f\\n0000000009 00000 n\\n0000000058 00000 n\\n0000000115 00000 n\\n0000000274 00000 n\\n0000000353 00000 n\\ntrailer\\n<<\\n/Size 6\\n/Root 1 0 R\\n>>\\nstartxref\\n449\\n%%EOF');
  
  const formData = new FormData();
  formData.append('invoices', testPDF, {
    filename: 'test-conversion.pdf',
    contentType: 'application/pdf'
  });
  
  try {
    console.log('📤 Envoi du PDF de test...');
    const response = await axios.post('http://localhost:3001/api/analyze-invoice', formData, {
      headers: formData.getHeaders()
    });
    
    console.log('✅ Conversion réussie!');
    console.log('Données extraites:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Échec de la conversion');
    console.log('Erreur:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\\n⚠️  Erreur serveur - Vérifiez:');
      console.log('1. Les clés iLovePDF dans .env');
      console.log('2. Le dossier converted/ existe et est accessible');
      console.log('3. Les logs du serveur pour plus de détails');
    }
  }
}

// Tester si le serveur est lancé
axios.get('http://localhost:3001/health')
  .then(() => testPDFConversion())
  .catch(() => console.log('⚠️  Serveur non disponible - Lancez: npm run dev'));
`;
  
  fs.writeFileSync('test-pdf-conversion.js', testScript);
  console.log('5. **Script de test créé**');
  console.log('   ```bash');
  console.log('   node test-pdf-conversion.js');
  console.log('   ```');
}

// Exécuter toutes les vérifications
console.log('🚀 Démarrage de l\'analyse...\n');

checkILovePDFConfig();
checkConvertedFolder();
analyzeILovePDFWrapper();
proposeSolutions();
createTestScript();

console.log('\n📌 DIAGNOSTIC PRINCIPAL:');
console.log('Les erreurs "conversion alternative" apparaissent quand:');
console.log('1. La conversion PDF → JPG échoue (iLovePDF)');
console.log('2. Claude ne peut pas extraire de données de l\'image');
console.log('3. Le système essaie un retraitement qui échoue aussi');
console.log('\nLa cause la plus probable est une mauvaise configuration d\'iLovePDF.');