import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Invoice, Opportunity, DashboardStats, CompetitorProduct, AnalysisStep, AnalysisResult } from '../types';
import { ReconquestPlan } from '../services/reconquestService';
import { invoiceValidationService } from '../services/invoiceValidationService';

interface DashboardStore {
  // Data state - PERSISTE dans localStorage
  invoices: Invoice[];
  opportunities: Opportunity[];
  stats: DashboardStats;
  competitorProducts: CompetitorProduct[];
  analysisResults: AnalysisResult;
  reconquestPlans: ReconquestPlan[];
  reconquestSummary: any | null;
  
  // UI state - NE PERSISTE PAS
  isInvoiceModalOpen: boolean;
  searchTerm: string;
  sortField: 'date' | 'amount';
  sortDirection: 'asc' | 'desc';
  isLoading: boolean;
  analysisSteps: AnalysisStep[];
  lastError: string | null;
  selectedInvoiceNumber: string | null;
  
  // Actions
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;
  removeInvoice: (invoiceId: string) => void;
  clearAllInvoices: () => void;
  setOpportunities: (opportunities: Opportunity[]) => void;
  setStats: (stats: DashboardStats) => void;
  setCompetitorProducts: (products: CompetitorProduct[]) => void;
  setError: (error: string | null) => void;
  
  // Reconquest actions
  setReconquestPlans: (plans: ReconquestPlan[]) => void;
  setReconquestSummary: (summary: any) => void;
  
  // UI actions
  openInvoiceModal: () => void;
  closeInvoiceModal: () => void;
  setSearchTerm: (term: string) => void;
  setSorting: (field: 'date' | 'amount', direction: 'asc' | 'desc') => void;
  setLoading: (loading: boolean) => void;
  setSelectedInvoice: (invoiceNumber: string | null) => void;
  
  // Analysis actions
  updateAnalysisStep: (stepId: string, status: 'completed' | 'current' | 'pending', progress: number) => void;
  setAnalysisResults: (results: AnalysisResult) => void;
  
  // Customer reconquest plans (legacy method for backward compatibility)
  getGeographicOpportunities: () => Array<{
    id: string;
    lat: number;
    lng: number;
    region: string;
    amount: number;
    size: 'small' | 'medium' | 'large';
    clients: number;
    reconquestPlan?: any;
  }>;
  
  // Customer reconquest locations
  getCustomerReconquestLocations: () => Array<{
    id: string;
    lat: number;
    lng: number;
    clientName: string;
    address: string;
    competitorAmount: number;
    reconquestPotential: number;
    priority: 'high' | 'medium' | 'low';
    lastPurchaseDate: string;
    hasReconquestPlan: boolean;
  }>;
  
  // Computed getters
  getFilteredInvoices: () => Invoice[];
  getSortedInvoices: (invoices: Invoice[]) => Invoice[];
  
  // Stats helpers
  getTotalInvoices: () => number;
  getTotalClients: () => number;
  getTotalPotential: () => number;
  getCompetitorBrandsCount: () => number;
  
  // Persistence helpers
  getStorageInfo: () => {
    totalInvoices: number;
    totalSize: string;
    lastSaved: string;
    isLoaded: boolean;
  };
  
  // Manual save function
  forceSave: () => void;
}

// Stats VIDES au démarrage
const initialStats: DashboardStats = {
  invoicesAnalyzed: { value: 0, trend: 0, trendDirection: 'up' },
  clientsIdentified: { value: 0, trend: 0, trendDirection: 'up' },
  businessPotential: { value: 0, trend: 0, trendDirection: 'up' }
};

// Aucun produit concurrent initial
const initialCompetitorProducts: CompetitorProduct[] = [];

// Étapes d'analyse vides (UI only - pas persistées)
const initialAnalysisSteps: AnalysisStep[] = [
  { id: '1', title: 'Importation factures', icon: 'file-import', status: 'pending', progress: 0 },
  { id: '2', title: 'Reconnaissance (OCR)', icon: 'eye', status: 'pending', progress: 0 },
  { id: '3', title: 'Extraction produits', icon: 'tags', status: 'pending', progress: 0 },
  { id: '4', title: 'Analyse concurrentielle', icon: 'brain', status: 'pending', progress: 0 },
  { id: '5', title: 'Plans de reconquête client', icon: 'lightbulb', status: 'pending', progress: 0 }
];

