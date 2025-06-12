import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testUpload() {
  try {
    // Utiliser notre image de test
    const filePath = path.resolve('test-invoice.jpg');
    console.log('📄 Test avec le fichier:', filePath);
    
    const form = new FormData();
    form.append('invoice', fs.createReadStream(filePath));
    
    console.log('🚀 Envoi de la requête...');
    const response = await fetch('http://localhost:3001/api/analyze-invoice', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('📡 Status:', response.status);
    console.log('📡 Headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('📡 Réponse brute:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('📡 Réponse JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('❌ La réponse n\'est pas du JSON valide');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testUpload();