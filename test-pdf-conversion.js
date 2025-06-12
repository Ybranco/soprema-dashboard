#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testPDFConversion() {
  console.log('🧪 Test de conversion PDF...\n');
  
  // Créer un PDF de test simple
  const testPDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000274 00000 n\n0000000353 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n449\n%%EOF');
  
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
      console.log('\n⚠️  Erreur serveur - Vérifiez:');
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
