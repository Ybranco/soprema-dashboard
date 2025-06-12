export interface Invoice {
  id: string;
  number: string;
  date: string;
  client: {
    name: string;
    fullName: string;
    address: string;
    siret?: string;
    contact?: string;
    phone?: string;
  };
  distributor: {
    name: string;
    agency: string;
    seller?: string;
  };
  amount: number;
  potential: number;
  products: Product[];
  status: 'analyzed' | 'pending' | 'processing';
  region?: string;
  reconquestPlan?: any; // Plan de reconquête client généré par Claude AI
}

export interface Product {
  reference: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'competitor' | 'soprema';
  brand?: string; // Marque du fabricant (pas le distributeur)
  competitor?: {
    brand: string;
    category: string;
  };
  verificationDetails?: {
    confidence: number;
    reclassified?: boolean;
  };
}

export interface Opportunity {
  id: string;
  title: string;
  subtitle: string;
  client: string;
  distributor: string;
  region: string;
  volume: number;
  potential: number;
  trend: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
  detectedProducts: string[];
  badge: string;
}

export interface DashboardStats {
  invoicesAnalyzed: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
  clientsIdentified: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
  businessPotential: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
}

export interface CompetitorProduct {
  name: string;
  amount: number;
  percentage: number;
}

export interface AnalysisStep {
  id: string;
  title: string;
  icon: string;
  status: 'completed' | 'current' | 'pending';
  progress: number;
}

export interface AnalysisResult {
  lastInvoice: string;
  detectedProducts: string;
  competitorBrands: string;
  clientProfilesGenerated: string;
  estimatedPotential: number;
}

// Type legacy supprimé - remplacé par CustomerReconquestPlan