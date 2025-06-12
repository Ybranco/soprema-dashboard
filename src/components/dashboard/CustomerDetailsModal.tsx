import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../common/Modal';
import { 
  CalendarIcon, 
  CurrencyEuroIcon, 
  ShoppingCartIcon, 
  BuildingStorefrontIcon,
  TrendingUpIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  IdentificationIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ProductTraceabilityModal } from './ProductTraceabilityModal';
import { useProductTraceability } from '../../hooks/useProductTraceability';
import { useDashboardStore } from '../../store/dashboardStore';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ isOpen, onClose, profile }) => {
  const { selectedBrandData, isModalOpen, showBrandDetails, closeModal } = useProductTraceability();
  const { setSelectedInvoice } = useDashboardStore();
  
  if (!profile) return null;

  // Créer des structures par défaut pour éviter les erreurs
  const analysis = profile.analysis || {
    totalInvoices: 0,
    totalAmount: 0,
    sopremaAmount: 0,
    competitorAmount: 0,
    sopremaShare: '0',
    topCompetitorBrands: [],
    lastPurchaseDate: Date.now(),
    purchaseFrequency: null
  };

  const clientInfo = profile.clientInfo || {
    name: profile.clientName || 'Client',
    address: undefined,
    siret: undefined
  };

  const reconquestStrategy = profile.reconquestStrategy || {
    priority: 'medium',
    targetProducts: [],
    estimatedPotential: 0,
    suggestedActions: []
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  const competitorPercentage = 100 - parseFloat(analysis.sopremaShare);
  const nextPurchaseDate = analysis.purchaseFrequency 
    ? analysis.lastPurchaseDate + (analysis.purchaseFrequency * 24 * 60 * 60 * 1000)
    : null;
  const isOverdue = nextPurchaseDate && Date.now() > nextPurchaseDate;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        size="large"
      >
      <div className="relative">
        {/* Contour et espacement ajoutés */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 opacity-50 -m-6 rounded-2xl"></div>
        <div className="relative space-y-6 p-6 -m-6 rounded-2xl border-2 border-gray-200 bg-white shadow-inner">
          {/* Header moderne avec gradient */}
          <div className="relative -m-6 mb-6 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">{profile.clientName}</h2>
              <div className="flex items-center gap-4 text-blue-100">
                {clientInfo.address && (
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="text-sm">{clientInfo.address}</span>
                  </div>
                )}
                {clientInfo.siret && (
                  <div className="flex items-center gap-1">
                    <IdentificationIcon className="w-4 h-4" />
                    <span className="text-sm">{clientInfo.siret}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-blue-100 mb-1">Montant concurrent</p>
              <p className="text-3xl font-bold">{formatCurrency(analysis.competitorAmount)}</p>
            </div>
          </div>
        </div>

        {/* KPIs en cards modernes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-3">
              <ShoppingCartIcon className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{analysis.totalInvoices}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Factures analysées</p>
            <p className="text-xs text-gray-500 mt-1">Historique complet</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200"
          >
            <div className="flex items-center justify-between mb-3">
              <CurrencyEuroIcon className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">
                {Math.round(analysis.totalAmount).toLocaleString()}€
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Chiffre d'affaires total</p>
            <p className="text-xs text-gray-500 mt-1">Toutes factures confondues</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200"
          >
            <div className="flex items-center justify-between mb-3">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">
                {analysis.purchaseFrequency || 'N/A'}j
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Fréquence d'achat</p>
            <p className="text-xs text-gray-500 mt-1">Moyenne entre commandes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200"
          >
            <div className="flex items-center justify-between mb-3">
              <BuildingStorefrontIcon className="w-8 h-8 text-orange-600" />
              <span className="text-3xl font-bold text-gray-900">{analysis.sopremaShare}%</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Part Soprema</p>
            <p className="text-xs text-gray-500 mt-1">Sur le CA total</p>
          </motion.div>
        </div>

        {/* Graphique de répartition visuel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <ChartPieIcon className="w-6 h-6 text-gray-600" />
            Répartition du chiffre d'affaires
          </h3>
          
          <div className="space-y-6">
            {/* Barre de progression visuelle */}
            <div className="relative">
              <div className="flex h-16 rounded-xl overflow-hidden shadow-inner bg-gray-100">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.sopremaShare}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold"
                >
                  {analysis.sopremaShare > 10 && 'SOPREMA'}
                </motion.div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${competitorPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold"
                >
                  {competitorPercentage > 10 && 'CONCURRENTS'}
                </motion.div>
              </div>
              
              {/* Indicateur de pourcentage au milieu */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-lg border-2 border-gray-300">
                <span className="text-sm font-bold text-gray-700">{analysis.sopremaShare}% / {competitorPercentage}%</span>
              </div>
            </div>

            {/* Détails chiffrés */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-gray-600 mb-1">Produits Soprema</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(analysis.sopremaAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">Objectif: augmenter cette part</p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm font-medium text-gray-600 mb-1">Produits Concurrents</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(analysis.competitorAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">Potentiel de conversion</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top marques concurrentes avec design moderne */}
        {analysis.topCompetitorBrands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              Marques concurrentes à cibler
            </h3>
            
            <div className="space-y-3">
              {analysis.topCompetitorBrands.map((brand: any, index: number) => {
                const percentage = (brand.amount / analysis.competitorAmount) * 100;
                return (
                  <div key={index} className="relative bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                     onClick={() => showBrandDetails(brand.brand)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                          ${index === 0 ? 'bg-red-600' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'}
                        `}>
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{brand.brand}</span>
                        <EyeIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-lg">{formatCurrency(brand.amount)}</p>
                        <p className="text-xs text-gray-600">{percentage.toFixed(1)}% des concurrents</p>
                        <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Cliquez pour voir les factures</p>
                      </div>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * index }}
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-red-600' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Timeline d'achat avec alerte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`rounded-xl p-6 border-2 ${
            isOverdue 
              ? 'bg-red-50 border-red-300' 
              : 'bg-green-50 border-green-300'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className={`w-6 h-6 ${isOverdue ? 'text-red-600' : 'text-green-600'}`} />
            Analyse temporelle
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Dernier achat</p>
              <p className="font-bold text-gray-900">{formatDate(analysis.lastPurchaseDate)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Il y a {Math.floor((Date.now() - analysis.lastPurchaseDate) / (1000 * 60 * 60 * 24))} jours
              </p>
            </div>
            
            {analysis.purchaseFrequency && (
              <>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Fréquence moyenne</p>
                  <p className="font-bold text-gray-900">Tous les {analysis.purchaseFrequency} jours</p>
                  <p className="text-xs text-gray-500 mt-1">Basé sur l'historique</p>
                </div>
                
                <div className={`rounded-lg p-4 ${isOverdue ? 'bg-red-100' : 'bg-green-100'}`}>
                  <p className="text-sm font-medium text-gray-600 mb-1">Prochain achat estimé</p>
                  <p className={`font-bold ${isOverdue ? 'text-red-700' : 'text-green-700'}`}>
                    {nextPurchaseDate ? formatDate(nextPurchaseDate) : 'Données insuffisantes'}
                  </p>
                  {isOverdue && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ En retard - Contact urgent recommandé
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer le profil
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Fermer
          </button>
        </div>
        </div>
      </div>
    </Modal>
    
    {/* Modal de traçabilité des produits */}
    {selectedBrandData && (
      <ProductTraceabilityModal
        isOpen={isModalOpen}
        onClose={closeModal}
        productBrand={selectedBrandData.brand}
        invoiceDetails={selectedBrandData.invoiceDetails}
        totalAmount={selectedBrandData.totalAmount}
        onInvoiceClick={(invoiceNumber) => {
          // Fermer les modals et afficher la facture
          closeModal();
          onClose();
          setSelectedInvoice(invoiceNumber);
        }}
      />
    )}
    </>
  );
};