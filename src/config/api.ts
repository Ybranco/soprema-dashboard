// Configuration API centralisée
export const getApiUrl = () => {
  // En développement local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // En production (Netlify, Vercel, etc.)
  // Utilise l'URL de base du site
  return `${window.location.origin}/api`;
};

export const API_BASE_URL = getApiUrl();