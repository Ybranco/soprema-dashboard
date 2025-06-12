import React from 'react';
import { motion } from 'framer-motion';
import { UserIcon, ShoppingCartIcon, ArrowTrendingUpIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface CustomerProfileProps {
  profile: {
    id: string;
    clientName: string;
    clientInfo: {
      name: string;
      address?: string;
      siret?: string;
    };
    analysis: {
      totalInvoices: number;
      totalAmount: number;
      sopremaAmount: number;
      competitorAmount: number;
      sopremaShare: string;
      topCompetitorBrands: Array<{ brand: string; amount: number }>;
      lastPurchaseDate: number;
      purchaseFrequency: number | null;
    };
    reconquestStrategy: {
      priority: 'high' | 'medium' | 'low';
      targetProducts: string[];
      estimatedPotential: number;
      suggestedActions: Array<{
        type: string;
        description: string;
        timing: string;
      }>;
    };
  };
  onViewDetails: (id: string) => void;
  onCreatePlan: (id: string) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ profile, onViewDetails, onCreatePlan }) => {
  const priorityColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-green-500 bg-green-50'
  };

  const priorityLabels = {
    high: 'Priorité haute',
    medium: 'Priorité moyenne',
    low: 'Priorité faible'
  };

  // Créer une structure d'analyse avec valeurs par défaut
  const analysis = profile.analysis || {
    totalInvoices: profile.invoiceCount || 0,
    totalAmount: profile.totalRevenue || profile.clientData?.totalRevenue || 0,
    sopremaAmount: profile.sopremaAmount || profile.clientData?.sopremaAmount || 0,
    competitorAmount: profile.competitorAmount || profile.clientData?.competitorAmount || 0,
    sopremaShare: profile.sopremaShare || '0',
    topCompetitorBrands: profile.topCompetitorBrands || profile.clientData?.competitorProducts?.map(p => ({
      brand: p.brand || p.supplierBrand || 'Concurrent',
      amount: p.amount || p.totalAmount || 0
    })) || [],
    lastPurchaseDate: profile.lastPurchaseDate || profile.lastInvoiceDate || Date.now(),
    purchaseFrequency: profile.purchaseFrequency || null
  };

  // Calculer la part Soprema si nécessaire
  if (!analysis.sopremaShare && analysis.totalAmount > 0) {
    analysis.sopremaShare = Math.round((analysis.sopremaAmount / analysis.totalAmount) * 100).toString();
  }

  // Créer une structure de stratégie avec valeurs par défaut
  const reconquestStrategy = profile.reconquestStrategy || {
    priority: profile.priority || 'medium',
    targetProducts: profile.targetProducts || [],
    estimatedPotential: profile.potentialValue || analysis.competitorAmount || 0,
    suggestedActions: profile.actions || []
  };

  // Créer une structure clientInfo avec valeurs par défaut
  const clientInfo = profile.clientInfo || {
    name: profile.clientName || 'Client',
    address: profile.clientAddress || profile.address || undefined,
    siret: profile.clientSiret || profile.siret || undefined
  };

  // Gestion robuste de la date
  const lastPurchaseDate = analysis.lastPurchaseDate || Date.now();
  
  const daysSinceLastPurchase = Math.floor(
    (Date.now() - (typeof lastPurchaseDate === 'string' ? new Date(lastPurchaseDate).getTime() : lastPurchaseDate)) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-md border-l-4 ${priorityColors[reconquestStrategy.priority]} hover:shadow-lg transition-shadow`}
    >
      <div className="p-6">
        {/* En-tête du profil */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{profile.clientName}</h3>
              <p className="text-sm text-gray-600">{clientInfo.address || 'Adresse non renseignée'}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            reconquestStrategy.priority === 'high' ? 'bg-red-100 text-red-700' :
            reconquestStrategy.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {priorityLabels[reconquestStrategy.priority]}
          </span>
        </div>

        {/* Statistiques clés */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <ShoppingCartIcon className="w-4 h-4" />
              <span className="text-xs">Historique d'achat</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {analysis.totalInvoices} factures
            </p>
            <p className="text-sm text-gray-600">
              {analysis.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} total
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-xs">Dernier achat</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {daysSinceLastPurchase}j
            </p>
            <p className="text-sm text-gray-600">
              {analysis.purchaseFrequency 
                ? `Tous les ${analysis.purchaseFrequency}j en moyenne`
                : 'Fréquence à établir'
              }
            </p>
          </div>
        </div>

        {/* Part de marché Soprema */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Part Soprema</span>
            <span className="text-sm font-medium">{analysis.sopremaShare}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${analysis.sopremaShare}%` }}
            />
          </div>
        </div>

        {/* Marques concurrentes principales - Version compacte */}
        {analysis.topCompetitorBrands.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top marques concurrentes</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.topCompetitorBrands.slice(0, 3).map((brand, index) => (
                <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-xs">
                  <span className="text-gray-700">{brand.brand}:</span>
                  <span className="font-medium text-red-600 ml-1">
                    {brand.amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                  </span>
                </div>
              ))}
              {analysis.topCompetitorBrands.length > 3 && (
                <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500">
                  +{analysis.topCompetitorBrands.length - 3} autres
                </div>
              )}
            </div>
          </div>
        )}

        {/* Montant concurrent à convertir - Version compacte */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-gray-700">Opportunité</span>
          </div>
          <span className="text-lg font-bold text-yellow-700">
            {analysis.competitorAmount.toLocaleString('fr-FR', { 
              style: 'currency', 
              currency: 'EUR' 
            })}
          </span>
        </div>

        {/* Actions suggérées - Version compacte */}
        {reconquestStrategy.suggestedActions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Actions clés</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {reconquestStrategy.suggestedActions.slice(0, 2).map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-1">•</span>
                  <span>{action.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(profile.id)}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Voir détails
          </button>
          <button
            onClick={() => onCreatePlan(profile.id)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Plan de reconquête
          </button>
        </div>
      </div>
    </motion.div>
  );
};