// Résultats d'analyse vides
const initialAnalysisResults: AnalysisResult = {
  lastInvoice: 'Aucune analyse effectuée',
  detectedProducts: 'Aucun produit analysé',
  competitorBrands: 'Aucune marque détectée',
  clientProfilesGenerated: 'Aucun profil client créé',
  estimatedPotential: 0
};

// Configuration de persistance avec localStorage - OPTIMISÉE
const persistConfig = {
  name: 'soprema-dashboard-v2-storage', // Version 2 avec persistance complète
  storage: createJSONStorage(() => localStorage),
  
  // PERSISTER SEULEMENT les données importantes
  partialize: (state: DashboardStore) => ({
    invoices: state.invoices,
    opportunities: state.opportunities,
    stats: state.stats,
    competitorProducts: state.competitorProducts,
    analysisResults: state.analysisResults,
    reconquestPlans: state.reconquestPlans,
    reconquestSummary: state.reconquestSummary,
    // UI state et analysis steps ne sont PAS persistés
  }),
  
  version: 2, // Version 2 pour la migration
  migrate: (persistedState: any, version: number) => {
    
    // Migration depuis version 1
    if (version === 1) {
      // Migrer les anciennes données si nécessaire
      persistedState.analysisResults = persistedState.analysisResults || initialAnalysisResults;
    }
    
    return persistedState;
  },
  
  onRehydrateStorage: () => {
    return (state, error) => {
      if (error) {
        // En cas d'erreur, utiliser les données vides
        return;
      }
      
      if (state && state.invoices && state.invoices.length > 0) {
        
        // Afficher un message à l'utilisateur
      } else {
      }
    };
  }
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Initial state - VIDE ou récupéré du localStorage
      invoices: [],
      opportunities: [],
      stats: initialStats,
      competitorProducts: initialCompetitorProducts,
      analysisResults: initialAnalysisResults,
      reconquestPlans: [],
      reconquestSummary: null,
      
      // UI state - JAMAIS persisté (réinitialisé à chaque session)
      isInvoiceModalOpen: false,
      searchTerm: '',
      sortField: 'date',
      sortDirection: 'desc',
      isLoading: false,
      analysisSteps: initialAnalysisSteps,
      lastError: null,
      selectedInvoiceNumber: null,
      
      // Data actions avec persistance AUTOMATIQUE
      setInvoices: (invoices) => {
        set({ invoices });
        updateAllStats(invoices, set);
      },
      
      addInvoice: (invoice) => {
        // Fonction stricte pour détecter les erreurs de conversion
        const isConversionError = (product: any) => {
          const text = [
            product.designation || '',
            product.reference || '',
            product.description || '',
            product.name || ''
          ].join(' ').toLowerCase();
          
          return text.includes('conversion alternative') ||
                 text.includes('document pdf') ||
                 text.includes('non extrait') ||
                 text.includes('pdf - conversion') ||
                 text.includes('erreur conversion') ||
                 text.includes('échec extraction');
        };

        // Valider la facture avant de l'ajouter
        const validation = invoiceValidationService.validateInvoice(invoice);
        
        // Log pour debug
        console.log('📋 Validation de la facture:', {
          invoiceNumber: invoice.number,
          confidence: validation.confidence,
          requiresReprocessing: validation.requiresReprocessing,
          issues: validation.issues
        });
        
        // Ne rejeter que les factures vraiment problématiques (seuil abaissé à 30%)
        const hasConversionError = validation.issues.some(issue => 
          issue.includes('conversion alternative') || 
          issue.includes('non extrait')
        );
        
        // Seuil de rejet abaissé de 60% à 30%
        if (validation.confidence < 30) {
          console.error('❌ Facture rejetée:', invoice.number, validation.issues);
          set({ 
            lastError: `Facture ${invoice.number} rejetée: ${validation.issues.join(', ')}`
          });
          return;
        }
        
        // Filtrer STRICTEMENT les produits avec erreurs de conversion
        const cleanedInvoice = { ...invoice };
        if (cleanedInvoice.products && Array.isArray(cleanedInvoice.products)) {
          const originalCount = cleanedInvoice.products.length;
          
          cleanedInvoice.products = cleanedInvoice.products.filter(product => {
            const hasError = isConversionError(product);
            
            if (hasError) {
              console.warn('🚫 Produit exclu (erreur de conversion):', {
                designation: product.designation,
                reference: product.reference,
                totalPrice: product.totalPrice
              });
            }
            
            return !hasError;
          });

          const filteredCount = cleanedInvoice.products.length;
          if (originalCount !== filteredCount) {
            console.log(`🧹 Filtrage: ${originalCount - filteredCount} produits erronés supprimés`);
          }
          
          // Recalculer le montant de la facture après filtrage
          cleanedInvoice.amount = Math.round(cleanedInvoice.products.reduce((sum, p) => sum + (p.totalPrice || 0), 0) * 100) / 100;
          cleanedInvoice.potential = Math.round(cleanedInvoice.amount * 1.15 * 100) / 100;
        }

        // Ne pas ajouter la facture si elle n'a plus de produits valides
        if (!cleanedInvoice.products || cleanedInvoice.products.length === 0) {
          console.warn('⚠️ Facture ignorée: aucun produit valide après filtrage');
          set({ 
            lastError: `Facture ${invoice.number} ignorée: aucun produit valide détecté`
          });
          return;
        }
        
        const updatedInvoices = [cleanedInvoice, ...get().invoices];
        set({ invoices: updatedInvoices });
        updateAllStats(updatedInvoices, set);
      },
      
      removeInvoice: (invoiceId) => {
        const currentInvoices = get().invoices;
        const invoiceToRemove = currentInvoices.find(inv => inv.id === invoiceId);
        const updatedInvoices = currentInvoices.filter(invoice => invoice.id !== invoiceId);
        
        set({ invoices: updatedInvoices });
        updateAllStats(updatedInvoices, set);
        
      },
      
      clearAllInvoices: () => {
        const currentCount = get().invoices.length;
        
        // Remettre TOUT à zéro avec persistance
        set({ 
          invoices: [],
          opportunities: [],
          stats: initialStats,
          competitorProducts: initialCompetitorProducts,
          analysisResults: initialAnalysisResults,
          reconquestPlans: [],
          reconquestSummary: null
        });
        
      },
      
      setOpportunities: (opportunities) => set({ opportunities }),
      setStats: (stats) => set({ stats }),
      setCompetitorProducts: (products) => set({ competitorProducts: products }),
      setError: (error) => set({ lastError: error }),
      
      // Reconquest actions avec persistance AUTOMATIQUE
      setReconquestPlans: (plans) => set({ reconquestPlans: plans }),
      setReconquestSummary: (summary) => set({ reconquestSummary: summary }),
      
      // UI actions - PAS de persistance
      openInvoiceModal: () => set({ isInvoiceModalOpen: true }),
      closeInvoiceModal: () => set({ isInvoiceModalOpen: false }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSorting: (field, direction) => set({ sortField: field, sortDirection: direction }),
      setLoading: (loading) => set({ isLoading: loading }),
      setSelectedInvoice: (invoiceNumber) => set({ selectedInvoiceNumber: invoiceNumber }),
      
      // Analysis actions - steps ne sont pas persistés (UI temporaire)
      updateAnalysisStep: (stepId, status, progress) => set((state) => ({
        analysisSteps: state.analysisSteps.map(step =>
          step.id === stepId ? { ...step, status, progress } : step
        )
      })),
      setAnalysisResults: (results) => set({ analysisResults: results }),
      
      // Geographic opportunities with action plans
      getGeographicOpportunities: () => {
        const invoices = get().invoices;
        const regionMap = new Map();
        
        invoices.forEach(invoice => {
          const region = invoice.region || 'France';
          const existing = regionMap.get(region) || {
            id: `region-${region}`,
            region,
            amount: 0,
            clients: new Set(),
            invoices: [],
            reconquestPlans: []
          };
          
          existing.amount += invoice.potential;
          existing.clients.add(invoice.client.name);
          existing.invoices.push(invoice);
          
          if (invoice.reconquestPlan) {
            existing.reconquestPlans.push(invoice.reconquestPlan);
          }
          
          regionMap.set(region, existing);
        });
        
        return Array.from(regionMap.values()).map(region => {
          const coordinates = getRegionCoordinates(region.region);
          const size = region.amount > 150000 ? 'large' : region.amount > 80000 ? 'medium' : 'small';
          
          return {
            id: region.id,
            lat: coordinates.lat,
            lng: coordinates.lng,
            region: region.region,
            amount: region.amount,
            size,
            clients: region.clients.size,
            reconquestPlan: region.reconquestPlans.length > 0 ? region.reconquestPlans[0] : null
          };
        });
      },
      
      // Get customer locations for reconquest mapping
      getCustomerReconquestLocations: () => {
        const invoices = get().invoices;
        const clientMap = new Map();
        
        // Fonction pour détecter les erreurs de conversion
        const isCorruptedInvoice = (invoice) => {
          // 🔧 CORRECTION: Gérer les cas où client est un objet ou une chaîne
          let clientName = '';
          if (typeof invoice.client === 'string') {
            clientName = invoice.client;
          } else if (invoice.client?.name) {
            clientName = invoice.client.name;
          }
          
          const invoiceNumber = invoice.number || '';
          
          // Vérifier client (avec vérification de type)
          if (typeof clientName === 'string' && 
              (clientName.toLowerCase().includes('conversion alternative') ||
               clientName.toLowerCase().includes('document pdf'))) {
            return true;
          }
          
          // Vérifier numéro de facture (avec vérification de type)
          if (typeof invoiceNumber === 'string' &&
              (invoiceNumber.toLowerCase().includes('conversion alternative') ||
               invoiceNumber.toLowerCase().includes('document pdf'))) {
            return true;
          }
          
          // Vérifier produits
          if (invoice.products && invoice.products.some(product => {
            const text = (product.designation + product.reference + (product.description || '')).toLowerCase();
            return text.includes('conversion alternative') || text.includes('document pdf');
          })) {
            return true;
          }
          
          return false;
        };
        
        // FILTRER toutes les factures corrompues
        const cleanInvoices = invoices.filter(invoice => {
          const isCorrupted = isCorruptedInvoice(invoice);
          if (isCorrupted) {
            console.warn('🗑️ Facture corrompue ignorée:', invoice.client?.name, invoice.number);
          }
          return !isCorrupted;
        });
        
        // Group invoices by client
        cleanInvoices.forEach(invoice => {
          const clientName = invoice.client.name;
          const existing = clientMap.get(clientName) || {
            clientName,
            clientInfo: invoice.client,
            invoices: [],
            totalAmount: 0,
            competitorAmount: 0,
            lastPurchaseDate: invoice.date,
            hasCompetitorProducts: false,
            region: invoice.region || 'France'
          };
          
          existing.invoices.push(invoice);
          existing.totalAmount += invoice.amount;
          
          // Calculate competitor amount with strict filtering
          invoice.products
            .filter(p => {
              // Fonction stricte pour détecter les erreurs de conversion
              const text = [
                p.designation || '',
                p.reference || '',
                p.description || '',
                p.name || ''
              ].join(' ').toLowerCase();
              
              const isConversionError = text.includes('conversion alternative') ||
                                       text.includes('document pdf') ||
                                       text.includes('non extrait') ||
                                       text.includes('pdf - conversion') ||
                                       text.includes('erreur conversion') ||
                                       text.includes('échec extraction');
              
              // Only include real competitor products, not conversion errors
              return !isConversionError && (p.type === 'competitor' || p.isCompetitor);
            })
            .forEach(p => {
              existing.competitorAmount += p.totalPrice;
              existing.hasCompetitorProducts = true;
            });
          
          // Update last purchase date
          if (new Date(invoice.date) > new Date(existing.lastPurchaseDate)) {
            existing.lastPurchaseDate = invoice.date;
          }
          
          clientMap.set(clientName, existing);
        });
        
        // Convert to locations array, only for clients with competitor products
        return Array.from(clientMap.values())
          .filter(client => client.hasCompetitorProducts && client.competitorAmount > 5000) // Seuil minimum
          .map(client => {
            // Get coordinates based on region or use default
            const coordinates = getClientCoordinates(client.clientName, client.region);
            
            // Calculate priority based on competitor amount
            const priority = client.competitorAmount > 100000 ? 'high' : 
                           client.competitorAmount > 50000 ? 'medium' : 'low';
            
            return {
              id: `client-${client.clientName.replace(/\s+/g, '-').toLowerCase()}`,
              lat: coordinates.lat,
              lng: coordinates.lng,
              clientName: client.clientName,
              address: client.clientInfo.address || '',
              competitorAmount: client.competitorAmount,
              reconquestPotential: Math.round(client.competitorAmount * 0.7), // 70% conversion potential
              priority,
              lastPurchaseDate: client.lastPurchaseDate,
              hasReconquestPlan: true // For now, assume all have plans
            };
          })
          .sort((a, b) => b.competitorAmount - a.competitorAmount);
      },
      
      // Computed getters
      getFilteredInvoices: () => {
        const { invoices, searchTerm } = get();
        if (!searchTerm) return invoices;
        
        const term = searchTerm.toLowerCase();
        return invoices.filter(invoice => {
          // CORRECTION: Vérifier les types avant toLowerCase
          const invoiceNumber = typeof invoice.number === 'string' ? invoice.number.toLowerCase() : '';
          const clientName = typeof invoice.client?.name === 'string' ? invoice.client.name.toLowerCase() : '';
          const distributorName = typeof invoice.distributor?.name === 'string' ? invoice.distributor.name.toLowerCase() : '';
          
          return invoiceNumber.includes(term) ||
                 clientName.includes(term) ||
                 distributorName.includes(term) ||
                 invoice.products.some(product => {
                   const designation = typeof product.designation === 'string' ? product.designation.toLowerCase() : '';
                   return designation.includes(term);
                 });
        });
      },
      
      getSortedInvoices: (invoices) => {
        const { sortField, sortDirection } = get();
        
        return [...invoices].sort((a, b) => {
          let valueA: any, valueB: any;
          
          if (sortField === 'date') {
            valueA = new Date(a.date);
            valueB = new Date(b.date);
          } else if (sortField === 'amount') {
            valueA = a.amount;
            valueB = b.amount;
          }
          
          const comparison = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
          return sortDirection === 'desc' ? comparison * -1 : comparison;
        });
      },
      
      // Stats helpers en temps réel - AVEC FILTRAGE
      getTotalInvoices: () => {
        const cleanInvoices = get().invoices.filter(inv => {
          const clientName = inv.client?.name || '';
          // CORRECTION: Vérifier que clientName est une chaîne
          if (typeof clientName !== 'string') return true;
          const lowercaseClientName = clientName.toLowerCase();
          return !lowercaseClientName.includes('conversion alternative') &&
                 !lowercaseClientName.includes('document pdf');
        });
        return cleanInvoices.length;
      },
      getTotalClients: () => {
        const cleanInvoices = get().invoices.filter(inv => {
          const clientName = inv.client?.name || '';
          // CORRECTION: Vérifier que clientName est une chaîne
          if (typeof clientName !== 'string') return true;
          const lowercaseClientName = clientName.toLowerCase();
          return !lowercaseClientName.includes('conversion alternative') &&
                 !lowercaseClientName.includes('document pdf');
        });
        return new Set(cleanInvoices.map(inv => inv.client.name)).size;
      },
      getTotalPotential: () => {
        const cleanInvoices = get().invoices.filter(inv => {
          const clientName = inv.client?.name || '';
          // CORRECTION: Vérifier que clientName est une chaîne
          if (typeof clientName !== 'string') return true;
          const lowercaseClientName = clientName.toLowerCase();
          return !lowercaseClientName.includes('conversion alternative') &&
                 !lowercaseClientName.includes('document pdf');
        });
        return cleanInvoices.reduce((sum, inv) => sum + inv.potential, 0);
      },
      getCompetitorBrandsCount: () => {
        const brands = new Set();
        const cleanInvoices = get().invoices.filter(inv => {
          const clientName = inv.client?.name || '';
          // CORRECTION: Vérifier que clientName est une chaîne
          if (typeof clientName !== 'string') return true;
          const lowercaseClientName = clientName.toLowerCase();
          return !lowercaseClientName.includes('conversion alternative') &&
                 !lowercaseClientName.includes('document pdf');
        });
        cleanInvoices.forEach(invoice => {
          invoice.products
            .filter(p => {
              // CORRECTION: Vérifier les types avant toLowerCase
              const designation = typeof p.designation === 'string' ? p.designation : '';
              const reference = typeof p.reference === 'string' ? p.reference : '';
              const description = typeof p.description === 'string' ? p.description : '';
              const text = (designation + reference + description).toLowerCase();
              return p.type === 'competitor' && 
                     !text.includes('conversion alternative') && 
                     !text.includes('document pdf');
            })
            .forEach(p => {
              const brand = p.competitor?.brand || 'Marque extraite';
              // CORRECTION: Vérifier que brand est une chaîne
              if (typeof brand === 'string') {
                const lowercaseBrand = brand.toLowerCase();
                if (!lowercaseBrand.includes('conversion alternative') && 
                    !lowercaseBrand.includes('document pdf')) {
                  brands.add(brand);
                }
              }
            });
        });
        return brands.size;
      },
      
      // Informations sur le stockage avec état de chargement
      getStorageInfo: () => {
        const invoices = get().invoices;
        const dataSize = JSON.stringify(invoices).length;
        const formattedSize = dataSize > 1024 * 1024 
          ? `${(dataSize / 1024 / 1024).toFixed(2)} MB`
          : dataSize > 1024 
            ? `${(dataSize / 1024).toFixed(2)} KB`
            : `${dataSize} bytes`;
        
        return {
          totalInvoices: invoices.length,
          totalSize: formattedSize,
          lastSaved: new Date().toLocaleString('fr-FR'),
          isLoaded: true // Toujours true car les données sont chargées
        };
      },
      
      // Forcer la sauvegarde manuelle (debug)
      forceSave: () => {
        const state = get();
        // La persistance se fait automatiquement via Zustand
      },
      
      // Fonction de nettoyage d'urgence
      purgeCorruptedData: () => {
        const state = get();
        console.log('🧹 Nettoyage d\'urgence des données corrompues...');
        
        const beforeCount = state.invoices.length;
        const cleanInvoices = state.invoices.filter(invoice => {
          const clientName = invoice.client?.name || '';
          const invoiceNumber = invoice.number || '';
          
          // CORRECTION: Vérifier que ce sont des chaînes avant toLowerCase
          const isCorrupted = (typeof clientName === 'string' && clientName.toLowerCase().includes('conversion alternative')) ||
                             (typeof clientName === 'string' && clientName.toLowerCase().includes('document pdf')) ||
                             (typeof invoiceNumber === 'string' && invoiceNumber.toLowerCase().includes('conversion alternative')) ||
                             (typeof invoiceNumber === 'string' && invoiceNumber.toLowerCase().includes('document pdf'));
          
          if (isCorrupted) {
            console.warn('🗑️ Facture éliminée:', clientName, invoiceNumber);
          }
          
          return !isCorrupted;
        });
        
        if (beforeCount !== cleanInvoices.length) {
          console.log(`🧹 ${beforeCount - cleanInvoices.length} factures corrompues éliminées`);
          set({ 
            invoices: cleanInvoices,
            competitorProducts: [],
            opportunities: [],
            reconquestPlans: [],
            reconquestSummary: null,
            stats: initialStats
          });
          updateAllStats(cleanInvoices, set);
        }
      }
    }),
    persistConfig
  )
);

