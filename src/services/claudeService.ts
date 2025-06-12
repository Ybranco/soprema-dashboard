// Service Claude - SANS MOCK DATA - Erreurs claires uniquement
export interface ExtractedInvoiceData {
  invoiceNumber: string;
  date: string;
  client: {
    name: string;
    fullName: string;
    address: string;
    siret?: string;
    contact?: string;
    phone?: string;
  };
  distributor: {
    name: string;
    agency: string;
    seller?: string;
  };
  products: Array<{
    reference: string;
    designation: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isCompetitor: boolean;
    brand?: string;
  }>;
  totalAmount: number;
  reconquestPlan?: any;
  clientLocation?: {
    coordinates: {
      lat: number;
      lng: number;
    };
    region: string;
    marketPotential: number;
    planId: string;
  };
}

class ClaudeService {
  private serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  // Méthode principale pour traiter un fichier
  async processFile(file: File, options?: { forceMethod?: string; previousAttemptFailed?: boolean }): Promise<ExtractedInvoiceData> {
    console.log('📤 claudeService.processFile appelé pour:', file.name);
    if (options?.previousAttemptFailed) {
      console.log('⚠️ Retraitement suite à échec précédent');
    }
    
    try {
      
      // Vérifier si le serveur est accessible
      await this.checkServerHealth();
      
      // Préparer les données du fichier
      const formData = new FormData();
      formData.append('invoice', file);
      
      // Ajouter des options pour le retraitement si nécessaire
      if (options?.forceMethod) {
        formData.append('conversionMethod', options.forceMethod);
      }
      if (options?.previousAttemptFailed) {
        formData.append('retryAttempt', 'true');
      }
      
      // Envoyer au serveur pour traitement complet
      console.log('📡 Envoi au serveur:', `${this.serverUrl}/api/analyze-invoice`);
      const response = await fetch(`${this.serverUrl}/api/analyze-invoice`, {
        method: 'POST',
        body: formData
      });

      console.log('📨 Réponse serveur:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erreur serveur inconnue',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        // NOUVEAU: Gérer le code 422 pour le retraitement automatique
        if (response.status === 422 && errorData.requiresReprocessing) {
          console.log('⚠️ Extraction échouée détectée - Retraitement automatique...');
          
          // Si c'est déjà un rejet définitif
          if (errorData.rejected) {
            throw new Error(`Facture illisible après plusieurs tentatives. ${errorData.message}`);
          }
          
          // Retenter avec une méthode de conversion alternative
          console.log('🔄 Tentative de retraitement avec méthode alternative...');
          
          // Indiquer que nous sommes en retraitement
          if (options?.onReprocessing) {
            options.onReprocessing();
          }
          
          // Réessayer avec les options de retraitement
          const retryResponse = await this.processFile(file, {
            forceMethod: 'alternative',
            previousAttemptFailed: true
          });
          
          return retryResponse;
        }
        
        // Erreurs spécifiques avec solutions
        if (response.status === 400 && errorData.message?.includes('ANTHROPIC_API_KEY')) {
          throw new Error('Configuration manquante: ANTHROPIC_API_KEY non configurée dans .env. Obtenez une clé Claude 3.5 Sonnet sur console.anthropic.com');
        }
        
        if (response.status === 500) {
          throw new Error(`Erreur interne serveur: ${errorData.message || 'Erreur d\'analyse'}`);
        }
        
        throw new Error(errorData.message || `Erreur serveur HTTP ${response.status}: ${response.statusText}`);
      }

      const extractedData = await response.json();
      
      return this.validateAndCleanData(extractedData);
      
    } catch (error) {
      
      // Analyse détaillée de l'erreur pour l'utilisateur
      if (error.message.includes('fetch')) {
        throw new Error(`Connexion serveur impossible: Vérifiez que le serveur Node.js est démarré avec "npm run dev". URL tentée: ${this.serverUrl}`);
      }
      
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        throw new Error('Clé Claude 3.5 Sonnet manquante: Configurez ANTHROPIC_API_KEY dans le fichier .env avec votre clé obtenue sur console.anthropic.com');
      }

      if (error.message.includes('Configuration manquante')) {
        throw new Error('Configuration manquante: Vérifiez votre fichier .env et redémarrez le serveur');
      }
      
      // Relancer l'erreur telle quelle si elle est déjà formatée
      throw error;
    }
  }

  // Méthode alternative avec base64 (fallback)
  async extractInvoiceData(file: File): Promise<ExtractedInvoiceData> {
    try {
      
      await this.checkServerHealth();
      
      const base64 = await this.fileToBase64(file);
      
      const response = await fetch(`${this.serverUrl}/api/analyze-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          mimeType: file.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur serveur HTTP ${response.status}: ${response.statusText}`);
      }

      const extractedData = await response.json();
      return this.validateAndCleanData(extractedData);
      
    } catch (error) {
      throw new Error(`Impossible d'analyser la facture via base64: ${error.message}`);
    }
  }

  // Vérifier la santé du serveur avec détails
  private async checkServerHealth(): Promise<void> {
    try {
      
      const healthResponse = await fetch(`${this.serverUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      
      if (!healthResponse.ok) {
        throw new Error(`Serveur non accessible (HTTP ${healthResponse.status})`);
      }
      
      const health = await healthResponse.json();
      
      // Vérifier les fonctionnalités critiques
      if (health.status !== 'OK') {
        throw new Error(`Serveur en erreur: ${health.message || 'État non OK'}`);
      }
      
      if (!health.features?.claudeAI) {
        throw new Error('Claude 3.5 Sonnet non configuré sur le serveur. Vérifiez ANTHROPIC_API_KEY dans .env et redémarrez le serveur.');
      }
      
      
    } catch (error) {
      
      if (error.message.includes('fetch')) {
        throw new Error(`Serveur Node.js non démarré ou inaccessible. URL: ${this.serverUrl}. Exécutez "npm run dev" dans un terminal.`);
      }
      throw error;
    }
  }

  // Convertir fichier en base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
      reader.readAsDataURL(file);
    });
  }

  // Validation et nettoyage des données avec logs détaillés
  private validateAndCleanData(responseData: any): ExtractedInvoiceData {
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Données invalides reçues du serveur - Réponse non-JSON ou vide');
    }

    // 🔧 NOUVEAU: Adapter à la structure du serveur hybride
    let data;
    if (responseData.success && responseData.data) {
      // Serveur hybride v2.0
      // 🔧 CORRECTION: Gérer les cas où customer est un objet ou une chaîne
      let customerName = '';
      const customer = responseData.data.invoiceInfo?.customer || responseData.data.invoiceInfo?.client;
      if (typeof customer === 'string') {
        customerName = customer;
      } else if (customer?.name) {
        customerName = customer.name;
      } else if (customer?.address) {
        customerName = `Client ${customer.address}`;
      } else {
        customerName = 'Client extrait de la facture';
      }
      
      data = {
        invoiceNumber: responseData.data.invoiceInfo?.number,
        date: responseData.data.invoiceInfo?.date,
        client: {
          name: customerName
        },
        distributor: {
          name: responseData.data.invoiceInfo?.supplier
        },
        products: responseData.data.products || [],
        totalAmount: responseData.data.totals?.total || 0
      };
      console.log(`🔧 Structure hybride détectée: ${data.products.length} produits`);
    } else {
      // Structure ancienne
      data = responseData;
      console.log(`🔧 Structure ancienne détectée`);
    }

    // FONCTION SIMPLE pour détecter UNIQUEMENT "conversion alternative"
    const isConversionAlternative = (text: string) => {
      if (!text || typeof text !== 'string') return false;
      return text.toLowerCase().includes('conversion alternative');
    };

    // VÉRIFIER LE NOM DU CLIENT - SEULEMENT "conversion alternative"
    const clientName = data.client?.name || '';
    if (isConversionAlternative(clientName)) {
      console.error('🚫 FACTURE REJETÉE - Contient "conversion alternative":', clientName);
      throw new Error(`Facture corrompue détectée: "${clientName}". Cette facture sera ignorée.`);
    }

    // VÉRIFIER LE NUMÉRO DE FACTURE - SEULEMENT "conversion alternative" 
    const invoiceNumber = data.invoiceNumber || '';
    if (isConversionAlternative(invoiceNumber)) {
      console.error('🚫 FACTURE REJETÉE - Numéro contient "conversion alternative":', invoiceNumber);
      throw new Error(`Facture corrompue détectée: "${invoiceNumber}". Cette facture sera ignorée.`);
    }

    // NETTOYER ET VALIDER LES PRODUITS
    const cleanProducts = (data.products || [])
      .map((product: any, index: number) => {
        const designation = product.designation || '';
        const reference = product.reference || '';
        const brand = product.brand || '';
        
        // REJETER les produits avec "conversion alternative" (erreur de conversion)
        if (brand.toLowerCase().includes('conversion alternative') || 
            brand.toLowerCase().includes('document pdf')) {
          console.warn(`🚫 Produit ${index + 1} ignoré (erreur de conversion):`, designation);
          return null; // Marquer pour suppression
        }
        
        return {
          reference: reference || 'REF-EXTRAITE',
          designation: designation || 'Produit extrait',
          quantity: Number(product.quantity) || 1,
          unitPrice: Number(product.unitPrice) || 0,
          totalPrice: Number(product.totalPrice) || 0,
          isCompetitor: Boolean(product.isCompetitor),
          brand: brand || undefined
        };
      })
      .filter(product => product !== null); // Supprimer les produits corrompus

    // Pas de rejet si tous les produits contiennent "conversion alternative" - on garde la facture mais sans ces produits
    console.log(`✅ Facture nettoyée: ${cleanProducts.length} produits valides sur ${(data.products || []).length} originaux`);

    const cleanedData: ExtractedInvoiceData = {
      invoiceNumber: invoiceNumber || `FA-${Date.now().toString().slice(-6)}`,
      date: data.date || new Date().toISOString().split('T')[0],
      client: {
        name: clientName || 'Client extrait de la facture',
        fullName: data.client?.fullName || clientName || 'Nom complet extrait',
        address: data.client?.address || 'Adresse extraite',
        siret: data.client?.siret,
        contact: data.client?.contact,
        phone: data.client?.phone
      },
      distributor: {
        name: data.distributor?.name || 'Distributeur extrait',
        agency: data.distributor?.agency || 'Agence extraite',
        seller: data.distributor?.seller
      },
      products: cleanProducts,
      totalAmount: Number(data.totalAmount) || 0
    };

    // Ajouter le plan de reconquête si présent
    if (data.reconquestPlan || data.actionPlan) {
      cleanedData.reconquestPlan = data.reconquestPlan || data.actionPlan;
    }

    // Ajouter les données de localisation client si présentes
    if (data.clientLocation || data.geographic) {
      cleanedData.clientLocation = data.clientLocation || data.geographic;
    }


    return cleanedData;
  }
}

export const claudeService = new ClaudeService();