import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { geocodePlace } from '@/lib/openroute';
import { useCityPoints } from '../hooks/useCityPoints';
import type { TripLocationSelection } from '../types/location.types';
import { AddressModeToggle } from './AddressModeToggle';

interface CityPointAutocompleteProps {
  cityId?: string;
  cityLabel?: string;
  value: TripLocationSelection | null;
  onSelect: (value: TripLocationSelection | null) => void;
  allowCustomAddress?: boolean;
  label: string;
}

export function CityPointAutocomplete({
  cityId,
  cityLabel,
  value,
  onSelect,
  allowCustomAddress = true,
  label,
}: CityPointAutocompleteProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'frequent' | 'custom'>(value?.mode ?? 'frequent');
  const [search, setSearch] = useState(value?.mode === 'frequent' ? (value.name ?? value.address) : '');
  const [customAddress, setCustomAddress] = useState(value?.mode === 'custom' ? value.address : '');
  const [open, setOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: points = [], isLoading } = useCityPoints(cityId, search);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!cityId) {
      setMode('frequent');
      setSearch('');
      setCustomAddress('');
      setLocalError('');
      setOpen(false);
    }
  }, [cityId]);

  const resolveCustomAddress = async () => {
    const trimmed = customAddress.trim();
    if (!trimmed) {
      setLocalError(t('locations.errors.enterPreciseAddress'));
      onSelect(null);
      return;
    }

    setIsResolving(true);
    setLocalError('');
    const query = cityLabel ? `${trimmed}, ${cityLabel}` : trimmed;
    const coords = await geocodePlace(query);
    setIsResolving(false);

    if (!coords) {
      setLocalError(t('locations.errors.geocodingUnavailable'));
      onSelect(null);
      return;
    }

    onSelect({
      mode: 'custom',
      point_id: null,
      name: null,
      address: trimmed,
      lat: coords[1],
      lng: coords[0],
    });
  };

  return (
    <div ref={wrapperRef} className="space-y-2">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      {allowCustomAddress && (
        <AddressModeToggle
          mode={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setOpen(false);
            setLocalError('');
            onSelect(null);
          }}
        />
      )}

      {mode === 'frequent' ? (
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-primary" />
          <input
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-secondary/50"
            placeholder={cityId ? t('locations.selectFrequentPoint') : t('locations.chooseCityFirst')}
            disabled={!cityId}
            value={search}
            autoComplete="off"
            onFocus={() => cityId && setOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
              onSelect(null);
            }}
          />
          {open && cityId && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {points.map((point) => (
                <li
                  key={point.id}
                  className="px-4 py-3 text-sm cursor-pointer hover:bg-secondary"
                  onMouseDown={() => {
                    onSelect({
                      mode: 'frequent',
                      point_id: point.id,
                      name: point.name,
                      address: point.address,
                      lat: point.lat,
                      lng: point.lng,
                    });
                    setSearch(point.name);
                    setOpen(false);
                  }}
                >
                  <div className="font-medium">{point.name}</div>
                  <div className="text-xs text-muted-foreground">{point.address}</div>
                </li>
              ))}
              {!isLoading && points.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">{t('locations.noFrequentPoints')}</li>
              )}
              {allowCustomAddress && (
                <li
                  className="px-4 py-3 text-sm cursor-pointer hover:bg-primary/5 border-t border-border text-primary"
                  onMouseDown={() => {
                    setMode('custom');
                    setOpen(false);
                    onSelect(null);
                  }}
                >
                  {t('locations.enterAnotherAddress')}
                </li>
              )}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Navigation className="absolute left-3 top-3 w-4 h-4 text-primary" />
            <input
              className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-secondary/50"
              placeholder={cityId ? t('locations.preciseAddressInSelectedCity') : t('locations.chooseCityFirst')}
              disabled={!cityId}
              value={customAddress}
              onChange={(event) => {
                setCustomAddress(event.target.value);
                setLocalError('');
                onSelect(null);
              }}
            />
          </div>
          <Button type="button" size="sm" variant="outline" onClick={resolveCustomAddress} disabled={!cityId || !customAddress.trim()} loading={isResolving}>
            {t('locations.validateAddress')}
          </Button>
        </div>
      )}

      {value && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <div className="font-medium">{value.name ?? value.address}</div>
          <div className="text-muted-foreground">{value.address}</div>
        </div>
      )}

      {localError && <div className="text-xs text-destructive">{localError}</div>}
    </div>
  );
}