// Fonction unifiée pour mettre à jour TOUTES les stats automatiquement avec PERSISTANCE
function updateAllStats(invoices: Invoice[], set: any) {
  const stats = calculateStatsFromInvoices(invoices);
  const opportunities = generateOpportunitiesFromInvoices(invoices);
  const competitorProducts = extractCompetitorProducts(invoices);
  const analysisResults = calculateAnalysisResults(invoices);
  
  set({ 
    stats, 
    opportunities, 
    competitorProducts, 
    analysisResults 
  });
  
}

// Fonction pour calculer les résultats d'analyse - SEULEMENT sur vraies données
function calculateAnalysisResults(invoices: Invoice[]): AnalysisResult {
  if (invoices.length === 0) {
    return initialAnalysisResults;
  }
  
  const lastInvoice = invoices[0];
  const totalProducts = invoices.reduce((sum, inv) => sum + inv.products.length, 0);
  const competitorBrandsSet = new Set();
  
  invoices.forEach(invoice => {
    invoice.products
      .filter(p => {
        // CORRECTION: Exclure les produits avec "conversion alternative" avec vérification de type
        if (p.designation && typeof p.designation === 'string' && p.designation.toLowerCase().includes('conversion alternative')) {
          return false;
        }
        if (p.reference && typeof p.reference === 'string' && p.reference.toLowerCase().includes('conversion alternative')) {
          return false;
        }
        // Vérifier les deux formats possibles
        return p.type === 'competitor' || (p as any).isCompetitor === true;
      })
      .forEach(p => {
        const brand = p.competitor?.brand || (p as any).brand || 'marque inconnue';
        // CORRECTION: Ne pas ajouter "conversion alternative" comme marque avec vérification de type
        if (typeof brand === 'string' && !brand.toLowerCase().includes('conversion alternative')) {
          competitorBrandsSet.add(brand);
        }
      });
  });
  
  const opportunities = generateOpportunitiesFromInvoices(invoices);
  const totalPotential = invoices.reduce((sum, inv) => sum + inv.potential, 0);
  
  return {
    lastInvoice: lastInvoice.client.name,
    detectedProducts: `${totalProducts} produits analysés`,
    competitorBrands: `${competitorBrandsSet.size} marques identifiées`,
    opportunitiesGenerated: `${opportunities.length} opportunités créées`,
    estimatedPotential: totalPotential
  };
}

