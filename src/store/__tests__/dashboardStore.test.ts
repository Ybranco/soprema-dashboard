import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDashboardStore } from '../dashboardStore'

describe('Dashboard Store', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    const store = useDashboardStore.getState()
    store.clearAllInvoices()
    // Réinitialiser localStorage mock
    vi.clearAllMocks()
  })

  describe('Invoice Management', () => {
    it('should add an invoice correctly', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      const mockInvoice = {
        id: 'test-1',
        number: 'FA-2024-001',
        date: '2024-01-15',
        client: {
          name: 'Test Client',
          address: '123 Test Street',
        },
        distributor: {
          name: 'Test Distributor',
        },
        products: [
          {
            reference: 'PROD-001',
            designation: 'Test Product',
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
            type: 'competitor' as const,
            isCompetitor: true,
            competitor: {
              brand: 'IKO',
              originalProduct: 'IKO Product',
            }
          }
        ],
        amount: 1000,
        potential: 700,
        opportunities: []
      }

      act(() => {
        result.current.addInvoice(mockInvoice)
      })

      expect(result.current.invoices).toHaveLength(1)
      expect(result.current.invoices[0]).toEqual(mockInvoice)
      expect(result.current.getTotalInvoices()).toBe(1)
    })

    it('should remove an invoice', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      // Ajouter deux factures
      act(() => {
        result.current.addInvoice({ 
          id: 'test-1', 
          number: 'FA-001',
          date: '2024-01-01',
          client: { name: 'Client 1', address: '123 rue Test' },
          distributor: { name: 'Dist 1' },
          products: [],
          amount: 1000,
          potential: 700,
          opportunities: []
        })
        result.current.addInvoice({ 
          id: 'test-2', 
          number: 'FA-002',
          date: '2024-01-02',
          client: { name: 'Client 2', address: '456 rue Test' },
          distributor: { name: 'Dist 2' },
          products: [],
          amount: 2000,
          potential: 1400,
          opportunities: []
        })
      })

      expect(result.current.invoices).toHaveLength(2)

      // Supprimer une facture
      act(() => {
        result.current.removeInvoice('test-1')
      })

      expect(result.current.invoices).toHaveLength(1)
      expect(result.current.invoices[0].id).toBe('test-2')
    })

    it('should calculate total potential correctly', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addInvoice({ 
          id: '1',
          number: 'FA-POT-001',
          date: '2024-01-01',
          client: { name: 'Client POT 1', address: '789 rue Test' },
          distributor: { name: 'Dist POT 1' },
          potential: 1000,
          products: [],
          amount: 1500,
          opportunities: []
        })
        result.current.addInvoice({ 
          id: '2',
          number: 'FA-POT-002',
          date: '2024-01-02',
          client: { name: 'Client POT 2', address: '012 rue Test' },
          distributor: { name: 'Dist POT 2' },
          potential: 2000,
          products: [],
          amount: 3000,
          opportunities: []
        })
      })

      expect(result.current.getTotalPotential()).toBe(3000)
    })
  })

  describe('Customer Reconquest', () => {
    it('should get customer reconquest locations', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      const mockInvoice = {
        id: 'test-1',
        number: 'FA-REC-001',
        date: '2024-01-01',
        client: {
          name: 'Test Client',
          address: '75001 Paris',
        },
        distributor: {
          name: 'Test Distributor'
        },
        products: [
          {
            reference: 'COMP-001',
            designation: 'IKO Product',
            quantity: 10,
            unitPrice: 1000,
            totalPrice: 10000,
            type: 'competitor',
            isCompetitor: true,
            competitor: { 
              brand: 'IKO',
              originalProduct: 'IKO Original',
            }
          }
        ],
        amount: 10000,
        potential: 7000,
        opportunities: []
      }

      act(() => {
        result.current.addInvoice(mockInvoice as any)
      })

      const locations = result.current.getCustomerReconquestLocations()
      
      expect(locations).toHaveLength(1)
      expect(locations[0].clientName).toBe('Test Client')
      expect(locations[0].competitorAmount).toBe(10000)
      expect(locations[0].priority).toBe('low') // < 50k€
    })
  })

  describe('Statistics', () => {
    it('should track competitor products', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addInvoice({
          id: '1',
          number: 'FA-BRAND-001',
          date: '2024-01-01',
          client: { name: 'Client Brands', address: '345 rue Marques' },
          distributor: { name: 'Dist Brands' },
          products: [
            { 
              reference: 'IKO-001',
              designation: 'IKO Product',
              quantity: 5,
              unitPrice: 200,
              totalPrice: 1000,
              type: 'competitor', 
              isCompetitor: true,
              competitor: { 
                brand: 'IKO',
                originalProduct: 'IKO Original',
                }
            },
            { 
              reference: 'KNAUF-001',
              designation: 'KNAUF Product',
              quantity: 10,
              unitPrice: 200,
              totalPrice: 2000,
              type: 'competitor',
              isCompetitor: true,
              competitor: { 
                brand: 'KNAUF',
                originalProduct: 'KNAUF Original',
                }
            },
            { 
              reference: 'SOP-001',
              designation: 'SOPREMA Product',
              quantity: 15,
              unitPrice: 200,
              totalPrice: 3000,
              type: 'soprema',
              isCompetitor: false
            }
          ],
          amount: 6000,
          potential: 2100,
          opportunities: []
        })
      })

      // Vérifier que les produits concurrents sont bien comptés
      const competitorCount = result.current.invoices[0].products.filter(p => p.isCompetitor).length
      expect(competitorCount).toBe(2)
      
      // Vérifier les marques
      const brands = result.current.invoices[0].products
        .filter(p => p.isCompetitor)
        .map(p => p.competitor?.brand)
      expect(brands).toContain('IKO')
      expect(brands).toContain('KNAUF')
    })

    it('should persist data to localStorage', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.addInvoice({ 
          id: 'persist-test',
          number: 'FA-PERSIST-001',
          date: '2024-01-01',
          client: { name: 'Client Persist', address: '678 rue Storage' },
          distributor: { name: 'Dist Persist' },
          products: [],
          amount: 5000,
          potential: 3500,
          opportunities: []
        })
      })

      // Vérifier que localStorage a été appelé
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })
})