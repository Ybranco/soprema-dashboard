#!/usr/bin/env node

/**
 * Test direct d'un PDF vers le serveur pour voir les logs complets
 */

import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

const API_URL = 'http://localhost:3001';

async function testPDFDirect() {
  console.log('🔍 TEST DIRECT PDF → SERVEUR');
  console.log('============================');

  try {
    // Trouver un PDF de test dans le dossier uploads
    const uploadsDir = './uploads';
    let testPDFPath = null;

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
      if (pdfFile) {
        testPDFPath = path.join(uploadsDir, pdfFile);
        console.log(`📄 PDF trouvé: ${testPDFPath}`);
      }
    }

    if (!testPDFPath || !fs.existsSync(testPDFPath)) {
      console.log('❌ Aucun PDF trouvé dans ./uploads');
      console.log('💡 Déposez d\'abord un PDF via l\'interface pour qu\'il soit sauvé dans uploads/');
      return false;
    }

    console.log(`📊 Taille du fichier: ${fs.statSync(testPDFPath).size} octets`);

    // Préparer FormData
    const formData = new FormData();
    formData.append('invoice', fs.createReadStream(testPDFPath));

    console.log('📡 Envoi vers /api/analyze-invoice...');
    console.log('⏰ Regardez les logs détaillés dans le terminal du serveur !');

    const response = await fetch(`${API_URL}/api/analyze-invoice`, {
      method: 'POST',
      body: formData
    });

    console.log(`📨 Réponse: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur: ${errorText}`);
      return false;
    }

    const data = await response.json();
    console.log('✅ Réponse reçue du serveur:');
    console.log('📋 Données extraites:');
    console.log(`   - Numéro facture: ${data.invoiceNumber || 'N/A'}`);
    console.log(`   - Client: ${data.client?.name || 'N/A'}`);
    console.log(`   - Montant total: ${data.totalAmount || 0}€`);
    console.log(`   - Nombre de produits: ${data.products?.length || 0}`);

    if (data.products && data.products.length > 0) {
      console.log('📦 Produits extraits:');
      data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.designation} - ${product.totalPrice}€ ${product.isCompetitor ? '(Concurrent)' : '(Soprema)'}`);
      });
    } else {
      console.log('⚠️  PROBLÈME: Aucun produit extrait !');
      console.log('🔍 Vérifiez les logs détaillés du serveur pour voir ce que Claude a reçu et répondu');
    }

    return true;

  } catch (error) {
    console.error(`❌ Erreur test direct: ${error.message}`);
    return false;
  }
}

console.log('🚀 LANCEMENT DU TEST DIRECT PDF');
console.log('📝 Ce test va envoyer un PDF directement au serveur');
console.log('🔍 REGARDEZ LE TERMINAL DU SERVEUR pour voir tous les logs de debug !');
console.log('');

testPDFDirect().then(success => {
  if (success) {
    console.log('\n✅ Test terminé - Vérifiez les logs du serveur pour les détails');
  } else {
    console.log('\n❌ Test échoué');
  }
});