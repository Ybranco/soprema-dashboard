import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../common/Modal';
import { Opportunity } from '../../types';
import { 
  RocketLaunchIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  responsible: string;
  status: 'pending' | 'in-progress' | 'completed';
  type: 'call' | 'email' | 'visit' | 'proposal' | 'follow-up';
}

export const ActionPlanModal: React.FC<ActionPlanModalProps> = ({
  isOpen,
  onClose,
  opportunity
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'aggressive' | 'standard' | 'conservative'>('standard');

  if (!opportunity) return null;

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneIcon className="w-5 h-5" />;
      case 'email': return <EnvelopeIcon className="w-5 h-5" />;
      case 'visit': return <UserIcon className="w-5 h-5" />;
      case 'proposal': return <DocumentIcon className="w-5 h-5" />;
      case 'follow-up': return <ClockIcon className="w-5 h-5" />;
      default: return <CheckCircleIcon className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-700';
      case 'email': return 'bg-purple-100 text-purple-700';
      case 'visit': return 'bg-green-100 text-green-700';
      case 'proposal': return 'bg-orange-100 text-orange-700';
      case 'follow-up': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const actionPlans = {
    aggressive: [
      {
        id: '1',
        title: 'Appel immédiat au décideur',
        description: 'Contacter directement le responsable achat pour présenter la valeur ajoutée SOPREMA',
        priority: 'high' as const,
        deadline: '2025-04-20',
        responsible: 'Commercial terrain',
        status: 'pending' as const,
        type: 'call' as const
      },
      {
        id: '2',
        title: 'Proposition technique express',
        description: 'Envoyer une offre détaillée avec comparatif technique et financier sous 48h',
        priority: 'high' as const,
        deadline: '2025-04-22',
        responsible: 'Ingénieur commercial',
        status: 'pending' as const,
        type: 'proposal' as const
      },
      {
        id: '3',
        title: 'Visite technique urgente',
        description: 'Organiser une démonstration produit avec échantillons sur le chantier en cours',
        priority: 'high' as const,
        deadline: '2025-04-25',
        responsible: 'Technico-commercial',
        status: 'pending' as const,
        type: 'visit' as const
      },
      {
        id: '4',
        title: 'Offre promotionnelle limitée',
        description: 'Proposer une remise exceptionnelle pour signature sous 15 jours',
        priority: 'medium' as const,
        deadline: '2025-05-05',
        responsible: 'Directeur commercial',
        status: 'pending' as const,
        type: 'proposal' as const
      }
    ],
    standard: [
      {
        id: '1',
        title: 'Prise de contact professionnelle',
        description: 'Email de présentation avec documentation technique SOPREMA',
        priority: 'high' as const,
        deadline: '2025-04-22',
        responsible: 'Commercial terrain',
        status: 'pending' as const,
        type: 'email' as const
      },
      {
        id: '2',
        title: 'Analyse des besoins',
        description: 'Appel téléphonique pour comprendre les projets à venir et les critères de choix',
        priority: 'high' as const,
        deadline: '2025-04-25',
        responsible: 'Commercial terrain',
        status: 'pending' as const,
        type: 'call' as const
      },
      {
        id: '3',
        title: 'Proposition technique adaptée',
        description: 'Étude comparative avec les produits actuellement utilisés',
        priority: 'medium' as const,
        deadline: '2025-05-02',
        responsible: 'Ingénieur commercial',
        status: 'pending' as const,
        type: 'proposal' as const
      },
      {
        id: '4',
        title: 'Présentation en agence',
        description: 'Rendez-vous dans les locaux du client pour présentation approfondie',
        priority: 'medium' as const,
        deadline: '2025-05-10',
        responsible: 'Technico-commercial',
        status: 'pending' as const,
        type: 'visit' as const
      },
      {
        id: '5',
        title: 'Suivi et relance',
        description: 'Point régulier sur l\'avancement de la réflexion client',
        priority: 'low' as const,
        deadline: '2025-05-20',
        responsible: 'Commercial terrain',
        status: 'pending' as const,
        type: 'follow-up' as const
      }
    ],
    conservative: [
      {
        id: '1',
        title: 'Veille et information',
        description: 'Envoi d\'une newsletter technique avec les dernières innovations',
        priority: 'low' as const,
        deadline: '2025-04-30',
        responsible: 'Marketing',
        status: 'pending' as const,
        type: 'email' as const
      },
      {
        id: '2',
        title: 'Invitation événement',
        description: 'Convier le client aux prochaines journées techniques SOPREMA',
        priority: 'medium' as const,
        deadline: '2025-05-15',
        responsible: 'Commercial terrain',
        status: 'pending' as const,
        type: 'email' as const
      },
      {
        id: '3',
        title: 'Contact distributeur',
        description: 'Sensibiliser le distributeur pour qu\'il présente les alternatives SOPREMA',
        priority: 'medium' as const,
        deadline: '2025-05-20',
        responsible: 'KAM Distributeur',
        status: 'pending' as const,
        type: 'call' as const
      },
      {
        id: '4',
        title: 'Suivi passif',
        description: 'Monitoring des commandes via le distributeur pour détecter les opportunités',
        priority: 'low' as const,
        deadline: '2025-06-01',
        responsible: 'Commercial terrain',
        status: 'pending' as const,
        type: 'follow-up' as const
      }
    ]
  };

  const currentPlan = actionPlans[selectedTemplate];

  const handleDownloadPlan = () => {
    // Simulation du téléchargement d'un plan d'action en PDF
    const content = `
Plan d'Action Commercial - ${opportunity.title}
==============================================

Client: ${opportunity.client}
Distributeur: ${opportunity.distributor}
Région: ${opportunity.region}
Potentiel: ${opportunity.potential.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}

Actions planifiées:
${currentPlan.map((action, index) => `
${index + 1}. ${action.title}
   - Description: ${action.description}
   - Priorité: ${action.priority}
   - Échéance: ${action.deadline}
   - Responsable: ${action.responsible}
`).join('')}

Généré le ${new Date().toLocaleDateString('fr-FR')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-action-${opportunity.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🚀 Plan d'action - ${opportunity.title}`}
      maxWidth="6xl"
    >
      <div className="p-6">
        {/* Sélecteur de stratégie */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisissez votre stratégie d'approche</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                key: 'aggressive',
                title: 'Approche Active',
                description: 'Contact direct et proposition rapide',
                timeline: '2-3 semaines',
                color: 'border-red-300 bg-red-50'
              },
              {
                key: 'standard',
                title: 'Approche Standard',
                description: 'Démarche commerciale classique et méthodique',
                timeline: '4-6 semaines',
                color: 'border-blue-300 bg-blue-50'
              },
              {
                key: 'conservative',
                title: 'Approche Douce',
                description: 'Sensibilisation progressive et non-intrusive',
                timeline: '6-12 semaines',
                color: 'border-green-300 bg-green-50'
              }
            ].map((strategy) => (
              <motion.div
                key={strategy.key}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTemplate === strategy.key 
                    ? strategy.color + ' border-opacity-100' 
                    : 'border-gray-200 bg-gray-50 border-opacity-50'
                }`}
                onClick={() => setSelectedTemplate(strategy.key as any)}
              >
                <h4 className="font-semibold text-gray-900 mb-2">{strategy.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                <div className="text-xs text-gray-500">Délai: {strategy.timeline}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Plan d'action détaillé */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RocketLaunchIcon className="w-5 h-5 text-blue-600" />
                Plan d'action détaillé
              </h3>
              <button
                onClick={handleDownloadPlan}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <DocumentIcon className="w-4 h-4" />
                Télécharger le plan
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {currentPlan.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(action.type)}`}>
                        {getActionIcon(action.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{action.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{action.description}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(action.priority)}`}>
                      {action.priority === 'high' ? 'PRIORITÉ HAUTE' : 
                       action.priority === 'medium' ? 'PRIORITÉ MOYENNE' : 'PRIORITÉ BASSE'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Échéance: {new Date(action.deadline).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>Responsable: {action.responsible}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        action.status === 'completed' ? 'bg-green-500' :
                        action.status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="capitalize">{action.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Modèles d'emails et documents */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📧 Modèles disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Email de première approche</h4>
              <p className="text-sm text-blue-700 mb-3">Modèle personnalisé avec les produits SOPREMA correspondants</p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                → Utiliser ce modèle
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Proposition technique</h4>
              <p className="text-sm text-blue-700 mb-3">Document de comparaison avec arguments techniques</p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                → Générer la proposition
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};