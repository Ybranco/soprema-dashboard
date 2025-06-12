import React from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../common/Modal';
import { 
  LightBulbIcon, 
  CalendarIcon, 
  CurrencyEuroIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface ReconquestPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

export const ReconquestPlanModal: React.FC<ReconquestPlanModalProps> = ({ isOpen, onClose, profile }) => {
  if (!profile) return null;

  const priorityConfig = {
    high: { 
      gradient: 'from-red-600 to-orange-600',
      lightGradient: 'from-red-50 to-orange-50',
      border: 'border-red-300',
      icon: FireIcon,
      label: 'PRIORITÉ HAUTE - ACTION IMMÉDIATE',
      badge: 'bg-red-100 text-red-800 border-red-300'
    },
    medium: { 
      gradient: 'from-yellow-600 to-amber-600',
      lightGradient: 'from-yellow-50 to-amber-50',
      border: 'border-yellow-300',
      icon: BellAlertIcon,
      label: 'PRIORITÉ MOYENNE - ACTION PLANIFIÉE',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    low: { 
      gradient: 'from-green-600 to-emerald-600',
      lightGradient: 'from-green-50 to-emerald-50',
      border: 'border-green-300',
      icon: SparklesIcon,
      label: 'PRIORITÉ FAIBLE - SUIVI RÉGULIER',
      badge: 'bg-green-100 text-green-800 border-green-300'
    }
  };

  const config = priorityConfig[profile.reconquestStrategy.priority];
  const PriorityIcon = config.icon;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="large"
    >
      <div className="relative">
        {/* Contour et espacement ajoutés */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.lightGradient} opacity-30 -m-6 rounded-2xl`}></div>
        <div className="relative space-y-6 p-6 -m-6 rounded-2xl border-2 border-gray-200 bg-white shadow-inner">
          {/* Header ultra moderne avec gradient et animation */}
          <div className={`relative -m-6 mb-6 bg-gradient-to-br ${config.gradient} p-8 text-white overflow-hidden rounded-t-xl`}>
          {/* Pattern de fond animé */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="p-3 bg-white/20 backdrop-blur rounded-xl"
              >
                <PriorityIcon className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold">Plan de Reconquête</h2>
                <p className="text-white/90">{profile.clientName}</p>
              </div>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.badge} border font-semibold text-sm`}>
              {config.label}
            </div>
          </div>
        </div>

        {/* Objectif principal avec design impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-gradient-to-br ${config.lightGradient} rounded-xl p-6 border-2 ${config.border}`}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-md">
              <RocketLaunchIcon className="w-8 h-8 text-gray-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Objectif de conversion</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">CA concurrent actuel</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(profile.analysis.competitorAmount)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Taux de conversion visé</p>
                  <p className="text-2xl font-bold text-blue-600">70%</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-400">
                  <p className="text-sm text-gray-600 mb-1">Potentiel estimé</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(profile.reconquestStrategy.estimatedPotential)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Produits cibles avec visual impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            Produits concurrents à remplacer
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.reconquestStrategy.targetProducts.map((product: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{product}</span>
              </motion.div>
            ))}
          </div>

          {profile.analysis.topCompetitorBrands?.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-gray-700 mb-2">🎯 Équivalences SOPREMA recommandées:</p>
              <div className="space-y-2">
                {profile.analysis.topCompetitorBrands.slice(0, 2).map((brand: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-red-600 font-medium">{brand.brand}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-600 font-medium">Gamme SOPREMA équivalente</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Plan d'action détaillé avec timeline visuelle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600" />
            Plan d'action stratégique
          </h3>
          
          <div className="relative">
            {/* Ligne de timeline */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-purple-600"></div>
            
            <div className="space-y-6">
              {profile.reconquestStrategy.suggestedActions.map((action: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="relative flex gap-4"
                >
                  {/* Point sur la timeline */}
                  <div className="relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    >
                      {index + 1}
                    </motion.div>
                  </div>
                  
                  {/* Contenu de l'action */}
                  <div className="flex-1 bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">{action.description}</h4>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        action.timing.includes('7 jours') ? 'bg-red-100 text-red-700' :
                        action.timing.includes('2 semaines') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {action.timing}
                        </div>
                      </div>
                    </div>
                    
                    {action.type === 'product-switch' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Action clé:</strong> Présenter les avantages techniques et économiques des solutions SOPREMA
                        </p>
                      </div>
                    )}
                    
                    {action.type === 'meeting' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Objectif:</strong> Établir une relation de confiance et identifier les besoins spécifiques
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Indicateurs de suivi avec alertes visuelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
            Indicateurs de performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Part de marché actuelle</p>
              <div className="relative w-24 h-24 mx-auto mb-2">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - profile.analysis.sopremaShare / 100)}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 36 * (1 - profile.analysis.sopremaShare / 100) }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{profile.analysis.sopremaShare}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">Soprema</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Fréquence d'achat</p>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {profile.analysis.purchaseFrequency || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">jours en moyenne</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Jours depuis dernier achat</p>
              <p className={`text-3xl font-bold mb-1 ${
                profile.analysis.daysSinceLastPurchase > (profile.analysis.purchaseFrequency || 30)
                  ? 'text-red-600' : 'text-green-600'
              }`}>
                {profile.analysis.daysSinceLastPurchase}
              </p>
              <p className="text-xs text-gray-500">
                {profile.analysis.daysSinceLastPurchase > (profile.analysis.purchaseFrequency || 30)
                  ? '⚠️ En retard' : '✅ Dans les temps'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`bg-gradient-to-r ${config.gradient} rounded-xl p-6 text-white text-center`}
        >
          <LightBulbIcon className="w-12 h-12 mx-auto mb-3 text-white/90" />
          <h3 className="text-xl font-bold mb-2">Prêt à passer à l'action ?</h3>
          <p className="text-white/90">
            Ce plan représente une opportunité de {formatCurrency(profile.reconquestStrategy.estimatedPotential)} 
            {' '}avec un taux de conversion réaliste de 70%
          </p>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer le plan
          </button>
          <button
            onClick={onClose}
            className={`flex-1 bg-gradient-to-r ${config.gradient} text-white px-6 py-3 rounded-lg hover:shadow-xl transition-all font-medium shadow-lg`}
          >
            Commencer la reconquête
          </button>
        </div>
        </div>
      </div>
    </Modal>
  );
};