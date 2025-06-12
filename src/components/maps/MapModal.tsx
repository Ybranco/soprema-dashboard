import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Minus, Maximize2, Navigation } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { useMapPopups } from '../../hooks/useMapPopups';
import { ActionPlanModal } from './ActionPlanModal';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const { selectedActionPlan, setSelectedActionPlan, createPopupContent } = useMapPopups();
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
  
  // Utiliser les mêmes localisations clients que GeographicMap
  const { getCustomerReconquestLocations } = useDashboardStore();
  const customerLocations = getCustomerReconquestLocations();

  // Écouteur pour ouvrir le modal du plan d'action
  useEffect(() => {
    const handleOpenActionPlan = (event: any) => {
      const { actionPlan, region, clientNames } = event.detail;
      setSelectedActionPlan({
        actionPlan,
        clientName: clientNames.join(', '),
        region
      });
      setIsActionPlanModalOpen(true);
    };

    const handleOpenReconquestPlan = (event: any) => {
      const { clientName, clientId } = event.detail;
      // Fermer le modal de la carte
      onClose();
      // Faire défiler jusqu'au tableau de bord de reconquête après un court délai
      setTimeout(() => {
        const reconquestSection = document.querySelector('.reconquest-dashboard');
        if (reconquestSection) {
          reconquestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    };

    window.addEventListener('openActionPlan', handleOpenActionPlan);
    window.addEventListener('openReconquestPlan', handleOpenReconquestPlan);
    
    return () => {
      window.removeEventListener('openActionPlan', handleOpenActionPlan);
      window.removeEventListener('openReconquestPlan', handleOpenReconquestPlan);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !mapRef.current || !window.google) return;

    // Initialiser la carte
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 46.603354, lng: 1.888334 }, // Centre de la France
      zoom: 6,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ lightness: -10 }]
        }
      ],
      mapTypeControl: true,
      fullscreenControl: false, // On gère notre propre fullscreen
      streetViewControl: true,
      zoomControl: false // On utilise nos propres contrôles
    });

    mapInstanceRef.current = map;

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Créer les marqueurs pour chaque client
    const bounds = new google.maps.LatLngBounds();
    
    customerLocations.forEach((location) => {
      // Vérifier que les coordonnées existent
      if (!location.lat || !location.lng) {
        return;
      }
      
      const position = {
        lat: location.lat,
        lng: location.lng
      };

      // Couleur selon la priorité du client
      const getMarkerColor = () => {
        switch (location.priority) {
          case 'high': return '#ef4444'; // Rouge
          case 'medium': return '#eab308'; // Jaune
          case 'low': return '#22c55e'; // Vert
          default: return '#3b82f6'; // Bleu
        }
      };

      // Icône personnalisée selon la priorité
      const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: getMarkerColor(),
        fillOpacity: 0.9,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 12
      };

      const marker = new google.maps.Marker({
        position,
        map,
        title: location.clientName,
        icon: icon,
        animation: google.maps.Animation.DROP
      });

      const infoWindow = new google.maps.InfoWindow({
        content: createPopupContent(location)
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Ajuster la vue pour montrer tous les marqueurs
    if (markersRef.current.length > 0) {
      map.fitBounds(bounds);
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom() > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isOpen, customerLocations]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 6;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 6;
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        const pos = marker.getPosition();
        if (pos) bounds.extend(pos);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Maximize2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Localisation Clients à Reconquérir - Vue Détaillée
            </h2>
            <span className="text-sm text-gray-500">
              ({customerLocations.length} clients identifiés)
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1">
          <div ref={mapRef} className="w-full h-full rounded-b-lg" />
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              aria-label="Zoom avant"
            >
              <Plus className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              aria-label="Zoom arrière"
            >
              <Minus className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="w-full h-px bg-gray-300 my-1" />
            
            <button
              onClick={handleRecenter}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              aria-label="Recentrer"
            >
              <Navigation className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Priorité Clients</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Haute (plus de 100k€)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Moyenne (50-100k€)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Faible (moins de 50k€)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {selectedActionPlan && (
        <ActionPlanModal
          isOpen={isActionPlanModalOpen}
          onClose={() => {
            setIsActionPlanModalOpen(false);
            setSelectedActionPlan(null);
          }}
          actionPlan={selectedActionPlan.actionPlan}
          clientName={selectedActionPlan.clientName}
          region={selectedActionPlan.region}
        />
      )}
    </div>
  );
};

export default MapModal;