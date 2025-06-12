// Script pour analyser les factures et comprendre pourquoi pas de plans de reconquête

// Simuler l'analyse des données si on pouvait accéder au store
console.log(`
=== ANALYSE DES PLANS DE RECONQUÊTE ===

Pour qu'un plan de reconquête soit généré, il faut :

1. SOIT au moins 5000€ de produits concurrents chez un client
2. SOIT au moins 2 factures pour le même client

Points à vérifier :

1. Les produits sont-ils bien identifiés comme concurrents ?
   - Vérifier que isCompetitor = true ou type = 'competitor'
   - Vérifier que les produits ont bien une marque concurrente

2. Les noms de clients sont-ils exactement identiques ?
   - "Client ABC" et "CLIENT ABC" sont considérés différents
   - Les espaces en trop comptent aussi

3. Les montants sont-ils corrects ?
   - Vérifier que totalPrice est bien calculé pour chaque produit

Pour voir les données, ouvrez l'application et :
- Regardez la liste des factures
- Cliquez sur quelques clients pour voir leurs détails
- Vérifiez les produits et leurs types

Ou dans la console du navigateur (F12), tapez :
useDashboardStore.getState().invoices

Cela affichera toutes les factures avec leurs détails.
`);

// Analyser le fichier de test pour exemple
const fs = require('fs');
const testData = JSON.parse(fs.readFileSync('./test-invoices.json', 'utf8'));

console.log('\n=== EXEMPLE AVEC DONNÉES DE TEST ===\n');

// Grouper par client
const clientsMap = new Map();

testData.forEach(invoice => {
  const clientName = invoice.client.name;
  if (!clientsMap.has(clientName)) {
    clientsMap.set(clientName, {
      invoices: [],
      totalCompetitor: 0,
      competitorProducts: []
    });
  }
  
  const client = clientsMap.get(clientName);
  client.invoices.push(invoice);
  
  invoice.products.forEach(product => {
    if (product.isCompetitor || product.type === 'competitor') {
      client.totalCompetitor += product.totalPrice;
      client.competitorProducts.push({
        name: product.designation,
        brand: product.brand,
        amount: product.totalPrice
      });
    }
  });
});

console.log('Analyse des clients de test:\n');
clientsMap.forEach((data, clientName) => {
  console.log(`Client: ${clientName}`);
  console.log(`  - Nombre de factures: ${data.invoices.length}`);
  console.log(`  - Total produits concurrents: ${data.totalCompetitor}€`);
  
  const shouldHavePlan = data.totalCompetitor >= 5000 || data.invoices.length >= 2;
  console.log(`  - Devrait avoir un plan de reconquête: ${shouldHavePlan ? 'OUI' : 'NON'}`);
  
  if (shouldHavePlan) {
    console.log(`    Raison: ${data.totalCompetitor >= 5000 ? 'Plus de 5000€ de produits concurrents' : 'Au moins 2 factures'}`);
  }
  
  if (data.competitorProducts.length > 0) {
    console.log('  - Produits concurrents:');
    data.competitorProducts.forEach(p => {
      console.log(`    • ${p.name} (${p.brand}): ${p.amount}€`);
    });
  }
  console.log('');
});

console.log(`
Pour vos vraies factures, vérifiez dans l'application :
1. Les produits sont-ils marqués comme concurrents ?
2. Les noms des clients sont-ils exactement identiques entre factures ?
3. Y a-t-il des clients avec 2+ factures ou 5000€+ de produits concurrents ?
`);