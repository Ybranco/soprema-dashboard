import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BuildingOfficeIcon, DocumentTextIcon, CurrencyEuroIcon, UsersIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { StatCard } from './components/dashboard/StatCard';
import { CompetitorChart } from './components/dashboard/CompetitorChart';
import { GeographicMap } from './components/dashboard/GeographicMap';
import { SalesComparison } from './components/dashboard/SalesComparison';
import { ReconquestDashboard } from './components/dashboard/ReconquestDashboard';
import { CompetitorProductsView } from './components/dashboard/CompetitorProductsView';
import { InvoiceModal } from './components/invoices/InvoiceModal';
import { useDashboardStore } from './store/dashboardStore';
import { generateDemoInvoices } from './utils/demoData';

function App() {
  const { 
    stats, 
    competitorProducts, 
    invoices,
    setInvoices,
    openInvoiceModal,
    getStorageInfo
  } = useDashboardStore();

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // L'application démarre avec les données persistées ou vides
  useEffect(() => {
    // Vérifier si on a des données persistées
    const storageInfo = getStorageInfo();
    
    // Si on est sur Netlify et qu'il n'y a pas de données, charger la démo
    if (window.location.hostname !== 'localhost' && invoices.length === 0) {
      const demoInvoices = generateDemoInvoices();
      setInvoices(demoInvoices);
      console.log('📊 Données de démonstration chargées:', demoInvoices.length, 'factures');
    }
    
    if (invoices.length > 0) {
      setIsDataLoaded(true);
    } else {
      // Initialiser avec des arrays vides (déjà fait par le store)
      setInvoices([]);
      setIsDataLoaded(true);
    }
  }, [invoices.length, setInvoices, getStorageInfo]);


  const invoicesAnalyzedTooltip = (
    <div>
      <p>Nombre total de factures analysées dans le système.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Actions disponibles</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Importer jusqu'à 100 factures simultanément</li>
          <li>Formats supportés : PDF et images</li>
          <li>Analyse automatique des produits concurrents</li>
          <li>Extraction des données clients</li>
        </ul>
      </div>
    </div>
  );

  const clientsIdentifiedTooltip = (
    <div>
      <p>Clients uniques achetant des produits concurrents.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Méthode d'identification</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Extraction automatique des coordonnées</li>
          <li>Détection des doublons</li>
          <li>Analyse des achats concurrents</li>
          <li>Segmentation par potentiel</li>
        </ul>
      </div>
    </div>
  );

  const businessPotentialTooltip = (
    <div>
      <p>Chiffre d'affaires potentiel en substituant les produits concurrents.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Méthode de calcul</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Analyse des produits concurrents</li>
          <li>Identification des équivalents SOPREMA</li>
          <li>Application des tarifs actuels</li>
          <li>Taux de conversion : 40-80%</li>
        </ul>
      </div>
    </div>
  );

  const storageInfo = getStorageInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec indicateur de persistance et bouton CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <BuildingOfficeIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-blue-600">
                  Profils Clients SOPREMA
                </h1>
                <p className="text-gray-600">
                  Tableau de bord analytique
                </p>
              </div>
            </div>
            
            {/* Bouton principal toujours visible en haut */}
            <div className="flex items-center gap-4">
              <button
                onClick={openInvoiceModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium animate-pulse hover:animate-none"
              >
                <DocumentTextIcon className="w-5 h-5" />
                {invoices.length === 0 ? 'Analyser des factures' : 'Ajouter des factures'}
              </button>
              
              {invoices.length > 0 && (
                <div className="text-sm text-center">
                  <div className="font-medium text-gray-600">
                    {invoices.length} factures
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards avec persistance automatique */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <StatCard
            title="Factures Analysées"
            value={stats.invoicesAnalyzed.value}
            trend={stats.invoicesAnalyzed.trend}
            trendDirection={stats.invoicesAnalyzed.trendDirection}
            icon={<DocumentTextIcon className="w-6 h-6" />}
            tooltipContent={invoicesAnalyzedTooltip}
            onClick={openInvoiceModal}
            valueType="number"
          />
          <StatCard
            title="Clients Identifiés"
            value={stats.clientsIdentified.value}
            trend={stats.clientsIdentified.trend}
            trendDirection={stats.clientsIdentified.trendDirection}
            icon={<UsersIcon className="w-6 h-6" />}
            tooltipContent={clientsIdentifiedTooltip}
            valueType="number"
          />
          <StatCard
            title="Potentiel d'Affaires"
            value={stats.businessPotential.value}
            trend={stats.businessPotential.trend}
            trendDirection={stats.businessPotential.trendDirection}
            icon={<CurrencyEuroIcon className="w-6 h-6" />}
            tooltipContent={businessPotentialTooltip}
          />
        </motion.div>

        {/* Charts Row - Competitor Chart and Geographic Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <div className="lg:col-span-2">
            <CompetitorChart data={competitorProducts} />
          </div>
          <div className="lg:col-span-1">
            <GeographicMap />
          </div>
        </motion.div>

        {/* Sales Comparison - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <SalesComparison />
        </motion.div>

        {/* Competitor Products View - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
          className="mb-8"
        >
          <CompetitorProductsView />
        </motion.div>

        {/* Invoice Management - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Gestion des Factures</h3>
                    <p className="text-sm text-gray-600">Analyse et importation des factures</p>
                  </div>
                </div>
                {invoices.length > 0 && (
                  <div className="text-gray-600">
                    <span className="font-medium">{invoices.length} factures</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-8">
              <div className="max-w-2xl mx-auto text-center">
                <DocumentTextIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h4 className="text-2xl font-bold mb-3">
                  {invoices.length === 0 ? 'Commencez votre analyse' : 'Gérez vos factures'}
                </h4>
                <p className="text-lg text-gray-600 mb-6">
                  {invoices.length === 0 
                    ? 'Importez vos factures pour l\'analyse concurrentielle'
                    : 'Gérez et analysez vos factures importées'
                  }
                </p>
                <button
                  onClick={openInvoiceModal}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto text-lg font-medium"
                >
                  <DocumentTextIcon className="w-6 h-6" />
                  {invoices.length === 0 ? 'Analyser des factures' : 'Gérer les factures'}
                </button>
                
              </div>
            </div>
          </div>
        </motion.div>

        {/* Opportunités de Conversion - Clients mixtes avec produits concurrents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ReconquestDashboard />
        </motion.div>

        {/* Modals */}
        <InvoiceModal />
        
        {/* Bouton flottant (FAB) - toujours visible */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={openInvoiceModal}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-16 h-16 rounded-full shadow-2xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center group z-50"
          title="Ajouter des factures"
        >
          <div className="relative">
            <DocumentTextIcon className="w-8 h-8" />
            <PlusIcon className="w-4 h-4 absolute -bottom-1 -right-1 bg-white text-blue-600 rounded-full" />
          </div>
          
          {/* Tooltip qui apparaît au hover */}
          <span className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {invoices.length === 0 ? 'Analyser des factures' : 'Ajouter des factures'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

export default App;