// Fonction pour calculer les stats - SEULEMENT sur vraies données
function calculateStatsFromInvoices(invoices: Invoice[]): DashboardStats {
  const invoicesCount = invoices.length;
  const clientsSet = new Set(invoices.map(inv => inv.client.name));
  const clientsCount = clientsSet.size;
  const totalPotential = invoices.reduce((sum, inv) => sum + inv.potential, 0);
  
  return {
    invoicesAnalyzed: { 
      value: invoicesCount, 
      trend: Math.max(0, invoicesCount), 
      trendDirection: 'up' 
    },
    clientsIdentified: { 
      value: clientsCount, 
      trend: Math.max(0, clientsCount), 
      trendDirection: 'up' 
    },
    businessPotential: { 
      value: totalPotential, 
      trend: Math.max(0, totalPotential * 0.1), 
      trendDirection: 'up' 
    }
  };
}

// Générer des opportunités - SEULEMENT à partir des vraies factures
function generateOpportunitiesFromInvoices(invoices: Invoice[]): Opportunity[] {
  if (invoices.length === 0) return [];
  
  const clientMap = new Map();
  
  invoices.forEach(invoice => {
    const clientName = invoice.client.name;
    const existing = clientMap.get(clientName) || {
      client: clientName,
      distributor: invoice.distributor.name,
      region: invoice.region || 'France',
      volume: 0,
      potential: 0,
      competitorProducts: new Set(),
      invoiceCount: 0
    };
    
    existing.volume += invoice.amount;
    existing.potential += invoice.potential;
    existing.invoiceCount += 1;
    
    invoice.products
      .filter(p => {
        // CORRECTION: Exclure les produits avec "conversion alternative" avec vérification de type
        const isConversionError = (p.designation && typeof p.designation === 'string' && p.designation.toLowerCase().includes('conversion alternative')) ||
                                 (p.reference && typeof p.reference === 'string' && p.reference.toLowerCase().includes('conversion alternative'));
        return !isConversionError && p.type === 'competitor';
      })
      .forEach(p => existing.competitorProducts.add(p.designation));
    
    clientMap.set(clientName, existing);
  });
  
  return Array.from(clientMap.values())
    .filter(client => client.volume > 0)
    .map((client, index) => ({
      id: `opp-${index}`,
      title: client.client,
      subtitle: `via ${client.distributor} • ${client.region}`,
      client: client.client,
      distributor: client.distributor,
      region: client.region,
      volume: client.volume,
      potential: client.potential,
      trend: Math.floor(Math.random() * 30) + 5,
      priority: client.potential > 50000 ? 'high' : client.potential > 20000 ? 'medium' : 'low',
      description: `Client avec ${client.invoiceCount} facture(s) analysée(s) représentant un potentiel commercial.`,
      detectedProducts: Array.from(client.competitorProducts).slice(0, 3),
      badge: client.invoiceCount > 2 ? 'Client récurrent' : 'Nouvelle opportunité'
    }));
}

