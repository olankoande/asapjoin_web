import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useCities } from '../hooks/useCities';
import { useCitySearch } from '../hooks/useCitySearch';
import type { City } from '../types/location.types';
import { formatCityLabel } from '../types/location.types';

interface CitySelectProps {
  label: string;
  value: City | null;
  onChange: (city: City | null) => void;
  placeholder: string;
}

export function CitySelect({ label, value, onChange, placeholder }: CitySelectProps) {
  const [query, setQuery] = useState(value ? formatCityLabel(value) : '');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: topCities = [] } = useCities(12);
  const { data: searchedCities = [] } = useCitySearch(query);

  useEffect(() => {
    setQuery(value ? formatCityLabel(value) : '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = useMemo(() => (
    query.trim().length >= 2 ? searchedCities : topCities
  ), [query, searchedCities, topCities]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 w-4 h-4 text-primary" />
        <input
          className="w-full h-11 pl-9 pr-10 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value && event.target.value !== formatCityLabel(value)) onChange(null);
            setOpen(true);
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange(null);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && options.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {options.map((city) => (
            <li
              key={city.id}
              className="px-4 py-3 text-sm cursor-pointer hover:bg-secondary flex items-center gap-2"
              onMouseDown={() => {
                onChange(city);
                setQuery(formatCityLabel(city));
                setOpen(false);
              }}
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{formatCityLabel(city)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
