import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TagIcon,
  EyeIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useProductTraceability } from '../../hooks/useProductTraceability';
import { ProductTraceabilityModal } from './ProductTraceabilityModal';
import { useDashboardStore } from '../../store/dashboardStore';

export const CompetitorProductsView: React.FC = () => {
  const { getAllCompetitorBrands, selectedBrandData, isModalOpen, showBrandDetails, closeModal } = useProductTraceability();
  const { setSelectedInvoice } = useDashboardStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  const competitorBrands = getAllCompetitorBrands();
  
  // Filtrer les marques selon la recherche
  const filteredBrands = competitorBrands.filter(brand =>
    brand.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalCompetitorAmount = competitorBrands.reduce((sum, brand) => sum + brand.total, 0);
  
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };
  
  // Limiter l'affichage initial à 5 marques
  const displayedBrands = showAll ? filteredBrands : filteredBrands.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* En-tête compact */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-red-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Produits Concurrents
          </h3>
          <span className="text-sm text-gray-500">({competitorBrands.length})</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{formatAmount(totalCompetitorAmount)}</p>
        </div>
      </div>

      {/* Barre de recherche compacte */}
      {competitorBrands.length > 5 && (
        <div className="mb-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Statistiques en ligne compacte */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
        <span>{competitorBrands.reduce((sum, brand) => sum + brand.invoiceCount, 0)} factures</span>
        <span>•</span>
        <span>Potentiel: <strong className="text-gray-900">{formatAmount(totalCompetitorAmount * 0.7)}</strong></span>
      </div>

      {/* Liste des marques concurrentes - Vue compacte */}
      <div className="space-y-2">
        {filteredBrands.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <TagIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune marque concurrente trouvée</p>
          </div>
        ) : (
          <>
            {displayedBrands.map((brand, index) => {
              const percentage = (brand.total / totalCompetitorAmount) * 100;
              return (
                <motion.div
                  key={brand.brand}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors"
                  onClick={() => showBrandDetails(brand.brand)}
                >
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0
                        ${index < 3 ? 'bg-red-500' : 'bg-gray-400'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 group-hover:text-red-600 transition-colors truncate">
                          {brand.brand}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{brand.invoiceCount} facture{brand.invoiceCount > 1 ? 's' : ''}</span>
                          <span>{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900">{formatAmount(brand.total)}</p>
                      <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                    </div>
                  </div>
                  
                  {/* Barre de progression compacte */}
                  <div className="px-2 pb-2">
                    <div className="w-full bg-gray-100 rounded-full h-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                        className={`h-1 rounded-full ${index < 3 ? 'bg-red-400' : 'bg-gray-300'}`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Bouton voir plus/moins */}
            {filteredBrands.length > 5 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAll(!showAll);
                }}
                className="w-full text-center py-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAll ? 'Voir moins' : `Voir ${filteredBrands.length - 5} marques de plus`}
              </button>
            )}
          </>
        )}
      </div>


      {/* Modal de traçabilité */}
      {selectedBrandData && (
        <ProductTraceabilityModal
          isOpen={isModalOpen}
          onClose={closeModal}
          productBrand={selectedBrandData.brand}
          invoiceDetails={selectedBrandData.invoiceDetails}
          totalAmount={selectedBrandData.totalAmount}
          onInvoiceClick={(invoiceNumber) => {
            closeModal();
            setSelectedInvoice(invoiceNumber);
            // Optionnel : faire défiler jusqu'à la facture
            setTimeout(() => {
              const element = document.querySelector(`[data-invoice="${invoiceNumber}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }}
        />
      )}
    </div>
  );
};