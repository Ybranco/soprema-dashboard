import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Tooltip } from '../common/Tooltip';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: number;
  trendDirection: 'up' | 'down';
  icon: React.ReactNode;
  tooltipContent: React.ReactNode;
  onClick?: () => void;
  valueType?: 'currency' | 'number'; // Nouveau paramètre pour spécifier le type
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendDirection,
  icon,
  tooltipContent,
  onClick,
  valueType = 'currency' // Par défaut currency pour maintenir la compatibilité
}) => {
  const formatValue = (val: string | number, isForCurrency: boolean = true) => {
    if (typeof val === 'number') {
      // Arrondir d'abord pour éviter les décimales infinies
      const roundedVal = Math.round(val * 100) / 100;
      
      if (isForCurrency && valueType === 'currency') {
        // Formatage pour les montants en euros
        if (roundedVal >= 1000000) {
          return `${(roundedVal / 1000000).toFixed(1)} M€`;
        }
        if (roundedVal >= 1000) {
          return `${Math.round(roundedVal / 1000)} K€`;
        }
        return roundedVal.toLocaleString('fr-FR', { 
          style: 'currency', 
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      } else {
        // Formatage pour les nombres (comptages, etc.)
        if (roundedVal >= 1000000) {
          return `${(roundedVal / 1000000).toFixed(1)} M`;
        }
        if (roundedVal >= 1000) {
          return `${Math.round(roundedVal / 1000)} K`;
        }
        return roundedVal.toLocaleString('fr-FR');
      }
    }
    return val;
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
      className={`bg-white rounded-xl p-6 shadow-md border border-gray-200 relative overflow-hidden ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      {/* Indicateur visuel pour les cartes cliquables */}
      {onClick && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Cliquer pour ouvrir
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center">
          {title}
          <Tooltip content={tooltipContent} />
        </h3>
      </div>
      
      <div className="text-3xl font-bold text-blue-600 mb-3">
        {formatValue(value, true)}
      </div>
      
      <div className={`flex items-center gap-1 text-sm font-medium ${
        trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
      }`}>
        {trendDirection === 'up' ? (
          <ArrowUpIcon className="w-4 h-4" />
        ) : (
          <ArrowDownIcon className="w-4 h-4" />
        )}
        +{formatValue(trend, false)} cette semaine
      </div>
    </motion.div>
  );
};