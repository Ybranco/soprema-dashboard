#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Migration vers l\'extraction de texte PDF\n');

async function backupCurrentServer() {
  console.log('📦 Sauvegarde du serveur actuel...');
  
  try {
    const serverContent = await fs.readFile('server.js', 'utf8');
    const backupName = `server.backup.${Date.now()}.js`;
    await fs.writeFile(backupName, serverContent);
    console.log(`✅ Serveur sauvegardé dans: ${backupName}`);
    return backupName;
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error.message);
    throw error;
  }
}

async function replaceServer() {
  console.log('\n📝 Remplacement du serveur...');
  
  try {
    const newServerContent = await fs.readFile('server-text-extraction.js', 'utf8');
    await fs.writeFile('server.js', newServerContent);
    console.log('✅ Serveur remplacé avec succès');
  } catch (error) {
    console.error('❌ Erreur remplacement:', error.message);
    throw error;
  }
}

async function updatePackageJson() {
  console.log('\n📋 Mise à jour de package.json...');
  
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    // S'assurer que pdf-parse est dans les dépendances
    if (!packageJson.dependencies['pdf-parse']) {
      packageJson.dependencies['pdf-parse'] = '^1.1.1';
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ pdf-parse ajouté aux dépendances');
    } else {
      console.log('✅ pdf-parse déjà présent');
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour package.json:', error.message);
  }
}

async function createTestScript() {
  console.log('\n🧪 Création du script de test...');
  
  const testScript = `#!/usr/bin/env node

import { extractTextFromPDF, formatTextForAnalysis } from './pdf-text-extractor.js';
import fs from 'fs/promises';
import path from 'path';

console.log('🧪 Test d\\'extraction de texte PDF\\n');

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
    
    console.log('\\n✅ Extraction réussie!');
    console.log('📊 Statistiques:');
    console.log('  - Nombre de pages:', extractedData.numpages);
    console.log('  - Longueur du texte:', extractedData.text.length, 'caractères');
    console.log('  - Titre:', extractedData.info?.Title || 'Non disponible');
    
    console.log('\\n📝 Aperçu du texte (500 premiers caractères):');
    console.log('---');
    console.log(extractedData.text.substring(0, 500));
    console.log('---');
    
    // Sauvegarder le texte extrait
    const outputFile = pdfFile.replace('.pdf', '_extracted.txt');
    await fs.writeFile(path.join(uploadsDir, outputFile), formattedText);
    console.log('\\n💾 Texte complet sauvegardé dans:', outputFile);
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testPDFExtraction();
`;

  await fs.writeFile('test-pdf-extraction.js', testScript);
  await fs.chmod('test-pdf-extraction.js', 0o755);
  console.log('✅ Script de test créé: test-pdf-extraction.js');
}

async function createDocumentation() {
  console.log('\n📚 Création de la documentation...');
  
  const doc = `# 📝 Migration vers l'Extraction de Texte PDF

## 🎯 Pourquoi ce changement ?

Auparavant, le système convertissait les PDF en images JPG via iLovePDF, ce qui causait :
- Des erreurs "conversion alternative" fréquentes
- Des rejets de factures valides
- Des dépendances à un service externe
- Des problèmes de qualité d'extraction

## ✨ Nouvelle approche

Le système extrait maintenant directement le texte des PDF :
- ✅ Plus rapide et fiable
- ✅ Pas de dépendance externe
- ✅ Meilleure qualité d'extraction
- ✅ Support des PDF complexes
- ✅ Économie de bande passante

## 🔧 Changements techniques

1. **Nouvelle dépendance** : \`pdf-parse\` pour l'extraction de texte
2. **Nouveau module** : \`pdf-text-extractor.js\`
3. **Serveur modifié** : Utilise l'extraction de texte au lieu de la conversion JPG
4. **Prompt Claude adapté** : Analyse du texte au lieu des images pour les PDF

## 📊 Résultats attendus

- **Avant** : 5/10 factures validées (erreurs de conversion)
- **Après** : 9-10/10 factures validées

## 🚀 Utilisation

1. Le serveur détecte automatiquement les PDF
2. Extrait le texte avec \`pdf-parse\`
3. Envoie le texte formaté à Claude
4. Les images (JPG/PNG) continuent d'être traitées normalement

## 🧪 Test

Utilisez le script de test :
\`\`\`bash
node test-pdf-extraction.js
\`\`\`

## ⚠️ Notes importantes

- Les PDF scannés (images dans PDF) peuvent avoir une extraction limitée
- Pour ces cas, une OCR pourrait être nécessaire (future amélioration)
- Les images JPG/PNG continuent de fonctionner exactement comme avant

## 🔄 Retour arrière

Si besoin de revenir à l'ancienne version :
\`\`\`bash
cp server.backup.*.js server.js
npm run dev
\`\`\`

---
*Migration effectuée le ${new Date().toLocaleDateString()}*
`;

  await fs.writeFile('MIGRATION_TEXT_EXTRACTION.md', doc);
  console.log('✅ Documentation créée: MIGRATION_TEXT_EXTRACTION.md');
}

// Exécuter la migration
async function migrate() {
  try {
    console.log('🚀 Début de la migration...\n');
    
    const backupFile = await backupCurrentServer();
    await replaceServer();
    await updatePackageJson();
    await createTestScript();
    await createDocumentation();
    
    console.log('\n✅ Migration terminée avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Installer les dépendances: npm install');
    console.log('2. Redémarrer le serveur: npm run dev');
    console.log('3. Tester avec: node test-pdf-extraction.js');
    console.log(`4. En cas de problème, restaurer avec: cp ${backupFile} server.js`);
    
  } catch (error) {
    console.error('\n❌ Erreur migration:', error.message);
    process.exit(1);
  }
}

migrate();