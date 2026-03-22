import { authApi } from '@/lib/api';

export async function loginWithGoogleCredential(credential: string) {
  const { data } = await authApi.google(credential);
  return data;
}
