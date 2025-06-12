import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configuration automatique du projet SOPREMA Dashboard\n');

// Vérifier si .env existe
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Fichier .env créé à partir de .env.example');
  } else {
    // Créer un .env basique avec le BON nom de variable
    const defaultEnv = \`# Configuration SOPREMA Dashboard
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_APP_TITLE=SOPREMA Commercial Dashboard
VITE_API_BASE_URL=http://localhost:3001/api
PORT=3001
NODE_ENV=development
`;
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Fichier .env créé avec la configuration par défaut');
  }
} else {
  console.log('✅ Fichier .env existe déjà');
  
  // Vérifier et corriger les noms de variables si nécessaire
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    let updated = false;
    
    // Remplacer CLAUDE_API_KEY par ANTHROPIC_API_KEY si présent
    if (envContent.includes('CLAUDE_API_KEY')) {
      envContent = envContent.replace(/CLAUDE_API_KEY/g, 'ANTHROPIC_API_KEY');
      updated = true;
      console.log('🔧 Correction: CLAUDE_API_KEY → ANTHROPIC_API_KEY');
    }
    
    if (updated) {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Fichier .env mis à jour avec les bons noms de variables');
    }
  } catch (error) {
    console.log('⚠️ Impossible de vérifier le contenu du .env:', error.message);
  }
}

// Vérifier les dossiers nécessaires
const requiredDirs = [
  'uploads',
  'temp',
  'converted'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(\`✅ Dossier ${dir}/ créé`);
  }
});

console.log('\n📋 PROCHAINES ÉTAPES:');
console.log('1. Configurez vos clés API dans le fichier .env');
console.log('   ⚠️  IMPORTANT: Utilisez ANTHROPIC_API_KEY (pas CLAUDE_API_KEY)');
console.log('2. Exécutez: npm install');
console.log('3. Exécutez: npm run dev');
console.log('\n🔑 Clés API nécessaires:');
console.log('- Google Maps: https://console.cloud.google.com/');
console.log('- Claude 3.5 Sonnet: https://console.anthropic.com/');
console.log('\n🎉 Configuration terminée!');