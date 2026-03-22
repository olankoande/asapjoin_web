import { useQuery } from '@tanstack/react-query';
import { citiesApi } from '../api/citiesApi';

export function useCities(limit = 100) {
  return useQuery({
    queryKey: ['cities', limit],
    queryFn: () => citiesApi.list(limit).then((res) => res.data),
  });
}
