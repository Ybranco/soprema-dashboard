#!/usr/bin/env node

/**
 * Test spécifique de l'outil pdfocr iLovePDF
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testPDFOCR() {
  console.log('🔍 TEST DE L\'OUTIL PDFOCR ILOVEPDF');
  console.log('=================================');

  const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
  
  try {
    // Authentification
    const authResponse = await fetch('https://api.ilovepdf.com/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: publicKey })
    });

    if (!authResponse.ok) {
      console.log('❌ Erreur authentification');
      return false;
    }

    const { token } = await authResponse.json();
    console.log('✅ Authentification réussie');

    // Test de l'outil pdfocr
    console.log('\n📄 Test de l\'outil pdfocr...');
    const response = await fetch('https://api.ilovepdf.com/v1/start/pdfocr', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   Statut: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`   ❌ Erreur: ${JSON.stringify(errorData, null, 2)}`);
      return false;
    }

    const data = await response.json();
    console.log('   ✅ Outil pdfocr disponible !');
    console.log(`   Task ID: ${data.task}`);
    console.log(`   Server: ${data.server}`);

    // Nettoyer la tâche
    try {
      await fetch(`https://${data.server}/v1/task/${data.task}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   ✅ Tâche nettoyée');
    } catch (e) {
      // Ignorer
    }

    console.log('\n🎉 L\'OUTIL PDFOCR EST DISPONIBLE ET FONCTIONNEL !');
    return true;

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return false;
  }
}

testPDFOCR().then(success => {
  if (success) {
    console.log('\n✅ L\'OCR iLovePDF devrait maintenant fonctionner correctement');
    console.log('🚀 Vous pouvez maintenant tester avec vos PDFs !');
  } else {
    console.log('\n❌ Il y a encore un problème avec l\'outil pdfocr');
  }
});