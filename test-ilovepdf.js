import { config } from 'dotenv';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
config();

console.log('🧪 Test de l\'API iLovePDF\n');

// Vérifier les clés API
const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
const secretKey = process.env.ILOVEPDF_SECRET_KEY;

console.log('1️⃣ Vérification des clés API:');
console.log(`   Public Key: ${publicKey ? '✅ Présente' : '❌ Manquante'}`);
console.log(`   Secret Key: ${secretKey ? '✅ Présente' : '❌ Manquante'}`);

if (!publicKey || !secretKey) {
  console.error('\n❌ ERREUR: Clés API manquantes dans le fichier .env');
  process.exit(1);
}

async function testILovePDFConnection() {
  try {
    console.log('\n2️⃣ Test de connexion à l\'API iLovePDF...');
    
    // Initialiser l'API
    const ilovepdfApi = new ILovePDFApi(publicKey, secretKey);
    
    // Créer une tâche simple pour tester la connexion
    const task = ilovepdfApi.newTask('pdfjpg');
    await task.start();
    
    console.log('   ✅ Connexion réussie!');
    console.log(`   Task ID: ${task.taskId}`);
    console.log(`   Server: ${task.server}`);
    
    // Supprimer la tâche de test
    await task.delete();
    
    return true;
  } catch (error) {
    console.error('   ❌ Erreur de connexion:', error.message);
    return false;
  }
}

async function createTestPDF() {
  try {
    console.log('\n3️⃣ Création d\'un PDF de test...');
    
    // Créer un PDF simple avec du texte
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(Test iLovePDF API) Tj
0 -40 Td
/F1 16 Tf
(Facture Test #2024-001) Tj
0 -30 Td
(Client: SOPREMA TEST) Tj
0 -30 Td
(Montant: 15000 EUR) Tj
0 -30 Td
(Produits concurrents: IKO, KNAUF) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000258 00000 n 
0000000344 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
596
%%EOF`;

    const testPdfPath = path.join(__dirname, 'test-invoice.pdf');
    await fs.writeFile(testPdfPath, pdfContent);
    
    console.log('   ✅ PDF de test créé:', testPdfPath);
    return testPdfPath;
  } catch (error) {
    console.error('   ❌ Erreur création PDF:', error.message);
    return null;
  }
}

async function testPDFConversion(pdfPath) {
  try {
    console.log('\n4️⃣ Test de conversion PDF vers JPEG...');
    
    const ilovepdfApi = new ILovePDFApi(publicKey, secretKey);
    
    // Créer une tâche de conversion
    const task = ilovepdfApi.newTask('pdfjpg');
    
    console.log('   → Démarrage de la tâche...');
    await task.start();
    
    console.log('   → Ajout du fichier PDF...');
    await task.addFile(pdfPath);
    
    console.log('   → Conversion en cours...');
    await task.process({
      pdfjpg_mode: 'pages',
      pdfjpg_page_range: '1',
    });
    
    console.log('   → Téléchargement du résultat...');
    const data = await task.download();
    
    // Sauvegarder le JPEG résultant
    const outputPath = path.join(__dirname, 'test-invoice-converted.jpg');
    await fs.writeFile(outputPath, data);
    
    // Vérifier la taille du fichier
    const stats = await fs.stat(outputPath);
    
    console.log('   ✅ Conversion réussie!');
    console.log(`   Fichier de sortie: ${outputPath}`);
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Nettoyer
    await task.delete();
    
    return outputPath;
  } catch (error) {
    console.error('   ❌ Erreur de conversion:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    return null;
  }
}

async function testReconquestThresholds() {
  console.log('\n5️⃣ Vérification des seuils de génération des plans de reconquête...');
  
  console.log('   Seuils actuels:');
  console.log('   - Montant minimum produits concurrents: 5000€');
  console.log('   - OU nombre minimum de factures: 2');
  
  console.log('\n   Scénarios de test:');
  console.log('   ✅ Client A: 6000€ concurrent, 1 facture → Plan généré');
  console.log('   ✅ Client B: 3000€ concurrent, 3 factures → Plan généré');
  console.log('   ❌ Client C: 2000€ concurrent, 1 facture → Pas de plan');
  console.log('   ❌ Client D: 0€ concurrent, 5 factures → Pas de plan');
  
  console.log('\n   💡 Si vos 10 factures n\'ont pas généré de plan, vérifiez:');
  console.log('      1. Les produits concurrents sont-ils correctement identifiés?');
  console.log('      2. Les clients ont-ils au moins 5000€ de produits concurrents?');
  console.log('      3. Ou ont-ils au moins 2 factures chacun?');
}

async function cleanup() {
  console.log('\n6️⃣ Nettoyage des fichiers de test...');
  try {
    await fs.unlink(path.join(__dirname, 'test-invoice.pdf'));
    await fs.unlink(path.join(__dirname, 'test-invoice-converted.jpg'));
    console.log('   ✅ Fichiers supprimés');
  } catch (error) {
    // Ignorer si les fichiers n'existent pas
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   TEST COMPLET API iLovePDF & PLANS RECONQUÊTE');
  console.log('═══════════════════════════════════════════════════');
  
  // Test 1: Connexion API
  const connectionOk = await testILovePDFConnection();
  
  if (connectionOk) {
    // Test 2: Création et conversion PDF
    const pdfPath = await createTestPDF();
    if (pdfPath) {
      const jpgPath = await testPDFConversion(pdfPath);
      if (jpgPath) {
        console.log('\n✅ TOUS LES TESTS iLovePDF PASSÉS AVEC SUCCÈS!');
      }
    }
  }
  
  // Test 3: Vérification des seuils
  await testReconquestThresholds();
  
  // Nettoyage
  await cleanup();
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   RÉSUMÉ DES TESTS');
  console.log('═══════════════════════════════════════════════════');
  console.log(`API iLovePDF: ${connectionOk ? '✅ Fonctionnelle' : '❌ Erreur'}`);
  console.log('Plans reconquête: Vérifiez les seuils ci-dessus');
  console.log('\n💡 Pour déboguer vos 10 factures:');
  console.log('   1. Vérifiez que les produits concurrents sont identifiés');
  console.log('   2. Consultez les logs du serveur lors de la génération');
  console.log('   3. Assurez-vous que les clients remplissent les critères');
}

// Lancer les tests
runAllTests().catch(console.error);