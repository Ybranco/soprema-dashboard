import { Invoice, Opportunity } from '../types';

// AUCUNE DONNÉE MOCKÉE - Application démarre complètement vide
// Les données sont générées uniquement par l'analyse réelle des factures

export const mockInvoices: Invoice[] = [];

export const mockOpportunities: Opportunity[] = [];

// Messages d'aide pour les utilisateurs
export const helpMessages = {
  noInvoices: {
    title: "Aucune facture analysée",
    message: "Commencez par uploader une facture PDF ou image pour voir les analyses s'afficher.",
    action: "Cliquez sur 'Gérer les factures' puis 'Ajouter une facture'"
  },
  noOpportunities: {
    title: "Aucune opportunité détectée",
    message: "Les opportunités commerciales apparaîtront automatiquement après l'analyse des factures contenant des produits concurrents.",
    action: "Uploadez des factures contenant des produits IKO, KNAUF, ISOVER, etc."
  },
  configurationError: {
    title: "Configuration requise",
    message: "Pour utiliser l'application, vous devez configurer vos clés API dans le fichier .env",
    actions: [
      "1. Obtenez une clé Google Maps API",
      "2. Obtenez une clé Claude API", 
      "3. Configurez le fichier .env",
      "4. Redémarrez l'application"
    ]
  }
};