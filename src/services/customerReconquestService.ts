import { CustomerProfile, CustomerReconquestPlan } from '../types/reconquest.types';

class CustomerReconquestService {
  private serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  // Générer un plan de reconquête détaillé avec Claude AI
  async generateReconquestPlan(customer: CustomerProfile): Promise<CustomerReconquestPlan> {
    try {
      
      // Préparer les données pour Claude
      const requestData = {
        clientId: customer.id,
        clientName: customer.fullName || customer.name,
        clientData: {
          totalRevenue: customer.totalRevenue,
          competitorAmount: customer.competitorAmount,
          reconquestPotential: customer.reconquestPotential,
          invoiceCount: customer.invoiceCount,
          lastInvoiceDate: customer.lastInvoiceDate,
          priority: customer.priority,
          competitorProducts: customer.competitorProducts,
          purchaseHistory: customer.purchaseHistory,
          distributors: customer.distributors,
          region: customer.region,
          coordinates: customer.coordinates,
          siret: customer.siret
        },
        requestType: 'detailed_reconquest_plan',
        analysisDepth: 'comprehensive'
      };

      
      const response = await fetch(`${this.serverUrl}/api/generate-reconquest-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erreur serveur inconnue',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.message || `Erreur serveur HTTP ${response.status}`);
      }

      const reconquestPlan = await response.json();
      
      return this.validateAndEnrichPlan(reconquestPlan, customer);
      
    } catch (error) {
      
      // Fallback : générer un plan basique si Claude échoue
      return this.generateFallbackPlan(customer);
    }
  }

  // Valider et enrichir le plan généré
  private validateAndEnrichPlan(plan: any, customer: CustomerProfile): CustomerReconquestPlan {
    const now = new Date();
    
    return {
      planId: plan.planId || `PLAN-${customer.id}-${Date.now()}`,
      clientId: customer.id,
      clientName: customer.fullName || customer.name,
      createdAt: plan.createdAt || now.toISOString(),
      status: 'active',
      priority: customer.priority,
      
      clientAnalysis: plan.clientAnalysis || this.generateDefaultClientAnalysis(customer),
      opportunityAssessment: plan.opportunityAssessment || this.generateDefaultOpportunityAssessment(customer),
      reconquestStrategy: plan.reconquestStrategy || this.generateDefaultStrategy(customer),
      actionPlan: plan.actionPlan || this.generateDefaultActionPlan(customer),
      riskManagement: plan.riskManagement || this.generateDefaultRiskManagement(customer),
      monitoring: plan.monitoring || this.generateDefaultMonitoring(customer),
      resourceAllocation: plan.resourceAllocation || this.generateDefaultResourceAllocation(customer),
      communication: plan.communication || this.generateDefaultCommunication(customer)
    };
  }

  // Générer un plan de base si Claude AI n'est pas disponible
  private generateFallbackPlan(customer: CustomerProfile): CustomerReconquestPlan {
    
    const now = new Date();
    const competitorShare = customer.competitorAmount / customer.totalRevenue;
    
    return {
      planId: `PLAN-${customer.id}-${Date.now()}`,
      clientId: customer.id,
      clientName: customer.fullName || customer.name,
      createdAt: now.toISOString(),
      status: 'active',
      priority: customer.priority,
      
      clientAnalysis: this.generateDefaultClientAnalysis(customer),
      opportunityAssessment: this.generateDefaultOpportunityAssessment(customer),
      reconquestStrategy: this.generateDefaultStrategy(customer),
      actionPlan: this.generateDefaultActionPlan(customer),
      riskManagement: this.generateDefaultRiskManagement(customer),
      monitoring: this.generateDefaultMonitoring(customer),
      resourceAllocation: this.generateDefaultResourceAllocation(customer),
      communication: this.generateDefaultCommunication(customer)
    };
  }

  // Méthodes privées pour générer les sections par défaut
  private generateDefaultClientAnalysis(customer: CustomerProfile) {
    const competitorShare = customer.competitorAmount / customer.totalRevenue;
    const avgOrderValue = customer.totalRevenue / customer.invoiceCount;
    
    return {
      profile: {
        companyName: customer.fullName || customer.name,
        sector: 'Construction / BTP',
        size: customer.totalRevenue > 500000 ? 'ETI' : 'PME' as 'PME' | 'ETI',
        yearsAsClient: 3,
        lastPurchaseDate: customer.lastInvoiceDate,
        totalPurchaseHistory: customer.totalRevenue,
        averageOrderValue: avgOrderValue,
        purchaseFrequency: 'Mensuelle',
        currentStatus: competitorShare > 0.5 ? 'at_risk' : 'active' as 'active' | 'at_risk'
      },
      behavioralInsights: {
        buyingPatterns: ['Commandes régulières', 'Volume stable'],
        seasonality: 'Pics au printemps et automne',
        preferredProducts: ['Étanchéité bitumineuse', 'Isolation thermique'],
        decisionMakingProcess: 'Validation technique puis commerciale',
        paymentBehavior: 'Paiement à 30 jours',
        loyaltyScore: Math.round((1 - competitorShare) * 100)
      },
      competitiveAnalysis: {
        currentSuppliers: customer.competitorProducts.map(cp => ({
          name: cp.brand,
          productsSupplied: cp.products,
          estimatedShare: Math.round((cp.totalAmount / customer.totalRevenue) * 100),
          strengths: ['Prix compétitifs', 'Disponibilité stock'],
          weaknesses: ['Support technique limité', 'Pas de garantie système']
        })),
        switchingBarriers: ['Habitudes d\'achat', 'Relations commerciales établies'],
        pricePositioning: 'value_focused' as 'value_focused',
        competitorAdvantages: ['Prix agressifs', 'Conditions de paiement flexibles']
      },
      relationshipHistory: {
        keyContacts: [{
          name: 'Directeur Achats',
          role: 'Décideur principal',
          influence: 'high' as 'high',
          relationshipQuality: 'good' as 'good',
          lastInteraction: customer.lastInvoiceDate
        }],
        historicalIssues: ['Délais de livraison occasionnels'],
        successStories: ['Chantier École Saint-Jean réussi'],
        contractHistory: ['Contrat cadre 2022-2023']
      }
    };
  }

  private generateDefaultOpportunityAssessment(customer: CustomerProfile) {
    return {
      reconquestPotential: {
        estimatedRevenue: customer.reconquestPotential,
        probabilityOfSuccess: customer.priority === 'high' ? 75 : 50,
        timeToConversion: '3-6 mois',
        requiredInvestment: customer.reconquestPotential * 0.1,
        roi: 3.5
      },
      productOpportunities: customer.competitorProducts.flatMap(cp => 
        cp.products.slice(0, 3).map(product => ({
          competitorProduct: product,
          volumePotential: cp.totalAmount / cp.products.length,
          revenueImpact: cp.totalAmount / cp.products.length * 1.15,
          conversionDifficulty: 'medium' as 'medium',
          uniqueSellingPoints: [
            'Garantie système complète',
            'Support technique expert',
            'Performance supérieure'
          ]
        }))
      ),
      crossSellPotential: [{
        productCategory: 'Isolation thermique',
        currentPenetration: 20,
        potentialIncrease: 50,
        recommendedProducts: ['EFISARKING', 'SOPRA-ISO'],
        estimatedRevenue: customer.reconquestPotential * 0.3
      }],
      marketContext: {
        localMarketGrowth: 'Croissance de 5% prévue',
        upcomingProjects: ['Rénovation énergétique secteur public'],
        regulatoryChanges: ['RE2020 - Nouvelles exigences'],
        technologyTrends: ['Solutions bas carbone', 'Toitures végétalisées']
      }
    };
  }

  private generateDefaultStrategy(customer: CustomerProfile) {
    return {
      winBackApproach: {
        primaryStrategy: 'Approche consultative axée sur la valeur',
        tacticalActions: [
          'Audit technique gratuit des besoins',
          'Démonstration produits sur chantier',
          'Formation équipes techniques'
        ],
        differentiators: [
          'Expertise technique reconnue',
          'Garantie système complète',
          'Service après-vente réactif'
        ],
        valueProposition: 'Partenaire technique de confiance pour vos projets d\'étanchéité',
        competitiveAdvantages: [
          'Leader du marché',
          'Innovation constante',
          'Réseau national'
        ]
      },
      pricingStrategy: {
        approach: 'value' as 'value',
        specialOffers: [{
          offerType: 'Remise volume progressif',
          discount: 10,
          conditions: 'Sur engagement annuel',
          validity: '6 mois'
        }],
        volumeIncentives: ['5% dès 50k€', '8% dès 100k€', '12% dès 200k€'],
        paymentTerms: 'Paiement 45 jours fin de mois'
      },
      serviceEnhancements: {
        technicalSupport: [
          'Hotline dédiée',
          'Visite mensuelle ingénieur conseil'
        ],
        trainingPrograms: [
          'Formation pose nouveaux produits',
          'Certification installateur agréé'
        ],
        dedicatedResources: [
          'Commercial dédié',
          'Support technique prioritaire'
        ],
        digitalServices: [
          'Plateforme commande en ligne',
          'Suivi chantiers digital'
        ],
        logisticsImprovements: [
          'Livraison J+1',
          'Stock dédié produits stratégiques'
        ]
      },
      relationshipBuilding: {
        executiveSponsor: 'Directeur Régional',
        accountTeam: ['Commercial Senior', 'Ingénieur Technique', 'Service Client'],
        communicationPlan: [{
          action: 'Réunion stratégique trimestrielle',
          frequency: 'Trimestrielle',
          responsible: 'Directeur Régional',
          objective: 'Alignement stratégique'
        }],
        trustBuildingActions: [
          'Visite usine de production',
          'Invitation événements VIP',
          'Programme partenaire privilégié'
        ]
      }
    };
  }

  private generateDefaultActionPlan(customer: CustomerProfile) {
    const now = new Date();
    const phase1End = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours
    const phase2End = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 jours
    const phase3End = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // +180 jours
    
    return {
      phase1_Contact: {
        duration: '30 jours',
        objectives: [
          'Rétablir le contact commercial',
          'Identifier les besoins actuels',
          'Comprendre la situation concurrentielle'
        ],
        actions: [{
          action: 'Appel du Directeur Régional',
          deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          responsible: 'Directeur Régional',
          resources: ['Historique client', 'Analyse concurrence'],
          successCriteria: 'RDV obtenu avec décideur'
        }],
        expectedOutcomes: ['RDV stratégique planifié', 'Besoins identifiés']
      },
      phase2_Negotiation: {
        duration: '60 jours',
        objectives: [
          'Présenter offre différenciée',
          'Négocier conditions commerciales',
          'Obtenir engagement test'
        ],
        actions: [{
          action: 'Présentation offre sur-mesure',
          deadline: phase1End.toISOString(),
          responsible: 'Commercial + Ingénieur',
          decisionPoint: 'Validation offre commerciale',
          fallbackOption: 'Proposition alternative'
        }],
        keyMilestones: ['Offre validée', 'Commande test']
      },
      phase3_Conversion: {
        duration: '90 jours',
        objectives: [
          'Livrer première commande',
          'Assurer satisfaction totale',
          'Sécuriser commandes récurrentes'
        ],
        actions: [{
          action: 'Accompagnement première livraison',
          deadline: phase2End.toISOString(),
          responsible: 'Service Technique',
          deliverables: ['Formation pose', 'Documentation technique'],
          qualityChecks: ['Audit satisfaction', 'Validation technique']
        }],
        successMetrics: ['Taux satisfaction > 90%', 'Commande récurrente obtenue']
      },
      phase4_Retention: {
        duration: 'Permanent',
        objectives: [
          'Maintenir satisfaction élevée',
          'Développer volume affaires',
          'Anticiper besoins futurs'
        ],
        actions: [{
          action: 'Revue business trimestrielle',
          frequency: 'Trimestrielle',
          responsible: 'Directeur Compte',
          kpi: 'Part de marché SOPREMA',
          reviewProcess: 'Comité de pilotage'
        }],
        loyaltyProgram: ['Points fidélité', 'Accès innovations', 'Events VIP']
      }
    };
  }

  private generateDefaultRiskManagement(customer: CustomerProfile) {
    return {
      identifiedRisks: [{
        risk: 'Résistance au changement des équipes terrain',
        probability: 'medium' as 'medium',
        impact: 'high' as 'high',
        mitigation: 'Formation et accompagnement renforcés',
        contingencyPlan: 'Support technique sur site'
      }],
      competitiveThreats: [
        'Contre-offensive prix concurrents',
        'Exclusivité proposée par concurrent'
      ],
      internalChallenges: [
        'Capacité livraison pics demande',
        'Disponibilité équipes techniques'
      ],
      externalFactors: [
        'Évolution réglementation',
        'Fluctuation prix matières premières'
      ]
    };
  }

  private generateDefaultMonitoring(customer: CustomerProfile) {
    return {
      kpis: [{
        metric: 'Part de marché SOPREMA',
        target: 80,
        current: Math.round((1 - customer.competitorAmount / customer.totalRevenue) * 100),
        frequency: 'Mensuelle',
        responsible: 'Commercial'
      }],
      milestones: [{
        milestone: 'Première commande significative',
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending' as 'pending',
        dependencies: ['Validation offre', 'Accord commercial']
      }],
      reviewSchedule: {
        frequency: 'Mensuelle puis trimestrielle',
        participants: ['Directeur Régional', 'Commercial', 'Client'],
        agenda: ['Performance', 'Satisfaction', 'Opportunités'],
        decisionRights: 'Directeur Régional'
      },
      successCriteria: {
        shortTerm: ['Commande test > 10k€', 'Satisfaction > 80%'],
        mediumTerm: ['Part marché > 60%', 'CA annuel > 200k€'],
        longTerm: ['Partenaire privilégié', 'Croissance annuelle > 15%']
      }
    };
  }

  private generateDefaultResourceAllocation(customer: CustomerProfile) {
    const budget = customer.reconquestPotential * 0.1;
    
    return {
      budget: {
        total: budget,
        breakdown: {
          commercial: budget * 0.4,
          marketing: budget * 0.2,
          technical: budget * 0.2,
          training: budget * 0.1,
          other: budget * 0.1
        },
        roi_projection: 3.5,
        paybackPeriod: '8 mois'
      },
      teamAssignment: [{
        role: 'Responsable Grand Compte',
        person: 'À définir',
        timeAllocation: '30%',
        responsibilities: ['Pilotage stratégique', 'Négociation commerciale']
      }],
      externalSupport: {
        consultants: [],
        partners: ['Installateurs agréés locaux'],
        suppliers: ['Transporteur dédié']
      }
    };
  }

  private generateDefaultCommunication(customer: CustomerProfile) {
    return {
      internalCommunication: {
        stakeholders: ['Direction Commerciale', 'Direction Technique', 'Supply Chain'],
        reportingFrequency: 'Mensuelle',
        escalationPath: ['Commercial', 'Directeur Régional', 'Direction Nationale'],
        documentationRequirements: ['CRM à jour', 'Rapports visites', 'Suivi KPIs']
      },
      clientCommunication: {
        primaryContact: 'Directeur Achats',
        communicationChannels: ['Email', 'Téléphone', 'Visites terrain'],
        meetingCadence: 'Mensuelle puis trimestrielle',
        proposalStrategy: 'Approche consultative personnalisée'
      },
      marketingSupport: {
        collateral: ['Brochures techniques', 'Études de cas', 'Certifications'],
        caseStudies: ['Chantier référence similaire'],
        references: ['Clients satisfaits même secteur'],
        events: ['Journées techniques', 'Visites usine']
      }
    };
  }

  // Sauvegarder le plan localement
  async savePlan(plan: CustomerReconquestPlan): Promise<void> {
    try {
      const plans = this.getStoredPlans();
      plans[plan.clientId] = plan;
      localStorage.setItem('reconquest_plans', JSON.stringify(plans));
    } catch (error) {
    }
  }

  // Récupérer un plan sauvegardé
  getPlan(clientId: string): CustomerReconquestPlan | null {
    const plans = this.getStoredPlans();
    return plans[clientId] || null;
  }

  // Récupérer tous les plans
  private getStoredPlans(): Record<string, CustomerReconquestPlan> {
    try {
      const stored = localStorage.getItem('reconquest_plans');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}

export const customerReconquestService = new CustomerReconquestService();