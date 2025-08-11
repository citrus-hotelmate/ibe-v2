'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, X, Users, Hotel as HotelIcon } from 'lucide-react';
import { getAllHotels } from '@/controllers/ibeController';
import { HotelResponse } from '@/types/admin';

interface Hotel {
  hotelID: number;
  hotelGUID: string;
  finAct: boolean;
  hotelName: string;
  hotelCode: number;
  userGUID_HotelOwner: string;
  hotelType: string;
  hotelAddress: string;
  city: string;
  zipCode: string;
  country: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelWeb: string;
  noOfRooms: number;
  latitude: string;
  longitude: string;
  currencyCode: string;
  languageCode: string;
  createdOn: string;
  createdTimeStamp: string;
  lastUpdatedOn: string | null;
  lastUpdatedTimeStamp: string | null;
  lastUpdatedBy_UserGUID: string;
  starCatgeory: number;
  cM_PropertyID: string;
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: null;
  planId: null;
  lowestRate: number;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'hotel' | 'destination' | 'hotelType'; // ⬅️ add 'hotelType'
  icon: React.ReactNode;
}
interface SearchBarProps {
  onSearch?: (
    destinationInput: string,
    hotelNameInput: string,
    hotelTypeInput: string
  ) => void;
}


function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}


export function SearchBar({ onSearch }: SearchBarProps) {
  const [destinationInput, setDestinationInput] = useState('');
  // Recent searches for destinations
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hotelNameInput, setHotelNameInput] = useState('');
  // Recent hotel searches
  const [recentHotelSearches, setRecentHotelSearches] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Suggestion[]>([]);
  const [hotelSuggestions, setHotelSuggestions] = useState<Suggestion[]>([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showHotelSuggestions, setShowHotelSuggestions] = useState(false);
  const [hotels, setHotels] = useState<HotelResponse[]>([]);
  const [allHotels, setAllHotels] = useState<HotelResponse[]>([]);
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(-1);
  const [selectedHotelIndex, setSelectedHotelIndex] = useState(-1);
  const destinationRef = useRef<HTMLDivElement>(null);
  const hotelRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const hotelInputRef = useRef<HTMLInputElement>(null);

  const [hotelTypeInput, setHotelTypeInput] = useState('');
  const [hotelTypeSuggestions, setHotelTypeSuggestions] = useState<Suggestion[]>([]);
  const [showHotelTypeSuggestions, setShowHotelTypeSuggestions] = useState(false);
  const [selectedHotelTypeIndex, setSelectedHotelTypeIndex] = useState(-1);
  const hotelTypeRef = useRef<HTMLDivElement>(null);
  const hotelTypeInputRef = useRef<HTMLInputElement>(null);


  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);


  const getUniqueHotelTypes = (): string[] => {
    const types = allHotels
      .map(hotel => hotel.hotelType?.trim())
      .filter((type): type is string => !!type);
    return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b));
  };

  const uniqueHotelTypes = getUniqueHotelTypes();

  const debouncedCity = useDebounce(destinationInput, 300);
  const debouncedHotel = useDebounce(hotelNameInput, 300);
  const debouncedType = useDebounce(hotelTypeInput, 300);

  useEffect(() => {
    onSearch?.(
      debouncedCity.trim(),
      debouncedHotel.trim(),
      debouncedType.trim()
    );
  }, [debouncedCity, debouncedHotel, debouncedType]);

  // Extract unique destinations as objects with city and country
  const getUniqueDestinations = (): { city: string; country: string }[] => {
    const destinations: { city: string; country: string }[] = [];

    // Filter hotels by hotel type if specified
    let filteredHotels = allHotels;
    if (hotelTypeInput.trim()) {
      filteredHotels = allHotels.filter(
        h => h.hotelType?.toLowerCase() === hotelTypeInput.toLowerCase()
      );
    }

    filteredHotels.forEach(hotel => {
      if (hotel.city && hotel.city.trim()) {
        destinations.push({
          city: hotel.city.trim(),
          country: hotel.country?.trim() || '',
        });
      }
    });

    // Remove duplicates by city+country
    const unique = Array.from(
      new Map(destinations.map(d => [`${d.city}-${d.country}`, d])).values()
    );

    return unique.sort((a, b) => a.city.localeCompare(b.city));
  };

  // Fetch hotels for suggestions
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const hotelsData = await getAllHotels({
          token: process.env.NEXT_PUBLIC_ACCESS_TOKEN || '',
        });
        setAllHotels(hotelsData);
        setHotels(hotelsData);
      } catch (error) {
        console.error('Failed to fetch hotels for suggestions:', error);
      }
    };

    fetchHotels();
  }, []);

  // Debug log

  // Generate destination suggestions
  useEffect(() => {
    const uniqueDestinations = getUniqueDestinations();
    if (!destinationInput.trim()) {
      // Prepare top 5 default suggestions silently
      const defaultSuggestions = uniqueDestinations
        .slice(0, 5)
        .map(destination => ({
          id: `default-${destination.city}`,
          text: `${destination.city}${destination.country ? ', ' + destination.country : ''}`,
          type: 'destination' as const,
          icon: <MapPin className="w-4 h-4 text-gray-500" />
        }));
      setDestinationSuggestions(defaultSuggestions);
      setSelectedDestinationIndex(-1);
      // Do not open dropdown automatically
      return;
    }

    const input = destinationInput.toLowerCase().trim();
    const matchingDestinations = uniqueDestinations
      .filter(destination =>
        destination.city.toLowerCase().startsWith(input) ||
        destination.country.toLowerCase().startsWith(input)
      )
      .slice(0, 8)
      .map(destination => ({
        id: `destination-${destination.city}`,
        text: `${destination.city}${destination.country ? ', ' + destination.country : ''}`,
        type: 'destination' as const,
        icon: <MapPin className="w-4 h-4 text-gray-500" />
      }));

    setDestinationSuggestions(matchingDestinations);
    setShowDestinationSuggestions(matchingDestinations.length > 0);
    setSelectedDestinationIndex(-1);
  }, [destinationInput, allHotels, hotelTypeInput]);

  // Generate hotel suggestions
  useEffect(() => {
    // Start with all hotels and apply filters
    let pool = allHotels;

    // filter by city (if any)
    if (destinationInput.trim()) {
      pool = pool.filter(h => h.city?.toLowerCase() === destinationInput.toLowerCase());
    }

    // filter by hotel type (if any)
    if (hotelTypeInput.trim()) {
      pool = pool.filter(
        h => h.hotelType?.toLowerCase() === hotelTypeInput.toLowerCase()
      );
    }

    if (!hotelNameInput.trim()) {
      const defaultHotelSuggestions = pool.slice(0, 5).map(hotel => ({
        id: `default-hotel-${hotel.hotelID}`,
        text: hotel.hotelName,
        type: 'hotel' as const,
        icon: <Building2 className="w-4 h-4 text-gray-500" />
      }));
      setHotelSuggestions(defaultHotelSuggestions);
      setSelectedHotelIndex(-1);
      return;
    }

    const input = hotelNameInput.toLowerCase().trim();

    const filteredSuggestions = pool
      .filter(h => h.hotelName.toLowerCase().startsWith(input))
      .slice(0, 8)
      .map(h => ({
        id: `hotel-${h.hotelID}`,
        text: h.hotelName,
        type: 'hotel' as const,
        icon: <Building2 className="w-4 h-4 text-gray-500" />
      }));

    setHotelSuggestions(filteredSuggestions);
    setShowHotelSuggestions(filteredSuggestions.length > 0);
    setSelectedHotelIndex(-1);
  }, [hotelNameInput, allHotels, destinationInput, hotelTypeInput]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false);
      }
      if (hotelRef.current && !hotelRef.current.contains(event.target as Node)) {
        setShowHotelSuggestions(false);
      }
      if (hotelTypeRef.current && !hotelTypeRef.current.contains(event.target as Node)) {
        setShowHotelTypeSuggestions(false);  // ⬅️ add this
      }
      if (
        !event.target ||
        !(event.target instanceof Element) ||
        (event.target && !event.target.closest('.guest-dropdown') && !event.target.closest('.guest-dropdown-toggle'))
      ) {
        setShowGuestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Filter hotels by destination if specified
    let filteredHotels = allHotels;
    if (destinationInput.trim()) {
      filteredHotels = allHotels.filter(h => h.city?.toLowerCase() === destinationInput.toLowerCase());
    }

    const types = Array.from(
      new Set(filteredHotels.map(h => h.hotelType?.trim()).filter(Boolean))
    ).sort();

    if (!hotelTypeInput.trim()) {
      setHotelTypeSuggestions(
        types.slice(0, 5).map((type, idx) => ({
          id: `default-type-${idx}`,
          text: type,
          type: 'hotelType' as const,
          icon: <HotelIcon className="w-4 h-4 text-gray-500" />
        }))
      );
      setSelectedHotelTypeIndex(-1);
      return;
    }

    const input = hotelTypeInput.toLowerCase().trim();
    const filtered = types
      .filter(t => t.toLowerCase().startsWith(input))
      .slice(0, 8)
      .map((t, idx) => ({
        id: `type-${idx}`,
        text: t,
        type: 'hotelType' as const,
        icon: <HotelIcon className="w-4 h-4 text-gray-500" />
      }));

    setHotelTypeSuggestions(filtered);
    setShowHotelTypeSuggestions(filtered.length > 0);
    setSelectedHotelTypeIndex(-1);
  }, [allHotels, hotelTypeInput, destinationInput]);



  // Handle keyboard navigation for destination input
  const handleDestinationKeyDown = (e: React.KeyboardEvent) => {
    if (!showDestinationSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedDestinationIndex(prev =>
          prev < destinationSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedDestinationIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedDestinationIndex >= 0) {
          handleDestinationSuggestionSelect(destinationSuggestions[selectedDestinationIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDestinationSuggestions(false);
        setSelectedDestinationIndex(-1);
        break;
    }
  };

  // Handle keyboard navigation for hotel input
  const handleHotelKeyDown = (e: React.KeyboardEvent) => {
    if (!showHotelSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedHotelIndex(prev =>
          prev < hotelSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedHotelIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedHotelIndex >= 0) {
          handleHotelSuggestionSelect(hotelSuggestions[selectedHotelIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowHotelSuggestions(false);
        setSelectedHotelIndex(-1);
        break;
    }
  };

  const handleHotelTypeKeyDown = (e: React.KeyboardEvent) => {
    if (!showHotelTypeSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedHotelTypeIndex(prev =>
          prev < hotelTypeSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedHotelTypeIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedHotelTypeIndex >= 0) {
          handleHotelTypeSuggestionSelect(hotelTypeSuggestions[selectedHotelTypeIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowHotelTypeSuggestions(false);
        setSelectedHotelTypeIndex(-1);
        break;
    }
  };

  const handleDestinationSuggestionSelect = (suggestion: Suggestion) => {
    // Extract city (text before the comma)
    const cityOnly = suggestion.text.split(',')[0].trim();

    // Show only city in the input field
    setDestinationInput(cityOnly);

    // Store in recent searches (max 5, no duplicates)
    setRecentSearches(prev => {
      const updated = [cityOnly, ...prev.filter(item => item !== cityOnly)].slice(0, 5);
      return updated;
    });

    // Close the dropdown
    setTimeout(() => {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      setSelectedDestinationIndex(-1);
    }, 50);
    // ❌ Do NOT auto-search here
  };

  const handleHotelSuggestionSelect = (suggestion: Suggestion) => {
    setHotelNameInput(suggestion.text);

    setRecentHotelSearches(prev => {
      const updated = [suggestion.text, ...prev.filter(item => item !== suggestion.text)].slice(0, 5);
      return updated;
    });

    setTimeout(() => {
      setHotelSuggestions([]);
      setShowHotelSuggestions(false);
      setSelectedHotelIndex(-1);
    }, 50);

    // Trigger search with combined input
    onSearch?.(destinationInput, suggestion.text, hotelTypeInput);
  };

  const handleSearch = () => {
    const city = destinationInput.trim();
    const hotel = hotelNameInput.trim();
    const type = hotelTypeInput.trim();

    if (city || hotel || type) {
      onSearch?.(city, hotel, type);
    }

    setShowDestinationSuggestions(false);
    setShowHotelSuggestions(false);
    setShowHotelTypeSuggestions(false);
  };

  const clearDestination = () => {
    setDestinationInput('');
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
    setSelectedDestinationIndex(-1);
    destinationInputRef.current?.focus();

    // Reset hotels to full list
    setHotels(allHotels);
  };

  const clearHotelName = () => {
    setHotelNameInput('');
    setHotelSuggestions([]);
    setShowHotelSuggestions(false);
    setSelectedHotelIndex(-1);
    hotelInputRef.current?.focus();

    // Reset hotels to full list
    setHotels(allHotels);
  };

  const handleHotelTypeSuggestionSelect = (suggestion: Suggestion) => {
    setHotelTypeInput(suggestion.text);

    setTimeout(() => {
      setHotelTypeSuggestions([]);
      setShowHotelTypeSuggestions(false);
      setSelectedHotelTypeIndex(-1);
    }, 50);

    onSearch?.(destinationInput, hotelNameInput, suggestion.text);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/70 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center border border-white/30 overflow-visible relative z-10 gap-2 sm:gap-0 p-2 sm:p-0">
      {/* City or Destination */}
      <div className="w-full sm:flex-1 px-2 sm:px-3 py-2 relative" ref={destinationRef}>
        <div className="flex items-center gap-1 sm:gap-2">
          <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-[#ff9100] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist">City or Destination</div>
            <input
              ref={destinationInputRef}
              type="text"
              placeholder="Search destinations"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyDown={handleDestinationKeyDown}
              onFocus={() => setShowDestinationSuggestions(destinationSuggestions.length > 0)}
              className="text-gray-900 font-semibold bg-transparent focus:outline-none font-urbanist notranslate w-full text-sm sm:text-base"
            />
          </div>
        </div>
        {showDestinationSuggestions && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-auto left-0 right-0 w-full sm:w-auto sm:min-w-full p-3 space-y-3">
            {/* Recent Searches */}
            {recentSearches.length > 0 && !destinationInput.trim() && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">Recent searches</div>
                <ul className="space-y-1">
                  {recentSearches.map((item, index) => (
                    <li
                      key={`recent-${index}`}
                      className="cursor-pointer flex items-center gap-2 px-2 py-2  rounded-md"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDestinationInput(item);
                      }}
                    >
                      <MapPin className="w-4 h-4 text-[#ff9100]" />
                      <span className="text-gray-400 font-urbanist">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Suggested Destinations */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">Suggested destinations</div>
              <ul className="space-y-1">
                {destinationSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    className={`cursor-pointer flex items-center gap-2 px-2 py-2 hover:bg-[#e2e0df]/10 rounded-md ${index === selectedDestinationIndex ? 'bg-[#ff9100]/20' : ''
                      }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleDestinationSuggestionSelect(suggestion);
                    }}
                  >
                    {suggestion.icon}
                    <div className="flex justify-between w-full">
                      <span className="font-medium text-gray-500 font-urbanist text-sm">
                        {suggestion.text.split(',')[0]}
                      </span>
                      {suggestion.text.includes(',') && (
                        <span className="text-gray-500 text-xs font-urbanist">
                          {suggestion.text.split(',')[1].trim()}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Hotel Type Search */}
      <div className="w-full sm:flex-1 px-2 sm:px-3 py-2 sm:ml-2 relative" ref={hotelTypeRef}>
        <div className="flex items-center gap-1 sm:gap-2">
          <HotelIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[#ff9100] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist">Hotel Type</div>
            <input
              ref={hotelTypeInputRef}
              type="text"
              placeholder="Search hotel type"
              value={hotelTypeInput}
              onChange={(e) => setHotelTypeInput(e.target.value)}
              onKeyDown={handleHotelTypeKeyDown}
              onFocus={() => setShowHotelTypeSuggestions(hotelTypeSuggestions.length > 0)}
              className="text-gray-900 font-semibold bg-transparent focus:outline-none font-urbanist notranslate w-full text-sm sm:text-base"
            />
          </div>
        </div>
        {showHotelTypeSuggestions && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-auto left-0 right-0 w-full sm:w-auto sm:min-w-full p-3 space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">Suggested types</div>
              <ul className="space-y-1">
                {hotelTypeSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    className={`cursor-pointer flex items-center gap-2 px-2 py-2 hover:bg-[#e2e0df]/10 rounded-md ${index === selectedHotelTypeIndex ? 'bg-[#ff9100]/20' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleHotelTypeSuggestionSelect(suggestion);
                    }}
                  >
                    {suggestion.icon}
                    <span className="font-medium text-gray-500 font-urbanist text-sm">
                      {suggestion.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Hotel Name Input */}
      <div className="w-full sm:flex-1 px-2 sm:px-3 py-2 sm:ml-2 relative" ref={hotelRef}>
        <div className="flex items-center gap-1 sm:gap-2">
          <Building2 className="w-4 sm:w-5 h-4 sm:h-5 text-[#ff9100] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist notranslate">Hotel Name</div>
            <input
              ref={hotelInputRef}
              type="text"
              placeholder="Enter hotel name"
              value={hotelNameInput}
              onChange={(e) => setHotelNameInput(e.target.value)}
              onKeyDown={handleHotelKeyDown}
              onFocus={() => setShowHotelSuggestions(hotelSuggestions.length > 0)}
              className="text-gray-900 font-semibold bg-transparent focus:outline-none font-urbanist notranslate w-full text-sm sm:text-base"
            />
          </div>
        </div>
        {showHotelSuggestions && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-auto left-0 right-0 w-full sm:w-auto sm:min-w-full p-3 space-y-3">
            {/* Recent Hotel Searches */}
            {recentHotelSearches.length > 0 && !hotelNameInput.trim() && (
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-2">Recent hotel searches</div>
                <ul className="space-y-1">
                  {recentHotelSearches.map((item, index) => (
                    <li
                      key={`recent-hotel-${index}`}
                      className="cursor-pointer flex items-center gap-2 px-2 py-2 hover:bg-[#ff9100]/10 rounded-md"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setHotelNameInput(item);
                      }}
                    >
                      <Building2 className="w-4 h-4 text-[#ff9100]" />
                      <span className="text-gray-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Suggested Hotels */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">Suggested hotels</div>
              <ul className="space-y-1">
                {hotelSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    className={`cursor-pointer flex items-center gap-2 px-2 py-2 hover:bg-[#e2e0df]/10 rounded-md ${index === selectedHotelIndex ? 'bg-[#ff9100]/20' : ''
                      }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleHotelSuggestionSelect(suggestion);
                    }}
                  >
                    {suggestion.icon}
                    <span className="text-gray-500 font-medium">{suggestion.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-[#ff9100] hover:bg-[#ff9100]/90 text-white p-2 sm:p-4 
                 rounded-2xl w-full sm:w-auto mr-[5px] flex items-center justify-center gap-2"
      >
        <Search className="w-4 sm:w-5 h-4 sm:h-5" />
        <span className="block sm:hidden">Search</span>
      </button>
    </div>
  );
}