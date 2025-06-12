import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  TrashIcon,
  DocumentIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  CurrencyEuroIcon,
  TagIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Invoice } from '../../types';
import { InvoiceDetails } from './InvoiceDetails';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useDashboardStore } from '../../store/dashboardStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect } from 'react';

interface InvoiceListProps {
  invoices: Invoice[];
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const { removeInvoice, getStorageInfo, selectedInvoiceNumber } = useDashboardStore();

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  // Auto-ouvrir la facture sélectionnée
  useEffect(() => {
    if (selectedInvoiceNumber) {
      const invoice = invoices.find(inv => inv.number === selectedInvoiceNumber);
      if (invoice) {
        setExpandedId(invoice.id);
        // Scroll vers la facture après un court délai
        setTimeout(() => {
          const element = document.querySelector(`[data-invoice="${selectedInvoiceNumber}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [selectedInvoiceNumber, invoices]);

  const handleDeleteClick = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      removeInvoice(invoiceToDelete.id);
      setInvoiceToDelete(null);
      if (expandedId === invoiceToDelete.id) {
        setExpandedId(null);
      }
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium mb-2">Aucune facture trouvée</h3>
        <p className="text-sm text-center max-w-md">
          Les factures affichées correspondent à vos critères de recherche et filtres actuels.
        </p>
      </div>
    );
  }

  const competitorProducts = invoices.reduce((total, invoice) => 
    total + invoice.products.filter(p => p.type === 'competitor').length, 0
  );
  const sopremaProducts = invoices.reduce((total, invoice) => 
    total + invoice.products.filter(p => p.type === 'soprema').length, 0
  );
  const storageInfo = getStorageInfo();

  return (
    <div className="space-y-1 p-6">
      {/* En-tête avec statistiques pour cette vue */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-6 h-6" />
            {invoices.length} facture{invoices.length > 1 ? 's' : ''} • Interface Accordéon Optimisée
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">Données persistées</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
          <div className="text-center">
            <div className="font-bold text-blue-600">
              {invoices.reduce((sum, inv) => sum + inv.products.length, 0)}
            </div>
            <div className="text-blue-700">Produits</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-red-600">{competitorProducts}</div>
            <div className="text-red-700">Concurrents</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{sopremaProducts}</div>
            <div className="text-green-700">SOPREMA</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-purple-600">
              {formatAmount(invoices.reduce((sum, inv) => sum + inv.potential, 0))}
            </div>
            <div className="text-purple-700">Potentiel</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-orange-600">{storageInfo.totalSize}</div>
            <div className="text-orange-700">Stockées</div>
          </div>
        </div>
        
        {/* Guide d'utilisation */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              <span>Clic sur une ligne = voir détails</span>
            </div>
            <div className="flex items-center gap-1">
              <ChevronDownIcon className="w-4 h-4" />
              <span>Accordéon = tous les produits</span>
            </div>
            <div className="flex items-center gap-1">
              <TrashIcon className="w-4 h-4" />
              <span>Suppression intelligente</span>
            </div>
          </div>
          <div className="text-green-600 text-xs">
            Auto-sauvegardé • Persiste après refresh
          </div>
        </div>
      </div>

      {/* Liste des factures - Interface accordéon moderne SANS boutons imbriqués */}
      <div className="space-y-2">
        {invoices.map((invoice, index) => (
          <motion.div
            key={invoice.id}
            data-invoice={invoice.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.02 }}
            className={`border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 ${
              expandedId === invoice.id 
                ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50' 
                : 'hover:border-blue-300 hover:shadow-md bg-white'
            }`}
          >
            {/* Ligne principale de la facture - DIV au lieu de BUTTON pour éviter l'imbrication */}
            <div
              className={`w-full p-4 cursor-pointer transition-all duration-200 ${
                expandedId === invoice.id 
                  ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {/* Grid responsive optimisé */}
              <div className="flex items-center justify-between">
                {/* Contenu principal - CLIQUABLE pour l'accordéon */}
                <div 
                  onClick={() => toggleExpanded(invoice.id)}
                  className="flex-1 grid grid-cols-6 gap-4 items-center cursor-pointer"
                >
                  {/* Numéro de facture */}
                  <div className="flex items-center gap-2 min-w-0">
                    <DocumentIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-blue-700 truncate" title={invoice.number}>
                        {invoice.number}
                      </div>
                      <div className="text-xs text-gray-500">Facture</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-center">
                    <div className="font-medium text-sm">{formatDate(invoice.date)}</div>
                    <div className="text-xs text-gray-500">Date</div>
                  </div>

                  {/* Client */}
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-green-700 truncate" title={typeof invoice.client === 'string' ? invoice.client : invoice.client?.name || 'Client'}>
                      {typeof invoice.client === 'string' ? invoice.client : invoice.client?.name || 'Client extrait'}
                    </div>
                    <div className="text-xs text-gray-500">Client</div>
                  </div>

                  {/* Distributeur */}
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-orange-700 truncate" title={typeof invoice.distributor === 'string' ? invoice.distributor : invoice.distributor?.name || 'Distributeur'}>
                      {typeof invoice.distributor === 'string' ? invoice.distributor : invoice.distributor?.name || 'Distributeur extrait'}
                    </div>
                    <div className="text-xs text-gray-500">Distributeur</div>
                  </div>

                  {/* Montant HT */}
                  <div className="text-center">
                    <div className="font-semibold text-sm text-purple-700">
                      {formatAmount(invoice.amount)}
                    </div>
                    <div className="text-xs text-gray-500">Montant HT</div>
                  </div>

                  {/* Potentiel */}
                  <div className="text-center">
                    <div className="font-bold text-sm text-green-600">
                      {formatAmount(invoice.potential)}
                    </div>
                    <div className="text-xs text-gray-500">Potentiel</div>
                  </div>
                </div>

                {/* Actions séparées - PAS dans le bouton principal */}
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  {/* Indicateur de produits */}
                  <div className="text-center">
                    <div className="font-bold text-blue-600">
                      {invoice.products.length}
                    </div>
                    <div className="text-xs text-blue-700">produits</div>
                  </div>

                  {/* Bouton de suppression - SÉPARÉ, pas imbriqué */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleDeleteClick(e, invoice)}
                    className="group p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                    title={`Supprimer la facture ${invoice.number}`}
                  >
                    <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </motion.button>

                  {/* Indicateur d'accordéon - CLIQUABLE pour l'accordéon */}
                  <div 
                    onClick={() => toggleExpanded(invoice.id)}
                    className="p-1 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {expandedId === invoice.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Badges de produits */}
              <div 
                onClick={() => toggleExpanded(invoice.id)}
                className="flex items-center gap-2 mt-2 cursor-pointer"
              >
                {invoice.products.filter(p => p.type === 'competitor').length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {invoice.products.filter(p => p.type === 'competitor').length} concurrent{invoice.products.filter(p => p.type === 'competitor').length > 1 ? 's' : ''}
                  </span>
                )}
                {invoice.products.filter(p => p.type === 'soprema').length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {invoice.products.filter(p => p.type === 'soprema').length} SOPREMA
                  </span>
                )}
                {invoice.actionPlan && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Plan d'action disponible
                  </span>
                )}
                {invoice._productVerification?.reclassifiedCount > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                    ✅ {invoice._productVerification.reclassifiedCount} produit{invoice._productVerification.reclassifiedCount > 1 ? 's' : ''} vérifié{invoice._productVerification.reclassifiedCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Indicateur de contenu de l'accordéon */}
              {expandedId === invoice.id && (
                <div 
                  onClick={() => toggleExpanded(invoice.id)}
                  className="mt-3 pt-3 border-t border-blue-200 cursor-pointer"
                >
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <ChevronDownIcon className="w-4 h-4" />
                    <span className="font-medium">
                      Détails complets • {invoice.products.length} produit{invoice.products.length > 1 ? 's' : ''} • 
                      Informations client • Opportunités SOPREMA
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Accordéon - Détails complets */}
            <AnimatePresence>
              {expandedId === invoice.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="border-t border-blue-200 bg-white"
                >
                  <div className="p-4">
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                        <TagIcon className="w-5 h-5" />
                        Analyse complète de la facture {invoice.number}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Produits:</span>
                          <span className="ml-2 font-bold">{invoice.products.length}</span>
                        </div>
                        <div>
                          <span className="text-red-700 font-medium">Concurrents:</span>
                          <span className="ml-2 font-bold">{invoice.products.filter(p => p.type === 'competitor').length}</span>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">SOPREMA:</span>
                          <span className="ml-2 font-bold">{invoice.products.filter(p => p.type === 'soprema').length}</span>
                        </div>
                        <div>
                          <span className="text-purple-700 font-medium">Potentiel:</span>
                          <span className="ml-2 font-bold">{formatAmount(invoice.potential)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                      <InvoiceDetails invoice={invoice} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer la facture"
        message={`Êtes-vous sûr de vouloir supprimer la facture ${invoiceToDelete?.number} de ${typeof invoiceToDelete?.client === 'string' ? invoiceToDelete.client : invoiceToDelete?.client?.name || 'ce client'} ?

Cette action va automatiquement :
• Supprimer définitivement cette facture
• Recalculer toutes les statistiques
• Mettre à jour les graphiques
• Recalculer les opportunités
• Actualiser les plans de reconquête client
• Sauvegarder automatiquement

L'action est irréversible mais toutes les données sont recalculées automatiquement.`}
        confirmText="Supprimer et sauvegarder"
        cancelText="Annuler"
        isDangerous={true}
      />

      {/* Info persistance */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-900">Interface accordéon avec persistance automatique</h4>
            <p className="text-sm text-green-700">
              {storageInfo.totalInvoices} factures • {storageInfo.totalSize} • Dernière sauvegarde: {storageInfo.lastSaved}
            </p>
          </div>
        </div>
        <p className="text-sm text-green-600">
          Cliquez sur une facture pour voir tous les détails. Toutes vos données persistent automatiquement.
        </p>
      </div>
    </div>
  );
};