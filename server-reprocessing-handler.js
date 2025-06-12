// Module de gestion du retraitement automatique des factures mal extraites
// Ce module détecte et gère les factures avec "Document PDF - conversion alternative"

export const reprocessingHandler = {
  // Mots-clés indiquant un problème d'extraction
  EXTRACTION_FAILURE_KEYWORDS: [
    'Document PDF - conversion alternative',
    'conversion alternative',
    'extraction failed',
    'unable to read',
    'conversion error',
    'format non supporté',
    'document illisible'
  ],

  // Vérifier si une valeur contient des mots-clés d'échec d'extraction
  containsExtractionFailure(value) {
    if (!value || typeof value !== 'string') return false;
    
    const lowerValue = value.toLowerCase();
    return this.EXTRACTION_FAILURE_KEYWORDS.some(keyword => 
      lowerValue.includes(keyword.toLowerCase())
    );
  },

  // Vérifier si l'extraction d'une facture a échoué
  checkExtractionFailure(extractedData) {
    console.log('🔍 Vérification de la qualité d\'extraction...');
    
    const issues = [];
    let failureCount = 0;
    
    // Vérifier le nom du client
    if (this.containsExtractionFailure(extractedData.client?.name)) {
      issues.push('Nom du client non extrait');
      failureCount++;
    }
    
    // Vérifier l'adresse du client
    if (this.containsExtractionFailure(extractedData.client?.address)) {
      issues.push('Adresse du client non extraite');
      failureCount++;
    }
    
    // Vérifier la date
    if (this.containsExtractionFailure(extractedData.date)) {
      issues.push('Date de facture non extraite');
      failureCount++;
    }
    
    // Vérifier le distributeur
    if (this.containsExtractionFailure(extractedData.distributor?.name)) {
      issues.push('Distributeur non extrait');
      failureCount++;
    }
    
    // Vérifier les produits
    const productsWithIssues = (extractedData.products || []).filter(p => 
      this.containsExtractionFailure(p.designation) || 
      this.containsExtractionFailure(p.reference)
    );
    
    if (productsWithIssues.length > 0) {
      issues.push(`${productsWithIssues.length} produits mal extraits`);
      failureCount += productsWithIssues.length;
    }
    
    // Vérifier tous les champs de manière récursive
    const totalFailures = this.countAllFailures(extractedData);
    
    const hasIssues = issues.length > 0 || totalFailures >= 3;
    
    if (hasIssues) {
      console.log(`❌ PROBLÈMES D'EXTRACTION DÉTECTÉS:`);
      console.log(`   - ${issues.join('\n   - ')}`);
      console.log(`   - Total de champs avec erreur: ${totalFailures}`);
    } else {
      console.log('✅ Extraction valide');
    }
    
    return {
      hasIssues,
      issues,
      failureCount: totalFailures,
      requiresReprocessing: totalFailures >= 3,
      confidence: Math.max(0, 100 - (totalFailures * 15))
    };
  },

  // Compter tous les échecs d'extraction dans l'objet
  countAllFailures(obj, count = 0) {
    if (!obj || typeof obj !== 'object') return count;
    
    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && this.containsExtractionFailure(value)) {
        count++;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        count = this.countAllFailures(value, count);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'object') {
            count = this.countAllFailures(item, count);
          }
        }
      }
    }
    
    return count;
  },

  // Nettoyer les données en supprimant les valeurs d'échec
  cleanFailedData(data) {
    const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone
    
    const cleanObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string' && this.containsExtractionFailure(obj[key])) {
          obj[key] = ''; // Vider les champs avec erreur
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          obj[key] = cleanObject(obj[key]);
        } else if (Array.isArray(obj[key])) {
          obj[key] = obj[key].map(item => 
            typeof item === 'object' ? cleanObject(item) : item
          );
        }
      });
      
      return obj;
    };
    
    return cleanObject(cleaned);
  },

  // Décider de la méthode de conversion pour le retraitement
  getAlternativeConversionMethod(previousMethod, attemptNumber) {
    const methods = [
      'ghostscript-high-quality',
      'pdf2pic-alternative',
      'poppler-utils',
      'jimp-reconstruction'
    ];
    
    // Choisir une méthode différente à chaque tentative
    const methodIndex = attemptNumber % methods.length;
    return methods[methodIndex];
  },

  // Créer la réponse d'erreur pour le retraitement
  createReprocessingResponse(extractedData, validationResult) {
    return {
      error: 'Extraction échouée',
      message: 'La facture n\'a pas pu être extraite correctement. Un retraitement automatique est nécessaire.',
      requiresReprocessing: true,
      validationResult: {
        issues: validationResult.issues,
        confidence: validationResult.confidence,
        failureCount: validationResult.failureCount
      },
      extractedData: extractedData, // Pour debug uniquement
      suggestions: [
        'Le système va automatiquement tenter une nouvelle conversion',
        'Si le problème persiste, vérifiez la qualité du document source',
        'Les documents scannés en haute résolution donnent de meilleurs résultats'
      ]
    };
  },

  // Créer la réponse de rejet définitif
  createRejectionResponse(fileName) {
    return {
      error: 'Facture illisible',
      message: 'Cette facture ne peut pas être traitée même après plusieurs tentatives. Veuillez vérifier la qualité du document.',
      rejected: true,
      fileName: fileName,
      suggestions: [
        'Vérifiez que le document est lisible et non corrompu',
        'Scannez le document en haute résolution (300 DPI minimum)',
        'Évitez les photos de documents, préférez les scans directs',
        'Assurez-vous que le texte est net et non flou'
      ]
    };
  }
};