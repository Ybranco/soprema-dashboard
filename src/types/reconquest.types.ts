// Types pour les plans de reconquête client détaillés
export interface CustomerReconquestPlan {
  planId: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  status: 'active' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'high' | 'medium' | 'low';
  
  // Analyse détaillée du client
  clientAnalysis: {
    profile: {
      companyName: string;
      sector: string;
      size: 'PME' | 'ETI' | 'Grand Compte';
      yearsAsClient: number;
      lastPurchaseDate: string;
      totalPurchaseHistory: number;
      averageOrderValue: number;
      purchaseFrequency: string;
      currentStatus: 'active' | 'dormant' | 'at_risk' | 'lost';
    };
    behavioralInsights: {
      buyingPatterns: string[];
      seasonality: string;
      preferredProducts: string[];
      decisionMakingProcess: string;
      paymentBehavior: string;
      loyaltyScore: number;
    };
    competitiveAnalysis: {
      currentSuppliers: Array<{
        name: string;
        productsSupplied: string[];
        estimatedShare: number;
        strengths: string[];
        weaknesses: string[];
      }>;
      switchingBarriers: string[];
      pricePositioning: 'price_sensitive' | 'value_focused' | 'premium_oriented';
      competitorAdvantages: string[];
    };
    relationshipHistory: {
      keyContacts: Array<{
        name: string;
        role: string;
        influence: 'high' | 'medium' | 'low';
        relationshipQuality: 'excellent' | 'good' | 'neutral' | 'poor';
        lastInteraction: string;
      }>;
      historicalIssues: string[];
      successStories: string[];
      contractHistory: string[];
    };
  };
  
  // Analyse des opportunités
  opportunityAssessment: {
    reconquestPotential: {
      estimatedRevenue: number;
      probabilityOfSuccess: number;
      timeToConversion: string;
      requiredInvestment: number;
      roi: number;
    };
    productOpportunities: Array<{
      competitorProduct: string;
      volumePotential: number;
      revenueImpact: number;
      conversionDifficulty: 'easy' | 'medium' | 'hard';
      uniqueSellingPoints: string[];
    }>;
    crossSellPotential: Array<{
      productCategory: string;
      currentPenetration: number;
      potentialIncrease: number;
      recommendedProducts: string[];
      estimatedRevenue: number;
    }>;
    marketContext: {
      localMarketGrowth: string;
      upcomingProjects: string[];
      regulatoryChanges: string[];
      technologyTrends: string[];
    };
  };
  
  // Stratégie de reconquête détaillée
  reconquestStrategy: {
    winBackApproach: {
      primaryStrategy: string;
      tacticalActions: string[];
      differentiators: string[];
      valueProposition: string;
      competitiveAdvantages: string[];
    };
    pricingStrategy: {
      approach: 'competitive' | 'value' | 'penetration' | 'premium';
      specialOffers: Array<{
        offerType: string;
        discount: number;
        conditions: string;
        validity: string;
      }>;
      volumeIncentives: string[];
      paymentTerms: string;
    };
    serviceEnhancements: {
      technicalSupport: string[];
      trainingPrograms: string[];
      dedicatedResources: string[];
      digitalServices: string[];
      logisticsImprovements: string[];
    };
    relationshipBuilding: {
      executiveSponsor: string;
      accountTeam: string[];
      communicationPlan: Array<{
        action: string;
        frequency: string;
        responsible: string;
        objective: string;
      }>;
      trustBuildingActions: string[];
    };
  };
  
  // Plan d'action tactique
  actionPlan: {
    phase1_Contact: {
      duration: string;
      objectives: string[];
      actions: Array<{
        action: string;
        deadline: string;
        responsible: string;
        resources: string[];
        successCriteria: string;
      }>;
      expectedOutcomes: string[];
    };
    phase2_Negotiation: {
      duration: string;
      objectives: string[];
      actions: Array<{
        action: string;
        deadline: string;
        responsible: string;
        decisionPoint: string;
        fallbackOption: string;
      }>;
      keyMilestones: string[];
    };
    phase3_Conversion: {
      duration: string;
      objectives: string[];
      actions: Array<{
        action: string;
        deadline: string;
        responsible: string;
        deliverables: string[];
        qualityChecks: string[];
      }>;
      successMetrics: string[];
    };
    phase4_Retention: {
      duration: string;
      objectives: string[];
      actions: Array<{
        action: string;
        frequency: string;
        responsible: string;
        kpi: string;
        reviewProcess: string;
      }>;
      loyaltyProgram: string[];
    };
  };
  
  // Gestion des risques
  riskManagement: {
    identifiedRisks: Array<{
      risk: string;
      probability: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      mitigation: string;
      contingencyPlan: string;
    }>;
    competitiveThreats: string[];
    internalChallenges: string[];
    externalFactors: string[];
  };
  
  // KPIs et suivi
  monitoring: {
    kpis: Array<{
      metric: string;
      target: number;
      current: number;
      frequency: string;
      responsible: string;
    }>;
    milestones: Array<{
      milestone: string;
      targetDate: string;
      status: 'pending' | 'achieved' | 'delayed' | 'failed';
      dependencies: string[];
    }>;
    reviewSchedule: {
      frequency: string;
      participants: string[];
      agenda: string[];
      decisionRights: string;
    };
    successCriteria: {
      shortTerm: string[];
      mediumTerm: string[];
      longTerm: string[];
    };
  };
  
  // Budget et ressources
  resourceAllocation: {
    budget: {
      total: number;
      breakdown: {
        commercial: number;
        marketing: number;
        technical: number;
        training: number;
        other: number;
      };
      roi_projection: number;
      paybackPeriod: string;
    };
    teamAssignment: Array<{
      role: string;
      person: string;
      timeAllocation: string;
      responsibilities: string[];
    }>;
    externalSupport: {
      consultants: string[];
      partners: string[];
      suppliers: string[];
    };
  };
  
  // Communication et documentation
  communication: {
    internalCommunication: {
      stakeholders: string[];
      reportingFrequency: string;
      escalationPath: string[];
      documentationRequirements: string[];
    };
    clientCommunication: {
      primaryContact: string;
      communicationChannels: string[];
      meetingCadence: string;
      proposalStrategy: string;
    };
    marketingSupport: {
      collateral: string[];
      caseStudies: string[];
      references: string[];
      events: string[];
    };
  };
}

// Type pour les profils clients consolidés
export interface CustomerProfile {
  id: string;
  name: string;
  fullName: string;
  siret?: string;
  totalRevenue: number;
  competitorAmount: number;
  reconquestPotential: number;
  invoiceCount: number;
  lastInvoiceDate: string;
  priority: 'high' | 'medium' | 'low';
  competitorProducts: Array<{
    brand: string;
    products: string[];
    totalAmount: number;
  }>;
  purchaseHistory: Array<{
    invoiceId: string;
    date: string;
    amount: number;
    competitorPercentage: number;
  }>;
  distributors: string[];
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}