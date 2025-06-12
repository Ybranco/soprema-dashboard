// Service pour gérer les opportunités de conversion
export interface ReconquestPlan {
  id: string;
  clientName: string;
  clientInfo: {
    name: string;
    address?: string;
    siret?: string;
  };
  analysis: {
    totalInvoices: number;
    totalAmount: number;
    sopremaAmount: number;
    competitorAmount: number;
    sopremaShare: string;
    topCompetitorBrands: Array<{ brand: string; amount: number }>;
    lastPurchaseDate: number;
    purchaseFrequency: number | null;
  };
  reconquestStrategy: {
    priority: 'high' | 'medium' | 'low';
    targetProducts: string[];
    estimatedPotential: number;
    suggestedActions: Array<{
      type: string;
      description: string;
      timing: string;
      expectedImpact?: 'high' | 'medium' | 'low';
    }>;
    keySellingPoints?: string[];
    competitorWeaknesses?: string[];
    conversionProbability?: number;
  };
  createdAt: string;
}

export interface ReconquestSummary {
  totalInvoicesAnalyzed: number;
  totalCustomers: number;
  significantCustomers: number;
  plansGenerated: number;
  totalCompetitorAmount: number;
  thresholds: {
    minCompetitorAmount: number;
    minInvoices: number;
  };
}

