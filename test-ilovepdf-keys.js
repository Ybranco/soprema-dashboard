#!/usr/bin/env node

/**
 * Test spécifique des clés iLovePDF pour diagnostiquer le problème
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testILovePDFKeys() {
  console.log('🔍 TEST DES CLÉS ILOVEPDF');
  console.log('========================');

  const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
  const secretKey = process.env.ILOVEPDF_SECRET_KEY;

  console.log('📋 Configuration:');
  console.log(`   Public Key: ${publicKey ? publicKey.substring(0, 20) + '...' : 'MANQUANTE'}`);
  console.log(`   Secret Key: ${secretKey ? secretKey.substring(0, 20) + '...' : 'MANQUANTE'}`);

  if (!publicKey || !secretKey) {
    console.log('❌ Clés manquantes dans .env');
    return false;
  }

  try {
    // Test 1: Authentification
    console.log('\n🔐 Test 1: Authentification...');
    const authResponse = await fetch('https://api.ilovepdf.com/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: publicKey })
    });

    console.log(`   Statut: ${authResponse.status} ${authResponse.statusText}`);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.log(`   ❌ Erreur auth: ${errorText}`);
      
      if (authResponse.status === 401) {
        console.log('   💡 Clé publique invalide ou expirée');
      } else if (authResponse.status === 403) {
        console.log('   💡 Accès refusé - vérifiez votre compte iLovePDF');
      } else if (authResponse.status === 429) {
        console.log('   💡 Limite de taux atteinte - attendez avant de réessayer');
      }
      return false;
    }

    const authData = await authResponse.json();
    console.log('   ✅ Authentification réussie');
    console.log(`   Token reçu: ${authData.token.substring(0, 20)}...`);
    
    const token = authData.token;

    // Test 2: Création d'une tâche OCR
    console.log('\n📄 Test 2: Création tâche OCR...');
    const startResponse = await fetch('https://api.ilovepdf.com/v1/start/ocr', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   Statut: ${startResponse.status} ${startResponse.statusText}`);
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.log(`   ❌ Erreur start OCR: ${errorText}`);
      
      if (startResponse.status === 400) {
        console.log('   💡 Requête malformée');
      } else if (startResponse.status === 401) {
        console.log('   💡 Token invalide');
      } else if (startResponse.status === 402) {
        console.log('   💡 Crédits insuffisants sur votre compte iLovePDF');
      } else if (startResponse.status === 403) {
        console.log('   💡 Fonctionnalité OCR non disponible pour votre plan');
      }
      return false;
    }

    const startData = await startResponse.json();
    console.log('   ✅ Tâche OCR créée avec succès');
    console.log(`   Task ID: ${startData.task}`);
    console.log(`   Server: ${startData.server}`);

    // Test 3: Vérifier les limites du compte
    console.log('\n💳 Test 3: Informations du compte...');
    const userResponse = await fetch('https://api.ilovepdf.com/v1/user', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('   ✅ Informations compte:');
      console.log(`   - Plan: ${userData.plan || 'Non spécifié'}`);
      console.log(`   - Crédits restants: ${userData.remaining_files || 'Non spécifié'}`);
      console.log(`   - OCR disponible: ${userData.ocr_available ? 'Oui' : 'Non'}`);
    }

    // Nettoyage
    try {
      await fetch(`https://${startData.server}/v1/task/${startData.task}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   ✅ Tâche nettoyée');
    } catch (e) {
      // Ignorer
    }

    console.log('\n🎉 TOUTES LES CLÉS ILOVEPDF FONCTIONNENT CORRECTEMENT !');
    return true;

  } catch (error) {
    console.error(`\n❌ Erreur réseau: ${error.message}`);
    if (error.message.includes('ENOTFOUND')) {
      console.log('   💡 Problème de connectivité Internet');
    }
    return false;
  }
}

testILovePDFKeys().then(success => {
  if (success) {
    console.log('\n✅ Les clés iLovePDF sont valides et fonctionnelles');
    console.log('🔍 Le problème pourrait être ailleurs (format de fichier, taille, etc.)');
  } else {
    console.log('\n❌ Problème détecté avec les clés iLovePDF');
    console.log('💡 Solutions possibles:');
    console.log('   1. Vérifier que les clés dans .env sont correctes');
    console.log('   2. Vérifier que votre compte iLovePDF a des crédits');
    console.log('   3. Vérifier que votre plan inclut la fonctionnalité OCR');
    console.log('   4. Créer de nouvelles clés sur https://developer.ilovepdf.com/');
  }
});