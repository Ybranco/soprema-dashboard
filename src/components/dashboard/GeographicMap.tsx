import React, { useState, useEffect } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { GoogleMapComponent } from '../maps/GoogleMapComponent';
import { Tooltip } from '../common/Tooltip';
import { MapPinIcon, ArrowsPointingOutIcon, UserIcon } from '@heroicons/react/24/outline';
import { useDashboardStore } from '../../store/dashboardStore';
import MapModal from '../maps/MapModal';

interface GeographicMapProps {
  opportunities?: any[]; // Optionnel, on va utiliser le store
}

export const GeographicMap: React.FC<GeographicMapProps> = () => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { getCustomerReconquestLocations, invoices } = useDashboardStore();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  // Récupérer les localisations des clients pour la reconquête
  const customerLocations = getCustomerReconquestLocations();

  // Écouteur pour l'événement de reconquête
  useEffect(() => {
    const handleOpenReconquestPlan = (event: any) => {
      const { clientName, clientId } = event.detail;
      // Faire défiler jusqu'au tableau de bord de reconquête
      setTimeout(() => {
        const reconquestSection = document.querySelector('.reconquest-dashboard');
        if (reconquestSection) {
          reconquestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };

    window.addEventListener('openReconquestPlan', handleOpenReconquestPlan);
    
    return () => {
      window.removeEventListener('openReconquestPlan', handleOpenReconquestPlan);
    };
  }, []);

  const tooltipContent = (
    <div>
      <p>Cette carte montre vos clients avec des produits concurrents et leurs plans de reconquête personnalisés.</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Comment lire cette carte</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>🔴 Point rouge : Client priorité haute (plus de 100k€ concurrence)</li>
          <li>🟡 Point jaune : Client priorité moyenne (50-100k€)</li>
          <li>🟢 Point vert : Client priorité faible (moins de 50k€)</li>
          <li>📍 Localisation spécifique du client</li>
        </ul>
      </div>
      
      <div className="mt-4">
        <h4 className="font-semibold text-base mb-2">Plans de reconquête</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Analyse consolidée de l'historique d'achat</li>
          <li>Stratégie personnalisée par client</li>
          <li>Actions concrètes basées sur les produits concurrents</li>
          <li>Potentiel de conversion estimé à 70%</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-3 border-blue-600">
        <strong>Focus client :</strong> Chaque point représente un client spécifique avec son potentiel de reconquête basé sur ses achats de produits concurrents.
      </div>
    </div>
  );

  const LoadingComponent = () => (
    <div className="w-full h-80 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-blue-700">Chargement de la carte...</p>
      </div>
    </div>
  );

  const ErrorComponent = () => (
    <div className="w-full h-80 bg-gradient-to-b from-red-100 to-red-200 rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <div className="text-red-600 mb-4">
          <MapPinIcon className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Carte non disponible
        </h3>
        <p className="text-red-700 text-sm mb-4">
          Clé API Google Maps manquante ou invalide
        </p>
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded border">
          <p>Pour activer Google Maps :</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Obtenez une clé API sur Google Cloud Console</li>
            <li>Activez l'API "Maps JavaScript API"</li>
            <li>Ajoutez VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env</li>
          </ol>
        </div>
      </div>
    </div>
  );

  const EmptyMapComponent = () => (
    <div className="w-full h-80 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <div className="text-gray-400 mb-4">
          <MapPinIcon className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Aucun client à reconquérir
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Les clients avec des produits concurrents s'afficheront après l'analyse des factures
        </p>
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
          <p>🎯 Critères d'affichage :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Clients avec plus de 5 000€ de produits concurrents</li>
            <li>Localisation basée sur la région ou adresse spécifique</li>
            <li>Plans de reconquête personnalisés disponibles</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderMap = (status: any) => {
    switch (status) {
      case 'LOADING':
        return <LoadingComponent />;
      case 'FAILURE':
        return <ErrorComponent />;
      case 'SUCCESS':
        return customerLocations.length > 0 ? (
          <GoogleMapComponent 
            opportunities={customerLocations} 
            apiKey={googleMapsApiKey}
          />
        ) : (
          <EmptyMapComponent />
        );
      default:
        return <LoadingComponent />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Localisation Clients à Reconquérir
          </h3>
          <Tooltip content={tooltipContent} title="Plans de reconquête client" />
        </div>
      </div>
      
      <div className="p-6">
        <div className="relative w-full h-80 rounded-lg overflow-hidden group">
          {googleMapsApiKey ? (
            <Wrapper
              apiKey={googleMapsApiKey}
              render={renderMap}
              libraries={['places', 'marker']}
            />
          ) : (
            <ErrorComponent />
          )}
          
          {/* Bouton d'agrandissement */}
          <button
            onClick={() => setIsMapModalOpen(true)}
            className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all"
            aria-label="Agrandir la carte"
          >
            <ArrowsPointingOutIcon className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Légende enrichie */}
          {customerLocations.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-md border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-2">Priorité Clients</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  <span>Haute (plus de 100k€)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                  <span>Moyenne (50-100k€)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  <span>Faible (moins de 50k€)</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistiques enrichies */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{customerLocations.length}</div>
            <div className="text-xs text-blue-700">Clients</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">
              {customerLocations.filter(loc => loc.priority === 'high').length}
            </div>
            <div className="text-xs text-red-700">Priorité haute</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.floor(customerLocations.reduce((acc, loc) => acc + loc.competitorAmount, 0) / 1000)}K€
            </div>
            <div className="text-xs text-yellow-700">Concurrence</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(customerLocations.reduce((acc, loc) => acc + loc.reconquestPotential, 0) / 1000)}K€
            </div>
            <div className="text-xs text-green-700">Potentiel</div>
          </div>
        </div>
      </div>
      
      {/* Modal de carte agrandie */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />
    </div>
  );
};