class ReconquestService {
  private serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  // Identifier les opportunités de conversion
  async generateReconquestPlans(invoices: any[]): Promise<{
    success: boolean;
    summary: ReconquestSummary;
    plans: ReconquestPlan[];
  }> {
    try {
      // Transformer les factures en données clients pour l'API
      const customersMap = new Map<string, any>();
      
      invoices.forEach(invoice => {
        // Extraire le nom du client en s'assurant que c'est une chaîne
        let clientKey = '';
        if (typeof invoice.client === 'string') {
          clientKey = invoice.client;
        } else if (invoice.client && typeof invoice.client.name === 'string') {
          clientKey = invoice.client.name;
        } else if (typeof invoice.clientName === 'string') {
          clientKey = invoice.clientName;
        } else {
          console.log('⚠️ Client non reconnu, structure:', {
            client: invoice.client,
            clientType: typeof invoice.client,
            clientName: invoice.clientName,
            invoice: invoice
          });
          clientKey = 'Client inconnu';
        }
        
        if (!customersMap.has(clientKey)) {
          customersMap.set(clientKey, {
            clientId: `client-${clientKey.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            clientName: clientKey,
            totalRevenue: 0,
            competitorAmount: 0,
            sopremaAmount: 0,
            invoiceCount: 0,
            invoices: [],
            competitorProducts: [],
            sopremaProducts: [],
            lastInvoiceDate: invoice.date || new Date().toISOString(),
            priority: 'medium'
          });
        }
        
        const customer = customersMap.get(clientKey);
        customer.invoiceCount++;
        customer.invoices.push({
          number: invoice.number,
          date: invoice.date,
          amount: invoice.amount || 0
        });
        
        // Calculer les montants par type de produit
        if (invoice.products && Array.isArray(invoice.products)) {
          invoice.products.forEach((product: any) => {
            const amount = product.totalPrice || 0;
            customer.totalRevenue += amount;
            
            if (product.type === 'competitor' || product.isCompetitor) {
              customer.competitorAmount += amount;
              customer.competitorProducts.push({
                designation: product.designation,
                amount: amount,
                brand: product.supplierBrand || 'Concurrent'
              });
            } else if (product.type === 'soprema' || product.isSoprema) {
              customer.sopremaAmount += amount;
              customer.sopremaProducts.push({
                designation: product.designation,
                amount: amount
              });
            }
          });
        }
        
        // Mettre à jour la priorité basée sur le montant concurrent
        if (customer.competitorAmount > 50000) {
          customer.priority = 'high';
        } else if (customer.competitorAmount > 20000) {
          customer.priority = 'medium';
        } else {
          customer.priority = 'low';
        }
      });
      
      const customers = Array.from(customersMap.values());
      console.log(`📊 Envoi de ${invoices.length} factures au serveur pour génération des plans`);
      
      const response = await fetch(`${this.serverUrl}/api/customer-reconquest-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoices })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la génération des plans');
      }

      const result = await response.json();
      
      // Ajouter des IDs uniques aux plans si nécessaire
      result.plans = result.plans.map((plan: any, index: number) => ({
        ...plan,
        id: plan.id || `reconquest-${Date.now()}-${index}`
      }));

      return result;
      
    } catch (error) {
      throw new Error(`Impossible de générer les plans de reconquête: ${error.message}`);
    }
  }

  // Filtrer les factures pour l'analyse de reconquête
  filterInvoicesForReconquest(invoices: any[]): any[] {
    console.log('🔍 filterInvoicesForReconquest - Analyse de', invoices.length, 'factures');
    
    const relevantInvoices = invoices.filter(invoice => {
      if (!invoice.products || !Array.isArray(invoice.products)) {
        console.log('⚠️ Facture sans produits:', invoice.number);
        return false;
      }
      
      // Log les formats de produits pour debug
      const competitorProducts = invoice.products.filter((product: any) => {
        const isCompetitor = product.type === 'competitor' || 
                           product.isCompetitor === true ||
                           product.isCompetitor === 'true';
        
        if (isCompetitor) {
          console.log('✅ Produit concurrent trouvé:', {
            designation: product.designation,
            type: product.type,
            isCompetitor: product.isCompetitor,
            totalPrice: product.totalPrice
          });
        }
        
        return isCompetitor;
      });
      
      const hasCompetitors = competitorProducts.length > 0;
      
      if (hasCompetitors) {
        console.log(`✅ Facture ${invoice.number} a ${competitorProducts.length} produits concurrents`);
      } else {
        console.log(`❌ Facture ${invoice.number} - aucun concurrent (${invoice.products.length} produits total)`);
        // Log le premier produit pour debug
        if (invoice.products.length > 0) {
          console.log('   Premier produit:', {
            designation: invoice.products[0].designation,
            type: invoice.products[0].type,
            isCompetitor: invoice.products[0].isCompetitor
          });
        }
      }
      
      return hasCompetitors;
    });
    
    console.log(`📊 Résultat: ${relevantInvoices.length} factures avec concurrents sur ${invoices.length} total`);
    return relevantInvoices;
  }

  // Calculer les statistiques de reconquête
  calculateReconquestStats(plans: ReconquestPlan[]): {
    totalPotential: number;
    highPriorityCount: number;
    averageCompetitorShare: number;
    topCompetitorBrands: Array<{ brand: string; totalAmount: number }>;
  } {
    if (plans.length === 0) {
      return {
        totalPotential: 0,
        highPriorityCount: 0,
        averageCompetitorShare: 0,
        topCompetitorBrands: []
      };
    }

    const totalPotential = plans.reduce((sum, plan) => {
      // Support des deux structures possibles
      const potential = plan.reconquestStrategy?.estimatedPotential || 
                       plan.potentialValue || 
                       0;
      return sum + potential;
    }, 0);

    const highPriorityCount = plans.filter(plan => {
      // Support des deux structures possibles
      const priority = plan.reconquestStrategy?.priority || 
                      plan.priority || 
                      'medium';
      return priority === 'high';
    }).length;

    const totalCompetitorShare = plans.reduce((sum, plan) => {
      // Support des deux structures possibles
      const totalAmount = plan.analysis?.totalAmount || 
                         plan.clientData?.totalRevenue || 
                         1;
      const competitorAmount = plan.analysis?.competitorAmount || 
                              plan.clientData?.competitorAmount || 
                              0;
      return sum + (competitorAmount / totalAmount * 100);
    }, 0);

    const averageCompetitorShare = totalCompetitorShare / plans.length;

    // Agréger toutes les marques concurrentes
    const brandTotals = new Map<string, number>();
    plans.forEach(plan => {
      // Support des deux structures possibles
      const brands = plan.analysis?.topCompetitorBrands || 
                    plan.clientData?.competitorProducts || 
                    [];
      
      if (Array.isArray(brands)) {
        brands.forEach(item => {
          const brand = item.brand || item.supplierBrand || 'Concurrent';
          const amount = item.amount || item.totalAmount || 0;
          const current = brandTotals.get(brand) || 0;
          brandTotals.set(brand, current + amount);
        });
      }
    });

    const topCompetitorBrands = Array.from(brandTotals.entries())
      .map(([brand, totalAmount]) => ({ brand, totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return {
      totalPotential,
      highPriorityCount,
      averageCompetitorShare,
      topCompetitorBrands
    };
  }

  // Regrouper les plans par priorité
  groupPlansByPriority(plans: ReconquestPlan[]): {
    high: ReconquestPlan[];
    medium: ReconquestPlan[];
    low: ReconquestPlan[];
  } {
    return {
      high: plans.filter(p => {
        const priority = p.reconquestStrategy?.priority || p.priority || 'medium';
        return priority === 'high';
      }),
      medium: plans.filter(p => {
        const priority = p.reconquestStrategy?.priority || p.priority || 'medium';
        return priority === 'medium';
      }),
      low: plans.filter(p => {
        const priority = p.reconquestStrategy?.priority || p.priority || 'medium';
        return priority === 'low';
      })
    };
  }

  // Obtenir les prochaines actions à effectuer
  getUpcomingActions(plans: ReconquestPlan[]): Array<{
    clientName: string;
    action: string;
    timing: string;
    priority: string;
  }> {
    const actions: any[] = [];

    plans.forEach(plan => {
      // Support des deux structures possibles
      const planActions = plan.reconquestStrategy?.suggestedActions || 
                         plan.actions || 
                         [];
      const priority = plan.reconquestStrategy?.priority || 
                      plan.priority || 
                      'medium';
      const clientName = plan.clientName || plan.clientData?.clientName || 'Client';
      
      if (Array.isArray(planActions)) {
        planActions.forEach(action => {
          actions.push({
            clientName: clientName,
            action: action.description || action.action || '',
            timing: action.timing || action.deadline || 'À définir',
            priority: priority
          });
        });
      }
    });

    // Trier par priorité et timing
    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }).slice(0, 10); // Top 10 actions
  }

  // Obtenir les détails d'analyse par client
  getClientsAnalysisDetails(invoices: any[]): Array<{
    name: string;
    totalAmount: number;
    competitorAmount: number;
    sopremaAmount: number;
    invoiceCount: number;
  }> {
    // Grouper les factures par client
    const clientMap = new Map<string, {
      name: string;
      totalAmount: number;
      competitorAmount: number;
      sopremaAmount: number;
      invoiceCount: number;
    }>();

    console.log('🔍 getClientsAnalysisDetails - Analyse de', invoices.length, 'factures');
    
    invoices.forEach(invoice => {
      // Correction: utiliser invoice.client.name au lieu de invoice.clientName
      const clientKey = invoice.client?.name || invoice.clientName || invoice.customerName || 'Client inconnu';
      
      if (!clientMap.has(clientKey)) {
        clientMap.set(clientKey, {
          name: clientKey,
          totalAmount: 0,
          competitorAmount: 0,
          sopremaAmount: 0,
          invoiceCount: 0
        });
      }

      const client = clientMap.get(clientKey)!;
      client.invoiceCount++;

      // Calculer les montants par type de produit
      if (invoice.products && Array.isArray(invoice.products)) {
        invoice.products.forEach((product: any) => {
          const amount = product.totalPrice || 0;
          client.totalAmount += amount;

          // Utiliser la même logique de détection que filterInvoicesForReconquest
          const isCompetitor = product.type === 'competitor' || 
                             product.isCompetitor === true ||
                             product.isCompetitor === 'true';
          
          const isSoprema = product.type === 'soprema' || 
                          product.isSoprema === true ||
                          product.isSoprema === 'true';

          if (isSoprema) {
            client.sopremaAmount += amount;
          } else if (isCompetitor) {
            client.competitorAmount += amount;
            console.log(`💰 Client ${clientKey} - Concurrent: ${product.designation} = ${amount}€`);
          }
        });
      }
    });
    
    const results = Array.from(clientMap.values())
      .sort((a, b) => b.competitorAmount - a.competitorAmount);
    
    console.log('📊 Résultats getClientsAnalysisDetails:');
    results.forEach(client => {
      if (client.competitorAmount > 0) {
        console.log(`   ${client.name}: ${client.competitorAmount}€ concurrent sur ${client.totalAmount}€ total`);
      }
    });
    
    return results;
  }
}

export const reconquestService = new ReconquestService();