import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../common/Modal';
import { CustomerReconquestPlan, CustomerProfile } from '../../types/reconquest.types';
import { customerReconquestService } from '../../services/customerReconquestService';

interface ReconquestPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerProfile;
}

export const ReconquestPlanModal: React.FC<ReconquestPlanModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [plan, setPlan] = useState<CustomerReconquestPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['phase1_Contact']);

  useEffect(() => {
    if (isOpen && customer) {
      loadOrGeneratePlan();
    }
  }, [isOpen, customer]);

  const loadOrGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier si un plan existe déjà
      let existingPlan = customerReconquestService.getPlan(customer.id);
      
      if (!existingPlan) {
        existingPlan = await customerReconquestService.generateReconquestPlan(customer);
        await customerReconquestService.savePlan(existingPlan);
      }
      
      setPlan(existingPlan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  const exportPlan = () => {
    if (!plan) return;
    
    const dataStr = JSON.stringify(plan, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `plan_reconquete_${customer.name}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const printPlan = () => {
    window.print();
  };

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: ChartBarIcon },
    { id: 'analysis', label: 'Analyse client', icon: UserGroupIcon },
    { id: 'opportunity', label: 'Opportunités', icon: ArrowTrendingUpIcon },
    { id: 'strategy', label: 'Stratégie', icon: BriefcaseIcon },
    { id: 'action', label: 'Plan d\'action', icon: CalendarDaysIcon },
    { id: 'risks', label: 'Risques', icon: ExclamationTriangleIcon },
    { id: 'monitoring', label: 'Suivi KPIs', icon: CheckCircleIcon },
    { id: 'resources', label: 'Ressources', icon: CurrencyEuroIcon },
    { id: 'communication', label: 'Communication', icon: MegaphoneIcon }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="6xl">
      <div className="flex h-[90vh]">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plan de reconquête
            </h3>
            <p className="text-sm text-gray-600">
              {customer.fullName || customer.name}
            </p>
          </div>
          
          <nav className="space-y-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="mt-8 space-y-2">
            <button
              onClick={exportPlan}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={printPlan}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <PrinterIcon className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-gray-600">Génération du plan de reconquête avec Claude AI...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadOrGeneratePlan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : plan ? (
            <div className="p-8">
              <AnimatePresence mode="wait">
                {/* Vue d'ensemble */}
                {activeSection === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <ChartBarIcon className="w-8 h-8 text-blue-600" />
                      Vue d'ensemble du plan
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <CurrencyEuroIcon className="w-8 h-8 text-green-600" />
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(plan.priority)}`}>
                            {plan.priority === 'high' ? 'Priorité haute' : plan.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">
                          {formatCurrency(plan.opportunityAssessment.reconquestPotential.estimatedRevenue)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">Potentiel de reconquête</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <ArrowTrendingUpIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">
                          {formatPercent(plan.opportunityAssessment.reconquestPotential.probabilityOfSuccess)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">Probabilité de succès</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <ClockIcon className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {plan.opportunityAssessment.reconquestPotential.timeToConversion}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">Temps de conversion estimé</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Stratégie principale</h3>
                      <p className="text-gray-700 mb-4">{plan.reconquestStrategy.winBackApproach.primaryStrategy}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Actions tactiques</h4>
                          <ul className="space-y-1">
                            {plan.reconquestStrategy.winBackApproach.tacticalActions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Avantages compétitifs</h4>
                          <ul className="space-y-1">
                            {plan.reconquestStrategy.winBackApproach.competitiveAdvantages.map((advantage, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <SparklesIcon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                {advantage}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Phases du plan</h3>
                      <div className="space-y-4">
                        {Object.entries(plan.actionPlan).map(([key, phase]) => (
                          <div key={key} className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              key === 'phase1_Contact' ? 'bg-blue-100 text-blue-600' :
                              key === 'phase2_Negotiation' ? 'bg-purple-100 text-purple-600' :
                              key === 'phase3_Conversion' ? 'bg-green-100 text-green-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              {key.split('_')[0].replace('phase', '')}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {key.split('_')[1].replace(/([A-Z])/g, ' $1').trim()}
                              </h4>
                              <p className="text-sm text-gray-600">Durée: {phase.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Analyse client */}
                {activeSection === 'analysis' && plan.clientAnalysis && (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <UserGroupIcon className="w-8 h-8 text-blue-600" />
                      Analyse approfondie du client
                    </h2>

                    {/* Profil client */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profil d'entreprise</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Secteur</p>
                          <p className="font-medium">{plan.clientAnalysis.profile.sector}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Taille</p>
                          <p className="font-medium">{plan.clientAnalysis.profile.size}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">CA total historique</p>
                          <p className="font-medium">{formatCurrency(plan.clientAnalysis.profile.totalPurchaseHistory)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Panier moyen</p>
                          <p className="font-medium">{formatCurrency(plan.clientAnalysis.profile.averageOrderValue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Statut actuel</p>
                          <p className={`font-medium ${
                            plan.clientAnalysis.profile.currentStatus === 'active' ? 'text-green-600' :
                            plan.clientAnalysis.profile.currentStatus === 'at_risk' ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {plan.clientAnalysis.profile.currentStatus === 'active' ? 'Actif' :
                             plan.clientAnalysis.profile.currentStatus === 'at_risk' ? 'À risque' :
                             plan.clientAnalysis.profile.currentStatus === 'dormant' ? 'Dormant' : 'Perdu'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Score de fidélité</p>
                          <p className="font-medium">{plan.clientAnalysis.behavioralInsights.loyaltyScore}/100</p>
                        </div>
                      </div>
                    </div>

                    {/* Analyse comportementale */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights comportementaux</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Patterns d'achat</h4>
                          <div className="flex flex-wrap gap-2">
                            {plan.clientAnalysis.behavioralInsights.buyingPatterns.map((pattern, idx) => (
                              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                {pattern}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Produits préférés</h4>
                          <div className="flex flex-wrap gap-2">
                            {plan.clientAnalysis.behavioralInsights.preferredProducts.map((product, idx) => (
                              <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                {product}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Saisonnalité</p>
                            <p className="font-medium">{plan.clientAnalysis.behavioralInsights.seasonality}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Processus décisionnel</p>
                            <p className="font-medium">{plan.clientAnalysis.behavioralInsights.decisionMakingProcess}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analyse concurrentielle */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse concurrentielle</h3>
                      <div className="space-y-4">
                        {plan.clientAnalysis.competitiveAnalysis.currentSuppliers.map((supplier, idx) => (
                          <div key={idx} className="border-l-4 border-red-500 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                              <span className="text-sm font-medium text-red-600">
                                {supplier.estimatedShare}% de PDM
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600 mb-1">Forces</p>
                                <ul className="space-y-1">
                                  {supplier.strengths.map((strength, sIdx) => (
                                    <li key={sIdx} className="text-gray-700">• {strength}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-gray-600 mb-1">Faiblesses</p>
                                <ul className="space-y-1">
                                  {supplier.weaknesses.map((weakness, wIdx) => (
                                    <li key={wIdx} className="text-gray-700">• {weakness}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Opportunités */}
                {activeSection === 'opportunity' && plan.opportunityAssessment && (
                  <motion.div
                    key="opportunity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <ArrowTrendingUpIcon className="w-8 h-8 text-blue-600" />
                      Analyse des opportunités
                    </h2>

                    {/* Potentiel de reconquête */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Potentiel de reconquête</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-600">
                            {formatCurrency(plan.opportunityAssessment.reconquestPotential.estimatedRevenue)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Revenus estimés</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600">
                            {plan.opportunityAssessment.reconquestPotential.probabilityOfSuccess}%
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Probabilité</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {plan.opportunityAssessment.reconquestPotential.timeToConversion}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Temps conversion</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(plan.opportunityAssessment.reconquestPotential.requiredInvestment)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Investissement</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-600">
                            {plan.opportunityAssessment.reconquestPotential.roi}x
                          </p>
                          <p className="text-sm text-gray-600 mt-1">ROI estimé</p>
                        </div>
                      </div>
                    </div>

                    {/* Opportunités produits */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunités de substitution</h3>
                      <div className="space-y-4">
                        {plan.opportunityAssessment.productOpportunities.map((opp, idx) => (
                          <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{opp.competitorProduct}</h4>
                                <p className="text-sm text-blue-600">→ {opp.sopremaAlternative}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                opp.conversionDifficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                opp.conversionDifficulty === 'medium' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {opp.conversionDifficulty === 'easy' ? 'Facile' :
                                 opp.conversionDifficulty === 'medium' ? 'Moyen' : 'Difficile'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Volume potentiel</p>
                                <p className="font-medium">{formatCurrency(opp.volumePotential)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Impact revenus</p>
                                <p className="font-medium text-green-600">{formatCurrency(opp.revenueImpact)}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Points de vente uniques</p>
                              <div className="flex flex-wrap gap-2">
                                {opp.uniqueSellingPoints.map((usp, uspIdx) => (
                                  <span key={uspIdx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {usp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Potentiel cross-sell */}
                    {plan.opportunityAssessment.crossSellPotential.length > 0 && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Potentiel de ventes croisées</h3>
                        <div className="space-y-4">
                          {plan.opportunityAssessment.crossSellPotential.map((cross, idx) => (
                            <div key={idx} className="border-l-4 border-purple-500 pl-4">
                              <h4 className="font-medium text-gray-900 mb-2">{cross.productCategory}</h4>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Pénétration actuelle</p>
                                  <p className="font-medium">{cross.currentPenetration}%</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Potentiel d'augmentation</p>
                                  <p className="font-medium text-green-600">+{cross.potentialIncrease}%</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Revenus estimés</p>
                                  <p className="font-medium">{formatCurrency(cross.estimatedRevenue)}</p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">Produits recommandés:</p>
                                <p className="text-sm">{cross.recommendedProducts.join(', ')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Stratégie */}
                {activeSection === 'strategy' && plan.reconquestStrategy && (
                  <motion.div
                    key="strategy"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <BriefcaseIcon className="w-8 h-8 text-blue-600" />
                      Stratégie de reconquête
                    </h2>

                    {/* Approche principale */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Approche de reconquête</h3>
                      <p className="text-gray-700 mb-4 text-lg">{plan.reconquestStrategy.winBackApproach.primaryStrategy}</p>
                      <div className="bg-white bg-opacity-70 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Proposition de valeur</h4>
                        <p className="text-gray-700 italic">{plan.reconquestStrategy.winBackApproach.valueProposition}</p>
                      </div>
                    </div>

                    {/* Stratégie tarifaire */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Stratégie tarifaire</h3>
                      <div className="mb-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                          plan.reconquestStrategy.pricingStrategy.approach === 'competitive' ? 'bg-red-100 text-red-700' :
                          plan.reconquestStrategy.pricingStrategy.approach === 'value' ? 'bg-blue-100 text-blue-700' :
                          plan.reconquestStrategy.pricingStrategy.approach === 'penetration' ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          Approche: {plan.reconquestStrategy.pricingStrategy.approach}
                        </span>
                      </div>
                      
                      {plan.reconquestStrategy.pricingStrategy.specialOffers.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Offres spéciales</h4>
                          {plan.reconquestStrategy.pricingStrategy.specialOffers.map((offer, idx) => (
                            <div key={idx} className="bg-green-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-green-800">{offer.offerType}</span>
                                <span className="text-green-600 font-bold">-{offer.discount}%</span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{offer.conditions}</p>
                              <p className="text-xs text-gray-600 mt-1">Validité: {offer.validity}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Améliorations de service */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Améliorations de service</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                            Support technique
                          </h4>
                          <ul className="space-y-2">
                            {plan.reconquestStrategy.serviceEnhancements.technicalSupport.map((support, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{support}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                            Programmes de formation
                          </h4>
                          <ul className="space-y-2">
                            {plan.reconquestStrategy.serviceEnhancements.trainingPrograms.map((training, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{training}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Plan d'action */}
                {activeSection === 'action' && plan.actionPlan && (
                  <motion.div
                    key="action"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <CalendarDaysIcon className="w-8 h-8 text-blue-600" />
                      Plan d'action détaillé
                    </h2>

                    <div className="space-y-6">
                      {Object.entries(plan.actionPlan).map(([phaseKey, phase]) => (
                        <div key={phaseKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            onClick={() => togglePhase(phaseKey)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                                phaseKey === 'phase1_Contact' ? 'bg-blue-600' :
                                phaseKey === 'phase2_Negotiation' ? 'bg-purple-600' :
                                phaseKey === 'phase3_Conversion' ? 'bg-green-600' :
                                'bg-orange-600'
                              }`}>
                                {phaseKey.split('_')[0].replace('phase', '')}
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {phaseKey.split('_')[1].replace(/([A-Z])/g, ' $1').trim()}
                                </h3>
                                <p className="text-sm text-gray-600">Durée: {phase.duration}</p>
                              </div>
                            </div>
                            {expandedPhases.includes(phaseKey) ? (
                              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          
                          {expandedPhases.includes(phaseKey) && (
                            <div className="px-6 pb-6 border-t border-gray-100">
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Objectifs</h4>
                                <ul className="space-y-2">
                                  {phase.objectives.map((objective, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                      <span className="text-gray-700">{objective}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="mt-6">
                                <h4 className="font-medium text-gray-900 mb-3">Actions à mener</h4>
                                <div className="space-y-3">
                                  {phase.actions.map((action, idx) => (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-medium text-gray-900">{action.action}</h5>
                                        <span className="text-sm text-gray-600">
                                          {new Date(action.deadline).toLocaleDateString('fr-FR')}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-gray-600">Responsable</p>
                                          <p className="font-medium">{action.responsible}</p>
                                        </div>
                                        {'successCriteria' in action && (
                                          <div>
                                            <p className="text-gray-600">Critères de succès</p>
                                            <p className="font-medium">{action.successCriteria}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {'expectedOutcomes' in phase && (
                                <div className="mt-6">
                                  <h4 className="font-medium text-gray-900 mb-3">Résultats attendus</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {phase.expectedOutcomes.map((outcome, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                        {outcome}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Gestion des risques */}
                {activeSection === 'risks' && plan.riskManagement && (
                  <motion.div
                    key="risks"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
                      Gestion des risques
                    </h2>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risques identifiés</h3>
                      <div className="space-y-4">
                        {plan.riskManagement.identifiedRisks.map((risk, idx) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-gray-900">{risk.risk}</h4>
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.probability)} bg-opacity-10`}>
                                  P: {risk.probability}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.impact)} bg-opacity-10`}>
                                  I: {risk.impact}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="text-gray-600">Stratégie de mitigation</p>
                                <p className="text-gray-800">{risk.mitigation}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Plan de contingence</p>
                                <p className="text-gray-800">{risk.contingencyPlan}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                        <h3 className="text-lg font-semibold text-red-900 mb-3">Menaces concurrentielles</h3>
                        <ul className="space-y-2">
                          {plan.riskManagement.competitiveThreats.map((threat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="text-red-800">{threat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                        <h3 className="text-lg font-semibold text-orange-900 mb-3">Défis internes</h3>
                        <ul className="space-y-2">
                          {plan.riskManagement.internalChallenges.map((challenge, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                              <span className="text-orange-800">{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-3">Facteurs externes</h3>
                        <ul className="space-y-2">
                          {plan.riskManagement.externalFactors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <span className="text-yellow-800">{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Suivi et KPIs */}
                {activeSection === 'monitoring' && plan.monitoring && (
                  <motion.div
                    key="monitoring"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                      Suivi et indicateurs de performance
                    </h2>

                    {/* KPIs */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs clés de performance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plan.monitoring.kpis.map((kpi, idx) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">{kpi.metric}</h4>
                              <span className="text-sm text-gray-600">{kpi.frequency}</span>
                            </div>
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <div>
                                  <span className="text-xs font-semibold inline-block text-blue-600">
                                    Actuel: {kpi.current}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-semibold inline-block text-green-600">
                                    Cible: {kpi.target}
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div 
                                  style={{ width: `${(kpi.current / kpi.target) * 100}%` }}
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                                />
                              </div>
                              <p className="text-sm text-gray-600">Responsable: {kpi.responsible}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Jalons */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Jalons du projet</h3>
                      <div className="space-y-3">
                        {plan.monitoring.milestones.map((milestone, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              milestone.status === 'achieved' ? 'bg-green-100 text-green-600' :
                              milestone.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                              milestone.status === 'delayed' ? 'bg-orange-100 text-orange-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {milestone.status === 'achieved' ? <CheckCircleIcon className="w-6 h-6" /> :
                               milestone.status === 'pending' ? <ClockIcon className="w-6 h-6" /> :
                               <ExclamationTriangleIcon className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{milestone.milestone}</h4>
                              <p className="text-sm text-gray-600">
                                Échéance: {new Date(milestone.targetDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Critères de succès */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Critères de succès</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Court terme</h4>
                          <ul className="space-y-2">
                            {plan.monitoring.successCriteria.shortTerm.map((criteria, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Moyen terme</h4>
                          <ul className="space-y-2">
                            {plan.monitoring.successCriteria.mediumTerm.map((criteria, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Long terme</h4>
                          <ul className="space-y-2">
                            {plan.monitoring.successCriteria.longTerm.map((criteria, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircleIcon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Ressources et budget */}
                {activeSection === 'resources' && plan.resourceAllocation && (
                  <motion.div
                    key="resources"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <CurrencyEuroIcon className="w-8 h-8 text-green-600" />
                      Allocation des ressources
                    </h2>

                    {/* Budget */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget alloué</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">
                            {formatCurrency(plan.resourceAllocation.budget.total)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Budget total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-600">
                            {plan.resourceAllocation.budget.roi_projection}x
                          </p>
                          <p className="text-sm text-gray-600 mt-1">ROI projeté</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {plan.resourceAllocation.budget.paybackPeriod}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Période de retour</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Répartition du budget</h4>
                        <div className="space-y-3">
                          {Object.entries(plan.resourceAllocation.budget.breakdown).map(([category, amount]) => (
                            <div key={category} className="relative">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {category === 'commercial' ? 'Commercial' :
                                   category === 'marketing' ? 'Marketing' :
                                   category === 'technical' ? 'Technique' :
                                   category === 'training' ? 'Formation' : 'Autres'}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${(amount / plan.resourceAllocation.budget.total) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Équipe */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Équipe assignée</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plan.resourceAllocation.teamAssignment.map((member, idx) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{member.role}</h4>
                              <span className="text-sm text-gray-600">{member.timeAllocation}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">Assigné: {member.person}</p>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Responsabilités:</p>
                              <ul className="text-xs text-gray-700 space-y-1">
                                {member.responsibilities.map((resp, rIdx) => (
                                  <li key={rIdx}>• {resp}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Communication */}
                {activeSection === 'communication' && plan.communication && (
                  <motion.div
                    key="communication"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <MegaphoneIcon className="w-8 h-8 text-purple-600" />
                      Plan de communication
                    </h2>

                    {/* Communication interne */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication interne</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Parties prenantes</h4>
                          <div className="flex flex-wrap gap-2">
                            {plan.communication.internalCommunication.stakeholders.map((stakeholder, idx) => (
                              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                {stakeholder}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Fréquence de reporting</h4>
                          <p className="text-gray-700">{plan.communication.internalCommunication.reportingFrequency}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Chemin d'escalade</h4>
                        <div className="flex items-center gap-2">
                          {plan.communication.internalCommunication.escalationPath.map((level, idx) => (
                            <React.Fragment key={idx}>
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                {level}
                              </span>
                              {idx < plan.communication.internalCommunication.escalationPath.length - 1 && (
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Communication client */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication client</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Contact principal</p>
                          <p className="font-medium text-gray-900">{plan.communication.clientCommunication.primaryContact}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cadence des réunions</p>
                          <p className="font-medium text-gray-900">{plan.communication.clientCommunication.meetingCadence}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Canaux de communication</h4>
                        <div className="flex flex-wrap gap-2">
                          {plan.communication.clientCommunication.communicationChannels.map((channel, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Stratégie de proposition</h4>
                        <p className="text-gray-700">{plan.communication.clientCommunication.proposalStrategy}</p>
                      </div>
                    </div>

                    {/* Support marketing */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Support marketing</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Supports disponibles</h4>
                          <ul className="space-y-1">
                            {plan.communication.marketingSupport.collateral.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Événements planifiés</h4>
                          <ul className="space-y-1">
                            {plan.communication.marketingSupport.events.map((event, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                <span>{event}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};