import React from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../common/Modal';
import { Opportunity } from '../../types';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  CurrencyEuroIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  TagIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

interface OpportunityAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
}

export const OpportunityAnalysisModal: React.FC<OpportunityAnalysisModalProps> = ({
  isOpen,
  onClose,
  opportunity
}) => {
  if (!opportunity) return null;

  // Données simulées pour l'analyse
  const monthlyData = [
    { month: 'Jan', concurrent: 85000, soprema: 12000 },
    { month: 'Fév', concurrent: 92000, soprema: 15000 },
    { month: 'Mar', concurrent: 78000, soprema: 18000 },
    { month: 'Avr', concurrent: 105000, soprema: 22000 },
    { month: 'Mai', concurrent: 98000, soprema: 28000 },
    { month: 'Jun', concurrent: 110000, soprema: 25000 }
  ];

  const competitorBreakdown = [
    { name: 'IKO ARMOURPLAN', value: 45000, percentage: 38 },
    { name: 'SMARTROOF B', value: 32000, percentage: 27 },
    { name: 'ENERTHERM ALU', value: 28000, percentage: 23 },
    { name: 'Autres', value: 15000, percentage: 12 }
  ];

  const conversionScenarios = [
    {
      scenario: 'Conservateur (40%)',
      potential: opportunity.potential * 0.4,
      timeline: '12-18 mois',
      confidence: 'Élevée',
      color: 'bg-green-100 text-green-700'
    },
    {
      scenario: 'Réaliste (65%)',
      potential: opportunity.potential * 0.65,
      timeline: '8-12 mois',
      confidence: 'Moyenne',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      scenario: 'Optimiste (85%)',
      potential: opportunity.potential * 0.85,
      timeline: '6-8 mois',
      confidence: 'Faible',
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M€`;
    }
    if (amount >= 1000) {
      return `${Math.floor(amount / 1000)}K€`;
    }
    return `${amount}€`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📊 Analyse détaillée - ${opportunity.title}`}
      maxWidth="6xl"
    >
      <div className="p-6 space-y-8">
        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <CurrencyEuroIcon className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Volume annuel</h3>
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatAmount(opportunity.volume)}</div>
            <div className="text-sm text-blue-700">Produits concurrents</div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-900">Croissance</h3>
            </div>
            <div className="text-2xl font-bold text-green-600">+{opportunity.trend}%</div>
            <div className="text-sm text-green-700">Sur 12 mois</div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Fréquence</h3>
            </div>
            <div className="text-2xl font-bold text-purple-600">2.3x/mois</div>
            <div className="text-sm text-purple-700">Commandes moyennes</div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold text-orange-900">Saisonnalité</h3>
            </div>
            <div className="text-2xl font-bold text-orange-600">Mars-Sept</div>
            <div className="text-sm text-orange-700">Période haute</div>
          </div>
        </div>

        {/* Évolution mensuelle */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            Évolution des achats (6 derniers mois)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickFormatter={(value) => `${value / 1000}K€`} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Area 
                  type="monotone" 
                  dataKey="concurrent" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#fecaca" 
                  name="Produits concurrents"
                />
                <Area 
                  type="monotone" 
                  dataKey="soprema" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#dbeafe" 
                  name="Produits SOPREMA"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition des produits concurrents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-red-600" />
              Produits concurrents achetés
            </h3>
            <div className="space-y-4">
              {competitorBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.percentage}% du volume</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatAmount(item.value)}</div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scénarios de conversion */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-green-600" />
              Scénarios de conversion
            </h3>
            <div className="space-y-4">
              {conversionScenarios.map((scenario, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg ${scenario.color}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{scenario.scenario}</h4>
                    <span className="text-sm opacity-75">Confiance: {scenario.confidence}</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{formatAmount(scenario.potential)}</div>
                  <div className="text-sm opacity-75">Délai: {scenario.timeline}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 Recommandations stratégiques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">Actions prioritaires</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span className="text-blue-700">Organiser une visite technique avec échantillons EFYOS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span className="text-blue-700">Proposer un essai gratuit sur un petit chantier</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span className="text-blue-700">Mettre en avant la garantie système 20 ans</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">Arguments clés</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-blue-700">Performances thermiques supérieures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-blue-700">Support technique dédié sur chantier</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-blue-700">Gamme complète en stock local</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};