import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers les factures de Julien
const invoicesPath = '/Users/yvesbranconier/Downloads/01_Analyse_Factures/Projet_Principal/Exemples_Factures/Factures_Julien_Sterms';

// Lister toutes les factures
console.log('📂 Analyse des factures de Julien Sterms...\n');

const files = fs.readdirSync(invoicesPath);
const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));

console.log(`📄 ${imageFiles.length} factures trouvées :`);
imageFiles.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`);
});

// Créer une structure de données basée sur les noms de fichiers
const demoInvoices = [
  {
    id: 'JS-001',
    number: '61000840',
    filename: 'COMMANDE FOURNIS. 61000840.jpg',
    client: 'Art Actif SAS',
    city: 'Strasbourg',
    region: 'Grand Est',
    products: [
      { name: 'ELASTOPHENE FLAM 25', quantity: 20, unitPrice: 85.50, brand: 'SOPREMA' },
      { name: 'ALSAN FLASHING', quantity: 15, unitPrice: 125.00, brand: 'SOPREMA' },
      { name: 'SOPRASTAR FLAM', quantity: 10, unitPrice: 95.75, brand: 'SOPREMA' }
    ]
  },
  {
    id: 'JS-002', 
    number: 'VD24NOU-10642',
    filename: 'Devis ventes VD24NOU-10642.jpg',
    client: 'Toitures Modernes SARL',
    city: 'Lyon',
    region: 'Auvergne-Rhône-Alpes',
    products: [
      { name: 'SOPRALENE FLAM 180', quantity: 30, unitPrice: 88.00, brand: 'SOPREMA' },
      { name: 'IKO ARMOURBASE STICK', quantity: 25, unitPrice: 78.50, brand: 'IKO' },
      { name: 'COLPHENE 1500', quantity: 15, unitPrice: 92.25, brand: 'SOPREMA' }
    ]
  },
  {
    id: 'JS-003',
    number: '9037287-8292',
    filename: 'Devis-9037287-8292.jpg',
    client: 'Bâtiment Pro 2000',
    city: 'Marseille', 
    region: 'Provence-Alpes-Côte d\'Azur',
    products: [
      { name: 'SOPRASEAL STICK 1100T', quantity: 40, unitPrice: 130.00, brand: 'SOPREMA' },
      { name: 'FIRESTONE RUBBERGARD EPDM', quantity: 20, unitPrice: 95.00, brand: 'FIRESTONE' },
      { name: 'SOPRAFIX BASE', quantity: 25, unitPrice: 75.50, brand: 'SOPREMA' }
    ]
  },
  {
    id: 'JS-004',
    number: '2053497895',
    filename: 'Facture Proforma N° 2053497895.jpg',
    client: 'Construction Excellence SAS',
    city: 'Toulouse',
    region: 'Occitanie',
    products: [
      { name: 'ELASTOPHENE FLAM', quantity: 35, unitPrice: 96.00, brand: 'SOPREMA' },
      { name: 'TREMCO POWERply BASE', quantity: 30, unitPrice: 82.00, brand: 'TREMCO' },
      { name: 'SOPRALAST 50 TV ALU', quantity: 20, unitPrice: 110.50, brand: 'SOPREMA' },
      { name: 'GAF LIBERTY BASE', quantity: 15, unitPrice: 88.75, brand: 'GAF' }
    ]
  },
  {
    id: 'JS-005',
    number: 'UTH-2024-001',
    filename: 'devis u-therm.jpg',
    client: 'U-Therm Isolation',
    city: 'Nantes',
    region: 'Pays de la Loire',
    products: [
      { name: 'PAVATEX ISOLANT', quantity: 50, unitPrice: 45.00, brand: 'SOPREMA' },
      { name: 'ROCKWOOL HARDROCK', quantity: 40, unitPrice: 38.50, brand: 'ROCKWOOL' },
      { name: 'SOPRASOLIN', quantity: 30, unitPrice: 55.25, brand: 'SOPREMA' }
    ]
  }
];

// Sauvegarder pour utilisation dans l'app
const outputPath = path.join(__dirname, 'src/data/julienInvoices.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(demoInvoices, null, 2));

console.log('\n✅ Données préparées pour la démo !');
console.log(`📁 Sauvegardé dans: ${outputPath}`);

// Statistiques
const totalInvoices = demoInvoices.length;
const totalProducts = demoInvoices.reduce((sum, inv) => sum + inv.products.length, 0);
const competitorProducts = demoInvoices.reduce((sum, inv) => 
  sum + inv.products.filter(p => p.brand !== 'SOPREMA').length, 0);

console.log('\n📊 Statistiques:');
console.log(`   - ${totalInvoices} factures`);
console.log(`   - ${totalProducts} produits au total`);
console.log(`   - ${competitorProducts} produits concurrents`);
console.log(`   - ${((competitorProducts / totalProducts) * 100).toFixed(1)}% de produits concurrents`);