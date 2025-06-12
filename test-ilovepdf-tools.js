#!/usr/bin/env node

/**
 * Test pour voir quels outils sont disponibles sur votre compte iLovePDF
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testAvailableTools() {
  console.log('🔍 TEST DES OUTILS DISPONIBLES ILOVEPDF');
  console.log('=====================================');

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
      return;
    }

    const { token } = await authResponse.json();

    // Liste des outils à tester
    const tools = [
      'ocr',      // OCR (ce qui nous intéresse)
      'pdfjpg',   // PDF vers JPG
      'compress', // Compression PDF
      'merge',    // Fusion PDF
      'split',    // Division PDF
      'unlock',   // Déverrouillage PDF
      'protect',  // Protection PDF
      'watermark',// Filigrane
      'rotate',   // Rotation
      'pagenumber' // Numérotation
    ];

    console.log('📋 Test de disponibilité des outils:\n');

    for (const tool of tools) {
      try {
        const response = await fetch(`https://api.ilovepdf.com/v1/start/${tool}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${tool.toUpperCase().padEnd(12)} - Disponible (Task: ${data.task})`);
          
          // Nettoyer la tâche
          try {
            await fetch(`https://${data.server}/v1/task/${data.task}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (e) {}
          
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log(`❌ ${tool.toUpperCase().padEnd(12)} - Non disponible (${response.status})`);
          if (errorData.error) {
            console.log(`   → ${errorData.error.message}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${tool.toUpperCase().padEnd(12)} - Erreur: ${error.message}`);
      }
    }

    // Tester les informations utilisateur
    console.log('\n💳 Informations du compte:');
    try {
      const userResponse = await fetch('https://api.ilovepdf.com/v1/user', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log(`   Plan: ${userData.plan || 'Non spécifié'}`);
        console.log(`   Crédits: ${userData.remaining_files || 'Non spécifié'}`);
        console.log(`   Email: ${userData.email || 'Non spécifié'}`);
      }
    } catch (e) {
      console.log('   Impossible de récupérer les infos utilisateur');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAvailableTools();