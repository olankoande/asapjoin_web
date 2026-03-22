// ─── API Types (from OpenAPI contract) ───

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  role: 'user' | 'support' | 'admin';
  is_banned: boolean;
  email_verified?: boolean;
  auth_provider?: 'local' | 'google';
  google_linked?: boolean;
  payout_email: string | null;
  current_contract_version?: string | null;
  accepted_contract_version?: string | null;
  contract_accepted_at?: string | null;
  contract_acceptance_required?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ContractDocument {
  id: string;
  title: string;
  version: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  plate: string | null;
  seats_count: number;
  has_ac: boolean;
  notes: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  driver_id: string;
  vehicle_id: string;
  // DB fields (from schema)
  from_city?: string;
  to_city?: string;
  from_address?: string | null;
  to_address?: string | null;
  departure_city_id?: string | null;
  arrival_city_id?: string | null;
  departure_point_id?: string | null;
  arrival_point_id?: string | null;
  departure_address?: string | null;
  departure_lat?: number | null;
  departure_lng?: number | null;
  arrival_address?: string | null;
  arrival_lat?: number | null;
  arrival_lng?: number | null;
  departure_label?: string;
  arrival_label?: string;
  departure_point_name?: string | null;
  arrival_point_name?: string | null;
  departure_at?: string;
  // Frontend alias fields (used in some pages)
  origin_address?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_address?: string;
  destination_lat?: number;
  destination_lng?: number;
  departure_time?: string;
  estimated_arrival?: string | null;
  seats_total?: number;
  seats_available?: number;
  available_seats?: number;
  price_per_seat: number;
  accepts_parcels: boolean;
  parcel_price?: number | null;
  parcel_base_price?: number | null;
  delivery_mode?: 'manual' | 'instant';
  booking_mode?: 'manual' | 'instant';
  status: 'draft' | 'published' | 'unpublished' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string | null;
  rules_json?: string | null;
  created_at: string;
  driver?: User;
  vehicle?: Vehicle;
}

export interface Booking {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats_requested: number;
  amount_total: number | null;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'paid' | 'cancelled' | 'completed' | 'expired';
  cancel_reason: string | null;
  cancellation_policy_id: string | null;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  passenger?: User;
  payments?: Payment[];
  // Returned on creation (for immediate payment flow)
  client_secret?: string;
  payment_id?: string;
}

export interface Delivery {
  id: string;
  trip_id: string;
  sender_id: string;
  recipient_user_id: string | null;
  amount_total: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'paid' | 'in_transit' | 'delivered' | 'cancelled' | 'disputed' | 'received';
  pickup_notes: string | null;
  dropoff_notes: string | null;
  accepted_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  received_at: string | null;
  delivery_code: string | null;
  created_at: string;
  trip?: Trip;
  sender?: User;
  recipient?: User;
  parcels?: Parcel;
}

export interface Parcel {
  id: string;
  size_category: 'XS' | 'S' | 'M' | 'L';
  weight_kg: number | null;
  declared_value: number | null;
  instructions: string | null;
}

export interface Payment {
  id: string;
  payer_id: string;
  payee_id: string;
  booking_id: string | null;
  delivery_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  provider: 'stripe';
  status: 'requires_payment' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  pending_balance: number;
  available_balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  trip_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: User;
}

export interface ConversationParticipant {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role?: string;
}

export interface Conversation {
  id: string;
  type?: 'booking' | 'delivery';
  status?: 'open' | 'closed' | 'archived';
  booking_id?: string | null;
  delivery_id?: string | null;
  participants: ConversationParticipant[];
  other_user?: ConversationParticipant | null;
  last_message?: Message | null;
  last_message_at?: string | null;
  has_unread?: boolean;
  trip_info?: { from_city: string; to_city: string; id?: string; departure_at?: string } | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content?: string;
  message_text?: string;
  message_type?: 'text' | 'system';
  created_at: string;
  sender?: { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ─── Cancellation & Refund Types ───

export interface CancelPreview {
  allowed: boolean;
  policy_id: string | null;
  policy_name: string | null;
  refund_amount_cents: number;
  cancellation_fee_cents: number;
  driver_reversal_cents: number;
  driver_compensation_cents: number;
  original_amount_cents: number;
  message: string;
  reason_code?: string;
}

export interface CancelResult {
  cancellation_request_id: string;
  status: 'approved' | 'refunded';
  refund_amount_cents: number;
  cancellation_fee_cents: number;
  stripe_refund_id: string | null;
  message: string;
}
