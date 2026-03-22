import http from './api-client';
import type { User, Vehicle, Trip, Booking, Delivery, Payment, Wallet, WalletTransaction, Review, Conversation, Message, TokenPair, Paginated, CancelPreview, CancelResult, ContractDocument } from './types';

// ─── Auth ───
export const authApi = {
  register: (body: { email: string; password: string; first_name: string; last_name: string; phone_number?: string }) =>
    http.post<TokenPair>('/auth/register', body),
  login: (email: string, password: string) => http.post<TokenPair>('/auth/login', { email, password }),
  google: (credential: string) => http.post<TokenPair>('/auth/google', { credential }),
  refresh: (refreshToken: string) => http.post<TokenPair>('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => http.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => http.post('/auth/reset-password', { token, password }),
};

// ─── Users ───
export const usersApi = {
  me: () => http.get<User>('/me'),
  updateMe: (body: Partial<Pick<User, 'first_name' | 'last_name' | 'phone_number' | 'avatar_url' | 'payout_email'>>) =>
    http.patch<User>('/me', body),
  getReviews: (userId: string) => http.get<{ reviews: Review[]; average: number }>(`/users/${userId}/reviews`),
};

// ─── Vehicles ───
export const vehiclesApi = {
  list: () => http.get<Vehicle[]>('/vehicles'),
  create: (body: { make: string; model: string; year?: number | null; color?: string | null; plate?: string | null; seats_count?: number; has_ac?: boolean; notes?: string | null }) =>
    http.post<Vehicle>('/vehicles', body),
  update: (id: string, body: Partial<Omit<Vehicle, 'id' | 'created_at'>>) => http.patch<Vehicle>(`/vehicles/${id}`, body),
  delete: (id: string) => http.delete(`/vehicles/${id}`),
};

// ─── Trips ───
export const tripsApi = {
  search: (params: Record<string, string | number | boolean>) => http.get<Paginated<Trip>>('/trips/search', { params }),
  get: (id: string) => http.get<Trip>(`/trips/${id}`),
  create: (body: {
    vehicle_id: string;
    departure_city_id?: string | number;
    arrival_city_id?: string | number;
    departure?: { point_id?: string | number | null; address: string; lat?: number | null; lng?: number | null };
    arrival?: { point_id?: string | number | null; address: string; lat?: number | null; lng?: number | null };
    origin_address?: string; origin_lat?: number; origin_lng?: number;
    destination_address?: string; destination_lat?: number; destination_lng?: number;
    departure_time: string; available_seats: number; price_per_seat: number;
    accepts_parcels?: boolean; parcel_price?: number; notes?: string | null;
  }) => http.post<Trip>('/trips', body),
  update: (id: string, body: Partial<Trip>) => http.patch<Trip>(`/trips/${id}`, body),
  publish: (id: string) => http.patch<Trip>(`/trips/${id}/publish`),
  unpublish: (id: string) => http.patch<Trip>(`/trips/${id}/unpublish`),
};

// ─── Bookings ───
export const bookingsApi = {
  create: (body: { trip_id: string; seats_booked?: number; seats_requested?: number }) => http.post<Booking>('/bookings', body),
  get: (id: string) => http.get<Booking>(`/bookings/${id}`),
  accept: (id: string) => http.patch<Booking>(`/bookings/${id}/accept`),
  reject: (id: string) => http.patch<Booking>(`/bookings/${id}/reject`),
  cancel: (id: string, reason?: string) => http.post<CancelResult>(`/bookings/${id}/cancel`, { reason }),
  cancelPreview: (id: string) => http.get<CancelPreview>(`/bookings/${id}/cancel-preview`),
  myBookings: () => http.get<Booking[]>('/me/bookings'),
  driverBookings: () => http.get<Booking[]>('/me/driver/bookings'),
};

// ─── Deliveries ───
export const deliveriesApi = {
  preparePayment: (body: { trip_id: string; recipient_user_id?: string; recipient_email?: string; pickup_notes?: string; dropoff_notes?: string; parcel: { size_category: string; weight_kg?: number; declared_value?: number; instructions?: string } }) =>
    http.post<{ requires_payment: boolean; amount: number; currency: string; client_secret: string | null; stripe_payment_intent_id: string | null }>('/deliveries/prepare-payment', body),
  create: (body: { trip_id: string; recipient_user_id?: string; recipient_email?: string; pickup_notes?: string; dropoff_notes?: string; stripe_payment_intent_id?: string; parcel: { size_category: string; weight_kg?: number; declared_value?: number; instructions?: string } }) =>
    http.post<Delivery>('/deliveries', body),
  get: (id: string) => http.get<Delivery>(`/deliveries/${id}`),
  accept: (id: string) => http.post<Delivery>(`/deliveries/${id}/accept`),
  reject: (id: string) => http.post<Delivery>(`/deliveries/${id}/reject`),
  cancel: (id: string, reason?: string) => http.post<CancelResult>(`/deliveries/${id}/cancel`, { reason }),
  cancelPreview: (id: string) => http.get<CancelPreview>(`/deliveries/${id}/cancel-preview`),
  markInTransit: (id: string) => http.post<Delivery>(`/deliveries/${id}/in-transit`),
  markDelivered: (id: string) => http.post<Delivery>(`/deliveries/${id}/delivered`),
  confirmReceipt: (id: string) => http.post<Delivery>(`/deliveries/${id}/confirm-receipt`),
  mySent: () => http.get<Delivery[]>('/me/deliveries/sent'),
  myReceived: () => http.get<Delivery[]>('/me/deliveries/received'),
  driverDeliveries: () => http.get<Delivery[]>('/me/driver/deliveries'),
};

// ─── Payments ───
export const paymentsApi = {
  createIntent: (body: { booking_id?: string; delivery_id?: string }) =>
    http.post<{ client_secret: string; payment_id: string }>('/payments/intent', body),
  get: (id: string) => http.get<Payment>(`/payments/${id}`),
  confirm: (id: string) => http.post<{ status: string; already_confirmed?: boolean }>(`/payments/${id}/confirm`),
};

// ─── Wallet ───
export const walletApi = {
  get: () => http.get<Wallet>('/me/wallet'),
  transactions: (params?: { page?: number; limit?: number }) =>
    http.get<Paginated<WalletTransaction>>('/me/wallet/transactions', { params }),
};

// ─── Messaging ───
export const messagingApi = {
  conversations: (params?: { bookingId?: string; deliveryId?: string }) =>
    http.get<{ data: Conversation[] }>('/conversations', { params }),
  messages: (conversationId: string) => http.get<{ data: Message[] }>(`/conversations/${conversationId}/messages`),
  send: (conversationId: string, content: string) =>
    http.post<{ data: Message }>(`/conversations/${conversationId}/messages`, { content }),
  start: (body: { booking_id?: string; delivery_id?: string }) =>
    http.post<{ data: Conversation }>('/conversations/start', body),
};

// ─── Reviews ───
export const reviewsApi = {
  create: (body: { reviewee_id: string; trip_id?: string; rating: number; comment?: string }) =>
    http.post<Review>('/reviews', body),
  getForUser: (userId: string) => http.get<{ reviews: Review[]; average: number }>(`/users/${userId}/reviews`),
};

// ─── Reports ───
export const reportsApi = {
  create: (body: { reported_id: string; reason: string }) => http.post('/reports', body),
};

export const contractsApi = {
  current: () => http.get<ContractDocument | null>('/contracts/current'),
  accept: (version: string) => http.post<{ accepted: boolean; version: string }>('/contracts/accept', { version }),
};
