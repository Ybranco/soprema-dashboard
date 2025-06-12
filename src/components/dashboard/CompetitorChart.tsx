import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { Tooltip } from '../common/Tooltip';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useDashboardStore } from '../../store/dashboardStore';

interface ChartData {
  name: string;
  amount: number;
  percentage: number;
}

export const CompetitorChart: React.FC = () => {
  const { competitorProducts } = useDashboardStore();

  const tooltipContent = (
    <div>
      <p>Ce graphique se remplit automatiquement à chaque analyse de facture avec Claude 3.5 Sonnet.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Comment ça fonctionne ?</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Claude 3.5 Sonnet identifie automatiquement les marques concurrentes</li>
          <li>Les montants sont calculés en temps réel</li>
          <li>Le graphique se met à jour après chaque upload</li>
          <li>Plus vous uploadez de factures, plus l'analyse devient précise</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-3 border-blue-600">
        <strong>État actuel :</strong> {competitorProducts.length === 0 ? 
          'Aucune donnée - Uploadez votre première facture !' : 
          `${competitorProducts.length} marques concurrentes détectées`}
      </div>
    </div>
  );

  const formatYAxisLabel = (value: number) => `${value / 1000}K`;
  const formatTooltipValue = (value: number) => [`${value / 1000}K€`, 'Montant'];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Produits Concurrents - Mise à jour en temps réel
          </h3>
          <Tooltip content={tooltipContent} title="Graphique en temps réel" />
        </div>
      </div>
      
      <div className="p-6">
        {competitorProducts.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Graphique en attente</h3>
              <p className="text-gray-500 mb-4">
                Les données apparaîtront automatiquement après l'analyse de vos factures par Claude 3.5 Sonnet
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  🧠 <strong>Claude 3.5 Sonnet</strong> identifiera automatiquement toutes les marques concurrentes et calculera les montants
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorProducts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={formatYAxisLabel}
                />
                <RechartsTooltip 
                  formatter={formatTooltipValue}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {competitorProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};