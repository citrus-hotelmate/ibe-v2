'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, X, Users } from 'lucide-react';
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
  type: 'hotel' | 'destination';
  icon: React.ReactNode;
}

interface SearchBarProps {
  onSearch?: (destinationInput: string, hotelNameInput: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [destinationInput, setDestinationInput] = useState('');
  const [hotelNameInput, setHotelNameInput] = useState('');
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

  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  // Extract unique destinations as objects with city and country
  const getUniqueDestinations = (): { city: string; country: string }[] => {
    const destinations: { city: string; country: string }[] = [];

    hotels.forEach(hotel => {
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

  console.log('All Hotels:', allHotels); // Debug log
   // Debug log

  // Generate destination suggestions
  useEffect(() => {
    if (!destinationInput.trim()) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }

    const input = destinationInput.toLowerCase().trim();
    const newSuggestions: Suggestion[] = [];

    console.log('Destination Input:', destinationInput); // Debug log
    console.log('newSuggestions before:', newSuggestions); // Debug log

    // Get all unique destinations from API data
    const uniqueDestinations = getUniqueDestinations();

    // Filter destinations that start with the input (city or country)
    const matchingDestinations = uniqueDestinations
      .filter(destination =>
        destination.city.toLowerCase().startsWith(input) ||
        destination.country.toLowerCase().startsWith(input)
      )
      .slice(0, 8) // Limit to 8 suggestions
      .map(destination => ({
        id: `destination-${destination.city}`,
        text: `${destination.city}${destination.country ? ', ' + destination.country : ''}`,
        type: 'destination' as const,
        icon: <MapPin className="w-4 h-4 text-gray-500" />
      }));

    newSuggestions.push(...matchingDestinations);
    console.log('Destination Suggestions:', matchingDestinations); // Debug lo
    console.log('Destination Suggestions:', newSuggestions); // Debug log

    setDestinationSuggestions(newSuggestions);
    setShowDestinationSuggestions(newSuggestions.length > 0);
    setSelectedDestinationIndex(-1);
  }, [destinationInput, hotels]);

  // Generate hotel suggestions
  useEffect(() => {
    if (!hotelNameInput.trim()) {
      setHotelSuggestions([]);
      setShowHotelSuggestions(false);
      return;
    }

    const input = hotelNameInput.toLowerCase().trim();
    const newSuggestions: Suggestion[] = [];

    console.log('Hotel Name Input:', hotelNameInput); // Debug log
    console.log('newSuggestions before:', newSuggestions); // Debug log

    // Add hotel suggestions (match with .startsWith like destination)
    const hotelSuggestions = allHotels
      .filter(hotel =>
        hotel.hotelName.toLowerCase().startsWith(input) 
      )
      .slice(0, 8)
      .map(hotel => ({
        id: `hotel-${hotel.hotelID}`,
        text: hotel.hotelName,
        type: 'hotel' as const,
        icon: <Building2 className="w-4 h-4 text-gray-500" />
      }));

    newSuggestions.push(...hotelSuggestions);
    console.log('Hotel Suggestionswwwwwwwwww:', hotelSuggestions); // Debug log
    console.log('Hotel Suggestions:', newSuggestions); // Debug log

    setHotelSuggestions(newSuggestions);
    setShowHotelSuggestions(newSuggestions.length > 0);
    setSelectedHotelIndex(-1);
  }, [hotelNameInput, allHotels]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false);
      }
      if (hotelRef.current && !hotelRef.current.contains(event.target as Node)) {
        setShowHotelSuggestions(false);
      }
      if (
        !event.target ||
        !(event.target instanceof Node) ||
        (event.target && !event.target.closest('.guest-dropdown') && !event.target.closest('.guest-dropdown-toggle'))
      ) {
        setShowGuestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleDestinationSuggestionSelect = (suggestion: Suggestion) => {
    setDestinationInput(suggestion.text);

    setTimeout(() => {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      setSelectedDestinationIndex(-1);
    }, 50);

    // Trigger search with combined input
    onSearch?.(suggestion.text, hotelNameInput);
  };

  const handleHotelSuggestionSelect = (suggestion: Suggestion) => {
    setHotelNameInput(suggestion.text);

    setTimeout(() => {
      setHotelSuggestions([]);
      setShowHotelSuggestions(false);
      setSelectedHotelIndex(-1);
    }, 50);

    // Trigger search with combined input
    onSearch?.(destinationInput, suggestion.text);
  };

  const handleSearch = () => {
    const combinedSearch = `${destinationInput} ${hotelNameInput}`.trim();
    if (combinedSearch) {


      // Filter hotels by destination and hotel name, and exclude hotels without a valid city
      const filteredHotels = allHotels.filter(hotel =>
        hotel.city && hotel.city.trim() && // Ensure the hotel has a valid city
        (destinationInput ? hotel.city.toLowerCase() === destinationInput.toLowerCase() : true) &&
        (hotelNameInput ? hotel.hotelName.toLowerCase().includes(hotelNameInput.toLowerCase()) : true)
      );
      
      setHotels(filteredHotels);
      setShowDestinationSuggestions(false);
      setShowHotelSuggestions(false);
      onSearch?.(destinationInput, hotelNameInput);
    }
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

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/70  rounded-3xl shadow-xl  flex items-center border border-white/30 overflow-visible relative z-10">
      {/* City or Destination */}
      <div className="flex-1 px-4 py-2 relative" ref={destinationRef}>
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#ff9100]" />
          <div>
            <div className="text-sm text-gray-500 font-medium font-urbanist ">City or Destination</div>
            <input
              ref={destinationInputRef}
              type="text"
              placeholder="Search destinations"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyDown={handleDestinationKeyDown}
              onFocus={() => destinationInput && setShowDestinationSuggestions(destinationSuggestions.length > 0)}
              className="text-gray-900 font-semibold bg-transparent focus:outline-none font-urbanist notranslate"
            />
          </div>
        </div>
        {showDestinationSuggestions && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {destinationSuggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className={`cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-[#ff9100]/10 ${
                  index === selectedDestinationIndex ? 'bg-[#ff9100]/20' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDestinationSuggestionSelect(suggestion);
                }}
              >
                {suggestion.icon}
                <div className="flex justify-between w-full">
                  <span className="font-medium text-gray-500 font-urbanist">{suggestion.text.split(',')[0]}</span>
                  {suggestion.text.includes(',') && (
                    <span className="text-gray-500 text-sm font-urbanist">{suggestion.text.split(',')[1].trim()}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hotel Name Input */}
      <div className="flex-1 px-4 py-2 relative" ref={hotelRef}>
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-[#ff9100]" />
          <div>
            <div className="text-sm text-gray-500 font-medium font-urbanist notranslate">Hotel Name</div>
            <input
              ref={hotelInputRef}
              type="text"
              placeholder="Enter hotel name"
              value={hotelNameInput}
              onChange={(e) => setHotelNameInput(e.target.value)}
              onKeyDown={handleHotelKeyDown}
              onFocus={() => hotelNameInput && setShowHotelSuggestions(hotelSuggestions.length > 0)}
              className="text-gray-900 font-semibold bg-transparent focus:outline-none font-urbanist notranslate"
            />
          </div>
        </div>
        {showHotelSuggestions && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {hotelSuggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className={`cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-[#ff9100]/10 ${
                  index === selectedHotelIndex ? 'bg-[#ff9100]/20' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleHotelSuggestionSelect(suggestion);
                }}
              >
                {suggestion.icon}
                <span>{suggestion.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Guest & Rooms */}
      <div className="flex-1 px-4 py-2 relative">
        <div
          className="flex items-center gap-3 cursor-pointer guest-dropdown-toggle"
          onClick={() => setShowGuestDropdown(prev => !prev)}
        >
          <Users className="w-5 h-5 text-[#ff9100]" />
          <div>
            <div className="text-sm text-gray-500 font-medium font-urbanist notranslate">Guest & Rooms</div>
            <div className="text-gray-400 font-medium font-urbanist notranslate">{adults} Adults, {rooms} Room{rooms > 1 ? 's' : ''}</div>
          </div>
        </div>

        {showGuestDropdown && (
          <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-300 rounded-xl shadow-lg p-4 w-64 guest-dropdown font-urbanist notranslate">
            {[
              { label: 'Adults', desc: 'Ages 13 or above', value: adults, setter: setAdults },
              { label: 'Children', desc: 'Ages 2–12', value: children, setter: setChildren },
              { label: 'Rooms', desc: 'Number of rooms', value: rooms, setter: setRooms },
            ].map(({ label, desc, value, setter }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <div className="font-medium text-sm text-gray-800">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setter(Math.max(0, value - 1))}
                    className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center"
                  >−</button>
                  <span className="w-4 text-center">{value}</span>
                  <button
                    onClick={() => setter(value + 1)}
                    className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-[#ff9100] hover:bg-[#ff9100]/90 text-white p-4 rounded-2xl ml-4 mr-1"
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  );
}