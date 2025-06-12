import { Invoice, Product } from '../types/invoice';

// Générateur de données de démonstration
export const generateDemoInvoices = (): Invoice[] => {
  const clients = [
    { name: 'Construction Dubois Inc.', city: 'Montréal', region: 'QC' },
    { name: 'Toitures Modernes Ltée', city: 'Québec', region: 'QC' },
    { name: 'Bâtiments Pro 2000', city: 'Laval', region: 'QC' },
    { name: 'Rénovations Expert Plus', city: 'Sherbrooke', region: 'QC' },
    { name: 'Construction Nouvelle Ère', city: 'Gatineau', region: 'QC' },
    { name: 'Toitures Excellence Inc.', city: 'Trois-Rivières', region: 'QC' },
    { name: 'Bâtisseurs Modernes', city: 'Longueuil', region: 'QC' },
    { name: 'Construction Alpha', city: 'Drummondville', region: 'QC' }
  ];

  const sopremaProducts: Partial<Product>[] = [
    { designation: 'SOPRALENE FLAM 180', unitPrice: 85.50, type: 'soprema', isSoprema: true },
    { designation: 'SOPRASEAL STICK 1100T', unitPrice: 125.00, type: 'soprema', isSoprema: true },
    { designation: 'ELASTOPHENE FLAM', unitPrice: 95.75, type: 'soprema', isSoprema: true },
    { designation: 'SOPRAFIX STICK', unitPrice: 110.25, type: 'soprema', isSoprema: true },
    { designation: 'COLVENT PERFORÉ', unitPrice: 45.50, type: 'soprema', isSoprema: true },
    { designation: 'SOPRAMASTIC ALU', unitPrice: 65.00, type: 'soprema', isSoprema: true }
  ];

  const competitorProducts: Partial<Product>[] = [
    { designation: 'IKO MODIFLEX MP-180', unitPrice: 78.00, type: 'competitor', isCompetitor: true, brand: 'IKO' },
    { designation: 'TREMCO ROOFING GRANULES', unitPrice: 55.50, type: 'competitor', isCompetitor: true, brand: 'TREMCO' },
    { designation: 'FIRESTONE RUBBERGARD', unitPrice: 92.00, type: 'competitor', isCompetitor: true, brand: 'FIRESTONE' },
    { designation: 'GAF RUBEROID TORCH', unitPrice: 82.50, type: 'competitor', isCompetitor: true, brand: 'GAF' },
    { designation: 'CARLISLE SURE-SEAL', unitPrice: 88.75, type: 'competitor', isCompetitor: true, brand: 'CARLISLE' },
    { designation: 'JOHNS MANVILLE EPDM', unitPrice: 95.00, type: 'competitor', isCompetitor: true, brand: 'JOHNS MANVILLE' }
  ];

  const invoices: Invoice[] = [];
  const currentDate = new Date();

  // Générer 50 factures sur les 3 derniers mois
  for (let i = 0; i < 50; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const daysAgo = Math.floor(Math.random() * 90);
    const invoiceDate = new Date(currentDate);
    invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
    
    // Décider du mix de produits
    const hasCompetitor = Math.random() > 0.4; // 60% ont des produits concurrents
    const productCount = Math.floor(Math.random() * 5) + 3; // 3 à 7 produits
    
    const products: Product[] = [];
    let productId = 1;
    
    // Ajouter des produits Soprema
    const sopremaCount = hasCompetitor ? Math.floor(productCount * 0.4) : productCount;
    for (let j = 0; j < sopremaCount; j++) {
      const product = { ...sopremaProducts[Math.floor(Math.random() * sopremaProducts.length)] };
      const quantity = Math.floor(Math.random() * 20) + 5;
      products.push({
        id: productId++,
        description: product.designation!,
        designation: product.designation!,
        quantity,
        unitPrice: product.unitPrice!,
        totalPrice: quantity * product.unitPrice!,
        type: 'soprema',
        isSoprema: true,
        isCompetitor: false,
        brand: 'SOPREMA'
      });
    }
    
    // Ajouter des produits concurrents si applicable
    if (hasCompetitor) {
      const competitorCount = productCount - sopremaCount;
      for (let j = 0; j < competitorCount; j++) {
        const product = { ...competitorProducts[Math.floor(Math.random() * competitorProducts.length)] };
        const quantity = Math.floor(Math.random() * 15) + 3;
        products.push({
          id: productId++,
          description: product.designation!,
          designation: product.designation!,
          quantity,
          unitPrice: product.unitPrice!,
          totalPrice: quantity * product.unitPrice!,
          type: 'competitor',
          isSoprema: false,
          isCompetitor: true,
          brand: product.brand!
        });
      }
    }
    
    const totalAmount = products.reduce((sum, p) => sum + p.totalPrice, 0);
    
    invoices.push({
      id: `DEMO-${String(i + 1).padStart(3, '0')}`,
      number: `FA-2024-${String(1000 + i).padStart(4, '0')}`,
      date: invoiceDate.toISOString().split('T')[0],
      uploadDate: new Date().toISOString(),
      client: {
        name: client.name,
        address: `${Math.floor(Math.random() * 999) + 1} rue Principale`,
        city: client.city,
        postalCode: `H${Math.floor(Math.random() * 9)}K ${Math.floor(Math.random() * 9)}L${Math.floor(Math.random() * 9)}`,
        region: client.region,
        location: {
          lat: 45.5 + (Math.random() - 0.5) * 2,
          lng: -73.6 + (Math.random() - 0.5) * 2
        }
      },
      products,
      subtotal: totalAmount,
      taxes: totalAmount * 0.14975,
      amount: totalAmount * 1.14975,
      competitorAmount: products
        .filter(p => p.isCompetitor)
        .reduce((sum, p) => sum + p.totalPrice, 0),
      status: 'validated',
      metadata: {
        isDemo: true,
        hasCompetitorProducts: hasCompetitor,
        sopremaSalesRatio: products.filter(p => p.isSoprema).length / products.length
      }
    });
  }
  
  return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};