import React, { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon, ChartBarIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface NoPlansExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  statistics: {
    totalInvoicesAnalyzed: number;
    invoicesWithCompetitors: number;
    totalClients: number;
    clientsWithCompetitors: number;
    clientsAboveThreshold: number;
    thresholdAmount: number;
    reasonCode: 'BELOW_THRESHOLD' | 'OTHER';
    clientsAnalyzed?: Array<{
      name: string;
      totalAmount: number;
      competitorAmount: number;
      sopremaAmount: number;
      invoiceCount: number;
    }>;
  };
}

interface AIAnalysis {
  clients: Array<{
    name: string;
    status: string;
    statusColor: string;
    analysis: string;
    recommendation: string;
    requiresManualPlan: boolean;
    confidence: string;
  }>;
  globalInsights: {
    summary: string;
    keyActions: string[];
    positivePoints: string[];
    attentionPoints: string[];
  };
}

export const NoPlansExplanationModal: React.FC<NoPlansExplanationModalProps> = ({
  isOpen,
  onClose,
  statistics
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && statistics.clientsAnalyzed && statistics.clientsAnalyzed.length > 0 && !aiAnalysis && !isLoading) {
      fetchAIAnalysis();
    }
    
    // Réinitialiser quand le modal se ferme
    if (!isOpen && aiAnalysis) {
      setAiAnalysis(null);
      setError(null);
    }
  }, [isOpen]); // Ne dépendre que de isOpen pour éviter les appels multiples

  const fetchAIAnalysis = async () => {
    console.log('🤖 Appel unique de l\'analyse IA...');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/analyze-no-reconquest-reasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientsData: statistics.clientsAnalyzed,
          threshold: statistics.thresholdAmount
        })
      });
      
      if (!response.ok) throw new Error('Erreur lors de l\'analyse');
      
      const data = await response.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error('Erreur analyse IA:', err);
      setError('Impossible d\'obtenir l\'analyse IA');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasClients = statistics.clientsAnalyzed && statistics.clientsAnalyzed.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="w-8 h-8 text-white" />
            <h2 className="text-xl font-bold text-white">
              Pourquoi aucun plan de reconquête n'a été généré ?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Explication principale */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex items-start gap-3">
              <ChartBarIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Critères de génération des plans de reconquête
                </h3>
                <p className="text-blue-800">
                  Un plan de reconquête est généré automatiquement lorsqu'un client a acheté 
                  <span className="font-bold"> au moins {statistics.thresholdAmount.toLocaleString('fr-FR')}€ </span>
                  de produits concurrents (non-Soprema).
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques des factures analysées */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CurrencyEuroIcon className="w-5 h-5" />
              Résumé de l'analyse
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{statistics.totalInvoicesAnalyzed}</div>
                <div className="text-sm text-gray-600">Factures analysées</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">{statistics.invoicesWithCompetitors}</div>
                <div className="text-sm text-blue-600">Avec concurrents</div>
              </div>
              <div className="bg-green-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">{statistics.clientsWithCompetitors}</div>
                <div className="text-sm text-green-600">Clients avec concurrents</div>
              </div>
              <div className={`rounded-lg p-4 ${
                statistics.clientsAboveThreshold > 0 ? 'bg-orange-100' : 'bg-red-100'
              }`}>
                <div className={`text-2xl font-bold ${
                  statistics.clientsAboveThreshold > 0 ? 'text-orange-900' : 'text-red-900'
                }`}>
                  {statistics.clientsAboveThreshold}
                </div>
                <div className={`text-sm ${
                  statistics.clientsAboveThreshold > 0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  Au-dessus de {statistics.thresholdAmount.toLocaleString('fr-FR')}€</div>
              </div>
            </div>
          </div>

          {/* Explication spécifique selon le cas */}
          <div className="mb-6">
            {statistics.reasonCode === 'BELOW_THRESHOLD' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  📊 Tous les clients sont sous le seuil de {statistics.thresholdAmount.toLocaleString('fr-FR')}€
                </h4>
                <p className="text-yellow-700">
                  Vos clients ont bien acheté des produits concurrents, mais les montants sont inférieurs au seuil 
                  requis pour générer automatiquement un plan de reconquête. Vous pouvez ajuster le seuil dans les paramètres 
                  ou créer manuellement des plans pour ces clients.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  🔍 Analyse en cours...
                </h4>
                <p className="text-blue-700">
                  L'analyse détaillée est en cours pour déterminer pourquoi aucun plan n'a été généré.
                </p>
              </div>
            )}
          </div>

          {/* État de chargement de l'analyse IA */}
          {isLoading && (
            <div className="mb-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-lg text-blue-800 font-medium">
                  Analyse approfondie en cours par l'IA...
                </p>
              </div>
              <p className="text-sm text-blue-600 text-center mt-2">
                Claude analyse l'historique et le contexte de chaque client
              </p>
            </div>
          )}

          {/* Détails par client */}
          {hasClients && !isLoading && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Détail par client (aucun n'atteint le seuil)
              </h4>
              <div className="space-y-3">
                {statistics.clientsAnalyzed.map((client, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">{client.name}</h5>
                        <p className="text-sm text-gray-500">{client.invoiceCount} facture(s)</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {client.totalAmount.toLocaleString('fr-FR')}€
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <div className="text-sm text-gray-600">Produits Soprema</div>
                        <div className="font-medium text-green-600">
                          {client.sopremaAmount.toLocaleString('fr-FR')}€
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Produits concurrents</div>
                        <div className={`font-medium ${client.competitorAmount >= statistics.thresholdAmount ? 'text-red-600' : 'text-orange-600'}`}>
                          {client.competitorAmount.toLocaleString('fr-FR')}€
                        </div>
                        {client.competitorAmount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {client.sopremaAmount === 0 ? (
                              <span className="text-red-600 font-medium">⚠️ Client 100% concurrent !</span>
                            ) : (
                              `Manque ${(statistics.thresholdAmount - client.competitorAmount).toLocaleString('fr-FR')}€ pour un plan`
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Analyse IA du client ou analyse basique si IA non disponible */}
                    {(() => {
                      // Si on a une analyse IA pour ce client
                      const aiClientAnalysis = aiAnalysis?.clients.find(c => c.name === client.name);
                      
                      if (aiClientAnalysis) {
                        const colorMap = {
                          green: 'bg-green-50 border-green-200 text-green-700',
                          blue: 'bg-blue-50 border-blue-200 text-blue-700',
                          orange: 'bg-orange-50 border-orange-200 text-orange-700',
                          yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                          purple: 'bg-purple-50 border-purple-200 text-purple-700',
                          red: 'bg-red-50 border-red-200 text-red-700'
                        };
                        
                        const statusIcons = {
                          'fidèle': '✅',
                          'mixte': '📊',
                          'à surveiller': '⚠️',
                          'nouveau': '🆕',
                          'opportunité': '💡'
                        };
                        
                        return (
                          <div className={`mt-3 p-3 rounded-lg border ${colorMap[aiClientAnalysis.statusColor] || colorMap.blue}`}>
                            <p className="text-sm mb-2">
                              <strong>{statusIcons[aiClientAnalysis.status] || '📌'} {aiClientAnalysis.status} :</strong> {aiClientAnalysis.analysis}
                            </p>
                            <p className="text-xs italic">
                              💡 {aiClientAnalysis.recommendation}
                            </p>
                            {aiClientAnalysis.requiresManualPlan && (
                              <p className="text-xs mt-2 font-semibold">
                                ⚡ Plan manuel recommandé
                              </p>
                            )}
                          </div>
                        );
                      }
                      
                      // Fallback sur l'analyse basique si pas d'IA
                      const competitorRatio = client.totalAmount > 0 ? (client.competitorAmount / client.totalAmount) * 100 : 0;
                      
                      if (isLoading) {
                        return (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">
                              ⏳ Analyse IA en cours...
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">
                            📊 {competitorRatio.toFixed(0)}% de produits concurrents
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights globaux de l'IA ou analyse basique */}
          {!isLoading && aiAnalysis?.globalInsights ? (
            <div className="space-y-4">
              {/* Résumé global */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🎯 Analyse globale par l'IA
                </h4>
                <p className="text-blue-800">{aiAnalysis.globalInsights.summary}</p>
              </div>
              
              {/* Points positifs */}
              {aiAnalysis.globalInsights.positivePoints.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">
                    ✅ Points positifs
                  </h4>
                  <ul className="space-y-1 text-green-800">
                    {aiAnalysis.globalInsights.positivePoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Points d'attention */}
              {aiAnalysis.globalInsights.attentionPoints.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2">
                    ⚠️ Points d'attention
                  </h4>
                  <ul className="space-y-1 text-amber-800">
                    {aiAnalysis.globalInsights.attentionPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Actions recommandées */}
              {aiAnalysis.globalInsights.keyActions.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    💡 Actions recommandées
                  </h4>
                  <ul className="space-y-1 text-purple-800">
                    {aiAnalysis.globalInsights.keyActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : !isLoading ? (
            /* Fallback sur l'analyse basique */
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">
                Raisons de l'absence de plans automatiques
              </h4>
              <ul className="space-y-2 text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>
                    <strong>Seuil non atteint :</strong> Les plans automatiques nécessitent plus de {statistics.thresholdAmount.toLocaleString('fr-FR')}€ 
                    de produits concurrents par client.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>
                    <strong>Analyse approfondie recommandée :</strong> L'historique complet du client doit être 
                    considéré avant de tirer des conclusions.
                  </span>
                </li>
              </ul>
            </div>
          ) : null}

          {/* Call to action */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ C'est une bonne nouvelle !
            </h4>
            <p className="text-green-800">
              L'absence de plans de reconquête signifie que vos clients sont majoritairement fidèles 
              aux produits Soprema. Continuez à maintenir cette excellente relation commerciale !
            </p>
          </div>

          {/* Actions suggérées */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              Actions suggérées
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">Analyser plus de factures</h5>
                <p className="text-sm text-blue-700">
                  Uploadez davantage de factures pour avoir une vision plus complète de vos clients.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-900 mb-1">Surveiller l'évolution</h5>
                <p className="text-sm text-purple-700">
                  Analysez régulièrement vos factures pour détecter rapidement tout changement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Compris
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};