// Service pour valider et retraiter les factures mal extraites
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  requiresReprocessing: boolean;
  confidence: number;
}

export class InvoiceValidationService {
  // Mots-clés indiquant un problème d'extraction
  private readonly EXTRACTION_FAILURE_KEYWORDS = [
    'Document PDF - conversion alternative',
    'conversion alternative',
    'extraction failed',
    'unable to read',
    'conversion error',
    'format non supporté'
  ];

  // Champs critiques qui doivent être valides
  private readonly CRITICAL_FIELDS = [
    'client.name',
    'client.address',
    'date',
    'distributor.name',
    'products'
  ];

  // Valider une facture extraite
  validateInvoice(invoice: any): ValidationResult {
    const issues: string[] = [];
    let confidence = 100;
    let requiresReprocessing = false;

    // Vérifier les champs critiques
    if (this.containsExtractionFailure(invoice.client?.name)) {
      issues.push('Nom du client non extrait correctement');
      confidence -= 30;
      requiresReprocessing = true;
    }

    if (this.containsExtractionFailure(invoice.client?.address)) {
      issues.push('Adresse du client non extraite');
      confidence -= 20;
      requiresReprocessing = true;
    }

    if (this.containsExtractionFailure(invoice.date)) {
      issues.push('Date de facture non extraite');
      confidence -= 25;
      requiresReprocessing = true;
    }

    if (this.containsExtractionFailure(invoice.distributor?.name)) {
      issues.push('Distributeur non extrait');
      confidence -= 15;
      requiresReprocessing = true;
    }

    // Vérifier la cohérence des données
    if (!this.isValidDate(invoice.date)) {
      issues.push('Format de date invalide');
      confidence -= 10;
    }

    if (!invoice.products || invoice.products.length === 0) {
      issues.push('Aucun produit extrait');
      confidence = 0;
      requiresReprocessing = true;
    }

    // Vérifier les montants
    if (!this.isValidAmount(invoice.totalAmount)) {
      issues.push('Montant total invalide ou manquant');
      confidence -= 20;
      requiresReprocessing = true;
    }

    // Si trop de champs contiennent "conversion alternative", marquer pour retraitement
    const extractionFailureCount = this.countExtractionFailures(invoice);
    if (extractionFailureCount >= 3) {
      requiresReprocessing = true;
      confidence = Math.max(0, confidence - (extractionFailureCount * 10));
    }

    return {
      isValid: confidence >= 50 && issues.length === 0,
      issues,
      requiresReprocessing,
      confidence: Math.max(0, confidence)
    };
  }

  // Vérifier si une valeur contient des mots-clés d'échec d'extraction
  private containsExtractionFailure(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    
    const lowerValue = value.toLowerCase();
    return this.EXTRACTION_FAILURE_KEYWORDS.some(keyword => 
      lowerValue.includes(keyword.toLowerCase())
    );
  }

  // Compter le nombre de champs avec des échecs d'extraction
  private countExtractionFailures(invoice: any): number {
    let count = 0;
    
    // Parcourir récursivement l'objet
    const checkObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.values(obj).forEach(value => {
        if (typeof value === 'string' && this.containsExtractionFailure(value)) {
          count++;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          checkObject(value);
        }
      });
    };

    checkObject(invoice);
    return count;
  }

  // Valider le format de date
  private isValidDate(dateStr: any): boolean {
    if (!dateStr || typeof dateStr !== 'string') return false;
    if (this.containsExtractionFailure(dateStr)) return false;
    
    // Vérifier différents formats de date
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/    // DD-MM-YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(dateStr));
  }

  // Valider un montant
  private isValidAmount(amount: any): boolean {
    if (amount === null || amount === undefined) return false;
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(numAmount) && numAmount > 0 && numAmount < 10000000; // Max 10M€
  }

  // Nettoyer les données pour le retraitement
  cleanInvoiceData(invoice: any): any {
    const cleaned = { ...invoice };
    
    // Remplacer les valeurs d'échec par des valeurs vides
    const cleanObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string' && this.containsExtractionFailure(obj[key])) {
          obj[key] = ''; // Vider les champs avec erreur
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          obj[key] = cleanObject(obj[key]);
        }
      });
      
      return obj;
    };
    
    return cleanObject(cleaned);
  }

  // Générer un rapport de validation
  generateValidationReport(invoices: any[]): {
    total: number;
    valid: number;
    requiresReprocessing: number;
    issues: { invoiceId: string; issues: string[] }[];
  } {
    const report = {
      total: invoices.length,
      valid: 0,
      requiresReprocessing: 0,
      issues: [] as { invoiceId: string; issues: string[] }[]
    };

    invoices.forEach(invoice => {
      const validation = this.validateInvoice(invoice);
      
      if (validation.isValid) {
        report.valid++;
      }
      
      if (validation.requiresReprocessing) {
        report.requiresReprocessing++;
        report.issues.push({
          invoiceId: invoice.id || invoice.number,
          issues: validation.issues
        });
      }
    });

    return report;
  }
}

export const invoiceValidationService = new InvoiceValidationService();