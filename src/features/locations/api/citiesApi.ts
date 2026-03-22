import http from '@/lib/api-client';
import type { City } from '../types/location.types';

export const citiesApi = {
  list: (limit = 100) => http.get<City[]>('/cities', { params: { limit } }),
  search: (q: string, limit = 12) => http.get<City[]>('/cities/search', { params: { q, limit } }),
};
