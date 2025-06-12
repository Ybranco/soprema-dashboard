import { describe, it, expect } from 'vitest';
import { reconquestService } from '../services/reconquestService';

describe('ReconquestService - getClientsAnalysisDetails', () => {
  it('should correctly analyze client invoice data', () => {
    const testInvoices = [
      {
        clientName: "ENTREPRISE ABC",
        products: [
          { designation: "ELASTOPHENE FLAM 25", totalPrice: 2500, isSoprema: true },
          { designation: "Membrane IKO", totalPrice: 1800, isCompetitor: true },
          { designation: "TRANSPORT", totalPrice: 150, isCompetitor: false, isSoprema: false }
        ]
      },
      {
        clientName: "ENTREPRISE ABC", 
        products: [
          { designation: "SOPRALENE 250", totalPrice: 3200, type: "soprema" },
          { designation: "Produit concurrent", totalPrice: 800, type: "competitor" }
        ]
      },
      {
        clientName: "SOCIETE XYZ",
        products: [
          { designation: "Membrane concurrent", totalPrice: 4500, isCompetitor: true },
          { designation: "SOPRAFIX", totalPrice: 500, isSoprema: true }
        ]
      }
    ];

    const clientDetails = reconquestService.getClientsAnalysisDetails(testInvoices);

    // Vérifier le nombre de clients
    expect(clientDetails).toHaveLength(2);

    // Vérifier les données pour SOCIETE XYZ (devrait être en premier car plus de produits concurrents)
    const xyzClient = clientDetails[0];
    expect(xyzClient.name).toBe("SOCIETE XYZ");
    expect(xyzClient.invoiceCount).toBe(1);
    expect(xyzClient.totalAmount).toBe(5000);
    expect(xyzClient.sopremaAmount).toBe(500);
    expect(xyzClient.competitorAmount).toBe(4500);

    // Vérifier les données pour ENTREPRISE ABC
    const abcClient = clientDetails[1];
    expect(abcClient.name).toBe("ENTREPRISE ABC");
    expect(abcClient.invoiceCount).toBe(2);
    expect(abcClient.totalAmount).toBe(8450);
    expect(abcClient.sopremaAmount).toBe(5700);
    expect(abcClient.competitorAmount).toBe(2600);
  });

  it('should handle invoices without products', () => {
    const testInvoices = [
      {
        clientName: "CLIENT SANS PRODUITS",
        products: []
      },
      {
        customerName: "CLIENT AVEC AUTRE NOM",
        // pas de produits
      }
    ];

    const clientDetails = reconquestService.getClientsAnalysisDetails(testInvoices);

    expect(clientDetails).toHaveLength(2);
    expect(clientDetails[0].totalAmount).toBe(0);
    expect(clientDetails[0].competitorAmount).toBe(0);
    expect(clientDetails[0].sopremaAmount).toBe(0);
  });

  it('should handle missing client names', () => {
    const testInvoices = [
      {
        products: [
          { designation: "Produit", totalPrice: 100, isCompetitor: true }
        ]
      }
    ];

    const clientDetails = reconquestService.getClientsAnalysisDetails(testInvoices);

    expect(clientDetails).toHaveLength(1);
    expect(clientDetails[0].name).toBe("Client inconnu");
  });

  it('should sort clients by competitor amount descending', () => {
    const testInvoices = [
      {
        clientName: "CLIENT A",
        products: [
          { designation: "Produit", totalPrice: 1000, isCompetitor: true }
        ]
      },
      {
        clientName: "CLIENT B",
        products: [
          { designation: "Produit", totalPrice: 3000, isCompetitor: true }
        ]
      },
      {
        clientName: "CLIENT C",
        products: [
          { designation: "Produit", totalPrice: 2000, isCompetitor: true }
        ]
      }
    ];

    const clientDetails = reconquestService.getClientsAnalysisDetails(testInvoices);

    expect(clientDetails[0].name).toBe("CLIENT B");
    expect(clientDetails[1].name).toBe("CLIENT C");
    expect(clientDetails[2].name).toBe("CLIENT A");
  });
});