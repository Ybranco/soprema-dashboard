import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentArrowUpIcon, 
  EyeIcon, 
  TagIcon, 
  CpuChipIcon, 
  LightBulbIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Tooltip } from '../common/Tooltip';
import { useDashboardStore } from '../../store/dashboardStore';

export const AnalysisPanel: React.FC = () => {
  const { analysisSteps, analysisResults, updateAnalysisStep } = useDashboardStore();

  const tooltipContent = (
    <div>
      <p>Vous voyez ici comment notre système analyse les factures automatiquement avec Claude 3.5 Sonnet et les résultats de la dernière analyse.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Les étapes d'analyse</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><span className="font-medium">Importation :</span> Réception de la facture dans notre système</li>
          <li><span className="font-medium">Reconnaissance :</span> Lecture automatique du document</li>
          <li><span className="font-medium">Extraction :</span> Identification des produits et quantités</li>
          <li><span className="font-medium">Analyse :</span> Comparaison avec les produits SOPREMA</li>
          <li><span className="font-medium">Opportunités :</span> Création de propositions commerciales</li>
        </ol>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-3 border-blue-600">
        <strong>Exemple :</strong> La facture de PRO-ETANCHE a été traitée en moins de 10 secondes. Claude 3.5 Sonnet a identifié 3 produits concurrents représentant un potentiel de près de 8 000€.
      </div>
    </div>
  );

  const getStepIcon = (icon: string) => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case 'file-import': return <DocumentArrowUpIcon className={iconClass} />;
      case 'eye': return <EyeIcon className={iconClass} />;
      case 'tags': return <TagIcon className={iconClass} />;
      case 'brain': return <CpuChipIcon className={iconClass} />;
      case 'lightbulb': return <LightBulbIcon className={iconClass} />;
      default: return <DocumentArrowUpIcon className={iconClass} />;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
    } else if (status === 'current') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      );
    } else {
      return <div className="w-6 h-6 rounded-full bg-gray-300" />;
    }
  };

  // Simulate real-time analysis
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStep = analysisSteps.find(step => step.status === 'current');
      if (currentStep && currentStep.progress < 100) {
        updateAnalysisStep(currentStep.id, 'current', Math.min(100, currentStep.progress + 2));
      } else if (currentStep && currentStep.progress >= 100) {
        updateAnalysisStep(currentStep.id, 'completed', 100);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [analysisSteps, updateAnalysisStep]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <CpuChipIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Analyse Claude 3.5 Sonnet en temps réel
          </h3>
          <Tooltip content={tooltipContent} title="Analyse en temps réel" />
        </div>
      </div>
      
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            {analysisSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {getStepIcon(step.icon)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {step.title}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${step.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
            <span className="text-sm text-gray-600">Dernière facture:</span>
            <span className="text-sm font-medium">{analysisResults.lastInvoice}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
            <span className="text-sm text-gray-600">Produits détectés:</span>
            <span className="text-sm font-medium text-right">{analysisResults.detectedProducts}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
            <span className="text-sm text-gray-600">Marques concurrentes:</span>
            <span className="text-sm font-medium">{analysisResults.competitorBrands}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
            <span className="text-sm text-gray-600">Opportunités générées:</span>
            <span className="text-sm font-medium">{analysisResults.opportunitiesGenerated}</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Potentiel estimé:</span>
            <span className="text-sm font-semibold text-green-600">
              {analysisResults.estimatedPotential.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};