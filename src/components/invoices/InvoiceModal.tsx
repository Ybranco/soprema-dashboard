import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { InvoiceList } from './InvoiceList';
import { InvoiceUpload } from './InvoiceUpload';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useDashboardStore } from '../../store/dashboardStore';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  DocumentIcon, 
  TrashIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  ArrowsUpDownIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  BuildingStorefrontIcon,
  TagIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Tooltip } from '../common/Tooltip';

type SortField = 'date' | 'amount' | 'client' | 'distributor' | 'number' | 'potential';
type SortDirection = 'asc' | 'desc';

interface FilterOptions {
  clientSearch: string;
  distributorSearch: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  hasCompetitorProducts: boolean;
  hasSopremaProducts: boolean;
}

export const InvoiceModal: React.FC = () => {
  const { 
    isInvoiceModalOpen, 
    closeInvoiceModal, 
    invoices,
    clearAllInvoices,
    getTotalInvoices,
    getTotalClients,
    getTotalPotential
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list');
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  
  // États pour la recherche et tri avancés
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    clientSearch: '',
    distributorSearch: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    hasCompetitorProducts: false,
    hasSopremaProducts: false
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleClearAll = () => {
    clearAllInvoices();
    setClearAllDialogOpen(false);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      clientSearch: '',
      distributorSearch: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
      hasCompetitorProducts: false,
      hasSopremaProducts: false
    });
    setCurrentPage(1);
  };

  // Filtrage et tri avancés
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      // Recherche globale
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesGlobal = 
          invoice.number.toLowerCase().includes(term) ||
          invoice.client.name.toLowerCase().includes(term) ||
          invoice.distributor.name.toLowerCase().includes(term) ||
          invoice.products.some(product => 
            product.designation.toLowerCase().includes(term) ||
            product.reference.toLowerCase().includes(term)
          );
        if (!matchesGlobal) return false;
      }

      // Filtres spécifiques
      if (filters.clientSearch && !invoice.client.name.toLowerCase().includes(filters.clientSearch.toLowerCase())) {
        return false;
      }

      if (filters.distributorSearch && !invoice.distributor.name.toLowerCase().includes(filters.distributorSearch.toLowerCase())) {
        return false;
      }

      if (filters.minAmount && invoice.amount < parseFloat(filters.minAmount)) {
        return false;
      }

      if (filters.maxAmount && invoice.amount > parseFloat(filters.maxAmount)) {
        return false;
      }

      if (filters.startDate && new Date(invoice.date) < new Date(filters.startDate)) {
        return false;
      }

      if (filters.endDate && new Date(invoice.date) > new Date(filters.endDate)) {
        return false;
      }

      if (filters.hasCompetitorProducts && !invoice.products.some(p => p.type === 'competitor')) {
        return false;
      }

      if (filters.hasSopremaProducts && !invoice.products.some(p => p.type === 'soprema')) {
        return false;
      }

      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortField) {
        case 'date':
          valueA = new Date(a.date);
          valueB = new Date(b.date);
          break;
        case 'amount':
          valueA = a.amount;
          valueB = b.amount;
          break;
        case 'potential':
          valueA = a.potential;
          valueB = b.potential;
          break;
        case 'client':
          valueA = a.client.name.toLowerCase();
          valueB = b.client.name.toLowerCase();
          break;
        case 'distributor':
          valueA = a.distributor.name.toLowerCase();
          valueB = b.distributor.name.toLowerCase();
          break;
        case 'number':
          valueA = a.number.toLowerCase();
          valueB = b.number.toLowerCase();
          break;
        default:
          valueA = a.date;
          valueB = b.date;
      }

      const comparison = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });

    return filtered;
  }, [invoices, searchTerm, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredAndSortedInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M€`;
    }
    if (amount >= 1000) {
      return `${Math.floor(amount / 1000)}K€`;
    }
    return `${amount}€`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowsUpDownIcon className="w-4 h-4 text-blue-600 transform rotate-180" /> :
      <ArrowsUpDownIcon className="w-4 h-4 text-blue-600" />;
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.clientSearch) count++;
    if (filters.distributorSearch) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.hasCompetitorProducts) count++;
    if (filters.hasSopremaProducts) count++;
    return count;
  }, [filters]);

  const tooltipContent = (
    <div>
      <p>Interface avancée de gestion des factures avec recherche, tri et filtres puissants.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Fonctionnalités avancées</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Recherche globale dans tous les champs</li>
          <li>Filtres avancés par client, distributeur, montant, dates</li>
          <li>Tri sur toutes les colonnes (cliquez sur les en-têtes)</li>
          <li>Vue accordéon pour voir les détails de chaque facture</li>
          <li>Pagination automatique pour de gros volumes</li>
          <li>Suppression individuelle ou en masse</li>
          <li>Persistance automatique de toutes les données</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-3 border-blue-600">
        <strong>Interface moderne :</strong> Tout est optimisé pour gérer facilement des centaines de factures avec performance et clarté.
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isInvoiceModalOpen}
      onClose={closeInvoiceModal}
      title={
        <div className="flex items-center gap-3">
          <DocumentIcon className="w-6 h-6" />
          Gestion Avancée des Factures
          <Tooltip content={tooltipContent} title="Gestion avancée des factures" />
          {filteredAndSortedInvoices.length !== invoices.length && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
              {filteredAndSortedInvoices.length}/{invoices.length} affichées
            </span>
          )}
        </div>
      }
      maxWidth="6xl"
    >
      <div className="h-full flex flex-col">
        {/* Tabs avec statistiques */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'list'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Bars3BottomLeftIcon className="w-5 h-5" />
                Liste avancée ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'upload'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <PlusIcon className="w-5 h-5" />
                Ajouter factures
              </button>
            </div>

            {/* Statistiques rapides et bouton "Effacer tout" */}
            {invoices.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{getTotalInvoices()}</div>
                    <div className="text-gray-500">Factures</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{getTotalClients()}</div>
                    <div className="text-gray-500">Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">{formatAmount(getTotalPotential())}</div>
                    <div className="text-gray-500">Potentiel</div>
                  </div>
                </div>

                <button
                  onClick={() => setClearAllDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  title="Supprimer toutes les factures et remettre l'application à zéro"
                >
                  <TrashIcon className="w-4 h-4" />
                  Effacer tout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'list' ? (
            <div className="h-full flex flex-col">
              {/* Barre de recherche et filtres avancés */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                {/* Recherche globale */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Recherche globale (numéro, client, distributeur, produits...)"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors text-sm font-medium ${
                      showFilters || activeFiltersCount > 0
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FunnelIcon className="w-4 h-4" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  {(searchTerm || activeFiltersCount > 0) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Effacer
                    </button>
                  )}
                </div>

                {/* Résultats de recherche */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {filteredAndSortedInvoices.length} facture{filteredAndSortedInvoices.length !== 1 ? 's' : ''}
                    {searchTerm || activeFiltersCount > 0 ? ` (sur ${invoices.length} total)` : ''}
                  </span>
                  {totalPages > 1 && (
                    <span>
                      Page {currentPage} sur {totalPages}
                    </span>
                  )}
                </div>

                {/* Filtres avancés */}
                {showFilters && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Filtre client */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client
                        </label>
                        <input
                          type="text"
                          placeholder="Nom du client..."
                          value={filters.clientSearch}
                          onChange={(e) => setFilters(prev => ({ ...prev, clientSearch: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Filtre distributeur */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distributeur
                        </label>
                        <input
                          type="text"
                          placeholder="Nom du distributeur..."
                          value={filters.distributorSearch}
                          onChange={(e) => setFilters(prev => ({ ...prev, distributorSearch: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Montant min */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant min (€)
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={filters.minAmount}
                          onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Montant max */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant max (€)
                        </label>
                        <input
                          type="number"
                          placeholder="999999"
                          value={filters.maxAmount}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Date début */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date début
                        </label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Date fin */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date fin
                        </label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Checkboxes pour types de produits */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Types de produits
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filters.hasCompetitorProducts}
                              onChange={(e) => setFilters(prev => ({ ...prev, hasCompetitorProducts: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-red-700">Avec produits concurrents</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filters.hasSopremaProducts}
                              onChange={(e) => setFilters(prev => ({ ...prev, hasSopremaProducts: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-green-700">Avec produits SOPREMA</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* En-têtes de colonnes avec tri */}
              {filteredAndSortedInvoices.length > 0 && (
                <div className="bg-gray-100 border-b border-gray-200 px-6 py-3">
                  <div className="grid grid-cols-7 gap-4 text-sm font-semibold text-gray-700">
                    <button
                      onClick={() => handleSort('number')}
                      className="flex items-center gap-1 hover:text-blue-600 text-left"
                    >
                      <DocumentIcon className="w-4 h-4" />
                      N° Facture
                      {getSortIcon('number')}
                    </button>
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-blue-600 text-left"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Date
                      {getSortIcon('date')}
                    </button>
                    <button
                      onClick={() => handleSort('client')}
                      className="flex items-center gap-1 hover:text-blue-600 text-left"
                    >
                      <BuildingStorefrontIcon className="w-4 h-4" />
                      Client
                      {getSortIcon('client')}
                    </button>
                    <button
                      onClick={() => handleSort('distributor')}
                      className="flex items-center gap-1 hover:text-blue-600 text-left"
                    >
                      <BuildingStorefrontIcon className="w-4 h-4" />
                      Distributeur
                      {getSortIcon('distributor')}
                    </button>
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1 hover:text-blue-600 text-left"
                    >
                      <CurrencyEuroIcon className="w-4 h-4" />
                      Montant
                      {getSortIcon('amount')}
                    </button>
                    <button
                      onClick={() => handleSort('potential')}
                      className="flex items-center gap-1 hover:text-blue-600 text-left"
                    >
                      <TagIcon className="w-4 h-4" />
                      Potentiel
                      {getSortIcon('potential')}
                    </button>
                    <div className="text-center">Actions</div>
                  </div>
                </div>
              )}

              {/* Liste des factures avec accordéon */}
              <div className="flex-1 overflow-y-auto">
                {filteredAndSortedInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium mb-2">
                      {invoices.length === 0 ? 'Aucune facture trouvée' : 'Aucun résultat'}
                    </h3>
                    <p className="text-sm text-center max-w-md">
                      {invoices.length === 0 
                        ? "Commencez par ajouter une facture dans l'onglet 'Ajouter factures' pour voir vos données s'afficher ici."
                        : "Aucune facture ne correspond à vos critères de recherche. Essayez de modifier les filtres."
                      }
                    </p>
                    {(searchTerm || activeFiltersCount > 0) && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Effacer tous les filtres
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <InvoiceList invoices={paginatedInvoices} />
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedInvoices.length)} sur {filteredAndSortedInvoices.length} factures
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Précédent
                            </button>
                            <div className="flex gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 text-sm border rounded ${
                                      page === currentPage
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 hover:bg-gray-100'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Suivant
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              <InvoiceUpload />
            </div>
          )}
        </div>

        {/* Dialog de confirmation pour "Effacer tout" */}
        <ConfirmDialog
          isOpen={clearAllDialogOpen}
          onClose={() => setClearAllDialogOpen(false)}
          onConfirm={handleClearAll}
          title="Effacer toutes les factures"
          message={`Êtes-vous sûr de vouloir supprimer TOUTES les ${invoices.length} factures ? Cette action est irréversible et va :

• Supprimer toutes les factures analysées
• Effacer tous les clients identifiés  
• Remettre toutes les statistiques à zéro
• Supprimer toutes les opportunités commerciales
• Effacer tous les plans de reconquête client
• Vider complètement les graphiques et la carte

L'application reviendra à son état initial, comme si aucune facture n'avait jamais été analysée.`}
          confirmText="Oui, tout effacer"
          cancelText="Annuler"
          isDangerous={true}
        />
      </div>
    </Modal>
  );
};