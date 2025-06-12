import { useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

export const useMapPopups = () => {
  const [selectedActionPlan, setSelectedActionPlan] = useState<{
    actionPlan: any;
    clientName: string;
    region: string;
  } | null>(null);
  
  const invoices = useDashboardStore(state => state.invoices);

  // Fonction pour détecter les erreurs de conversion
  const isConversionError = (text: string) => {
    const lowercaseText = text.toLowerCase();
    return lowercaseText.includes('conversion alternative') ||
           lowercaseText.includes('document pdf') ||
           lowercaseText.includes('non extrait') ||
           lowercaseText.includes('pdf - conversion') ||
           lowercaseText.includes('erreur conversion') ||
           lowercaseText.includes('échec extraction');
  };

  // Fonction pour obtenir les noms de clients par région
  const getClientNamesByRegion = (region: string): string[] => {
    const clientsInRegion = invoices
      .filter(invoice => {
        // Filtrer les invoices avec des noms de clients erronés
        const clientName = invoice.client.name || '';
        return (invoice.region || 'France') === region && !isConversionError(clientName);
      })
      .map(invoice => invoice.client.name);
    
    return Array.from(new Set(clientsInRegion));
  };

  // Fonction pour obtenir tous les clients et leurs factures par région
  const getClientsDetailsByRegion = (region: string) => {
    const clientMap = new Map<string, any[]>();
    
    invoices
      .filter(invoice => {
        // Filtrer les invoices avec des noms de clients erronés
        const clientName = invoice.client.name || '';
        return (invoice.region || 'France') === region && !isConversionError(clientName);
      })
      .forEach(invoice => {
        const clientName = invoice.client.name;
        if (!clientMap.has(clientName)) {
          clientMap.set(clientName, []);
        }
        clientMap.get(clientName)!.push(invoice);
      });
    
    return clientMap;
  };

  // Fonction pour créer le contenu HTML du popup avec les vrais noms de clients
  const createPopupContent = (opportunity: any) => {
    // Détection du type de données (client spécifique ou région)
    const isCustomerData = opportunity.clientName && opportunity.competitorAmount !== undefined;
    
    const formatAmount = (amount: number) => {
      // Arrondir d'abord pour éviter les décimales infinies
      const roundedAmount = Math.round(amount);
      
      if (roundedAmount >= 1000000) {
        return `${(roundedAmount / 1000000).toFixed(1)} M€`;
      }
      if (roundedAmount >= 1000) {
        return `${Math.round(roundedAmount / 1000)} K€`;
      }
      // Utiliser toLocaleString pour un formatage propre avec des espaces de milliers
      return roundedAmount.toLocaleString('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };
    
    // Si c'est une donnée client spécifique (nouveau format)
    if (isCustomerData) {
      const getPriorityColor = (priority: string) => {
        switch (priority) {
          case 'high': return '#dc2626';
          case 'medium': return '#f59e0b';
          case 'low': return '#10b981';
          default: return '#3b82f6';
        }
      };
      
      const getPriorityLabel = (priority: string) => {
        switch (priority) {
          case 'high': return '🔴 Priorité haute';
          case 'medium': return '🟡 Priorité moyenne';
          case 'low': return '🟢 Priorité faible';
          default: return '⚪ Priorité normale';
        }
      };
      
      const lastPurchaseDate = opportunity.lastPurchaseDate ? 
        new Date(opportunity.lastPurchaseDate).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'Non disponible';
      
      return `
        <div style="padding: 16px; font-family: Inter, sans-serif; max-width: 350px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            👤 ${opportunity.clientName}
          </h3>
          
          <div style="margin-bottom: 8px; padding: 8px; background: #f3f4f6; border-radius: 6px;">
            <div style="font-size: 12px; color: ${getPriorityColor(opportunity.priority)}; font-weight: 600; margin-bottom: 4px;">
              ${getPriorityLabel(opportunity.priority)}
            </div>
            ${opportunity.address ? `
              <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">
                📍 ${opportunity.address}
              </div>
            ` : ''}
            <div style="font-size: 11px; color: #6b7280;">
              📅 Dernier achat: ${lastPurchaseDate}
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="margin-bottom: 6px; color: #374151; font-size: 14px;">
              <strong>Produits concurrents:</strong> ${formatAmount(opportunity.competitorAmount)}
            </div>
            <div style="margin-bottom: 6px; color: #374151; font-size: 14px;">
              <strong>Potentiel de reconquête:</strong> 
              <span style="color: #10b981; font-weight: 600;">${formatAmount(opportunity.reconquestPotential)}</span>
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              💡 Conversion estimée à 70%
            </div>
          </div>
          
          ${opportunity.hasReconquestPlan ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 6px 0; color: #10b981; font-size: 14px; font-weight: 600;">
                🎯 Plan de Reconquête Disponible
              </h4>
              <button 
                onclick="(function() {
                  var detail = {
                    clientName: '${opportunity.clientName.replace(/'/g, "\\'").replace(/"/g, '\\"')}',
                    clientId: '${opportunity.id}',
                    competitorAmount: ${opportunity.competitorAmount},
                    reconquestPotential: ${opportunity.reconquestPotential},
                    priority: '${opportunity.priority}'
                  };
                  window.dispatchEvent(new CustomEvent('openReconquestPlan', { detail: detail }));
                })()"
                style="
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  font-size: 13px;
                  cursor: pointer;
                  width: 100%;
                  margin-top: 8px;
                  font-weight: 500;
                "
                onmouseover="this.style.background='#2563eb'"
                onmouseout="this.style.background='#3b82f6'"
              >
                Voir le plan de reconquête →
              </button>
            </div>
          ` : `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <div style="background: #fef3c7; padding: 8px; border-radius: 6px;">
                <div style="font-size: 11px; color: #92400e; text-align: center;">
                  ⏳ Générez un plan de reconquête depuis le tableau de bord
                </div>
              </div>
            </div>
          `}
        </div>
      `;
    }
    
    // Sinon, c'est l'ancien format par région
    const clientDetails = getClientsDetailsByRegion(opportunity.region);
    const clientNames = Array.from(clientDetails.keys());

    // Section des clients
    const clientsSection = clientNames.length > 0 ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
          Clients dans cette région:
        </h4>
        <div style="max-height: 150px; overflow-y: auto;">
          ${clientNames.map(clientName => {
            const clientInvoices = clientDetails.get(clientName) || [];
            const clientTotal = clientInvoices.reduce((sum, inv) => sum + inv.potential, 0);
            const hasActionPlan = clientInvoices.some(inv => inv.actionPlan);
            
            return `
              <div style="background: #f9fafb; padding: 8px; border-radius: 6px; margin-bottom: 6px;">
                <div style="font-weight: 500; color: #1f2937; font-size: 13px;">
                  ${hasActionPlan ? '🎯' : '📋'} ${clientName}
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                  ${clientInvoices.length} facture${clientInvoices.length > 1 ? 's' : ''} • 
                  Potentiel: ${formatAmount(clientTotal)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    // Section du plan d'action
    const actionPlanSection = opportunity.actionPlan ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 6px 0; color: #10b981; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
          🎯 Plan d'Action Claude 3.5 Sonnet
        </h4>
        <div style="font-size: 12px; color: #374151; margin-bottom: 8px;">
          <strong>Stratégie:</strong> Plan de reconquête personnalisé disponible
        </div>
        <div style="font-size: 12px; color: #374151; margin-bottom: 8px;">
          <strong>Actions:</strong> ${opportunity.actionPlan.actionPlan?.immediate?.length || 0} actions immédiates
        </div>
        <button 
          onclick="window.dispatchEvent(new CustomEvent('openActionPlan', { detail: { 
            actionPlan: ${JSON.stringify(opportunity.actionPlan).replace(/"/g, '&quot;')}, 
            region: '${opportunity.region}',
            clientNames: ${JSON.stringify(clientNames).replace(/"/g, '&quot;')}
          }}))"
          style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            width: 100%;
            margin-top: 8px;
            font-weight: 500;
          "
          onmouseover="this.style.background='#2563eb'"
          onmouseout="this.style.background='#3b82f6'"
        >
          Voir le plan d'action complet →
        </button>
      </div>
    ` : `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <div style="background: #fef3c7; padding: 8px; border-radius: 6px;">
          <div style="font-size: 11px; color: #92400e; text-align: center;">
            ⏳ Plan d'action en cours de génération...
          </div>
        </div>
      </div>
    `;

    return `
      <div style="padding: 16px; font-family: Inter, sans-serif; max-width: 350px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          📍 ${opportunity.region}
        </h3>
        <div style="margin-bottom: 8px; color: #374151; font-size: 14px;">
          <strong>Potentiel total:</strong> ${formatAmount(opportunity.amount)}
        </div>
        <div style="margin-bottom: 8px; color: #374151; font-size: 14px;">
          <strong>Nombre de clients:</strong> ${opportunity.clients}
        </div>
        <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">
          ${opportunity.actionPlan ? 
            '✅ Analysé par Claude 3.5 Sonnet' : 
            '⏳ Analyse en cours...'
          }
        </div>
        ${clientsSection}
        ${actionPlanSection}
      </div>
    `;
  };

  return {
    selectedActionPlan,
    setSelectedActionPlan,
    createPopupContent,
    getClientNamesByRegion,
    getClientsDetailsByRegion
  };
};