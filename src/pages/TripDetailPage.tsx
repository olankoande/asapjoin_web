import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { tripsApi, bookingsApi, paymentsApi } from '@/lib/api';
import { getApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useOnline } from '@/lib/useOnline';
import { formatDate, formatCurrency, initials } from '@/lib/utils';
import { Calendar, Users, Package, Car, Star, ArrowLeft, CreditCard, Shield, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// ─── Stripe Payment Form (inline) ───
function StripePaymentForm({ onSuccess, onError }: { onSuccess: (bookingId: string) => void; onError: (msg: string) => void; bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Erreur de paiement');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        onError('Le paiement est en cours de traitement...');
      } else {
        onError('Le paiement nécessite une action supplémentaire.');
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Erreur inattendue');
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button type="submit" className="w-full" size="lg" loading={processing} disabled={!stripe || !elements}>
        <CreditCard className="w-4 h-4 mr-2" /> Confirmer le paiement
      </Button>
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span>Paiement sécurisé par Stripe</span>
      </div>
    </form>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const online = useOnline();
  const [seats, setSeats] = useState(1);
  const [bookError, setBookError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentIdState, setPaymentIdState] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bookingTotal, setBookingTotal] = useState<number | null>(null);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  // Create booking mutation - returns client_secret for Stripe
  const bookMutation = useMutation({
    mutationFn: () => bookingsApi.create({ trip_id: id!, seats_booked: seats }),
    onSuccess: (res) => {
      const booking = res.data;
      if (booking.client_secret) {
        // Show Stripe payment form
        setClientSecret(booking.client_secret);
        setBookingId(booking.id);
        setPaymentIdState(booking.payment_id ?? null);
        setBookingTotal(Number(booking.amount_total) || null);
        setBookError('');
      } else {
        // Fallback: no payment needed (free trip?) or redirect
        navigate(`/booking/${booking.id}`);
      }
    },
    onError: (err) => setBookError(getApiError(err).message),
  });

  const handlePaymentSuccess = async () => {
    // Confirm payment with backend to update DB status immediately
    // (without waiting for Stripe webhook)
    if (paymentIdState) {
      try {
        await paymentsApi.confirm(paymentIdState);
      } catch (err) {
        // Even if confirm call fails, the webhook will eventually update the status
        console.warn('Payment confirm call failed (webhook will handle it):', err);
      }
    }

    setPaymentSuccess(true);
    setClientSecret(null);
    // Redirect to booking detail after a short delay
    setTimeout(() => {
      if (bookingId) navigate(`/booking/${bookingId}`);
    }, 2000);
  };

  const isOwnTrip = user && trip && user.id === trip.driver_id;

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-48 rounded-2xl" />
      <div className="skeleton h-32 rounded-2xl" />
    </div>
  );

  if (!trip) return <div className="text-center py-12 text-muted-foreground">Trajet introuvable</div>;

  const availableSeats = trip.available_seats ?? trip.seats_available ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Paiement effectué ! Votre réservation est confirmée. Redirection...</span>
        </div>
      )}

      {/* Route */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-0.5 h-8 bg-border" />
            <div className="w-3 h-3 rounded-full bg-accent" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="font-medium">{trip.departure_label || trip.from_city || trip.origin_address}</p>
              {trip.departure_address && trip.departure_address !== trip.departure_label && (
                <p className="text-xs text-muted-foreground">{trip.departure_address}</p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(trip.departure_at || trip.departure_time)}</p>
            </div>
            <div>
              <p className="font-medium">{trip.arrival_label || trip.to_city || trip.destination_address}</p>
              {trip.arrival_address && trip.arrival_address !== trip.arrival_label && (
                <p className="text-xs text-muted-foreground">{trip.arrival_address}</p>
              )}
              {trip.estimated_arrival && <p className="text-xs text-muted-foreground">Arrivée estimée : {formatDate(trip.estimated_arrival)}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
            <Users className="w-4 h-4 text-primary" />{availableSeats} place{availableSeats > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-semibold">
            {formatCurrency(trip.price_per_seat)} /place
          </span>
          {trip.accepts_parcels && (
            <span className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-lg">
              <Package className="w-4 h-4" /> Colis acceptés {(trip.parcel_price || trip.parcel_base_price) ? `(${formatCurrency(trip.parcel_price || trip.parcel_base_price)})` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Driver */}
      {trip.driver && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <h3 className="text-sm font-semibold mb-3">Conducteur</h3>
          <div className="flex items-center gap-3">
            {trip.driver.avatar_url ? (
              <img src={trip.driver.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                {initials(trip.driver.first_name, trip.driver.last_name)}
              </div>
            )}
            <div>
              <p className="font-medium">{trip.driver.first_name} {trip.driver.last_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-warning" /> Membre depuis {new Date(trip.driver.created_at).getFullYear()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle */}
      {trip.vehicle && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <h3 className="text-sm font-semibold mb-2">Véhicule</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="w-4 h-4" />
            <span>{trip.vehicle.make} {trip.vehicle.model}{trip.vehicle.color ? ` · ${trip.vehicle.color}` : ''}{trip.vehicle.year ? ` · ${trip.vehicle.year}` : ''}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {trip.notes && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <h3 className="text-sm font-semibold mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground">{trip.notes}</p>
        </div>
      )}

      {/* Stripe Payment Form (shown after booking creation) */}
      {clientSecret && !paymentSuccess && (
        <div className="bg-card rounded-2xl border border-primary/20 p-5 mb-4">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Paiement pour {seats} place{seats > 1 ? 's' : ''}
          </h3>
          <div className="text-xs text-muted-foreground mb-4 space-y-1">
            <div className="flex justify-between"><span>Prix ({seats} place{seats > 1 ? 's' : ''}) :</span><span>{formatCurrency(trip.price_per_seat * seats)}</span></div>
            {bookingTotal && bookingTotal > trip.price_per_seat * seats && (
              <div className="flex justify-between"><span>Frais de service :</span><span>{formatCurrency(bookingTotal - trip.price_per_seat * seats)}</span></div>
            )}
            <div className="flex justify-between font-semibold text-primary border-t border-border pt-1">
              <span>Total :</span><span>{formatCurrency(bookingTotal || trip.price_per_seat * seats)}</span>
            </div>
          </div>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: { colorPrimary: '#6366f1', borderRadius: '12px' },
              },
            }}
          >
            <StripePaymentForm
              bookingId={bookingId || ''}
              onSuccess={handlePaymentSuccess}
              onError={(msg) => setBookError(msg)}
            />
          </Elements>
          <button
            onClick={() => { setClientSecret(null); setBookError(''); }}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground text-center"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Booking section (shown when no payment form is active) */}
      {user && !isOwnTrip && trip.status === 'published' && availableSeats > 0 && !clientSecret && !paymentSuccess && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <h3 className="text-sm font-semibold mb-3">Réserver et payer</h3>
          {bookError && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl mb-3">{bookError}</div>}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm">Places :</label>
            <select value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="h-10 px-3 rounded-xl border border-border text-sm">
              {Array.from({ length: availableSeats }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm font-semibold text-primary ml-auto">{formatCurrency(trip.price_per_seat * seats)}</span>
          </div>
          <Button onClick={() => bookMutation.mutate()} loading={bookMutation.isPending} disabled={!online} className="w-full" size="lg">
            <CreditCard className="w-4 h-4 mr-2" />
            {!online ? 'Hors ligne — Réservation impossible' : `Réserver et payer ${formatCurrency(trip.price_per_seat * seats)}`}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Paiement sécurisé · Remboursement possible selon conditions
          </p>
        </div>
      )}

      {/* Send parcel */}
      {user && !isOwnTrip && trip.status === 'published' && trip.accepts_parcels && !clientSecret && !paymentSuccess && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold">Envoyer un colis</h3>
            </div>
            {(trip.parcel_price || trip.parcel_base_price) != null && (
              <span className="text-sm font-bold text-accent">{formatCurrency(trip.parcel_price || trip.parcel_base_price)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">Ce conducteur accepte les colis sur ce trajet.</p>
          <Button
            onClick={() => navigate(`/trips/${trip.id}/send-parcel`)}
            className="w-full bg-accent text-white shadow-[0_6px_20px_rgb(245_158_11/0.35)] hover:brightness-110 hover:shadow-[0_10px_28px_rgb(245_158_11/0.45)]"
            disabled={!online}
          >
            <Package className="w-4 h-4 mr-2" />
            {!online ? 'Hors ligne' : 'Envoyer un colis'}
          </Button>
        </div>
      )}

      {isOwnTrip && (
        <div className="bg-warning/10 text-warning text-sm px-4 py-3 rounded-xl text-center">
          C'est votre trajet — vous ne pouvez pas le réserver.
        </div>
      )}

      {!user && (
        <div className="text-center">
          <Button onClick={() => navigate('/login')} variant="outline" size="lg">Connectez-vous pour réserver</Button>
        </div>
      )}
    </div>
  );
}
