import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, ChartBarSquareIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { Opportunity } from '../../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onAnalyze?: (id: string) => void;
  onCreatePlan?: (id: string) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
  opportunity, 
  onAnalyze, 
  onCreatePlan 
}) => {
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M€`;
    }
    if (amount >= 1000) {
      return `${Math.floor(amount / 1000)}K€`;
    }
    return `${amount}€`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'medium': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'PRIORITÉ HAUTE';
      case 'medium': return 'PRIORITÉ MOYENNE';
      case 'low': return 'PRIORITÉ BASSE';
      default: return 'PRIORITÉ INCONNUE';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)' }}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 relative">
        <div className="absolute top-5 right-6">
          <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-xs font-medium">
            {opportunity.badge}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold mb-1 pr-20">
          {opportunity.title}
        </h3>
        <p className="text-blue-100 text-sm">
          {opportunity.subtitle}
        </p>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Meta info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Volume détecté</div>
            <div className="text-lg font-semibold">{formatAmount(opportunity.volume)}/an</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Tendance</div>
            <div className={`text-lg font-semibold flex items-center gap-1 ${
              opportunity.trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {opportunity.trend > 0 ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : (
                <ArrowDownIcon className="w-4 h-4" />
              )}
              {Math.abs(opportunity.trend)}%
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {opportunity.description}
        </p>

        {/* Detected products */}
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Produits achetés régulièrement
          </div>
          <div className="flex flex-wrap gap-2">
            {opportunity.detectedProducts.map((product, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
              >
                {product}
              </span>
            ))}
          </div>
        </div>

        {/* Potential section */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 mt-auto">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Potentiel d'affaires</div>
              <div className="text-xl font-bold text-blue-600">
                {formatAmount(opportunity.potential)}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              getPriorityColor(opportunity.priority)
            }`}>
              {getPriorityText(opportunity.priority)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onAnalyze?.(opportunity.id)}
            className="flex-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ChartBarSquareIcon className="w-4 h-4" />
            Analyser
          </button>
          <button
            onClick={() => onCreatePlan?.(opportunity.id)}
            className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RocketLaunchIcon className="w-4 h-4" />
            Plan d'action
          </button>
        </div>
      </div>
    </motion.div>
  );
};