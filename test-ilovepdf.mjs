import { ILovePDFWrapper } from './ilovepdf-wrapper.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Test de connexion iLovePDF...');
console.log('Public Key:', process.env.ILOVEPDF_PUBLIC_KEY ? '✅ Configurée' : '❌ Manquante');
console.log('Secret Key:', process.env.ILOVEPDF_SECRET_KEY ? '✅ Configurée' : '❌ Manquante');

const api = new ILovePDFWrapper(process.env.ILOVEPDF_PUBLIC_KEY, process.env.ILOVEPDF_SECRET_KEY);

try {
  const token = await api.authenticate();
  console.log('✅ Authentification réussie\!');
  console.log('Token:', token ? token.substring(0, 20) + '...' : 'null');
} catch (err) {
  console.error('❌ Erreur authentification:', err.message);
  console.error('Détails:', err);
}
