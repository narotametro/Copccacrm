import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { COUNTRY_CODES, type CountryCode } from '../lib/country-codes';

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CountrySelector({ value, onChange, disabled, className = '' }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter countries based on search
  const filteredCountries = COUNTRY_CODES.filter(country => {
    const searchLower = search.toLowerCase();
    return (
      country.country.toLowerCase().includes(searchLower) ||
      country.code.includes(search) ||
      country.iso.toLowerCase().includes(searchLower)
    );
  });

  // Get selected country
  const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredCountries.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCountries[highlightedIndex]) {
            onChange(filteredCountries[highlightedIndex].code);
            setIsOpen(false);
            setSearch('');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearch('');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredCountries, onChange]);

  // Scroll highlighted item into view
  useEffect(() => {
    const highlightedElement = document.getElementById(`country-option-${highlightedIndex}`);
    if (highlightedElement) {
      highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const handleSelect = (country: CountryCode) => {
    onChange(country.code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Country Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors flex items-center justify-between ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{selectedCountry.flag}</span>
          <span className="text-sm">
            {selectedCountry.code} - {selectedCountry.country}
          </span>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-[9999] overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country, code, or ISO..."
                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>
            {search && (
              <p className="text-xs text-gray-500 mt-1">
                {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
              </p>
            )}
          </div>

          {/* Country List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => {
                const isSelected = country.code === value;
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <button
                    key={country.code + country.iso}
                    id={`country-option-${index}`}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all text-left border-l-4 ${
                      isSelected 
                        ? 'bg-pink-100 border-pink-600' 
                        : isHighlighted 
                        ? 'bg-pink-50 border-transparent hover:bg-pink-50' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-pink-700' : 'text-gray-700'}`}>
                          {country.code}
                        </span>
                        <span className="text-xs text-gray-400">{country.iso}</span>
                      </div>
                      <div className={`text-sm truncate ${isSelected ? 'text-pink-600 font-medium' : 'text-gray-600'}`}>
                        {country.country}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-pink-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <p className="text-sm">No countries found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          {!search && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                💡 Tip: Type to search, use ↑↓ arrows to navigate, Enter to select
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}