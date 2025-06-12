import React from 'react';
import { X } from 'lucide-react';

interface ActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionPlan: any;
  clientName: string;
  region: string;
}

export const ActionPlanModal: React.FC<ActionPlanModalProps> = ({
  isOpen,
  onClose,
  actionPlan,
  clientName,
  region
}) => {
  if (!isOpen || !actionPlan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Plan d'Action Géographique
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {clientName} • {region}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Contexte */}
          {actionPlan.context && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-blue-600">📍</span> Contexte Local
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-700">{actionPlan.context}</p>
              </div>
            </div>
          )}

          {/* Stratégie */}
          {actionPlan.strategy && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-green-600">🎯</span> Stratégie Commerciale
              </h3>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-700">{actionPlan.strategy}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {actionPlan.actionPlan && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-orange-600">⚡</span> Plan d'Action
              </h3>
              
              {/* Actions immédiates */}
              {actionPlan.actionPlan.immediate && actionPlan.actionPlan.immediate.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Actions Immédiates (0-3 mois)</h4>
                  <div className="space-y-2">
                    {actionPlan.actionPlan.immediate.map((action: any, index: number) => (
                      <div key={index} className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                        <div className="font-medium text-gray-800">{action.action}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Responsable: {action.responsible} • Échéance: {action.deadline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions à moyen terme */}
              {actionPlan.actionPlan.medium && actionPlan.actionPlan.medium.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Actions Moyen Terme (3-6 mois)</h4>
                  <div className="space-y-2">
                    {actionPlan.actionPlan.medium.map((action: any, index: number) => (
                      <div key={index} className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                        <div className="font-medium text-gray-800">{action.action}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Responsable: {action.responsible} • Échéance: {action.deadline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions à long terme */}
              {actionPlan.actionPlan.long && actionPlan.actionPlan.long.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Actions Long Terme (6-12 mois)</h4>
                  <div className="space-y-2">
                    {actionPlan.actionPlan.long.map((action: any, index: number) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                        <div className="font-medium text-gray-800">{action.action}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Responsable: {action.responsible} • Échéance: {action.deadline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Métriques de succès */}
          {actionPlan.metrics && actionPlan.metrics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-purple-600">📊</span> Métriques de Succès
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {actionPlan.metrics.map((metric: any, index: number) => (
                  <div key={index} className="bg-purple-50 rounded-lg p-3">
                    <div className="font-medium text-gray-800">{metric.name}</div>
                    <div className="text-sm text-gray-600">{metric.target}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget */}
          {actionPlan.budget && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-blue-600">💰</span> Budget Estimé
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-800">{actionPlan.budget}</div>
                <div className="text-sm text-gray-600 mt-1">Budget estimé pour la mise en œuvre complète</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            Plan d'action généré par Claude 3.5 Sonnet • Analyse basée sur les données de facturation
          </div>
        </div>
      </div>
    </div>
  );
};