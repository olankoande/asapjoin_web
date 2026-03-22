import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tripsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { MapPin, Calendar, Users, Package, ArrowRight, Search, X, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import type { Trip } from '@/lib/types';

// ─── Liste des villes pour l'autocomplétion ───
const CITIES = [
  'Montréal, QC', 'Toronto, ON', 'Vancouver, BC', 'Calgary, AB', 'Edmonton, AB',
  'Ottawa, ON', 'Winnipeg, MB', 'Québec, QC', 'Hamilton, ON', 'Kitchener, ON',
  'London, ON', 'Halifax, NS', 'Victoria, BC', 'Oshawa, ON', 'Windsor, ON',
  'Saskatoon, SK', 'Regina, SK', 'Sherbrooke, QC', 'St. John\'s, NL', 'Barrie, ON',
  'Kelowna, BC', 'Abbotsford, BC', 'Kingston, ON', 'Trois-Rivières, QC', 'Moncton, NB',
  'Chicoutimi, QC', 'Saint John, NB', 'Thunder Bay, ON', 'Sudbury, ON', 'Gatineau, QC',
  'Laval, QC', 'Longueuil, QC', 'Lévis, QC', 'Drummondville, QC', 'Granby, QC',
  'Saint-Hyacinthe, QC', 'Rimouski, QC', 'Shawinigan, QC', 'Victoriaville, QC',
  'Saguenay, QC', 'Terrebonne, QC', 'Repentigny, QC', 'Brossard, QC', 'Saint-Jérôme, QC',
  'Châteauguay, QC', 'Joliette, QC', 'Alma, QC', 'Val-d\'Or, QC', 'Rouyn-Noranda, QC',
  'Sept-Îles, QC', 'Sorel-Tracy, QC', 'Thetford Mines, QC', 'Magog, QC',
  'Mississauga, ON', 'Brampton, ON', 'Markham, ON', 'Vaughan, ON', 'Richmond Hill, ON',
  'Oakville, ON', 'Burlington, ON', 'Guelph, ON', 'Cambridge, ON', 'Waterloo, ON',
  'Brantford, ON', 'Peterborough, ON', 'Niagara Falls, ON', 'St. Catharines, ON',
  'Sault Ste. Marie, ON', 'Sarnia, ON', 'Belleville, ON', 'Cornwall, ON',
  'North Bay, ON', 'Timmins, ON', 'Lethbridge, AB', 'Red Deer, AB', 'Medicine Hat, AB',
  'Grande Prairie, AB', 'Airdrie, AB', 'Spruce Grove, AB', 'Nanaimo, BC',
  'Kamloops, BC', 'Prince George, BC', 'Chilliwack, BC', 'Vernon, BC', 'Courtenay, BC',
  'Fredericton, NB', 'Charlottetown, PE', 'Whitehorse, YT', 'Yellowknife, NT',
  'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Touba', 'Diourbel',
  'Tambacounda', 'Kolda', 'Matam', 'Fatick', 'Kaffrine', 'Kédougou', 'Sédhiou',
  'Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'San-Pédro', 'Korhogo',
  'Bamako', 'Sikasso', 'Mopti', 'Ségou', 'Koutiala', 'Kayes',
  'Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé',
  'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora',
  'Lomé', 'Sokodé', 'Kara', 'Atakpamé',
  'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi',
  'Niamey', 'Zinder', 'Maradi', 'Tahoua', 'Agadez',
  'Nouakchott', 'Nouadhibou', 'Rosso',
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes',
  'Bruxelles', 'Anvers', 'Liège', 'Gand', 'Charleroi', 'Namur',
  'Genève', 'Zurich', 'Lausanne', 'Berne', 'Bâle',
];

function CityAutocomplete({
  value,
  onChange,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filterCities = useCallback((input: string) => {
    if (!input || input.length < 2) return [];
    const lower = input.toLowerCase();
    return CITIES.filter((c) => c.toLowerCase().includes(lower)).slice(0, 8);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    const filtered = filterCities(val);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightIndex(-1);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">{icon}</div>
      <input
        className="w-full h-12 pl-10 pr-9 rounded-xl border border-border bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/40 transition-all placeholder:text-muted-foreground/60"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => {
          const filtered = filterCities(value);
          if (filtered.length > 0) {
            setSuggestions(filtered);
            setShowSuggestions(true);
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); setSuggestions([]); setShowSuggestions(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-border/60 rounded-xl shadow-lg max-h-52 overflow-y-auto animate-scale-in">
          {suggestions.map((city, idx) => (
            <li
              key={city}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2.5 ${
                idx === highlightIndex ? 'bg-primary/5 text-primary' : 'hover:bg-secondary'
              }`}
              onMouseDown={() => handleSelect(city)}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium">{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Trip Card ─── */
function TripCard({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  return (
    <Link to={`/trips/${trip.id}`} className="block group">
      <Card hover className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5">
          {/* Route */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-primary/20" />
                  <div className="w-0.5 h-5 bg-gradient-to-b from-primary/40 to-accent/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-accent/20" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-semibold truncate">{trip.departure_label || trip.origin_address}</p>
                  <p className="text-sm font-semibold truncate">{trip.arrival_label || trip.destination_address}</p>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-extrabold text-gradient">{formatCurrency(trip.price_per_seat)}</span>
              <p className="text-[11px] text-muted-foreground font-medium">/place</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="default" icon={<Calendar className="w-3 h-3" />}>
              {formatDate(trip.departure_time)}
            </Badge>
            <Badge variant="primary" icon={<Users className="w-3 h-3" />}>
              {trip.available_seats ?? 0} place{(trip.available_seats ?? 0) > 1 ? 's' : ''}
            </Badge>
            {trip.accepts_parcels && (
              <Badge variant="accent" icon={<Package className="w-3 h-3" />}>
                {t('common.parcel')}
              </Badge>
            )}
          </div>

          {/* Driver */}
          {trip.driver && (
            <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-border/50">
              <Avatar
                src={trip.driver.avatar_url}
                firstName={trip.driver.first_name}
                lastName={trip.driver.last_name}
                size="xs"
              />
              <span className="text-xs font-medium text-muted-foreground">
                {trip.driver.first_name} {trip.driver.last_name}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function SearchPage() {
  const { t } = useTranslation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState('1');
  const [parcels, setParcels] = useState(false);
  const [submittedParams, setSubmittedParams] = useState<Record<string, string>>({});
  const [hasSearched, setHasSearched] = useState(true);

  const { data: tripsData, isLoading, error, refetch } = useQuery({
    queryKey: ['trips-search', submittedParams],
    queryFn: () => tripsApi.search(submittedParams).then((r) => r.data),
    enabled: true,
  });

  const trips: Trip[] = tripsData?.data ?? (Array.isArray(tripsData) ? tripsData : []);
  const sortedTrips = trips;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (origin) params.origin_address = origin;
    if (destination) params.destination_address = destination;
    if (date) params.date = date;
    if (seats && Number(seats) > 1) params.seats = seats;
    if (parcels) params.accepts_parcels = 'true';
    setSubmittedParams(params);
    setHasSearched(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3 h-3" />
          {t('search.badge')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          <span className="text-gradient">{t('search.title')}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">{t('search.subtitle')}</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="animate-fade-in-up">
        <Card className="p-5 sm:p-6 mb-6" variant="default">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CityAutocomplete
                value={origin}
                onChange={setOrigin}
                placeholder={t('search.originPlaceholder')}
                icon={<MapPin className="w-4 h-4 text-primary" />}
              />
              <CityAutocomplete
                value={destination}
                onChange={setDestination}
                placeholder={t('search.destinationPlaceholder')}
                icon={<MapPin className="w-4 h-4 text-accent" />}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input id="seats" type="number" min="1" max="8" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder={t('search.seatsPlaceholder')} />
              <label className="flex items-center gap-2.5 h-11 px-4 rounded-xl border border-border bg-white cursor-pointer hover:border-primary/40 transition-all col-span-2 sm:col-span-1">
                <input type="checkbox" checked={parcels} onChange={(e) => setParcels(e.target.checked)} className="accent-primary w-4 h-4" />
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('common.parcel')}</span>
              </label>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              <Search className="w-4 h-4" />
              {t('search.searchButton')}
            </Button>
          </div>
        </Card>
      </form>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-8 animate-fade-in">
        <Link to="/driver/trips/new" className="group">
          <Card hover padding="sm" className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">{t('search.newTrip')}</p>
              <p className="text-xs text-muted-foreground">{t('search.proposeTrip')}</p>
            </div>
          </Card>
        </Link>
        <Link to="/deliveries" className="group">
          <Card hover padding="sm" className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold">{t('search.sendParcel')}</p>
              <p className="text-xs text-muted-foreground">{t('search.fastDelivery')}</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Results */}
      {hasSearched && error && (
        <div className="bg-destructive/10 text-destructive text-sm font-medium px-4 py-3 rounded-xl mb-4 animate-scale-in flex items-center justify-between gap-3">
          <span>{t('search.searchError')}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs underline underline-offset-2 shrink-0"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      )}

      {hasSearched && !isLoading && !error && sortedTrips.length === 0 && (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title={t('search.noTrips')}
          description={t('search.noTripsHint')}
          action={
            <Link to="/driver/trips/new">
              <Button variant="outline">{t('search.createTrip')}</Button>
            </Link>
          }
        />
      )}

      {!isLoading && sortedTrips.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {t('search.tripsCount', { count: sortedTrips.length })}{' '}
              <span className="text-muted-foreground font-normal text-sm">{t('search.available', { count: sortedTrips.length })}</span>
            </h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full font-medium">
              {t('common.byDate')}
            </span>
          </div>
          <div className="space-y-3 stagger-children">
            {sortedTrips.map((trip: Trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
