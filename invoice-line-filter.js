// Module pour filtrer les lignes non-produits dans les factures
// (transport, frais, taxes, etc.)

export class InvoiceLineFilter {
  constructor() {
    // Patterns pour identifier les lignes non-produits
    this.NON_PRODUCT_PATTERNS = {
      // Transport et livraison
      transport: [
        /^transport/i,
        /frais de transport/i,
        /port et emballage/i,
        /livraison/i,
        /expedition/i,
        /franco de port/i,
        /participation aux frais de port/i,
        /supplement transport/i,
        /cout de transport/i,
        /frais de port/i
      ],
      
      // Taxes et frais administratifs
      taxes: [
        /^taxe/i,
        /^tva/i,
        /eco[-\s]?taxe/i,
        /eco[-\s]?participation/i,
        /eco[-\s]?contribution/i,
        /contribution environnementale/i,
        /taxe environnementale/i,
        /deee/i,  // Déchets d'équipements électriques
        /tgap/i   // Taxe générale sur les activités polluantes
      ],
      
      // Frais divers
      fees: [
        /frais de dossier/i,
        /frais administratif/i,
        /frais de gestion/i,
        /frais bancaire/i,
        /frais financier/i,
        /interets de retard/i,
        /penalite/i,
        /majoration/i,
        /frais de traitement/i,
        /frais supplementaire/i,
        /participation aux frais/i,
        /contribution aux frais/i
      ],
      
      // Services
      services: [
        /main\s+d['']?œuvre/i,  // Main d'œuvre
        /main\s+d['']?oeuvre/i,  // Main d'oeuvre
        /installation/i,
        /pose/i,
        /montage/i,
        /mise en service/i,
        /formation/i,
        /assistance technique/i,
        /location/i,
        /prestation/i,
        /intervention/i,
        /deplacement/i,
        /visite technique/i
      ],
      
      // Remises et avoirs
      discounts: [
        /remise/i,
        /rabais/i,
        /ristourne/i,
        /avoir/i,
        /reduction/i,
        /escompte/i,
        /promotion/i,
        /offre commerciale/i
      ],
      
      // Autres éléments non-produits
      other: [
        /consigne/i,
        /caution/i,
        /depot de garantie/i,
        /assurance/i,
        /garantie/i,
        /reprise/i,
        /retour/i,
        /^palette/i,
        /supplement/i,
        /forfait/i,
        /abonnement/i,
        /cotisation/i
      ]
    };
    
    // Mots qui pourraient sembler des frais mais sont des produits légitimes
    this.PRODUCT_EXCEPTIONS = [
      'transport de chaleur',      // Produit d'isolation
      'frais bitume',              // Type de bitume
      'eco membrane',              // Membrane écologique
      'palette de',                // Suivi de produits
      'forfait etancheite',        // Forfait de produits
      'garantie decennale'         // Produit d'assurance construction
    ];
  }

  /**
   * Vérifier si une ligne de facture est un produit ou non
   * @param {Object} line - Ligne de facture avec designation, reference, etc.
   * @returns {Object} { isProduct: boolean, category: string, confidence: number }
   */
  checkInvoiceLine(line) {
    if (!line || !line.designation || line.designation.trim() === '') {
      return { 
        isProduct: false, 
        category: 'other', 
        confidence: 90,
        reason: 'Ligne vide ou sans désignation'
      };
    }
    
    const designation = line.designation.toLowerCase().trim();
    const reference = (line.reference || '').toLowerCase().trim();
    
    // Vérifier d'abord les exceptions (vrais produits)
    for (const exception of this.PRODUCT_EXCEPTIONS) {
      if (designation.includes(exception)) {
        return { 
          isProduct: true, 
          category: 'product_exception', 
          confidence: 90 
        };
      }
    }
    
    // Vérifier les patterns de non-produits
    for (const [category, patterns] of Object.entries(this.NON_PRODUCT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(designation) || pattern.test(reference)) {
          return { 
            isProduct: false, 
            category, 
            confidence: 95,
            reason: `Détecté comme ${category}: "${designation}"`
          };
        }
      }
    }
    
    // Vérifications supplémentaires
    // Si la quantité est 0 ou le prix unitaire est 0, probablement pas un produit
    if (line.quantity === 0 || line.unitPrice === 0) {
      // Sauf si c'est une remise (prix négatif)
      if (line.totalPrice < 0) {
        return { 
          isProduct: false, 
          category: 'discounts', 
          confidence: 90,
          reason: 'Montant négatif - probablement une remise'
        };
      }
    }
    
    // Si la désignation est très courte (moins de 3 caractères), suspect
    if (designation.length < 3 && !reference) {
      return { 
        isProduct: false, 
        category: 'other', 
        confidence: 70,
        reason: 'Désignation trop courte'
      };
    }
    
    // Par défaut, considérer comme un produit
    return { 
      isProduct: true, 
      category: 'product', 
      confidence: 85 
    };
  }

  /**
   * Filtrer une liste de lignes de facture
   * @param {Array} lines - Tableau de lignes de facture
   * @returns {Object} { products: [], nonProducts: [], summary: {} }
   */
  filterInvoiceLines(lines) {
    if (!Array.isArray(lines)) {
      return { products: [], nonProducts: [], summary: {} };
    }
    
    const products = [];
    const nonProducts = [];
    const categoryCounts = {};
    
    for (const line of lines) {
      const check = this.checkInvoiceLine(line);
      
      if (check.isProduct) {
        products.push(line);
      } else {
        nonProducts.push({
          ...line,
          filterInfo: check
        });
        
        categoryCounts[check.category] = (categoryCounts[check.category] || 0) + 1;
      }
    }
    
    const summary = {
      totalLines: lines.length,
      productCount: products.length,
      nonProductCount: nonProducts.length,
      categories: categoryCounts,
      totalProductAmount: products.reduce((sum, p) => sum + (p.totalPrice || 0), 0),
      totalNonProductAmount: nonProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0)
    };
    
    if (nonProducts.length > 0) {
      console.log(`\n🚫 ${nonProducts.length} lignes non-produits détectées:`);
      nonProducts.forEach(np => {
        console.log(`   - ${np.designation}: ${np.filterInfo.reason}`);
      });
    }
    
    return { products, nonProducts, summary };
  }

  /**
   * Nettoyer les données d'une facture complète
   * @param {Object} invoiceData - Données extraites de la facture
   * @returns {Object} Facture avec produits filtrés
   */
  cleanInvoiceData(invoiceData) {
    if (!invoiceData || !invoiceData.products) {
      return invoiceData;
    }
    
    const { products, nonProducts, summary } = this.filterInvoiceLines(invoiceData.products);
    
    // Mettre à jour les données de la facture
    const cleanedData = {
      ...invoiceData,
      products: products,
      _filtering: {
        originalProductCount: invoiceData.products.length,
        filteredProductCount: products.length,
        removedLines: nonProducts,
        summary: summary
      }
    };
    
    // Recalculer le montant total si nécessaire
    if (summary.nonProductCount > 0) {
      const newTotal = products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
      cleanedData.totalProductsOnly = newTotal;
      
      console.log(`💰 Montants recalculés:`);
      console.log(`   - Total original: ${invoiceData.totalAmount}€`);
      console.log(`   - Total produits uniquement: ${newTotal}€`);
      console.log(`   - Total frais/services: ${summary.totalNonProductAmount}€`);
    }
    
    return cleanedData;
  }
}

// Instance singleton
export const invoiceLineFilter = new InvoiceLineFilter();