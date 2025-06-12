import { describe, it, expect } from 'vitest';
import { reconquestService } from '../services/reconquestService';
import { invoiceLineFilter } from '../../invoice-line-filter.js';

describe('Complete Integration Test - All Features', () => {
  it('should process a complete invoice workflow with all new features', async () => {
    // 1. Facture brute avec mélange de produits, non-produits, et erreurs de classification
    const rawInvoices = [
      {
        invoiceNumber: "FA-2024-001",
        clientName: "ENTREPRISE CONSTRUCTION ABC",
        customerName: "ENTREPRISE CONSTRUCTION ABC",
        totalAmount: 12000,
        products: [
          // Produits Soprema
          { designation: "SOPRALENE FLAM 180-25", totalPrice: 3500, reference: "SOP180" },
          { designation: "ELASTOPHENE FLAM 25", totalPrice: 2000, reference: "ELA25" },
          
          // Produits concurrents
          { designation: "Membrane IKO Premium", totalPrice: 3000, reference: "IKO-001" },
          { designation: "Bitume concurrent XYZ", totalPrice: 1500, reference: "XYZ-B01" },
          
          // Non-produits à filtrer
          { designation: "TRANSPORT EXPRESS", totalPrice: 200 },
          { designation: "Eco-participation DEEE", totalPrice: 50 },
          { designation: "Main d'œuvre installation", totalPrice: 800 },
          { designation: "Frais de port", totalPrice: 100 },
          { designation: "Remise commerciale 5%", totalPrice: -500 },
          
          // Exception - produit qui ressemble à un non-produit
          { designation: "Transport de chaleur isolant SOPRA", totalPrice: 1350, reference: "TCI-001" }
        ]
      },
      {
        invoiceNumber: "FA-2024-002",
        clientName: "SOCIETE TOITURE PRO",
        customerName: "SOCIETE TOITURE PRO",
        totalAmount: 8000,
        products: [
          // Majoritairement Soprema
          { designation: "SOPRALENE 250", totalPrice: 4000, isSoprema: true },
          { designation: "SOPRAFIX HP", totalPrice: 1500, isSoprema: true },
          { designation: "PRIMER SOPRA", totalPrice: 500, isSoprema: true },
          
          // Un peu de concurrent
          { designation: "Accessoire concurrent", totalPrice: 300, isCompetitor: true },
          
          // Non-produits
          { designation: "TVA 20%", totalPrice: 1400 },
          { designation: "Port et emballage", totalPrice: 80 },
          { designation: "Eco-taxe", totalPrice: 20 }
        ]
      },
      {
        invoiceNumber: "FA-2024-003", 
        clientName: "CLIENT FIDELE SOPREMA",
        products: [
          // 100% Soprema
          { designation: "SOPRALENE JARDIN", totalPrice: 5000, type: "soprema" },
          { designation: "AQUADERE", totalPrice: 3000, type: "soprema" },
          { designation: "FLASHING SOPREMA", totalPrice: 2000, type: "soprema" },
          
          // Services
          { designation: "Formation technique sur site", totalPrice: 500 },
          { designation: "Assistance pose", totalPrice: 300 }
        ]
      }
    ];

    // 2. Filtrer les lignes non-produits pour chaque facture
    const cleanedInvoices = rawInvoices.map(invoice => {
      const cleaned = invoiceLineFilter.cleanInvoiceData(invoice);
      
      // Marquer les produits comme Soprema ou concurrent pour la simulation
      // (normalement fait par le matcher Soprema)
      cleaned.products = cleaned.products.map(product => {
        if (product.designation.toLowerCase().includes('sopra') || 
            product.designation.toLowerCase().includes('elastophene')) {
          return { ...product, isSoprema: true, type: 'soprema' };
        } else if (product.designation.toLowerCase().includes('iko') || 
                   product.designation.toLowerCase().includes('concurrent') ||
                   product.designation.toLowerCase().includes('xyz')) {
          return { ...product, isCompetitor: true, type: 'competitor' };
        }
        return product;
      });
      
      return cleaned;
    });

    // 3. Analyser les clients pour les plans de reconquête
    const clientAnalysis = reconquestService.getClientsAnalysisDetails(cleanedInvoices);
    
    // Vérifications
    expect(clientAnalysis).toHaveLength(3);
    
    // ENTREPRISE CONSTRUCTION ABC devrait être en tête (4500€ concurrent après filtrage)
    const abcAnalysis = clientAnalysis[0];
    expect(abcAnalysis.name).toBe("ENTREPRISE CONSTRUCTION ABC");
    expect(abcAnalysis.competitorAmount).toBe(4500); // 3000 + 1500
    expect(abcAnalysis.sopremaAmount).toBe(6850); // 3500 + 2000 + 1350
    expect(abcAnalysis.totalAmount).toBe(11350); // Total des produits uniquement
    
    // SOCIETE TOITURE PRO (300€ concurrent)
    const toitureAnalysis = clientAnalysis[1];
    expect(toitureAnalysis.name).toBe("SOCIETE TOITURE PRO");
    expect(toitureAnalysis.competitorAmount).toBe(300);
    expect(toitureAnalysis.sopremaAmount).toBe(6000);
    
    // CLIENT FIDELE SOPREMA (0€ concurrent)
    const fideleAnalysis = clientAnalysis[2];
    expect(fideleAnalysis.name).toBe("CLIENT FIDELE SOPREMA");
    expect(fideleAnalysis.competitorAmount).toBe(0);
    expect(fideleAnalysis.sopremaAmount).toBe(10000);

    // 4. Vérifier le seuil pour les plans de reconquête
    const threshold = 5000;
    const qualifyingClients = clientAnalysis.filter(c => c.competitorAmount >= threshold);
    expect(qualifyingClients).toHaveLength(0); // Aucun client n'atteint le seuil

    // 5. Données pour le modal d'explication
    const modalData = {
      totalInvoices: cleanedInvoices.length,
      totalClients: clientAnalysis.length,
      clientsAnalyzed: clientAnalysis,
      threshold: threshold
    };

    expect(modalData.totalInvoices).toBe(3);
    expect(modalData.totalClients).toBe(3);
    
    // Vérifier que le modal peut calculer le manque pour chaque client
    modalData.clientsAnalyzed.forEach(client => {
      const gap = threshold - client.competitorAmount;
      expect(gap).toBeGreaterThan(0); // Tous sous le seuil
    });
  });

  it('should demonstrate the complete filtering pipeline statistics', () => {
    const invoice = {
      clientName: "TEST STATISTICS",
      products: [
        // Produits réels
        { designation: "SOPRALENE 180", totalPrice: 2000 },
        { designation: "Membrane IKO", totalPrice: 1500 },
        { designation: "Transport de chaleur isolant", totalPrice: 1000 }, // Exception
        
        // Non-produits
        { designation: "TRANSPORT", totalPrice: 150 },
        { designation: "Main d'œuvre pose", totalPrice: 500 },
        { designation: "Eco-taxe DEEE", totalPrice: 25 },
        { designation: "Remise 10%", totalPrice: -450 },
        { designation: "Frais de dossier", totalPrice: 50 },
        { designation: "Port et emballage", totalPrice: 80 }
      ]
    };

    const result = invoiceLineFilter.filterInvoiceLines(invoice.products);
    
    // Statistiques de filtrage
    expect(result.summary.totalLines).toBe(9);
    expect(result.summary.productCount).toBe(3);
    expect(result.summary.nonProductCount).toBe(6);
    expect(result.summary.totalProductAmount).toBe(4500); // 2000 + 1500 + 1000
    expect(result.summary.totalNonProductAmount).toBe(355); // 150 + 500 + 25 - 450 + 50 + 80
    
    // Catégories de non-produits
    expect(result.summary.categories).toEqual({
      transport: 2,      // TRANSPORT, Port et emballage
      services: 1,       // Main d'œuvre
      taxes: 1,          // Eco-taxe
      discounts: 1,      // Remise
      fees: 1            // Frais de dossier
    });
  });

  it('should handle edge cases gracefully', () => {
    const edgeCases = [
      // Facture vide
      { clientName: "Client vide", products: [] },
      
      // Facture avec seulement des non-produits
      {
        clientName: "Client services only",
        products: [
          { designation: "Installation", totalPrice: 1000 },
          { designation: "Transport", totalPrice: 200 },
          { designation: "Formation", totalPrice: 500 }
        ]
      },
      
      // Facture avec caractères spéciaux
      {
        clientName: "L'entreprise & Co. - Division n°2",
        products: [
          { designation: "Produit avec œ spécial", totalPrice: 1000 },
          { designation: "Main d'œuvre spécialisée", totalPrice: 500 }
        ]
      }
    ];

    edgeCases.forEach(invoice => {
      const cleaned = invoiceLineFilter.cleanInvoiceData(invoice);
      expect(cleaned).toBeDefined();
      expect(cleaned.products).toBeDefined();
      expect(Array.isArray(cleaned.products)).toBe(true);
    });

    // Analyse des clients edge cases
    const analysis = reconquestService.getClientsAnalysisDetails(edgeCases);
    expect(analysis).toHaveLength(3);
    expect(analysis.every(a => a.totalAmount >= 0)).toBe(true);
  });
});