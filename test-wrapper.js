import { config } from 'dotenv';
import { ILovePDFWrapper } from './ilovepdf-wrapper.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
config();

console.log('🧪 Test du wrapper iLovePDF\n');

async function createTestPDF() {
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
(Test iLovePDF Wrapper) Tj
0 -40 Td
/F1 16 Tf
(Date systeme decalee) Tj
0 -30 Td
(Client: TEST WRAPPER) Tj
0 -30 Td
(Montant: 25000 EUR) Tj
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

  const testPdfPath = path.join(__dirname, 'test-wrapper.pdf');
  await fs.writeFile(testPdfPath, pdfContent);
  return testPdfPath;
}

async function testWrapper() {
  try {
    console.log('1️⃣ Création du PDF de test...');
    const pdfPath = await createTestPDF();
    console.log('✅ PDF créé:', pdfPath);

    console.log('\n2️⃣ Initialisation du wrapper iLovePDF...');
    const wrapper = new ILovePDFWrapper(
      process.env.ILOVEPDF_PUBLIC_KEY,
      process.env.ILOVEPDF_SECRET_KEY
    );

    console.log('\n3️⃣ Test de conversion PDF → JPG...');
    const outputPath = path.join(__dirname, 'test-wrapper-output.jpg');
    
    await wrapper.convertPdfToJpg(pdfPath, outputPath);

    // Vérifier que le fichier existe
    const stats = await fs.stat(outputPath);
    console.log(`\n✅ Conversion réussie!`);
    console.log(`   Fichier de sortie: ${outputPath}`);
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);

    // Nettoyer
    await fs.unlink(pdfPath);
    await fs.unlink(outputPath);
    console.log('\n🧹 Fichiers de test supprimés');

    return true;
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    return false;
  }
}

console.log('═══════════════════════════════════════════════════');
console.log('   TEST WRAPPER iLovePDF');
console.log('═══════════════════════════════════════════════════');
console.log('⚠️  Ce wrapper contourne le problème de date système');
console.log('   en utilisant directement l\'API REST');
console.log('═══════════════════════════════════════════════════\n');

testWrapper().then(success => {
  console.log('\n═══════════════════════════════════════════════════');
  console.log(success ? '✅ TEST RÉUSSI!' : '❌ TEST ÉCHOUÉ');
  console.log('═══════════════════════════════════════════════════');
  
  if (success) {
    console.log('\n💡 Le wrapper fonctionne correctement!');
    console.log('   L\'application utilisera maintenant ce wrapper');
    console.log('   au lieu du package npm défaillant.');
  }
});