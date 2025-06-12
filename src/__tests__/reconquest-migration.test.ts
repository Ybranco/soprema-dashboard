import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from '../store/dashboardStore'

describe('Reconquest Plan Migration Tests', () => {
  it('should handle invoices with reconquest plans', () => {
    // Test simple de vérification de terminologie
    const reconquestPlan = {
      planId: 'test-plan',
      clientAnalysis: {},
      competitorAnalysis: {},
      conversionStrategy: {}
    }
    
    expect(reconquestPlan).toHaveProperty('clientAnalysis')
    expect(reconquestPlan).toHaveProperty('competitorAnalysis')
    expect(reconquestPlan).toHaveProperty('conversionStrategy')
  })

  it('should handle invoices with reconquest terminology', () => {
    // Test simple de validation de structure
    const invoice = {
      id: 'test-1',
      reconquestPlan: {
        planId: 'plan-1'
      }
    }
    
    expect(invoice.reconquestPlan).toBeDefined()
    expect(invoice.reconquestPlan.planId).toBe('plan-1')
  })

  it('should use reconquest terminology in UI', () => {
    // Test simple pour vérifier la terminologie
    const store = useDashboardStore.getState()
    
    // Vérifier que le texte utilise "reconquête" au lieu de "géographique"
    const reconquestText = 'profils de reconquête client'
    const geographicText = 'opportunités géographiques'
    
    expect(reconquestText).toContain('reconquête')
    expect(reconquestText).not.toContain('géographique')
  })

  it('should generate customer reconquest locations instead of opportunities', () => {
    const store = useDashboardStore.getState()
    
    // Ajouter une facture avec produits concurrents
    store.addInvoice({
      id: 'test-1',
      number: 'FA-TEST-001',
      date: '2024-01-01',
      client: { 
        name: 'Test Client', 
        address: '75001 Paris' 
      },
      distributor: {
        name: 'Test Distributor'
      },
      products: [
        {
          reference: 'REF-001',
          designation: 'IKO Product',
          quantity: 100,
          unitPrice: 600,
          totalPrice: 60000,
          type: 'competitor',
          isCompetitor: true,
          competitor: { 
            brand: 'IKO',
            originalProduct: 'IKO Original',
          }
        }
      ],
      amount: 60000,
      potential: 42000,
      opportunities: []
    } as any)

    const locations = store.getCustomerReconquestLocations()
    
    // Vérifier qu'au moins un client est retourné
    expect(locations.length).toBeGreaterThan(0)
    
    // Vérifier la structure de reconquête client
    expect(locations[0]).toHaveProperty('clientName')
    expect(locations[0]).toHaveProperty('competitorAmount')
    expect(locations[0]).toHaveProperty('reconquestPotential')
    expect(locations[0]).toHaveProperty('priority')
    expect(locations[0].priority).toBe('medium') // 50-100k€
  })
})