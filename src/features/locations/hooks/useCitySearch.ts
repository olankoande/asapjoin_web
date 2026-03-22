import { useQuery } from '@tanstack/react-query';
import { citiesApi } from '../api/citiesApi';

export function useCitySearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['cities', 'search', trimmed],
    queryFn: () => citiesApi.search(trimmed).then((res) => res.data),
    enabled: trimmed.length >= 2,
  });
}
