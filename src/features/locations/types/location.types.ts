export interface City {
  id: string;
  name: string;
  province: string | null;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CityPoint {
  id: string;
  city_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  point_type: 'station' | 'airport' | 'university' | 'mall' | 'downtown' | 'custom';
  popularity_score: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripLocationSelection {
  mode: 'frequent' | 'custom';
  point_id: string | null;
  name: string | null;
  address: string;
  lat: number;
  lng: number;
}

export function formatCityLabel(city: City | null | undefined) {
  if (!city) return '';
  return [city.name, city.province].filter(Boolean).join(', ');
}
