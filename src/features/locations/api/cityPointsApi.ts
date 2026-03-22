import http from '@/lib/api-client';
import type { CityPoint } from '../types/location.types';

export const cityPointsApi = {
  list: (cityId: string, params?: { q?: string; limit?: number; type?: string }) =>
    http.get<CityPoint[]>(`/cities/${cityId}/points`, { params }),
};
