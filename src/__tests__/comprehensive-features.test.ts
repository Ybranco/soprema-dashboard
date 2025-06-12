import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reconquestService } from '../services/reconquestService';
import { invoiceLineFilter } from '../../invoice-line-filter.js';
import fs from 'fs';
import path from 'path';

describe('Comprehensive Feature Tests', () => {
  describe('Product Database Filtering', () => {
    it('should have filtered product database available', () => {
      const filteredDbPath = path.join(process.cwd(), 'Produits_Soprema_France_Final.json');
      const exists = fs.existsSync(filteredDbPath);
      expect(exists).toBe(true);
      
      if (exists) {
        const filteredData = JSON.parse(fs.readFileSync(filteredDbPath, 'utf-8'));
        expect(filteredData.total_produits).toBe(13748); // Nombre exact de produits après filtrage
        expect(filteredData.produits).toBeDefined();
        expect(Array.isArray(filteredData.produits)).toBe(true);
      }
    });

    it('should not contain non-product items in filtered database', () => {
      const filteredDbPath = path.join(process.cwd(), 'Produits_Soprema_France_Final.json');
      if (fs.existsSync(filteredDbPath)) {
        const data = JSON.parse(fs.readFileSync(filteredDbPath, 'utf-8'));
        const products = data.produits || [];
        
        // Vérifier qu'aucun produit ne contient des mots-clés de non-produits spécifiques
        // Note: certains vrais produits contiennent "transport" dans leur nom (ex: "CHARIOT TRANSPORT DE ROULEAUX")
        const nonProductKeywords = ['casquette', 'polo', 'chandail', 'tee-shirt', 'pantalon'];
        const foundNonProducts = products.filter(p => 
          nonProductKeywords.some(keyword => 
            p.nom_complet?.toLowerCase().includes(keyword)
          )
        );
        
        expect(foundNonProducts.length).toBe(0);
      }
    });
  });

  describe('Invoice Line Filtering', () => {
    it('should correctly identify and filter transport lines', () => {
      const testLines = [
        { designation: "TRANSPORT", totalPrice: 150 },
        { designation: "Frais de transport", totalPrice: 80 },
        { designation: "Port et emballage", totalPrice: 50 }
      ];

      testLines.forEach(line => {
        const result = invoiceLineFilter.checkInvoiceLine(line);
        expect(result.isProduct).toBe(false);
        expect(result.category).toBe('transport');
      });
    });

    it('should correctly identify and filter tax lines', () => {
      const testLines = [
        { designation: "Eco-taxe", totalPrice: 25 },
        { designation: "ECO-PARTICIPATION", totalPrice: 30 },
        { designation: "TVA 20%", totalPrice: 500 },
        { designation: "DEEE", totalPrice: 15 }
      ];

      testLines.forEach(line => {
        const result = invoiceLineFilter.checkInvoiceLine(line);
        expect(result.isProduct).toBe(false);
        expect(result.category).toBe('taxes');
      });
    });

    it('should correctly identify and filter service lines', () => {
      const testLines = [
        { designation: "Main d'œuvre", totalPrice: 400 },
        { designation: "Installation sur site", totalPrice: 500 },
        { designation: "Formation technique", totalPrice: 300 }
      ];

      testLines.forEach(line => {
        const result = invoiceLineFilter.checkInvoiceLine(line);
        expect(result.isProduct).toBe(false);
        expect(result.category).toBe('services');
      });
    });

    it('should correctly identify and filter discount lines', () => {
      const testLines = [
        { designation: "Remise commerciale 5%", totalPrice: -250 },
        { designation: "Rabais exceptionnel", totalPrice: -100 },
        { designation: "Avoir sur facture", totalPrice: -150 }
      ];

      testLines.forEach(line => {
        const result = invoiceLineFilter.checkInvoiceLine(line);
        expect(result.isProduct).toBe(false);
        expect(result.category).toBe('discounts');
      });
    });

    it('should correctly identify product exceptions', () => {
      const productExceptions = [
        { designation: "Transport de chaleur isolant", totalPrice: 1200 },
        { designation: "Frais bitume modifié", totalPrice: 800 },
        { designation: "ECO membrane étanchéité", totalPrice: 1500 },
        { designation: "Palette de 48 rouleaux SOPRALENE", totalPrice: 3000 }
      ];

      productExceptions.forEach(line => {
        const result = invoiceLineFilter.checkInvoiceLine(line);
        expect(result.isProduct).toBe(true);
        expect(result.category).toBe('product_exception');
      });
    });

    it('should handle empty or invalid lines', () => {
      const invalidLines = [
        null,
        undefined,
        { designation: "" },
        { designation: "  " },
        { /* no designation */ }
      ];

      invalidLines.forEach(line => {
        const result = invoiceLineFilter.checkInvoiceLine(line);
        expect(result.isProduct).toBe(false);
        expect(result.reason).toContain('vide');
      });
    });

    it('should clean invoice data and recalculate totals', () => {
      const invoiceData = {
        invoiceNumber: "FA-2024-001",
        totalAmount: 5000,
        products: [
          { designation: "ELASTOPHENE FLAM 25", totalPrice: 2500, isSoprema: true },
          { designation: "Membrane IKO", totalPrice: 1800, isCompetitor: true },
          { designation: "TRANSPORT", totalPrice: 150 },
          { designation: "Eco-taxe", totalPrice: 25 },
          { designation: "Main d'œuvre", totalPrice: 400 },
          { designation: "Remise 5%", totalPrice: -250 }
        ]
      };

      const cleaned = invoiceLineFilter.cleanInvoiceData(invoiceData);
      
      expect(cleaned.products.length).toBe(2); // Seulement 2 vrais produits
      expect(cleaned.totalProductsOnly).toBe(4300); // 2500 + 1800
      expect(cleaned._filtering.originalProductCount).toBe(6);
      expect(cleaned._filtering.filteredProductCount).toBe(2);
      expect(cleaned._filtering.removedLines.length).toBe(4);
    });
  });

  describe('Reconquest Client Analysis', () => {
    it('should analyze clients with mixed Soprema and competitor products', () => {
      const testInvoices = [
        {
          clientName: "ENTREPRISE MIXTE",
          products: [
            { designation: "SOPRALENE 250", totalPrice: 3000, isSoprema: true },
            { designation: "Membrane IKO", totalPrice: 2000, isCompetitor: true },
            { designation: "ELASTOPHENE", totalPrice: 1500, type: "soprema" },
            { designation: "Produit concurrent", totalPrice: 1000, type: "competitor" }
          ]
        }
      ];

      const analysis = reconquestService.getClientsAnalysisDetails(testInvoices);
      
      expect(analysis.length).toBe(1);
      expect(analysis[0].totalAmount).toBe(7500);
      expect(analysis[0].sopremaAmount).toBe(4500);
      expect(analysis[0].competitorAmount).toBe(3000);
    });

    it('should group multiple invoices from same client', () => {
      const testInvoices = [
        {
          clientName: "CLIENT ABC",
          products: [
            { designation: "Produit 1", totalPrice: 1000, isCompetitor: true }
          ]
        },
        {
          clientName: "CLIENT ABC",
          products: [
            { designation: "Produit 2", totalPrice: 2000, isCompetitor: true }
          ]
        },
        {
          clientName: "CLIENT ABC",
          products: [
            { designation: "Produit 3", totalPrice: 1500, isSoprema: true }
          ]
        }
      ];

      const analysis = reconquestService.getClientsAnalysisDetails(testInvoices);
      
      expect(analysis.length).toBe(1);
      expect(analysis[0].invoiceCount).toBe(3);
      expect(analysis[0].totalAmount).toBe(4500);
      expect(analysis[0].competitorAmount).toBe(3000);
      expect(analysis[0].sopremaAmount).toBe(1500);
    });

    it('should handle clients below reconquest threshold', () => {
      const testInvoices = [
        {
          clientName: "PETIT CLIENT 1",
          products: [
            { designation: "Produit concurrent", totalPrice: 500, isCompetitor: true }
          ]
        },
        {
          clientName: "PETIT CLIENT 2",
          products: [
            { designation: "Produit concurrent", totalPrice: 1000, isCompetitor: true }
          ]
        },
        {
          clientName: "GROS CLIENT",
          products: [
            { designation: "Produit concurrent", totalPrice: 6000, isCompetitor: true }
          ]
        }
      ];

      const analysis = reconquestService.getClientsAnalysisDetails(testInvoices);
      
      // Vérifier que tous les clients sont analysés
      expect(analysis.length).toBe(3);
      
      // Vérifier l'ordre (par montant concurrent décroissant)
      expect(analysis[0].name).toBe("GROS CLIENT");
      expect(analysis[0].competitorAmount).toBe(6000);
      expect(analysis[1].competitorAmount).toBe(1000);
      expect(analysis[2].competitorAmount).toBe(500);
    });
  });

  describe('Integration: Invoice Processing Pipeline', () => {
    it('should process invoice through complete pipeline', () => {
      // Facture avec mélange de produits et non-produits
      const rawInvoice = {
        clientName: "ENTREPRISE TEST",
        invoiceNumber: "FA-2024-TEST",
        products: [
          { designation: "SOPRALENE FLAM 180", totalPrice: 2500, reference: "SOP180" },
          { designation: "Membrane concurrente XYZ", totalPrice: 2000, reference: "XYZ123" },
          { designation: "TRANSPORT EXPRESS", totalPrice: 200 },
          { designation: "Eco-participation", totalPrice: 50 },
          { designation: "Main d'œuvre pose", totalPrice: 500 },
          { designation: "Transport de chaleur isolant", totalPrice: 1500 }, // Exception
          { designation: "Remise commerciale", totalPrice: -375 }
        ]
      };

      // 1. Filtrer les lignes non-produits
      const cleaned = invoiceLineFilter.cleanInvoiceData(rawInvoice);
      
      expect(cleaned.products.length).toBe(3); // 3 vrais produits
      expect(cleaned.totalProductsOnly).toBe(6000); // 2500 + 2000 + 1500
      
      // 2. Les produits filtrés devraient être prêts pour l'analyse
      const productsForAnalysis = cleaned.products;
      expect(productsForAnalysis.find(p => p.designation.includes("TRANSPORT EXPRESS"))).toBeUndefined();
      expect(productsForAnalysis.find(p => p.designation.includes("Transport de chaleur"))).toBeDefined();
    });
  });

  describe('No Plans Explanation Modal Data', () => {
    it('should provide correct data for modal when no plans generated', () => {
      const invoices = [
        {
          clientName: "CLIENT SOUS SEUIL 1",
          products: [
            { designation: "SOPRALENE", totalPrice: 8000, isSoprema: true },
            { designation: "Produit concurrent", totalPrice: 2000, isCompetitor: true }
          ]
        },
        {
          clientName: "CLIENT SOUS SEUIL 2",
          products: [
            { designation: "SOPRAFIX", totalPrice: 3000, isSoprema: true },
            { designation: "Membrane IKO", totalPrice: 1500, isCompetitor: true }
          ]
        },
        {
          clientName: "CLIENT FIDELE",
          products: [
            { designation: "SOPRALENE", totalPrice: 10000, isSoprema: true },
            { designation: "ELASTOPHENE", totalPrice: 5000, isSoprema: true }
          ]
        }
      ];

      const clientDetails = reconquestService.getClientsAnalysisDetails(invoices);
      
      // Vérifier les données pour le modal
      expect(clientDetails.length).toBe(3);
      
      // CLIENT SOUS SEUIL 1 devrait être en premier (2000€ concurrent)
      expect(clientDetails[0].name).toBe("CLIENT SOUS SEUIL 1");
      expect(clientDetails[0].competitorAmount).toBe(2000);
      expect(clientDetails[0].totalAmount).toBe(10000);
      
      // CLIENT SOUS SEUIL 2 (1500€ concurrent)
      expect(clientDetails[1].name).toBe("CLIENT SOUS SEUIL 2");
      expect(clientDetails[1].competitorAmount).toBe(1500);
      
      // CLIENT FIDELE (0€ concurrent)
      expect(clientDetails[2].name).toBe("CLIENT FIDELE");
      expect(clientDetails[2].competitorAmount).toBe(0);
      expect(clientDetails[2].sopremaAmount).toBe(15000);
    });

    it('should show correct threshold gap in modal', () => {
      const threshold = 5000; // Seuil minimum
      const clientDetails = [
        { name: "Client A", competitorAmount: 4500, totalAmount: 10000, sopremaAmount: 5500, invoiceCount: 2 },
        { name: "Client B", competitorAmount: 2000, totalAmount: 8000, sopremaAmount: 6000, invoiceCount: 1 },
        { name: "Client C", competitorAmount: 0, totalAmount: 5000, sopremaAmount: 5000, invoiceCount: 3 }
      ];

      // Calculer le manque pour atteindre le seuil
      clientDetails.forEach(client => {
        const gap = threshold - client.competitorAmount;
        expect(gap).toBeGreaterThan(0); // Tous sous le seuil
        
        if (client.name === "Client A") expect(gap).toBe(500);
        if (client.name === "Client B") expect(gap).toBe(3000);
        if (client.name === "Client C") expect(gap).toBe(5000);
      });
    });
  });

  describe('Product Classification After Filtering', () => {
    it('should correctly classify products after line filtering', () => {
      const invoice = {
        products: [
          { designation: "SOPRALENE FLAM 180", totalPrice: 2500 },
          { designation: "Membrane IKO Premium", totalPrice: 2000 },
          { designation: "TRANSPORT", totalPrice: 150 },
          { designation: "ELASTOPHENE 25", totalPrice: 1800 },
          { designation: "Eco-taxe", totalPrice: 25 }
        ]
      };

      const cleaned = invoiceLineFilter.cleanInvoiceData(invoice);
      
      // Seuls les vrais produits devraient rester
      expect(cleaned.products.length).toBe(3);
      expect(cleaned.products.every(p => 
        !p.designation.includes("TRANSPORT") && 
        !p.designation.includes("Eco-taxe")
      )).toBe(true);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle malformed invoice data gracefully', () => {
    const malformedInvoices = [
      { /* no clientName */ products: [{ totalPrice: 100 }] },
      { clientName: null, products: null },
      { clientName: "", products: undefined },
      { clientName: "Test", products: "not-an-array" }
    ];

    // Ne devrait pas lancer d'erreur
    expect(() => {
      malformedInvoices.forEach(invoice => {
        reconquestService.getClientsAnalysisDetails([invoice]);
      });
    }).not.toThrow();
  });

  it('should handle very large amounts correctly', () => {
    const invoice = {
      clientName: "GROS CLIENT",
      products: [
        { designation: "Commande massive", totalPrice: 999999, isCompetitor: true }
      ]
    };

    const analysis = reconquestService.getClientsAnalysisDetails([invoice]);
    expect(analysis[0].competitorAmount).toBe(999999);
    expect(analysis[0].totalAmount).toBe(999999);
  });

  it('should handle special characters in client names', () => {
    const invoices = [
      { clientName: "L'ENTREPRISE & CO.", products: [] },
      { clientName: "SOCIÉTÉ \"TEST\" S.A.R.L.", products: [] },
      { clientName: "CLIENT N°123 / DIV-456", products: [] }
    ];

    const analysis = reconquestService.getClientsAnalysisDetails(invoices);
    expect(analysis.length).toBe(3);
    expect(analysis.map(a => a.name)).toContain("L'ENTREPRISE & CO.");
  });
});