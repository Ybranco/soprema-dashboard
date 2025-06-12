// Service pour gérer les interactions avec Google Maps API

export interface Region {
  name: string;
  lat: number;
  lng: number;
  bounds?: google.maps.LatLngBounds;
}

export class GoogleMapsService {
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    if (typeof google !== 'undefined') {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  // Géocoder une adresse pour obtenir les coordonnées
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.geocoder) {
      return null;
    }

    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        this.geocoder!.geocode({ address }, (results, status) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result.length > 0) {
        const location = result[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      }
    } catch (error) {
    }

    return null;
  }

  // Obtenir les coordonnées d'une région française
  getRegionCoordinates(regionName: string): { lat: number; lng: number } | null {
    const regionCoordinates: Record<string, { lat: number; lng: number }> = {
      'Auvergne-Rhône-Alpes': { lat: 45.7640, lng: 4.8357 },
      'Bourgogne-Franche-Comté': { lat: 47.2808, lng: 4.9994 },
      'Bretagne': { lat: 48.2020, lng: -2.9326 },
      'Centre-Val de Loire': { lat: 47.7516, lng: 1.6751 },
      'Corse': { lat: 42.0396, lng: 9.0129 },
      'Grand Est': { lat: 48.5734, lng: 7.7521 },
      'Hauts-de-France': { lat: 50.4801, lng: 2.7931 },
      'Île-de-France': { lat: 48.8566, lng: 2.3522 },
      'Normandie': { lat: 49.1829, lng: -0.3707 },
      'Nouvelle-Aquitaine': { lat: 44.8378, lng: -0.5792 },
      'Occitanie': { lat: 43.6047, lng: 1.4442 },
      'Pays de la Loire': { lat: 47.4784, lng: -0.5632 },
      'Provence-Alpes-Côte d\'Azur': { lat: 43.9352, lng: 6.0679 }
    };

    return regionCoordinates[regionName] || null;
  }

  // Calculer la distance entre deux points
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.degToRad(point2.lat - point1.lat);
    const dLng = this.degToRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(point1.lat)) *
        Math.cos(this.degToRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Grouper les opportunités par région géographique
  groupOpportunitiesByRegion(
    opportunities: Array<{ lat: number; lng: number; amount: number; client: string }>
  ): Array<{ region: string; lat: number; lng: number; totalAmount: number; clients: string[]; size: 'small' | 'medium' | 'large' }> {
    const regions = Object.entries(this.getRegionCoordinates('') || {});
    const grouped: Array<{
      region: string;
      lat: number;
      lng: number;
      totalAmount: number;
      clients: string[];
      size: 'small' | 'medium' | 'large';
    }> = [];

    // Pour chaque région, trouver les opportunités proches
    Object.entries({
      'Auvergne-Rhône-Alpes': { lat: 45.7640, lng: 4.8357 },
      'Bourgogne-Franche-Comté': { lat: 47.2808, lng: 4.9994 },
      'Bretagne': { lat: 48.2020, lng: -2.9326 },
      'Centre-Val de Loire': { lat: 47.7516, lng: 1.6751 },
      'Corse': { lat: 42.0396, lng: 9.0129 },
      'Grand Est': { lat: 48.5734, lng: 7.7521 },
      'Hauts-de-France': { lat: 50.4801, lng: 2.7931 },
      'Île-de-France': { lat: 48.8566, lng: 2.3522 },
      'Normandie': { lat: 49.1829, lng: -0.3707 },
      'Nouvelle-Aquitaine': { lat: 44.8378, lng: -0.5792 },
      'Occitanie': { lat: 43.6047, lng: 1.4442 },
      'Pays de la Loire': { lat: 47.4784, lng: -0.5632 },
      'Provence-Alpes-Côte d\'Azur': { lat: 43.9352, lng: 6.0679 }
    }).forEach(([regionName, regionCoords]) => {
      const regionOpportunities = opportunities.filter(opp => {
        const distance = this.calculateDistance(regionCoords, { lat: opp.lat, lng: opp.lng });
        return distance < 150; // Moins de 150km du centre de la région
      });

      if (regionOpportunities.length > 0) {
        const totalAmount = regionOpportunities.reduce((sum, opp) => sum + opp.amount, 0);
        const clients = regionOpportunities.map(opp => opp.client);
        
        let size: 'small' | 'medium' | 'large' = 'small';
        if (totalAmount > 150000) size = 'large';
        else if (totalAmount > 80000) size = 'medium';

        grouped.push({
          region: regionName,
          lat: regionCoords.lat,
          lng: regionCoords.lng,
          totalAmount,
          clients,
          size
        });
      }
    });

    return grouped;
  }
}

export const googleMapsService = new GoogleMapsService();