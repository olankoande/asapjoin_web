/**
 * OpenRouteService — Geocoding + Distance calculation
 * API gratuite : https://openrouteservice.org/
 */

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || '';
const ORS_BASE = 'https://api.openrouteservice.org';

// ─── Coordonnées de villes connues (fallback si geocoding échoue) ───
const CITY_COORDS: Record<string, [number, number]> = {
  // Canada
  'montréal': [-73.5673, 45.5017], 'montreal': [-73.5673, 45.5017],
  'toronto': [-79.3832, 43.6532], 'vancouver': [-123.1216, 49.2827],
  'ottawa': [-75.6972, 45.4215], 'québec': [-71.2075, 46.8139], 'quebec': [-71.2075, 46.8139],
  'calgary': [-114.0719, 51.0447], 'edmonton': [-113.4938, 53.5461],
  'winnipeg': [-97.1384, 49.8951], 'hamilton': [-79.8711, 43.2557],
  'kitchener': [-80.4823, 43.4516], 'london': [-81.2453, 42.9849],
  'halifax': [-63.5752, 44.6488], 'victoria': [-123.3656, 48.4284],
  'sherbrooke': [-71.8929, 45.4042], 'trois-rivières': [-72.5477, 46.3432],
  'gatineau': [-75.7013, 45.4765], 'laval': [-73.7500, 45.6066],
  'longueuil': [-73.5115, 45.5312], 'moncton': [-64.7782, 46.0878],
  'saskatoon': [-106.6700, 52.1332], 'regina': [-104.6189, 50.4452],
  'kingston': [-76.4860, 44.2312], 'niagara falls': [-79.0849, 43.0896],
  'granby': [-72.7329, 45.4000], 'drummondville': [-72.4843, 45.8838],
  'rimouski': [-68.5243, 48.4489], 'saguenay': [-71.0693, 48.4279],
  'mississauga': [-79.6441, 43.5890], 'brampton': [-79.7624, 43.7315],
  // Afrique de l'Ouest
  'dakar': [-17.4677, 14.7167], 'thiès': [-16.9260, 14.7886], 'thies': [-16.9260, 14.7886],
  'saint-louis': [-16.0179, 16.0326], 'kaolack': [-16.0755, 14.1520],
  'ziguinchor': [-16.2719, 12.5681], 'touba': [-15.8831, 14.8500],
  'abidjan': [-4.0083, 5.3600], 'yamoussoukro': [-5.2767, 6.8276],
  'bouaké': [-5.0339, 7.6939], 'bamako': [-8.0029, 12.6392], 'conakry': [-13.5784, 9.6412],
  // France
  'paris': [2.3522, 48.8566], 'lyon': [4.8357, 45.7640], 'marseille': [5.3698, 43.2965],
  'toulouse': [1.4442, 43.6047], 'nice': [7.2620, 43.7102], 'bordeaux': [-0.5792, 44.8378],
  'lille': [3.0573, 50.6292],
  // Belgique / Suisse
  'bruxelles': [4.3517, 50.8503], 'genève': [6.1432, 46.2044], 'zurich': [8.5417, 47.3769],
  'lausanne': [6.6323, 46.5197],
};

/**
 * Géocode une ville → [lng, lat]
 */
export async function geocodePlace(city: string): Promise<[number, number] | null> {
  // D'abord chercher dans le cache local
  const normalized = city.toLowerCase().split(',')[0].trim();
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];

  // Sinon appeler l'API ORS
  if (!ORS_API_KEY) return null;

  try {
    const res = await fetch(
      `${ORS_BASE}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(city)}&size=1`
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates;
      return [coords[0], coords[1]]; // [lng, lat]
    }
  } catch {
    // Silently fail
  }
  return null;
}

export async function geocodeCity(city: string): Promise<[number, number] | null> {
  return geocodePlace(city);
}

/**
 * Calcule la distance en km entre deux points via ORS Directions API
 */
export async function getDistance(
  from: [number, number],
  to: [number, number]
): Promise<{ distance_km: number; duration_min: number } | null> {
  // Si pas de clé API, utiliser la formule Haversine
  if (!ORS_API_KEY) {
    return haversineDistance(from, to);
  }

  try {
    const res = await fetch(
      `${ORS_BASE}/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${from[0]},${from[1]}&end=${to[0]},${to[1]}`
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const segment = data.features[0].properties.segments[0];
      return {
        distance_km: Math.round(segment.distance / 1000 * 10) / 10,
        duration_min: Math.round(segment.duration / 60),
      };
    }
  } catch {
    // Fallback to haversine
  }
  return haversineDistance(from, to);
}

/**
 * Formule Haversine (fallback sans API)
 */
function haversineDistance(
  from: [number, number],
  to: [number, number]
): { distance_km: number; duration_min: number } {
  const R = 6371;
  const dLat = ((to[1] - from[1]) * Math.PI) / 180;
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from[1] * Math.PI) / 180) *
      Math.cos((to[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance_km = Math.round(R * c * 1.3 * 10) / 10; // ×1.3 pour approximer la route
  const duration_min = Math.round(distance_km / 90 * 60); // ~90 km/h moyenne
  return { distance_km, duration_min };
}

/**
 * Calcule le prix suggéré basé sur la distance
 */
export function suggestPrice(
  distance_km: number,
  options: {
    price_per_km?: number;      // $ par km (défaut: 0.08)
    base_price?: number;        // prix de base (défaut: 5.00)
    margin_percent?: number;    // marge plateforme % (défaut: 15)
  } = {}
): { suggested_price: number; min_price: number; max_price: number } {
  const pricePerKm = options.price_per_km ?? 0.08;
  const basePrice = options.base_price ?? 5.00;
  const marginPercent = options.margin_percent ?? 15;

  const rawPrice = basePrice + distance_km * pricePerKm;
  const withMargin = rawPrice * (1 + marginPercent / 100);
  const suggested = Math.round(withMargin * 100) / 100;
  const min = Math.round(rawPrice * 0.7 * 100) / 100;
  const max = Math.round(rawPrice * 1.5 * 100) / 100;

  return { suggested_price: suggested, min_price: min, max_price: max };
}

/**
 * Calcule le prix suggéré pour un colis
 */
export function suggestParcelPrice(
  distance_km: number,
  options: {
    parcel_base_price?: number;     // prix de base colis (défaut: 5.00)
    parcel_per_km?: number;         // $ par km pour colis (défaut: 0.03)
    parcel_margin_percent?: number; // marge % (défaut: 20)
  } = {}
): number {
  const base = options.parcel_base_price ?? 5.00;
  const perKm = options.parcel_per_km ?? 0.03;
  const margin = options.parcel_margin_percent ?? 20;

  const raw = base + distance_km * perKm;
  return Math.round(raw * (1 + margin / 100) * 100) / 100;
}
