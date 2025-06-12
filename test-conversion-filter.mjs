// Test script to verify conversion error filtering
import { useDashboardStore } from './src/store/dashboardStore.ts';

// Mock invoice with conversion error product
const mockInvoiceWithError = {
  id: 'test-invoice-1',
  number: 'INV-2025-001',
  date: '2025-01-16',
  client: {
    name: 'TEST CLIENT',
    address: '123 Test Street, Paris',
    postalCode: '75001'
  },
  distributor: {
    name: 'TEST DISTRIBUTOR'
  },
  amount: 15000,
  potential: 10000,
  region: 'Île-de-France',
  products: [
    {
      designation: 'Document PDF - conversion alternative',
      reference: 'ERROR-001',
      quantity: 1,
      unitPrice: 12289.54,
      totalPrice: 12289.54,
      type: 'competitor',
      isCompetitor: true,
      competitor: {
        brand: 'CONVERSION ERROR'
      }
    },
    {
      designation: 'IKO ARMOURBASE',
      reference: 'IKO-001',
      quantity: 10,
      unitPrice: 50,
      totalPrice: 500,
      type: 'competitor',
      isCompetitor: true,
      competitor: {
        brand: 'IKO'
      }
    }
  ]
};

console.log('🧪 Testing conversion error filtering...\n');

// Test 1: Check if products are filtered in addInvoice
console.log('Test 1: Adding invoice with conversion error product');
const store = useDashboardStore.getState();

// Clear any existing data
store.clearAllInvoices();

// Add the test invoice
store.addInvoice(mockInvoiceWithError);

// Get the added invoice
const invoices = store.getFilteredInvoices();
console.log(`✓ Invoices added: ${invoices.length}`);

if (invoices.length > 0) {
  const addedInvoice = invoices[0];
  console.log(`✓ Original products: ${mockInvoiceWithError.products.length}`);
  console.log(`✓ Filtered products: ${addedInvoice.products.length}`);
  
  const hasConversionError = addedInvoice.products.some(p => 
    p.designation && p.designation.toLowerCase().includes('conversion alternative')
  );
  
  console.log(`✓ Conversion error removed: ${!hasConversionError ? 'YES' : 'NO'}`);
}

// Test 2: Check customer reconquest locations
console.log('\nTest 2: Customer reconquest locations');
const locations = store.getCustomerReconquestLocations();
console.log(`✓ Reconquest locations: ${locations.length}`);

if (locations.length > 0) {
  const location = locations[0];
  console.log(`✓ Client: ${location.clientName}`);
  console.log(`✓ Competitor amount: ${location.competitorAmount}€`);
  console.log(`✓ Should be 500€ (only IKO product), not 12,789.54€`);
}

// Test 3: Check competitor products
console.log('\nTest 3: Competitor products extraction');
const competitorProducts = store.competitorProducts;
console.log(`✓ Competitor brands found: ${competitorProducts.length}`);
competitorProducts.forEach(product => {
  console.log(`  - ${product.name}: ${product.amount}€`);
});

const hasErrorBrand = competitorProducts.some(p => 
  p.name.toLowerCase().includes('conversion') || 
  p.name.toLowerCase().includes('error')
);
console.log(`✓ Conversion error brand excluded: ${!hasErrorBrand ? 'YES' : 'NO'}`);

console.log('\n✅ Test completed!');