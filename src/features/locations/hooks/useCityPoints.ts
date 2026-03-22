import { useQuery } from '@tanstack/react-query';
import { cityPointsApi } from '../api/cityPointsApi';

export function useCityPoints(cityId?: string, search = '') {
  return useQuery({
    queryKey: ['city-points', cityId, search],
    queryFn: () => cityPointsApi.list(cityId as string, { q: search || undefined, limit: 10 }).then((res) => res.data),
    enabled: !!cityId,
  });
}
