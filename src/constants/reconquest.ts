// Constants pour les opportunités de conversion
export const RECONQUEST_THRESHOLDS = {
  // Seuil minimum en euros pour identifier une opportunité de conversion
  MIN_COMPETITOR_AMOUNT: 5000,
  
  // Autres seuils utiles
  HIGH_PRIORITY_THRESHOLD: 50000,    // Client haute priorité
  MEDIUM_PRIORITY_THRESHOLD: 20000,  // Client priorité moyenne
  
  // Seuils pour les régions sur la carte
  LARGE_REGION_THRESHOLD: 150000,
  MEDIUM_REGION_THRESHOLD: 80000
} as const;

// Type pour s'assurer que les seuils sont utilisés correctement
export type ReconquestThreshold = typeof RECONQUEST_THRESHOLDS[keyof typeof RECONQUEST_THRESHOLDS];