import React, { useEffect, useRef, useState } from 'react';
import { useMapPopups } from '../../hooks/useMapPopups';
import { ActionPlanModal } from './ActionPlanModal';

interface MapDot {
  id: string;
  lat: number;
  lng: number;
  clientName: string;
  address?: string;
  competitorAmount?: number;
  reconquestPotential?: number;
  priority?: 'high' | 'medium' | 'low';
  lastPurchaseDate?: string;
  hasReconquestPlan?: boolean;
  // Keep legacy fields for backward compatibility
  region?: string;
  amount?: number;
  size?: 'small' | 'medium' | 'large';
  clients?: number;
  actionPlan?: any;
}

interface GoogleMapComponentProps {
  opportunities: MapDot[];
  apiKey: string;
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ opportunities, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const { selectedActionPlan, setSelectedActionPlan, createPopupContent } = useMapPopups();
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);

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

    window.addEventListener('openActionPlan', handleOpenActionPlan);
    
    return () => {
      window.removeEventListener('openActionPlan', handleOpenActionPlan);
    };
  }, []);

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    // Initialiser la carte avec une version compatible
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 46.603354, lng: 1.888334 },
      zoom: 6,
      styles: [
        {
          featureType: 'administrative',
          elementType: 'geometry',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          stylers: [{ visibility: 'off' }]
        }
      ],
      disableDefaultUI: true,
      zoomControl: true,
      restriction: {
        latLngBounds: {
          north: 51.1,
          south: 41.3,
          west: -5.2,
          east: 9.7
        },
        strictBounds: false
      }
    });

    setMap(mapInstance);

    return () => {
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!map || !opportunities.length) return;

    // Supprimer les anciens marqueurs
    markers.forEach(marker => marker.setMap(null));

    // Créer de nouveaux marqueurs compatibles
    const newMarkers = opportunities.map(opportunity => {
      const getMarkerSize = (priority?: string, size?: string) => {
        // Use priority first, then fall back to size for backward compatibility
        if (priority) {
          switch (priority) {
            case 'high': return 40;
            case 'medium': return 30;
            case 'low': return 20;
            default: return 30;
          }
        }
        switch (size) {
          case 'large': return 40;
          case 'medium': return 30;
          case 'small': return 20;
          default: return 30;
        }
      };

      const markerSize = getMarkerSize(opportunity.priority, opportunity.size);
      
      // Couleur selon la priorité du client
      const getMarkerColor = () => {
        if (opportunity.priority) {
          switch (opportunity.priority) {
            case 'high': return '#ef4444'; // Rouge
            case 'medium': return '#eab308'; // Jaune
            case 'low': return '#22c55e'; // Vert
            default: return '#3b82f6'; // Bleu
          }
        }
        // Fallback pour compatibilité
        return opportunity.actionPlan ? '#ef4444' : '#3b82f6';
      };
      
      // Icône compatible avec toutes les versions de Google Maps
      const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: getMarkerColor(),
        fillOpacity: 0.8,
        stroke: '#ffffff',
        strokeWeight: 3,
        scale: markerSize / 2
      };

      const marker = new google.maps.Marker({
        position: { lat: opportunity.lat, lng: opportunity.lng },
        map,
        icon,
        title: opportunity.clientName || `${opportunity.region}: ${(opportunity.competitorAmount || opportunity.amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
      });

      const infoWindow = new google.maps.InfoWindow({
        content: createPopupContent(opportunity)
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Effet de survol
      marker.addListener('mouseover', () => {
        marker.setIcon({
          ...icon,
          scale: (markerSize / 2) * 1.2,
          fillOpacity: 1
        });
      });

      marker.addListener('mouseout', () => {
        marker.setIcon(icon);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, opportunities]);

  return (
    <>
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[300px] rounded-lg"
        style={{ minHeight: '300px' }}
      />
      
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
    </>
  );
};