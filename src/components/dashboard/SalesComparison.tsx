import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useDashboardStore } from '../../store/dashboardStore';
import { Tooltip } from '../common/Tooltip';

export const SalesComparison: React.FC = () => {
  const invoices = useDashboardStore(state => state.invoices);
  
  // Calculer les totaux Soprema vs Concurrence
  const calculateSalesData = () => {
    let sopremaTotal = 0;
    let competitorTotal = 0;
    const competitorBrands: { [key: string]: number } = {};
    
    invoices.forEach(invoice => {
      invoice.products.forEach(product => {
        if (product.type === 'competitor') {
          competitorTotal += product.totalPrice;
          const brand = product.competitor?.brand || 'Autres marques';
          competitorBrands[brand] = (competitorBrands[brand] || 0) + product.totalPrice;
        } else {
          sopremaTotal += product.totalPrice;
        }
      });
    });
    
    const totalSales = sopremaTotal + competitorTotal;
    const sopremaPercentage = totalSales > 0 ? (sopremaTotal / totalSales) * 100 : 0;
    const competitorPercentage = totalSales > 0 ? (competitorTotal / totalSales) * 100 : 0;
    
    return {
      sopremaTotal,
      competitorTotal,
      totalSales,
      sopremaPercentage,
      competitorPercentage,
      competitorBrands: Object.entries(competitorBrands)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  };
  
  const salesData = calculateSalesData();
  
  const tooltipContent = (
    <div>
      <p>Cette analyse compare les ventes de produits Soprema avec celles de la concurrence.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Informations clés</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Part de marché Soprema dans vos factures</li>
          <li>Identification des marques concurrentes principales</li>
          <li>Opportunités de conversion potentielles</li>
          <li>Évolution de la pénétration Soprema</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-3 border-blue-600">
        <strong>Objectif :</strong> Augmenter la part de marché Soprema en identifiant et convertissant les achats de produits concurrents.
      </div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Comparaison Soprema vs Concurrence
          </h3>
          <Tooltip content={tooltipContent} title="Analyse comparative des ventes" />
        </div>
      </div>
      
      <div className="p-6">
        {/* Barres de progression principales */}
        <div className="space-y-6">
          {/* Soprema */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="font-medium text-gray-700">Produits Soprema</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {salesData.sopremaPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  ({salesData.sopremaTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div 
                className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                style={{ width: `${salesData.sopremaPercentage}%` }}
              >
                {salesData.sopremaPercentage > 10 && (
                  <span className="text-white text-sm font-medium">
                    {salesData.sopremaPercentage.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Concurrence */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="font-medium text-gray-700">Produits Concurrents</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-600">
                  {salesData.competitorPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  ({salesData.competitorTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div 
                className="bg-red-500 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                style={{ width: `${salesData.competitorPercentage}%` }}
              >
                {salesData.competitorPercentage > 10 && (
                  <span className="text-white text-sm font-medium">
                    {salesData.competitorPercentage.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Total des ventes */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total analysé</span>
            <span className="text-xl font-bold text-gray-900">
              {salesData.totalSales.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>
        
        {/* Top marques concurrentes */}
        {salesData.competitorBrands.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-4">Top 5 Marques Concurrentes</h4>
            <div className="space-y-3">
              {salesData.competitorBrands.map(([brand, amount], index) => {
                const percentage = (amount / salesData.competitorTotal) * 100;
                return (
                  <div key={brand} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-4">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700">{brand}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Indicateur d'opportunité */}
        {salesData.competitorTotal > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Opportunité de conversion</h4>
                <p className="text-sm text-gray-700">
                  Potentiel de conversion des produits concurrents : {' '}
                  <span className="font-bold text-green-600">
                    {salesData.competitorTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Les plans de reconquête client ciblent ces opportunités
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};