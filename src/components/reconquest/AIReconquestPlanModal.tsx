import React from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon,
  SparklesIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BriefcaseIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../common/Modal';
import { ReconquestPlan } from '../../services/reconquestService';

interface AIReconquestPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ReconquestPlan;
}

export const AIReconquestPlanModal: React.FC<AIReconquestPlanModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  if (!profile) return null;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'medium': return <ClockIcon className="w-5 h-5" />;
      case 'low': return <CheckCircleIcon className="w-5 h-5" />;
      default: return <ChartBarIcon className="w-5 h-5" />;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'commercial': return <UserGroupIcon className="w-5 h-5 text-blue-600" />;
      case 'technique': return <BriefcaseIcon className="w-5 h-5 text-purple-600" />;
      case 'marketing': return <SparklesIcon className="w-5 h-5 text-pink-600" />;
      case 'contractuel': return <CalendarDaysIcon className="w-5 h-5 text-green-600" />;
      default: return <CheckCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Créer une structure de stratégie par défaut pour éviter les erreurs
  const strategy = profile.reconquestStrategy || {
    priority: 'medium',
    targetProducts: [],
    estimatedPotential: 0,
    suggestedActions: []
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-purple-600" />
                Plan de Reconquête IA
              </h2>
              <p className="text-gray-600 mt-1">{profile.clientName}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getPriorityColor(strategy.priority)}`}>
                {getPriorityIcon(strategy.priority)}
                <span className="font-medium capitalize">
                  Priorité {strategy.priority === 'high' ? 'haute' : strategy.priority === 'medium' ? 'moyenne' : 'basse'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Résumé exécutif */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
              Résumé Exécutif
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(strategy.estimatedPotential)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Potentiel estimé</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {strategy.targetProducts?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Produits ciblés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {strategy.suggestedActions?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Actions recommandées</p>
              </div>
            </div>
          </div>

          {/* Analyse concurrentielle */}
          {strategy.competitiveAnalysis && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                Analyse Concurrentielle
              </h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Menace principale</h4>
                <p className="text-lg text-red-600 font-medium">{strategy.competitiveAnalysis.mainThreat}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Vulnérabilités identifiées</h4>
                  <ul className="space-y-2">
                    {strategy.competitiveAnalysis.vulnerabilities?.map((vulnerability, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{vulnerability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Opportunités</h4>
                  <ul className="space-y-2">
                    {strategy.competitiveAnalysis.opportunities?.map((opportunity, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <LightBulbIcon className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions recommandées */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              Plan d'Actions Recommandées
            </h3>
            
            <div className="space-y-4">
              {strategy.suggestedActions?.map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getActionTypeIcon(action.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{action.description}</h4>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {action.timing}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Résultat attendu</p>
                          <p className="text-gray-700">{action.expectedOutcome}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Avantage SOPREMA</p>
                          <p className="text-blue-700">{action.sopremaAdvantage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Solutions proposées */}
          {strategy.proposedSolutions && strategy.proposedSolutions.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LightBulbIcon className="w-6 h-6 text-yellow-600" />
                Solutions SOPREMA Proposées
              </h3>
              
              <div className="space-y-4">
                {strategy.proposedSolutions.map((solution, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{solution.productFamily}</h4>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(solution.estimatedValue)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{solution.description}</p>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Avantage:</span> {solution.advantage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {strategy.timeline && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-6 h-6 text-green-600" />
                Chronologie d'Exécution
              </h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-red-700 mb-1">Immédiat (0-2 semaines)</h4>
                  <p className="text-gray-700">{strategy.timeline.immediate}</p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-orange-700 mb-1">Court terme (1-3 mois)</h4>
                  <p className="text-gray-700">{strategy.timeline.shortTerm}</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700 mb-1">Long terme (3-12 mois)</h4>
                  <p className="text-gray-700">{strategy.timeline.longTerm}</p>
                </div>
              </div>
            </div>
          )}

          {/* Arguments clés */}
          {strategy.keyArguments && strategy.keyArguments.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
                Arguments Commerciaux Clés
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {strategy.keyArguments.map((argument, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-gray-700 text-sm">{argument}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Plan généré par Claude AI • {new Date(profile.createdAt || Date.now()).toLocaleDateString('fr-FR')}
              </div>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(profile, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `plan_reconquete_${profile.clientName}_${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Exporter le plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};