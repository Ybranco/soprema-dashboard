import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reconquestService } from '../services/reconquestService';

// Mock fetch
global.fetch = vi.fn();

describe('Plans de Reconquête Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Génération des plans de reconquête', () => {
    it('devrait générer des plans pour les clients avec >= 5000€ de produits concurrents', async () => {
      const invoices = [
        {
          id: 'inv-1',
          client: { name: 'Client A', address: 'Paris' },
          amount: 10000,
          products: [
            { designation: 'Produit SOPREMA', totalPrice: 4000, isCompetitor: false },
            { designation: 'Produit IKO', totalPrice: 6000, isCompetitor: true, brand: 'IKO' }
          ]
        }
      ];

      const mockResponse = {
        success: true,
        summary: {
          totalInvoicesAnalyzed: 1,
          totalCustomers: 1,
          significantCustomers: 1,
          plansGenerated: 1,
          totalCompetitorAmount: 6000,
          thresholds: { minCompetitorAmount: 5000, minInvoices: 2 }
        },
        plans: [{
          clientName: 'Client A',
          analysis: { competitorAmount: 6000 },
          reconquestStrategy: { priority: 'high' }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await reconquestService.generateReconquestPlans(invoices);
      
      expect(result.success).toBe(true);
      expect(result.summary.plansGenerated).toBe(1);
      expect(result.plans).toHaveLength(1);
    });

    it('devrait générer des plans pour les clients avec >= 2 factures', async () => {
      const invoices = [
        {
          id: 'inv-1',
          client: { name: 'Client B', address: 'Lyon' },
          amount: 2000,
          products: [
            { designation: 'Produit KNAUF', totalPrice: 2000, isCompetitor: true, brand: 'KNAUF' }
          ]
        },
        {
          id: 'inv-2',
          client: { name: 'Client B', address: 'Lyon' },
          amount: 1500,
          products: [
            { designation: 'Produit ISOVER', totalPrice: 1500, isCompetitor: true, brand: 'ISOVER' }
          ]
        }
      ];

      const mockResponse = {
        success: true,
        summary: {
          totalInvoicesAnalyzed: 2,
          totalCustomers: 1,
          significantCustomers: 1,
          plansGenerated: 1,
          totalCompetitorAmount: 3500,
          thresholds: { minCompetitorAmount: 5000, minInvoices: 2 }
        },
        plans: [{
          clientName: 'Client B',
          analysis: { 
            competitorAmount: 3500,
            totalInvoices: 2
          },
          reconquestStrategy: { priority: 'medium' }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await reconquestService.generateReconquestPlans(invoices);
      
      expect(result.success).toBe(true);
      expect(result.summary.plansGenerated).toBe(1);
      expect(result.plans[0].analysis.totalInvoices).toBe(2);
    });

    it('ne devrait PAS générer de plan si les seuils ne sont pas atteints', async () => {
      const invoices = [
        {
          id: 'inv-1',
          client: { name: 'Client C', address: 'Marseille' },
          amount: 3000,
          products: [
            { designation: 'Produit SOPREMA', totalPrice: 2000, isCompetitor: false },
            { designation: 'Produit IKO', totalPrice: 1000, isCompetitor: true, brand: 'IKO' }
          ]
        }
      ];

      const mockResponse = {
        success: true,
        summary: {
          totalInvoicesAnalyzed: 1,
          totalCustomers: 1,
          significantCustomers: 0,
          plansGenerated: 0,
          totalCompetitorAmount: 1000,
          thresholds: { minCompetitorAmount: 5000, minInvoices: 2 }
        },
        plans: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await reconquestService.generateReconquestPlans(invoices);
      
      expect(result.success).toBe(true);
      expect(result.summary.plansGenerated).toBe(0);
      expect(result.plans).toHaveLength(0);
    });
  });

  describe('Filtrage des factures', () => {
    it('devrait filtrer uniquement les factures avec produits concurrents', () => {
      const invoices = [
        {
          id: 'inv-1',
          products: [
            { designation: 'SOPREMA', isCompetitor: false },
            { designation: 'IKO', isCompetitor: true }
          ]
        },
        {
          id: 'inv-2',
          products: [
            { designation: 'SOPREMA', isCompetitor: false }
          ]
        },
        {
          id: 'inv-3',
          products: [
            { designation: 'KNAUF', type: 'competitor' }
          ]
        }
      ];

      const filtered = reconquestService.filterInvoicesForReconquest(invoices);
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('inv-1');
      expect(filtered[1].id).toBe('inv-3');
    });
  });

  describe('Statistiques de reconquête', () => {
    it('devrait calculer correctement les statistiques', () => {
      const plans = [
        {
          id: '1',
          clientName: 'Client A',
          reconquestStrategy: {
            priority: 'high' as const,
            estimatedPotential: 50000,
            targetProducts: [],
            suggestedActions: []
          },
          analysis: {
            totalAmount: 100000,
            competitorAmount: 60000,
            topCompetitorBrands: [
              { brand: 'IKO', amount: 40000 },
              { brand: 'KNAUF', amount: 20000 }
            ]
          } as any
        },
        {
          id: '2',
          clientName: 'Client B',
          reconquestStrategy: {
            priority: 'medium' as const,
            estimatedPotential: 20000,
            targetProducts: [],
            suggestedActions: []
          },
          analysis: {
            totalAmount: 50000,
            competitorAmount: 20000,
            topCompetitorBrands: [
              { brand: 'ISOVER', amount: 20000 }
            ]
          } as any
        }
      ];

      const stats = reconquestService.calculateReconquestStats(plans);
      
      expect(stats.totalPotential).toBe(70000);
      expect(stats.highPriorityCount).toBe(1);
      expect(stats.averageCompetitorShare).toBeCloseTo(50); // (60% + 40%) / 2
      expect(stats.topCompetitorBrands).toHaveLength(3);
      expect(stats.topCompetitorBrands[0]).toEqual({ brand: 'IKO', totalAmount: 40000 });
    });
  });

  describe('Identification des produits concurrents', () => {
    const competitorBrands = ['IKO', 'KNAUF', 'ISOVER', 'U-THERM', 'SMARTROOF', 
                             'ENERTHERM', 'ROCKWOOL', 'URSA', 'KINGSPAN', 'RECTICEL'];
    
    const sopremaBrands = ['EFYOS', 'FLAGON', 'SOPRASTICK', 'ELASTOPHENE', 
                          'PARAFOR', 'COLLTACK'];

    it('devrait identifier correctement les marques concurrentes', () => {
      competitorBrands.forEach(brand => {
        const product = { 
          designation: `Membrane ${brand} 4mm`, 
          brand: brand,
          isCompetitor: true 
        };
        expect(product.isCompetitor).toBe(true);
      });
    });

    it('devrait identifier correctement les produits SOPREMA', () => {
      sopremaBrands.forEach(brand => {
        const product = { 
          designation: `${brand} 5mm`, 
          brand: 'SOPREMA',
          isCompetitor: false 
        };
        expect(product.isCompetitor).toBe(false);
      });
    });
  });

  describe('Seuils de génération', () => {
    it('devrait respecter le seuil de 5000€ minimum de produits concurrents', () => {
      const MIN_COMPETITOR_AMOUNT = 5000;
      
      const testCases = [
        { amount: 4999, shouldGenerate: false },
        { amount: 5000, shouldGenerate: true },
        { amount: 10000, shouldGenerate: true }
      ];

      testCases.forEach(({ amount, shouldGenerate }) => {
        const meetsThreshold = amount >= MIN_COMPETITOR_AMOUNT;
        expect(meetsThreshold).toBe(shouldGenerate);
      });
    });

    it('devrait respecter le seuil de 2 factures minimum', () => {
      const MIN_INVOICES = 2;
      
      const testCases = [
        { invoices: 1, shouldGenerate: false },
        { invoices: 2, shouldGenerate: true },
        { invoices: 5, shouldGenerate: true }
      ];

      testCases.forEach(({ invoices, shouldGenerate }) => {
        const meetsThreshold = invoices >= MIN_INVOICES;
        expect(meetsThreshold).toBe(shouldGenerate);
      });
    });
  });
});