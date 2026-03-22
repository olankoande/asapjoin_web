import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { tripsApi, deliveriesApi } from '@/lib/api';
import { getApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Package, MapPin, ArrowRight, User, FileText, Scale, DollarSign, CheckCircle, CreditCard, Loader2, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SIZE_OPTIONS = [
  { value: 'XS', label: 'Très petit (enveloppe)', desc: 'Documents, petits objets' },
  { value: 'S', label: 'Petit (sac)', desc: 'Livres, vêtements' },
  { value: 'M', label: 'Moyen (boîte)', desc: 'Électronique, vaisselle' },
  { value: 'L', label: 'Grand (carton)', desc: 'Équipement, gros colis' },
];

const ERROR_MESSAGES: Record<string, string> = {
  DELIVERY_TOO_LATE_BEFORE_DEPARTURE: 'La date de départ est trop proche pour créer une livraison. Veuillez choisir un trajet avec un départ plus éloigné.',
  TRIP_DOES_NOT_ACCEPT_PARCELS: "Ce trajet n'accepte pas les colis.",
  CANNOT_REQUEST_DELIVERY_ON_OWN_TRIP: 'Vous ne pouvez pas envoyer un colis sur votre propre trajet.',
  PARCEL_NOT_ALLOWED: 'Votre colis ne respecte pas les contraintes du trajet (taille ou poids).',
  INVALID_RECIPIENT: 'Le destinataire spécifié est invalide.',
  TRIP_NOT_PUBLISHED: "Ce trajet n'est plus disponible.",
  PAYMENT_REQUIRED: 'Le paiement est requis avant de créer la livraison.',
  PAYMENT_NOT_SUCCEEDED: 'Le paiement n\'a pas été complété. Veuillez réessayer.',
  PAYMENT_AMOUNT_MISMATCH: 'Le montant du paiement ne correspond pas au prix de la livraison.',
};

function getErrorMessage(err: unknown): string {
  const apiErr = getApiError(err);
  const code = ('code' in apiErr ? (apiErr as { code: string }).code : '') || '';
  return ERROR_MESSAGES[code] || apiErr.message;
}

// ─── Stripe Payment Form Component ───
function StripePaymentForm({ onSuccess, onError }: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/deliveries',
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Erreur lors du paiement');
        setProcessing(false);
        return;
      }

      onSuccess();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Erreur lors du paiement');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || processing}>
        {processing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement en cours...</>
        ) : (
          <><CreditCard className="w-4 h-4 mr-2" /> Payer et envoyer la demande</>
        )}
      </Button>
    </form>
  );
}

type FormData = {
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string;
  delivery_address: string;
  size_category: string;
  weight_kg: string;
  declared_value: string;
  instructions: string;
  pickup_notes: string;
  delivery_notes: string;
};

