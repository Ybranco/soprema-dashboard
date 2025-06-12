import { config } from 'dotenv';
import fetch from 'node-fetch';

// Charger les variables d'environnement
config();

console.log('🔐 Vérification détaillée des clés iLovePDF\n');

const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
const secretKey = process.env.ILOVEPDF_SECRET_KEY;

console.log('1️⃣ Clés trouvées dans .env:');
console.log('─────────────────────────────────────────────────');
console.log(`Public Key: ${publicKey}`);
console.log(`Secret Key: ${secretKey ? secretKey.substring(0, 20) + '...' : 'MANQUANTE'}`);
console.log('─────────────────────────────────────────────────\n');

// Vérifier le format des clés
console.log('2️⃣ Vérification du format des clés:');

// Public key devrait commencer par "project_public_"
if (publicKey && publicKey.startsWith('project_public_')) {
  console.log('✅ Format public key correct (commence par "project_public_")');
} else {
  console.log('❌ Format public key incorrect');
}

// Secret key devrait commencer par "secret_key_"
if (secretKey && secretKey.startsWith('secret_key_')) {
  console.log('✅ Format secret key correct (commence par "secret_key_")');
} else {
  console.log('❌ Format secret key incorrect');
}

console.log('\n3️⃣ Test direct de l\'API iLovePDF:');

// Test avec l'API REST directe d'iLovePDF
async function testDirectAPI() {
  try {
    const authUrl = 'https://api.ilovepdf.com/v1/auth';
    
    console.log('→ Tentative d\'authentification...');
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public_key: publicKey
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentification réussie!');
      console.log(`   Token: ${data.token ? data.token.substring(0, 20) + '...' : 'Non reçu'}`);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Authentification échouée');
      console.log(`   Erreur: ${error}`);
      
      if (response.status === 401) {
        console.log('\n⚠️  Erreur 401: Clé publique invalide ou compte désactivé');
        console.log('   Solutions possibles:');
        console.log('   1. Vérifiez que votre compte iLovePDF est actif');
        console.log('   2. Régénérez vos clés API sur https://developer.ilovepdf.com/');
        console.log('   3. Assurez-vous d\'avoir un compte payant actif');
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

// Vérifier l'erreur 401
console.log('\n4️⃣ Diagnostic de l\'erreur 401:');
console.log('─────────────────────────────────────────────────');
console.log('L\'erreur 401 peut signifier:');
console.log('• Clé API invalide ou mal copiée');
console.log('• Compte iLovePDF suspendu ou expiré');
console.log('• Limite d\'utilisation dépassée');
console.log('• Clés API non activées sur votre compte');
console.log('─────────────────────────────────────────────────\n');

// Exécuter le test
testDirectAPI().then(success => {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('RÉSUMÉ:');
  console.log('═══════════════════════════════════════════════════');
  
  if (success) {
    console.log('✅ Clés iLovePDF valides et fonctionnelles');
    console.log('   Le problème vient peut-être du package npm');
    console.log('   Essayez: npm install @ilovepdf/ilovepdf-nodejs@latest');
  } else {
    console.log('❌ Problème avec les clés iLovePDF');
    console.log('\nActions recommandées:');
    console.log('1. Connectez-vous sur https://developer.ilovepdf.com/');
    console.log('2. Vérifiez que votre compte est actif (payant)');
    console.log('3. Créez un nouveau projet et générez de nouvelles clés');
    console.log('4. Remplacez les clés dans le fichier .env');
    console.log('5. Redémarrez le serveur');
  }
  
  console.log('\n💡 Alternative: Si iLovePDF ne fonctionne pas,');
  console.log('   le système utilisera automatiquement Ghostscript');
  console.log('   ou les autres méthodes de conversion.');
});