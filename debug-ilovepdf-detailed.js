import { config } from 'dotenv';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
config();

console.log('🔍 DEBUG DÉTAILLÉ iLovePDF\n');

const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
const secretKey = process.env.ILOVEPDF_SECRET_KEY;

console.log('1️⃣ Configuration actuelle:');
console.log('─────────────────────────────────────────────────');
console.log(`Public Key: ${publicKey}`);
console.log(`Secret Key: ${secretKey?.substring(0, 30)}...`);
console.log('─────────────────────────────────────────────────\n');

// Test 1: Initialisation basique
async function testBasicInit() {
  console.log('2️⃣ Test d\'initialisation basique...');
  try {
    const api = new ILovePDFApi(publicKey, secretKey);
    console.log('✅ API initialisée');
    console.log('   Instance créée:', typeof api);
    console.log('   Méthodes disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(api)));
    return api;
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    return null;
  }
}

// Test 2: Création de tâche avec debug
async function testTaskCreation(api) {
  console.log('\n3️⃣ Test de création de tâche...');
  try {
    console.log('→ Création d\'une tâche pdfjpg...');
    const task = api.newTask('pdfjpg');
    console.log('✅ Tâche créée');
    console.log('   Type de tâche:', task.tool);
    console.log('   Méthodes de tâche:', Object.getOwnPropertyNames(Object.getPrototypeOf(task)));
    
    // Essayer de démarrer la tâche
    console.log('\n→ Démarrage de la tâche...');
    await task.start();
    console.log('✅ Tâche démarrée!');
    console.log('   Task ID:', task.taskId);
    console.log('   Server:', task.server);
    console.log('   Token:', task.token ? 'Présent' : 'Absent');
    
    return task;
  } catch (error) {
    console.error('❌ Erreur création/démarrage tâche:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.status);
    console.error('   Response:', error.response);
    
    if (error.response && error.response.data) {
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Vérifier si c'est une erreur d'authentification
    if (error.status === 401 || error.message.includes('401')) {
      console.error('\n⚠️  ERREUR 401 DÉTECTÉE!');
      console.error('   Cela indique un problème d\'authentification.');
    }
    
    return null;
  }
}

// Test 3: Test avec authentification manuelle
async function testManualAuth() {
  console.log('\n4️⃣ Test d\'authentification manuelle...');
  try {
    // Tenter une authentification directe via fetch
    const authResponse = await fetch('https://api.ilovepdf.com/v1/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public_key: publicKey
      })
    });
    
    console.log(`   Status HTTP: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentification manuelle réussie!');
      console.log('   Token reçu:', authData.token ? 'Oui' : 'Non');
      
      // Essayer de créer une tâche avec le token
      if (authData.token) {
        console.log('\n→ Test de création de tâche avec token manuel...');
        const startResponse = await fetch('https://api.ilovepdf.com/v1/start/pdfjpg', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        
        console.log(`   Status création tâche: ${startResponse.status}`);
        if (startResponse.ok) {
          const taskData = await startResponse.json();
          console.log('✅ Tâche créée avec authentification manuelle!');
          console.log('   Task ID:', taskData.task);
          console.log('   Server:', taskData.server);
        } else {
          console.log('❌ Échec création tâche avec token manuel');
          const errorText = await startResponse.text();
          console.log('   Erreur:', errorText);
        }
      }
      
      return authData.token;
    } else {
      console.log('❌ Authentification manuelle échouée');
      const errorText = await authResponse.text();
      console.log('   Erreur:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur test manuel:', error.message);
    return null;
  }
}

// Test 4: Vérifier la version du package
async function checkPackageVersion() {
  console.log('\n5️⃣ Vérification du package iLovePDF...');
  try {
    const packageJsonPath = path.join(__dirname, 'node_modules', '@ilovepdf', 'ilovepdf-nodejs', 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    console.log('   Version installée:', packageJson.version);
    console.log('   Description:', packageJson.description);
    
    // Vérifier si c'est la dernière version
    console.log('\n→ Vérification de la dernière version disponible...');
    const npmResponse = await fetch('https://registry.npmjs.org/@ilovepdf/ilovepdf-nodejs/latest');
    if (npmResponse.ok) {
      const npmData = await npmResponse.json();
      console.log('   Dernière version:', npmData.version);
      
      if (packageJson.version !== npmData.version) {
        console.log('⚠️  Une mise à jour est disponible!');
        console.log(`   Installez avec: npm install @ilovepdf/ilovepdf-nodejs@${npmData.version}`);
      } else {
        console.log('✅ Package à jour');
      }
    }
  } catch (error) {
    console.log('⚠️  Impossible de vérifier la version du package');
  }
}

// Test 5: Alternative - Utiliser directement l'API REST
async function testDirectRestApi() {
  console.log('\n6️⃣ Test direct de l\'API REST iLovePDF...');
  
  try {
    // Étape 1: Authentification
    console.log('→ Étape 1: Authentification...');
    const authResponse = await fetch('https://api.ilovepdf.com/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: publicKey })
    });
    
    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`);
    }
    
    const { token } = await authResponse.json();
    console.log('✅ Token obtenu');
    
    // Étape 2: Créer une tâche
    console.log('\n→ Étape 2: Création de tâche...');
    const startResponse = await fetch('https://api.ilovepdf.com/v1/start/pdfjpg', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!startResponse.ok) {
      throw new Error(`Start task failed: ${startResponse.status}`);
    }
    
    const taskInfo = await startResponse.json();
    console.log('✅ Tâche créée');
    console.log('   Task:', taskInfo.task);
    console.log('   Server:', taskInfo.server);
    
    return { token, taskInfo };
  } catch (error) {
    console.error('❌ Erreur API REST directe:', error.message);
    return null;
  }
}

// Fonction principale
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   DIAGNOSTIC COMPLET iLovePDF');
  console.log('═══════════════════════════════════════════════════');
  
  // Test 1: Initialisation
  const api = await testBasicInit();
  
  if (api) {
    // Test 2: Création de tâche
    const task = await testTaskCreation(api);
    
    // Nettoyer si la tâche a été créée
    if (task && task.taskId) {
      try {
        await task.delete();
        console.log('🧹 Tâche de test supprimée');
      } catch (e) {
        // Ignorer les erreurs de suppression
      }
    }
  }
  
  // Test 3: Auth manuelle
  await testManualAuth();
  
  // Test 4: Version du package
  await checkPackageVersion();
  
  // Test 5: API REST directe
  await testDirectRestApi();
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('RÉSUMÉ DU DIAGNOSTIC');
  console.log('═══════════════════════════════════════════════════');
  
  console.log('\n💡 Solutions possibles:');
  console.log('1. Mettre à jour le package: npm install @ilovepdf/ilovepdf-nodejs@latest');
  console.log('2. Utiliser l\'API REST directement sans le package npm');
  console.log('3. Vérifier les limites de votre compte sur https://developer.ilovepdf.com/');
  console.log('4. Contacter le support iLovePDF avec ces logs');
}

// Lancer les tests
runAllTests().catch(console.error);