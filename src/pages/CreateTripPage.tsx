import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tripsApi, vehiclesApi } from '@/lib/api';
import { getApiError } from '@/lib/api-client';
import { getDistance, suggestPrice, suggestParcelPrice } from '@/lib/openroute';
import { ArrowLeft, Calendar, Package, Car, Zap, Route, DollarSign, Info, Plus, X, Snowflake, MapPinned, Clock3, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CitySelect } from '@/features/locations/components/CitySelect';
import { CityPointAutocomplete } from '@/features/locations/components/CityPointAutocomplete';
import type { City, TripLocationSelection } from '@/features/locations/types/location.types';
import { formatCityLabel } from '@/features/locations/types/location.types';

export default function CreateTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: new Date().getFullYear().toString(), color: '', plate: '', seats_count: '4', has_ac: false });
  const [vehicleError, setVehicleError] = useState('');
  const [departureCity, setDepartureCity] = useState<City | null>(null);
  const [arrivalCity, setArrivalCity] = useState<City | null>(null);
  const [departureLocation, setDepartureLocation] = useState<TripLocationSelection | null>(null);
  const [arrivalLocation, setArrivalLocation] = useState<TripLocationSelection | null>(null);
  const [routeError, setRouteError] = useState('');
  const latestCalculationRef = useRef(0);

  const [form, setForm] = useState({
    vehicle_id: '',
    departure_time: '',
    available_seats: '4',
    price_per_seat: '',
    accepts_parcels: false,
    parcel_price: '',
    notes: '',
  });

  const [routeInfo, setRouteInfo] = useState<{
    distance_km: number;
    duration_min: number;
    suggested_price: number;
    min_price: number;
    max_price: number;
    parcel_price: number;
  } | null>(null);
  const [calculating, setCalculating] = useState(false);

  const formatDuration = (durationMin: number) => {
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;

    if (hours <= 0) {
      return t('createTrip.durationMinutes', { count: minutes });
    }

    if (minutes === 0) {
      return t('createTrip.durationHours', { count: hours });
    }

    return t('createTrip.durationHoursMinutes', { hours, minutes });
  };

  const calculateRoute = useCallback(async () => {
    if (!departureLocation || !arrivalLocation) {
      setRouteInfo(null);
      setRouteError('');
      return;
    }

    if (departureLocation.lat === arrivalLocation.lat && departureLocation.lng === arrivalLocation.lng) {
      setRouteInfo(null);
      setRouteError(t('createTrip.errors.sameLocations'));
      return;
    }

    const calculationId = latestCalculationRef.current + 1;
    latestCalculationRef.current = calculationId;
    setCalculating(true);
    setRouteError('');

    try {
      const distance = await getDistance(
        [departureLocation.lng, departureLocation.lat],
        [arrivalLocation.lng, arrivalLocation.lat],
      );

      if (latestCalculationRef.current !== calculationId) {
        return;
      }

      if (distance && distance.distance_km > 0) {
        const suggested = suggestPrice(distance.distance_km);
        setRouteInfo({
          distance_km: distance.distance_km,
          duration_min: distance.duration_min,
          ...suggested,
          parcel_price: suggestParcelPrice(distance.distance_km),
        });

        setForm((prev) => ({
          ...prev,
          price_per_seat: prev.price_per_seat || suggested.suggested_price.toFixed(2),
          parcel_price: prev.parcel_price || suggestParcelPrice(distance.distance_km).toFixed(2),
        }));
      } else {
        setRouteInfo(null);
        setRouteError(t('createTrip.errors.routeCalculationFailed'));
      }
    } catch {
      if (latestCalculationRef.current === calculationId) {
        setRouteInfo(null);
        setRouteError(t('createTrip.errors.routeCalculationFailed'));
      }
    } finally {
      if (latestCalculationRef.current === calculationId) {
        setCalculating(false);
      }
    }
  }, [departureLocation, arrivalLocation]);

  useEffect(() => {
    const timer = setTimeout(calculateRoute, 400);
    return () => clearTimeout(timer);
  }, [calculateRoute]);

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.list().then((res) => res.data),
  });

  const addVehicleMutation = useMutation({
    mutationFn: () =>
      vehiclesApi.create({
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: vehicleForm.year ? Number(vehicleForm.year) : null,
        color: vehicleForm.color || null,
        plate: vehicleForm.plate || null,
        seats_count: Number(vehicleForm.seats_count) || 4,
        has_ac: vehicleForm.has_ac,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setForm((prev) => ({ ...prev, vehicle_id: res.data.id }));
      setShowAddVehicle(false);
      setVehicleForm({ make: '', model: '', year: new Date().getFullYear().toString(), color: '', plate: '', seats_count: '4', has_ac: false });
      setVehicleError('');
    },
    onError: (err) => setVehicleError(getApiError(err).message),
  });

  const createMutation = useMutation({
    mutationFn: () => tripsApi.create({
      vehicle_id: form.vehicle_id,
      departure_city_id: departureCity?.id,
      arrival_city_id: arrivalCity?.id,
      departure: {
        point_id: departureLocation?.point_id,
        address: departureLocation?.address || '',
        lat: departureLocation?.lat,
        lng: departureLocation?.lng,
      },
      arrival: {
        point_id: arrivalLocation?.point_id,
        address: arrivalLocation?.address || '',
        lat: arrivalLocation?.lat,
        lng: arrivalLocation?.lng,
      },
      departure_time: new Date(form.departure_time).toISOString(),
      available_seats: Number(form.available_seats),
      price_per_seat: parseFloat(Number(form.price_per_seat).toFixed(2)),
      accepts_parcels: form.accepts_parcels,
      parcel_price: form.parcel_price ? parseFloat(Number(form.parcel_price).toFixed(2)) : undefined,
      notes: form.notes || null,
    }),
    onSuccess: (res) => {
      tripsApi.publish(res.data.id).then(() => {
        navigate(`/trips/${res.data.id}`);
      }).catch(() => {
        navigate(`/trips/${res.data.id}`);
      });
    },
    onError: (err) => setError(getApiError(err).message),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.vehicle_id) { setError(t('createTrip.errors.selectVehicle')); return; }
    if (!departureCity) { setError(t('createTrip.errors.selectDepartureCity')); return; }
    if (!arrivalCity) { setError(t('createTrip.errors.selectArrivalCity')); return; }
    if (!departureLocation) { setError(t('createTrip.errors.selectDeparturePoint')); return; }
    if (!arrivalLocation) { setError(t('createTrip.errors.selectArrivalPoint')); return; }
    if (!form.departure_time) { setError(t('createTrip.errors.enterDeparture')); return; }
    if (!form.price_per_seat || Number(form.price_per_seat) <= 0) { setError(t('createTrip.errors.enterPrice')); return; }
    if (form.accepts_parcels && (!form.parcel_price || Number(form.parcel_price) <= 0)) { setError(t('createTrip.errors.enterParcelPrice')); return; }
    if (routeError) { setError(routeError); return; }

    createMutation.mutate();
  };

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      <div className="mb-6 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-accent/10 p-5 shadow-sm">
        <h1 className="text-2xl font-bold">{t('createTrip.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('createTrip.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Car className="w-4 h-4 text-primary" /> {t('createTrip.vehicle')}</h3>
            {!showAddVehicle && (
              <button type="button" onClick={() => setShowAddVehicle(true)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3.5 h-3.5" /> {t('common.add')}
              </button>
            )}
          </div>

          {vehiclesLoading ? (
            <div className="skeleton h-11 rounded-xl" />
          ) : !showAddVehicle ? (
            <>
              {vehicles && vehicles.length > 0 ? (
                <select
                  value={form.vehicle_id}
                  onChange={set('vehicle_id')}
                  className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">{t('createTrip.selectVehicle')}</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}{vehicle.color ? ` - ${vehicle.color}` : ''}{vehicle.plate ? ` - ${vehicle.plate}` : ''}</option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">{t('createTrip.noVehicles')}</p>
                  <button type="button" onClick={() => setShowAddVehicle(true)} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium">
                    <Plus className="w-4 h-4" /> {t('createTrip.addVehicle')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{t('createTrip.newVehicle')}</span>
                <button type="button" onClick={() => { setShowAddVehicle(false); setVehicleError(''); }} className="p-1 hover:bg-secondary rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {vehicleError && <div className="bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-lg">{vehicleError}</div>}
              <div className="grid grid-cols-2 gap-2">
                <Input id="v_make" label={`${t('createTrip.vehicleForm.make')} *`} placeholder="Toyota" value={vehicleForm.make} onChange={(event) => setVehicleForm((prev) => ({ ...prev, make: event.target.value }))} />
                <Input id="v_model" label={`${t('createTrip.vehicleForm.model')} *`} placeholder="Corolla" value={vehicleForm.model} onChange={(event) => setVehicleForm((prev) => ({ ...prev, model: event.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input id="v_year" label={t('createTrip.vehicleForm.year')} type="number" value={vehicleForm.year} onChange={(event) => setVehicleForm((prev) => ({ ...prev, year: event.target.value }))} />
                <Input id="v_color" label={t('createTrip.vehicleForm.color')} placeholder="Noir" value={vehicleForm.color} onChange={(event) => setVehicleForm((prev) => ({ ...prev, color: event.target.value }))} />
                <Input id="v_plate" label={t('createTrip.vehicleForm.plate')} placeholder="ABC 123" value={vehicleForm.plate} onChange={(event) => setVehicleForm((prev) => ({ ...prev, plate: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input id="v_seats" label={t('createTrip.vehicleForm.seats')} type="number" min="1" max="50" value={vehicleForm.seats_count} onChange={(event) => setVehicleForm((prev) => ({ ...prev, seats_count: event.target.value }))} />
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={vehicleForm.has_ac} onChange={(event) => setVehicleForm((prev) => ({ ...prev, has_ac: event.target.checked }))} className="accent-primary w-4 h-4" />
                    <Snowflake className="w-4 h-4 text-blue-500" />
                    <span className="text-xs">{t('createTrip.vehicleForm.ac')}</span>
                  </label>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full"
                loading={addVehicleMutation.isPending}
                onClick={() => {
                  setVehicleError('');
                  if (!vehicleForm.make.trim()) { setVehicleError(t('createTrip.errors.makeRequired')); return; }
                  if (!vehicleForm.model.trim()) { setVehicleError(t('createTrip.errors.modelRequired')); return; }
                  addVehicleMutation.mutate();
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> {t('createTrip.saveVehicle')}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><MapPinned className="w-4 h-4 text-primary" /> {t('createTrip.route')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CitySelect
              label={t('createTrip.departure')}
              value={departureCity}
              onChange={(city) => {
                setDepartureCity(city);
                setDepartureLocation(null);
              }}
              placeholder={t('createTrip.originPlaceholder')}
            />
            <CitySelect
              label={t('createTrip.destination')}
              value={arrivalCity}
              onChange={(city) => {
                setArrivalCity(city);
                setArrivalLocation(null);
              }}
              placeholder={t('createTrip.destinationPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CityPointAutocomplete
              label={t('locations.departurePoint')}
              cityId={departureCity?.id}
              cityLabel={formatCityLabel(departureCity)}
              value={departureLocation}
              onSelect={setDepartureLocation}
            />
            <CityPointAutocomplete
              label={t('locations.arrivalPoint')}
              cityId={arrivalCity?.id}
              cityLabel={formatCityLabel(arrivalCity)}
              value={arrivalLocation}
              onSelect={setArrivalLocation}
            />
          </div>

          {(departureLocation || arrivalLocation) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border px-4 py-3">
                <div className="text-xs text-muted-foreground mb-1">{t('locations.finalDeparture')}</div>
                <div className="font-medium">{departureLocation?.name ?? departureLocation?.address ?? t('locations.toDefine')}</div>
                <div className="text-xs text-muted-foreground">{departureLocation?.address ?? ''}</div>
              </div>
              <div className="rounded-xl border border-border px-4 py-3">
                <div className="text-xs text-muted-foreground mb-1">{t('locations.finalArrival')}</div>
                <div className="font-medium">{arrivalLocation?.name ?? arrivalLocation?.address ?? t('locations.toDefine')}</div>
                <div className="text-xs text-muted-foreground">{arrivalLocation?.address ?? ''}</div>
              </div>
            </div>
          )}

          {calculating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <Route className="w-3.5 h-3.5" /> {t('createTrip.calculatingDistance')}
            </div>
          )}
          {routeError && !calculating && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{routeError}</span>
            </div>
          )}
          {routeInfo && !calculating && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-white to-accent/10 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-primary">{t('createTrip.routeSummary')}</div>
                  <p className="text-xs text-muted-foreground">{t('createTrip.routeSummaryHint')}</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {t('createTrip.suggestedPrice')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-white/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Route className="w-3.5 h-3.5" />
                    {t('createTrip.distanceLabel')}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{routeInfo.distance_km.toFixed(1)} km</div>
                </div>
                <div className="rounded-xl border border-border bg-white/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Clock3 className="w-3.5 h-3.5" />
                    {t('createTrip.durationLabel')}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{formatDuration(routeInfo.duration_min)}</div>
                </div>
                <div className="rounded-xl border border-border bg-white/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5" />
                    {t('createTrip.suggestedPrice')}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-primary">{formatCurrency(routeInfo.suggested_price)} {t('common.perSeat')}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Info className="w-3.5 h-3.5" />
                    {t('createTrip.recommendedSeatPrice')}
                  </div>
                  <div className="mt-1 text-base font-semibold text-primary">{formatCurrency(routeInfo.suggested_price)} {t('common.perSeat')}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('createTrip.priceRange', {
                      min: formatCurrency(routeInfo.min_price),
                      max: formatCurrency(routeInfo.max_price),
                    })}
                  </p>
                </div>
                <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    {t('createTrip.recommendedParcelPrice')}
                  </div>
                  <div className="mt-1 text-base font-semibold text-accent">{formatCurrency(routeInfo.parcel_price)} /{t('common.parcel').toLowerCase()}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{t('createTrip.parcelPriceHint')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {t('createTrip.dateAndSeats')}</h3>
          <Input id="departure_time" label={t('createTrip.departureDateTime')} type="datetime-local" value={form.departure_time} onChange={set('departure_time')} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="available_seats" label={t('createTrip.availableSeats')} type="number" min="1" max="50" value={form.available_seats} onChange={set('available_seats')} />
            <div>
              <Input id="price_per_seat" label={t('createTrip.pricePerSeat')} type="number" min="0" step="0.01" value={form.price_per_seat} onChange={set('price_per_seat')} placeholder={t('createTrip.priceExample')} hint={routeInfo ? t('createTrip.currentSuggestedSeatPrice', { price: formatCurrency(routeInfo.suggested_price) }) : undefined} />
              {routeInfo && (
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, price_per_seat: routeInfo.suggested_price.toFixed(2) }))} className="mt-1 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                  <Zap className="w-3 h-3" /> {t('createTrip.applyFormatted', { price: formatCurrency(routeInfo.suggested_price) })}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.accepts_parcels}
              onChange={(event) => setForm((prev) => ({
                ...prev,
                accepts_parcels: event.target.checked,
                parcel_price: event.target.checked
                  ? (prev.parcel_price || routeInfo?.parcel_price.toFixed(2) || '')
                  : prev.parcel_price,
              }))}
              className="accent-primary w-4 h-4"
            />
            <Package className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">{t('createTrip.acceptParcels')}</span>
          </label>
          {form.accepts_parcels && (
            <>
              <div>
                <Input id="parcel_price" label={t('createTrip.parcelPrice')} type="number" min="0" step="0.01" value={form.parcel_price} onChange={set('parcel_price')} placeholder={t('createTrip.parcelPriceExample')} hint={routeInfo ? t('createTrip.currentSuggestedParcelPrice', { price: formatCurrency(routeInfo.parcel_price) }) : undefined} />
                {routeInfo && (
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, parcel_price: routeInfo.parcel_price.toFixed(2) }))} className="mt-1 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                    <DollarSign className="w-3 h-3" /> {t('createTrip.applyFormatted', { price: formatCurrency(routeInfo.parcel_price) })}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <label className="text-sm font-medium text-foreground mb-1.5 block">{t('createTrip.notes')}</label>
          <textarea
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="w-full h-24 px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            placeholder={t('createTrip.notesPlaceholder')}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={createMutation.isPending}>
          {t('createTrip.submit')}
        </Button>
      </form>
    </div>
  );
}
