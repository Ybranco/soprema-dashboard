#!/usr/bin/env node

/**
 * Analyser toutes les factures du localStorage pour comprendre le problème de reconquête
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 ANALYSE DES FACTURES DANS LE STORE');
console.log('===================================');

// Fonction pour analyser les factures comme le fait le vrai système
function analyzeInvoicesForReconquest(invoices) {
  console.log(`\n📊 Analyse de ${invoices.length} factures pour reconquête:`);
  
  const clientsMap = new Map();
  let totalInvoicesWithCompetitors = 0;
  
  invoices.forEach((invoice, index) => {
    console.log(`\n📄 Facture ${index + 1}: ${invoice.number || invoice.id}`);
    console.log(`   Client: ${invoice.client?.name || invoice.clientName || 'Inconnu'}`);
    console.log(`   Montant: ${invoice.amount || 0}€`);
    console.log(`   Produits: ${invoice.products?.length || 0}`);
    
    const clientKey = invoice.client?.name || invoice.clientName || 'Client inconnu';
    
    if (!clientsMap.has(clientKey)) {
      clientsMap.set(clientKey, {
        name: clientKey,
        totalAmount: 0,
        competitorAmount: 0,
        sopremaAmount: 0,
        invoiceCount: 0,
        competitorProducts: [],
        sopremaProducts: []
      });
    }
    
    const client = clientsMap.get(clientKey);
    client.invoiceCount++;
    
    let invoiceCompetitorAmount = 0;
    let invoiceSopremaAmount = 0;
    let hasCompetitors = false;
    
    if (invoice.products && Array.isArray(invoice.products)) {
      invoice.products.forEach((product, pIndex) => {
        const amount = product.totalPrice || 0;
        client.totalAmount += amount;
        
        console.log(`     Produit ${pIndex + 1}: ${product.designation || 'Sans nom'}`);
        console.log(`       Type: ${product.type}`);
        console.log(`       isCompetitor: ${product.isCompetitor}`);
        console.log(`       isSoprema: ${product.isSoprema}`);
        console.log(`       Prix: ${amount}€`);
        
        // Logique de détection exacte du système
        const isCompetitor = product.type === 'competitor' || 
                           product.isCompetitor === true ||
                           product.isCompetitor === 'true';
        
        const isSoprema = product.type === 'soprema' || 
                         product.isSoprema === true ||
                         product.isSoprema === 'true';
        
        console.log(`       → Détecté concurrent: ${isCompetitor}`);
        console.log(`       → Détecté Soprema: ${isSoprema}`);
        
        if (isCompetitor) {
          client.competitorAmount += amount;
          invoiceCompetitorAmount += amount;
          hasCompetitors = true;
          client.competitorProducts.push({
            designation: product.designation,
            amount: amount,
            brand: product.brand || 'Marque inconnue'
          });
          console.log(`       ✅ CONCURRENT: ${amount}€`);
        } else if (isSoprema) {
          client.sopremaAmount += amount;
          invoiceSopremaAmount += amount;
          client.sopremaProducts.push({
            designation: product.designation,
            amount: amount
          });
          console.log(`       ✅ SOPREMA: ${amount}€`);
        } else {
          console.log(`       ⚠️  NON CLASSÉ: ${amount}€`);
        }
      });
    }
    
    if (hasCompetitors) {
      totalInvoicesWithCompetitors++;
      console.log(`   🎯 FACTURE AVEC CONCURRENTS: ${invoiceCompetitorAmount}€ concurrent sur ${invoice.amount}€ total`);
    } else {
      console.log(`   ❌ Aucun concurrent détecté`);
    }
  });
  
  console.log(`\n📈 RÉSUMÉ PAR CLIENT:`);
  console.log('====================');
  
  const clients = Array.from(clientsMap.values())
    .sort((a, b) => b.competitorAmount - a.competitorAmount);
  
  let eligibleClients = 0;
  
  clients.forEach((client, index) => {
    const competitorShare = client.totalAmount > 0 ? 
      Math.round((client.competitorAmount / client.totalAmount) * 100) : 0;
    
    const isEligible = client.competitorAmount >= 5000;
    if (isEligible) eligibleClients++;
    
    console.log(`\n${index + 1}. ${client.name} ${isEligible ? '✅ ÉLIGIBLE' : '❌'}`);
    console.log(`   Total: ${client.totalAmount.toLocaleString('fr-FR')}€`);
    console.log(`   Concurrent: ${client.competitorAmount.toLocaleString('fr-FR')}€`);
    console.log(`   Soprema: ${client.sopremaAmount.toLocaleString('fr-FR')}€`);
    console.log(`   Part concurrent: ${competitorShare}%`);
    console.log(`   Factures: ${client.invoiceCount}`);
    console.log(`   Produits concurrents: ${client.competitorProducts.length}`);
    
    if (client.competitorProducts.length > 0) {
      console.log(`   Top concurrents:`);
      client.competitorProducts.slice(0, 3).forEach(prod => {
        console.log(`     - ${prod.designation}: ${prod.amount}€`);
      });
    }
  });
  
  console.log(`\n🎯 STATISTIQUES FINALES:`);
  console.log('======================');
  console.log(`Factures total: ${invoices.length}`);
  console.log(`Factures avec concurrents: ${totalInvoicesWithCompetitors}`);
  console.log(`Clients unique: ${clients.length}`);
  console.log(`Clients éligibles (≥5000€): ${eligibleClients}`);
  console.log(`Seuil actuel: 5000€`);
  
  if (eligibleClients === 0 && totalInvoicesWithCompetitors > 0) {
    console.log(`\n⚠️  PROBLÈME DÉTECTÉ:`);
    console.log(`Il y a ${totalInvoicesWithCompetitors} factures avec concurrents mais 0 clients éligibles.`);
    console.log(`Cela indique que les montants concurrents sont tous < 5000€.`);
    
    const maxCompetitor = Math.max(...clients.map(c => c.competitorAmount));
    console.log(`Montant concurrent maximum: ${maxCompetitor}€`);
    
    if (maxCompetitor > 0) {
      const suggestedThreshold = Math.max(1000, Math.floor(maxCompetitor * 0.8));
      console.log(`💡 Seuil suggéré: ${suggestedThreshold}€`);
    }
  }
  
  return {
    totalInvoices: invoices.length,
    invoicesWithCompetitors: totalInvoicesWithCompetitors,
    totalClients: clients.length,
    eligibleClients: eligibleClients,
    clients: clients
  };
}

// Lire les factures depuis un fichier JSON de test (vous pouvez exporter depuis le store)
const testInvoices = [
  // Exemple basé sur vos logs
  {
    id: 'invoice-1749686144129-50h430',
    number: 'DN177600',
    client: { name: 'FEMAT' },
    amount: 910.25,
    products: [
      {
        designation: 'ECO-PARTICIPATION FRANCE',
        type: 'soprema',
        isCompetitor: false,
        isSoprema: true,
        totalPrice: 227.56
      },
      {
        designation: 'PRODUIT SOPREMA 2',
        type: 'soprema',
        isCompetitor: false,
        isSoprema: true,
        totalPrice: 182.69
      },
      {
        designation: 'PRODUIT SOPREMA 3',
        type: 'soprema',
        isCompetitor: false,
        isSoprema: true,
        totalPrice: 250.00
      },
      {
        designation: 'PRODUIT SOPREMA 4',
        type: 'soprema',
        isCompetitor: false,
        isSoprema: true,
        totalPrice: 250.00
      }
    ]
  }
];

console.log('📝 Pour analyser vos vraies factures:');
console.log('1. Ouvrez la console du navigateur (F12)');
console.log('2. Exécutez: console.log(JSON.stringify(useDashboardStore.getState().invoices, null, 2))');
console.log('3. Copiez le résultat dans un fichier invoices.json');
console.log('4. Relancez ce script avec les vraies données');

console.log('\n🔍 ANALYSE AVEC LES DONNÉES DE TEST:');
analyzeInvoicesForReconquest(testInvoices);