import { Invoice, Product } from '../types/invoice';

// Fonctions utilitaires pour la France
const generateFrenchPostalCode = (city: string): string => {
  const cityPostalCodes: Record<string, string> = {
    'Strasbourg': '67000',
    'Lyon': '69000',
    'Marseille': '13000',
    'Toulouse': '31000',
    'Nantes': '44000',
    'Bordeaux': '33000',
    'Lille': '59000',
    'Mulhouse': '68100',
    'Nice': '06000',
    'Rennes': '35000'
  };
  return cityPostalCodes[city] || '75000';
};

const getFrenchCityCoordinates = (city: string): { lat: number; lng: number } => {
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'Strasbourg': { lat: 48.5734, lng: 7.7521 },
    'Lyon': { lat: 45.7640, lng: 4.8357 },
    'Marseille': { lat: 43.2965, lng: 5.3698 },
    'Toulouse': { lat: 43.6047, lng: 1.4442 },
    'Nantes': { lat: 47.2184, lng: -1.5536 },
    'Bordeaux': { lat: 44.8378, lng: -0.5792 },
    'Lille': { lat: 50.6292, lng: 3.0573 },
    'Mulhouse': { lat: 47.7508, lng: 7.3359 },
    'Nice': { lat: 43.7102, lng: 7.2620 },
    'Rennes': { lat: 48.1173, lng: -1.6778 }
  };
  return cityCoords[city] || { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
};

// Générateur de données de démonstration
export const generateDemoInvoices = (): Invoice[] => {
  const clients = [
    { name: 'Art Actif SAS', city: 'Strasbourg', region: 'Grand Est' },
    { name: 'Toitures Modernes SARL', city: 'Lyon', region: 'Auvergne-Rhône-Alpes' },
    { name: 'Bâtiment Pro 2000', city: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur' },
    { name: 'Construction Excellence SAS', city: 'Toulouse', region: 'Occitanie' },
    { name: 'U-Therm Isolation', city: 'Nantes', region: 'Pays de la Loire' },
    { name: 'Étanchéité Plus', city: 'Bordeaux', region: 'Nouvelle-Aquitaine' },
    { name: 'Couverture Moderne', city: 'Lille', region: 'Hauts-de-France' },
    { name: 'Bâtisseurs Alsaciens', city: 'Mulhouse', region: 'Grand Est' },
    { name: 'Toitures du Sud', city: 'Nice', region: 'Provence-Alpes-Côte d\'Azur' },
    { name: 'Isolation Expert', city: 'Rennes', region: 'Bretagne' }
  ];

  const sopremaProducts: Partial<Product>[] = [
    { designation: 'SOPRALENE FLAM 180', unitPrice: 85.50, type: 'soprema', isSoprema: true },
    { designation: 'SOPRASEAL STICK 1100T', unitPrice: 125.00, type: 'soprema', isSoprema: true },
    { designation: 'ELASTOPHENE FLAM 25', unitPrice: 88.00, type: 'soprema', isSoprema: true },
    { designation: 'ALSAN FLASHING', unitPrice: 125.00, type: 'soprema', isSoprema: true },
    { designation: 'SOPRASTAR FLAM', unitPrice: 95.75, type: 'soprema', isSoprema: true },
    { designation: 'COLPHENE 1500', unitPrice: 92.25, type: 'soprema', isSoprema: true },
    { designation: 'SOPRAFIX BASE', unitPrice: 75.50, type: 'soprema', isSoprema: true },
    { designation: 'SOPRALAST 50 TV ALU', unitPrice: 110.50, type: 'soprema', isSoprema: true },
    { designation: 'SOPRASOLIN', unitPrice: 55.25, type: 'soprema', isSoprema: true },
    { designation: 'PAVATEX ISOLANT', unitPrice: 45.00, type: 'soprema', isSoprema: true }
  ];

  const competitorProducts: Partial<Product>[] = [
    { designation: 'IKO ARMOURBASE STICK', unitPrice: 78.50, type: 'competitor', isCompetitor: true, brand: 'IKO' },
    { designation: 'FIRESTONE RUBBERGARD EPDM', unitPrice: 95.00, type: 'competitor', isCompetitor: true, brand: 'FIRESTONE' },
    { designation: 'TREMCO POWERply BASE', unitPrice: 82.00, type: 'competitor', isCompetitor: true, brand: 'TREMCO' },
    { designation: 'GAF LIBERTY BASE', unitPrice: 88.75, type: 'competitor', isCompetitor: true, brand: 'GAF' },
    { designation: 'ROCKWOOL HARDROCK', unitPrice: 38.50, type: 'competitor', isCompetitor: true, brand: 'ROCKWOOL' },
    { designation: 'SIPLAST PARAFOR', unitPrice: 91.20, type: 'competitor', isCompetitor: true, brand: 'SIPLAST' },
    { designation: 'AXTER HYRENE 25', unitPrice: 86.40, type: 'competitor', isCompetitor: true, brand: 'AXTER' },
    { designation: 'DERBIGUM SP4', unitPrice: 79.90, type: 'competitor', isCompetitor: true, brand: 'DERBIGUM' }
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
        address: `${Math.floor(Math.random() * 999) + 1} ${['rue', 'avenue', 'boulevard'][Math.floor(Math.random() * 3)]} ${['de la République', 'Victor Hugo', 'Jean Jaurès', 'du Général de Gaulle'][Math.floor(Math.random() * 4)]}`,
        city: client.city,
        postalCode: generateFrenchPostalCode(client.city),
        region: client.region,
        location: getFrenchCityCoordinates(client.city)
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