// Extraire les produits concurrents - SEULEMENT des vraies factures
function extractCompetitorProducts(invoices: Invoice[]): CompetitorProduct[] {
  if (invoices.length === 0) return [];
  
  const productMap = new Map();
  
  // FONCTION ULTRA-STRICTE pour détecter la corruption
  const isCorruptedData = (text: any) => {
    // 🔧 CORRECTION: Vérifier que text est une chaîne
    if (typeof text !== 'string') return false;
    
    const lowercaseText = text.toLowerCase();
    return lowercaseText.includes('conversion alternative') ||
           lowercaseText.includes('document pdf') ||
           lowercaseText.includes('non extrait') ||
           lowercaseText.includes('pdf - conversion') ||
           lowercaseText.includes('erreur conversion') ||
           lowercaseText.includes('échec extraction');
  };
  
  invoices.forEach(invoice => {
    // IGNORER complètement les factures corrompues
    // 🔧 CORRECTION: Gérer les cas où client est un objet ou une chaîne
    let clientName = '';
    if (typeof invoice.client === 'string') {
      clientName = invoice.client;
    } else if (invoice.client?.name) {
      clientName = invoice.client.name;
    }
    
    if (isCorruptedData(clientName)) {
      console.warn('🚫 Facture ignorée (client corrompu):', clientName);
      return;
    }
    
    invoice.products
      .filter(p => {
        // VÉRIFICATION ULTRA-STRICTE de chaque champ
        const designation = p.designation || '';
        const reference = p.reference || '';
        const description = p.description || '';
        const brand = p.competitor?.brand || (p as any).brand || '';
        
        if (isCorruptedData(designation) || 
            isCorruptedData(reference) || 
            isCorruptedData(description) || 
            isCorruptedData(brand)) {
          console.warn('🚫 Produit ignoré (corruption détectée):', { designation, reference, brand });
          return false;
        }
        
        // Vérifier les deux formats possibles
        return p.type === 'competitor' || (p as any).isCompetitor === true;
      })
      .forEach(product => {
        const brand = product.competitor?.brand || (product as any).brand || 'marque inconnue';
        
        // DOUBLE VÉRIFICATION de la marque
        if (isCorruptedData(brand)) {
          console.warn('🚫 Marque ignorée (corruption):', brand);
          return;
        }
        
        const existing = productMap.get(brand) || { name: brand, amount: 0 };
        existing.amount += product.totalPrice || 0;
        productMap.set(brand, existing);
      });
  });
  
  const products = Array.from(productMap.values());
  const total = products.reduce((sum, p) => sum + p.amount, 0);
  
  return products
    .map(product => ({
      ...product,
      percentage: total > 0 ? Math.round((product.amount / total) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

// Coordonnées des régions françaises
function getRegionCoordinates(region: string): { lat: number; lng: number } {
  const coordinates: Record<string, { lat: number; lng: number }> = {
    'Île-de-France': { lat: 48.8566, lng: 2.3522 },
    'Auvergne-Rhône-Alpes': { lat: 45.7640, lng: 4.8357 },
    'Hauts-de-France': { lat: 50.4801, lng: 2.7931 },
    'Grand Est': { lat: 48.5734, lng: 7.7521 },
    'Nouvelle-Aquitaine': { lat: 44.8378, lng: -0.5792 },
    'Occitanie': { lat: 43.6047, lng: 1.4442 },
    'Pays de la Loire': { lat: 47.4784, lng: -0.5632 },
    'Bretagne': { lat: 48.2020, lng: -2.9326 },
    'Normandie': { lat: 49.1829, lng: -0.3707 },
    'Bourgogne-Franche-Comté': { lat: 47.2808, lng: 4.9994 },
    'Centre-Val de Loire': { lat: 47.7516, lng: 1.6751 },
    'Provence-Alpes-Côte d\'Azur': { lat: 43.9352, lng: 6.0679 },
    'Corse': { lat: 42.0396, lng: 9.0129 },
    'France': { lat: 46.603354, lng: 1.888334 }
  };
  
  return coordinates[region] || coordinates['France'];
}

// Fonction pour obtenir les coordonnées d'un client spécifique
function getClientCoordinates(clientName: string, region: string): { lat: number; lng: number } {
  // Coordonnées spécifiques pour certains clients importants
  const specificClients: Record<string, { lat: number; lng: number }> = {
    'REMY PHILIPPE': { lat: 48.9352, lng: 2.4406 }, // Exemple: Villepinte
    'PRO-ETANCHE': { lat: 43.6047, lng: 1.4442 }, // Toulouse
    'ÉTABLISSEMENTS DELCROIX': { lat: 50.4801, lng: 2.7931 }, // Hauts-de-France
    // Ajouter d'autres clients ici si nécessaire
  };
  
  // Si le client a des coordonnées spécifiques, les utiliser
  if (specificClients[clientName]) {
    return specificClients[clientName];
  }
  
  // Sinon, utiliser les coordonnées de la région
  return getRegionCoordinates(region);
}