export default function SendParcelPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'payment' | 'creating' | 'success'>('form');

  // Payment data from prepare-payment
  const [paymentInfo, setPaymentInfo] = useState<{
    client_secret: string;
    stripe_payment_intent_id: string;
    amount?: number;
    driver_price?: number;
    platform_fee?: number;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    delivery_address: '',
    size_category: 'S',
    weight_kg: '',
    declared_value: '',
    instructions: '',
    pickup_notes: '',
    delivery_notes: '',
  });

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.get(tripId!).then((r) => r.data),
    enabled: !!tripId,
  });

  function buildDropoffNotes() {
    const lines = [
      `Adresse de livraison: ${form.delivery_address.trim()}`,
      `Destinataire: ${form.recipient_name.trim()}`,
      `Telephone: ${form.recipient_phone.trim()}`,
    ];

    if (form.recipient_email.trim()) {
      lines.push(`Email: ${form.recipient_email.trim()}`);
    }

    if (form.delivery_notes.trim()) {
      lines.push('', 'Instructions de livraison:', form.delivery_notes.trim());
    }

    return lines.join('\n');
  }

  // Build the request body from form state
  function buildRequestBody() {
    return {
      trip_id: tripId!,
      recipient_email: form.recipient_email.trim() || undefined,
      pickup_notes: form.pickup_notes || undefined,
      dropoff_notes: buildDropoffNotes(),
      parcel: {
        size_category: form.size_category,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        declared_value: form.declared_value ? Number(form.declared_value) : undefined,
        instructions: form.instructions || undefined,
      },
    };
  }

  // Step 1: Prepare payment (validates rules + creates PaymentIntent if needed)
  const prepareMutation = useMutation({
    mutationFn: () => deliveriesApi.preparePayment(buildRequestBody()),
    onSuccess: (response) => {
      const data = response.data;

      if (data.requires_payment && data.client_secret && data.stripe_payment_intent_id) {
        // Payment required → show Stripe form with fee breakdown
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = data as Record<string, unknown>;
        setPaymentInfo({
          client_secret: data.client_secret,
          stripe_payment_intent_id: data.stripe_payment_intent_id,
          amount: (d.amount as number) || undefined,
          driver_price: (d.driver_price as number) || undefined,
          platform_fee: (d.platform_fee as number) || undefined,
        });
        setStep('payment');
      } else {
        // No payment needed → create delivery directly
        createDirectly();
      }
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  // Step 2b: Create delivery directly (no payment needed)
  const createMutation = useMutation({
    mutationFn: (stripePaymentIntentId?: string) => {
      const body = {
        ...buildRequestBody(),
        stripe_payment_intent_id: stripePaymentIntentId,
      };
      return deliveriesApi.create(body);
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      // If creation fails after payment, go back to form with error
      if (step === 'creating') {
        setStep('form');
      }
    },
  });

  function createDirectly(stripePaymentIntentId?: string) {
    setStep('creating');
    createMutation.mutate(stripePaymentIntentId);
  }

  // Called after Stripe payment succeeds
  function handlePaymentSuccess() {
    if (!paymentInfo) return;
    // Payment succeeded → now create the delivery with the payment intent ID
    createDirectly(paymentInfo.stripe_payment_intent_id);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.recipient_name.trim()) { setError('Veuillez renseigner le nom complet du destinataire'); return; }
    if (!form.recipient_phone.trim()) { setError('Veuillez renseigner le telephone du destinataire'); return; }
    if (!form.delivery_address.trim()) { setError('Veuillez renseigner l adresse de livraison'); return; }
    if (!form.size_category) { setError('Veuillez sélectionner une taille de colis'); return; }
    prepareMutation.mutate();
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-lg font-medium text-muted-foreground">Connectez-vous pour envoyer un colis</p>
        <Button className="mt-4" onClick={() => navigate('/login')}>Se connecter</Button>
      </div>
    );
  }

  // ─── Step: Success ───
  if (step === 'success') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
        <h1 className="text-2xl font-bold mb-2">Demande envoyée !</h1>
        <p className="text-muted-foreground mb-6">
          Votre demande de livraison a été enregistrée avec succès.
          {paymentInfo && ' Le paiement a été effectué.'}
          {' '}Le conducteur sera notifié de votre demande.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          💬 Une conversation a été créée avec le conducteur. Vous pouvez le contacter depuis la page Messages.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={() => navigate('/deliveries')}>Mes colis</Button>
          <Button variant="outline" onClick={() => navigate('/messages')}>
            <MessageCircle className="w-4 h-4 mr-2" /> Messages
          </Button>
          <Button variant="outline" onClick={() => navigate('/search')}>Rechercher</Button>
        </div>
      </div>
    );
  }

  // ─── Step: Creating (loading) ───
  if (step === 'creating') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
        <h1 className="text-xl font-bold mb-2">Création de la livraison...</h1>
        <p className="text-muted-foreground">Veuillez patienter.</p>
      </div>
    );
  }

  // ─── Step: Stripe Payment ───
  if (step === 'payment' && paymentInfo) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => { setStep('form'); setError(''); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour au formulaire
        </button>

        <h1 className="text-2xl font-bold mb-2">Paiement de la livraison</h1>
        <p className="text-muted-foreground mb-6">
          Le paiement doit être effectué avant l'enregistrement de votre demande de livraison.
        </p>

        {/* Trip info recap with fee breakdown */}
        {trip && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{trip.origin_address}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{trip.destination_address}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-primary/10 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Prix de livraison :</span>
                <span>{formatCurrency(paymentInfo.driver_price ?? trip.parcel_price ?? 0)}</span>
              </div>
              {paymentInfo.platform_fee != null && paymentInfo.platform_fee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Frais de service :</span>
                  <span>{formatCurrency(paymentInfo.platform_fee)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-accent border-t border-primary/10 pt-1.5">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Total à payer
                </span>
                <span className="text-xl font-bold">{formatCurrency(paymentInfo.amount ?? trip.parcel_price ?? 0)}</span>
              </div>
            </div>
          </div>
        )}

        {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" /> Informations de paiement
          </h3>
          <Elements stripe={stripePromise} options={{ clientSecret: paymentInfo.client_secret, appearance: { theme: 'stripe' } }}>
            <StripePaymentForm
              onSuccess={handlePaymentSuccess}
              onError={(msg) => setError(msg)}
            />
          </Elements>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          🔒 Paiement sécurisé par Stripe. Vos informations bancaires ne sont jamais stockées sur nos serveurs.
        </p>
      </div>
    );
  }

  // ─── Step: Form ───
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <h1 className="text-2xl font-bold mb-6">Envoyer un colis</h1>

      {/* Trip info */}
      {tripLoading && <div className="skeleton h-24 rounded-2xl mb-4" />}
      {trip && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{trip.origin_address}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{trip.destination_address}</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>📅 {formatDate(trip.departure_time)}</span>
            {trip.driver && <span>🚗 {trip.driver.first_name} {trip.driver.last_name}</span>}
            {trip.parcel_price != null && (
              <span className="text-primary font-medium">💰 {formatCurrency(trip.parcel_price)} / colis</span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl">{error}</div>}

        {/* Destinataire */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Destinataire</h3>
          <Input
            id="recipient_name"
            label="Nom complet"
            value={form.recipient_name}
            onChange={(e) => setForm((p) => ({ ...p, recipient_name: e.target.value }))}
            placeholder="Ex: Aminata Diallo"
          />
          <Input
            id="recipient_phone"
            label="Telephone"
            type="tel"
            value={form.recipient_phone}
            onChange={(e) => setForm((p) => ({ ...p, recipient_phone: e.target.value }))}
            placeholder="+1 514 000 0000"
          />
          <Input
            id="recipient_email"
            label="Email du destinataire (optionnel)"
            type="email"
            value={form.recipient_email}
            onChange={(e) => setForm((p) => ({ ...p, recipient_email: e.target.value }))}
            placeholder="destinataire@email.com"
          />
          <Input
            id="delivery_address"
            label="Adresse de livraison"
            value={form.delivery_address}
            onChange={(e) => setForm((p) => ({ ...p, delivery_address: e.target.value }))}
            placeholder="Adresse complete de livraison"
          />
          <p className="text-xs text-muted-foreground">Si le destinataire a un compte, il pourra confirmer la réception.</p>
        </div>

        {/* Taille du colis */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Taille du colis</h3>
          <div className="grid grid-cols-2 gap-2">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, size_category: opt.value }))}
                className={`text-left p-3 rounded-xl border transition-all ${
                  form.size_category === opt.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Détails du colis */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /> Détails</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="weight_kg"
              label="Poids (kg)"
              type="number"
              min="0"
              step="0.1"
              value={form.weight_kg}
              onChange={(e) => setForm((p) => ({ ...p, weight_kg: e.target.value }))}
              placeholder="Ex: 2.5"
            />
            <Input
              id="declared_value"
              label="Valeur déclarée ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.declared_value}
              onChange={(e) => setForm((p) => ({ ...p, declared_value: e.target.value }))}
              placeholder="Ex: 50.00"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Instructions spéciales</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              className="w-full h-20 px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Fragile, garder au sec, etc."
            />
          </div>
        </div>

        {/* Notes de ramassage / livraison */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Notes</h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">📦 Point de ramassage</label>
            <textarea
              value={form.pickup_notes}
              onChange={(e) => setForm((p) => ({ ...p, pickup_notes: e.target.value }))}
              className="w-full h-16 px-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Adresse, étage, code d'entrée..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">📦 Note de ramassage</label>
            <textarea
              value={form.delivery_notes}
              onChange={(e) => setForm((p) => ({ ...p, delivery_notes: e.target.value }))}
              className="w-full h-16 px-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Instructions pour le ramassage, étage, code d'entrée..."
            />
          </div>
        </div>

        {/* Prix */}
        {trip?.parcel_price != null && trip.parcel_price > 0 && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Frais de livraison</span>
              </div>
              <span className="text-lg font-bold text-accent">{formatCurrency(trip.parcel_price)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💳 Le paiement sera requis <strong>avant</strong> l'enregistrement de votre demande.
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={prepareMutation.isPending}>
          <Package className="w-4 h-4 mr-2" />
          {trip?.parcel_price && trip.parcel_price > 0
            ? 'Continuer vers le paiement'
            : 'Envoyer la demande de livraison'
          }
        </Button>
      </form>
    </div>
  );
}
