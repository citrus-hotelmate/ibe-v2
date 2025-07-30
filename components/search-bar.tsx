'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, X } from 'lucide-react';
import { getAllHotels } from '@/controllers/adminController';
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

  // Extract unique destinations from hotels data
  const getUniqueDestinations = (): string[] => {
    const destinations = new Set<string>();
    
    hotels.forEach(hotel => {
      // Add city if available
      if (hotel.city && hotel.city.trim()) {
        destinations.add(hotel.city.trim());
      }
      // Add country if available and different from city
      if (hotel.country && hotel.country.trim() && hotel.country !== hotel.city) {
        destinations.add(hotel.country.trim());
      }
    });
    
    return Array.from(destinations).sort();
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

    // Filter destinations that start with the input
    const matchingDestinations = uniqueDestinations
      .filter(destination =>
        destination.toLowerCase().startsWith(input)  // Start with input
      )
      .slice(0, 8) // Limit to 8 suggestions
      .map(destination => ({
        id: `destination-${destination}`,
        text: destination,
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
    <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-2xl">
      {/* Destination Input */}
      <div ref={destinationRef} className="relative flex-1">
        <div className="flex flex-col px-6 py-3 border-r border-gray-200">
          <label className="text-xs font-medium text-gray-900 mb-1">Where</label>
          <div className="flex items-center">
            <input
              ref={destinationInputRef}
              type="text"
              placeholder="Search destinations"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyDown={handleDestinationKeyDown}
              onFocus={() => destinationInput && setShowDestinationSuggestions(destinationSuggestions.length > 0)}
              className="w-full text-sm placeholder-gray-400 focus:outline-none bg-transparent"
            />
            {destinationInput && (
              <button
                onClick={clearDestination}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Destination Suggestions Dropdown */}
        {showDestinationSuggestions && destinationSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
            {destinationSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleDestinationSuggestionSelect(suggestion)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                  index === selectedDestinationIndex ? 'bg-gray-50' : ''
                }`}
              >
                {suggestion.icon}
                <span className="ml-3 text-sm text-gray-900">{suggestion.text}</span>
                <span className="ml-auto text-xs text-gray-500 capitalize">
                  {suggestion.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hotel Name Input */}
      <div ref={hotelRef} className="relative flex-1">
        <div className="flex flex-col px-6 py-3">
          <label className="text-xs font-medium text-gray-900 mb-1">Hotel name</label>
          <div className="flex items-center">
            <input
              ref={hotelInputRef}
              type="text"
              placeholder="Enter hotel name"
              value={hotelNameInput}
              onChange={(e) => setHotelNameInput(e.target.value)}
              onKeyDown={handleHotelKeyDown}
              onFocus={() => hotelNameInput && setShowHotelSuggestions(hotelSuggestions.length > 0)}
              className="w-full text-sm placeholder-gray-400 focus:outline-none bg-transparent"
            />
            {hotelNameInput && (
              <button
                onClick={clearHotelName}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Hotel Suggestions Dropdown */}
        {showHotelSuggestions && hotelSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
            {hotelSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleHotelSuggestionSelect(suggestion)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                  index === selectedHotelIndex ? 'bg-gray-50' : ''
                }`}
              >
                {suggestion.icon}
                <span className="ml-3 text-sm text-gray-900">{suggestion.text}</span>
                <span className="ml-auto text-xs text-gray-500 capitalize">
                  {suggestion.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-orange-500 text-white px-8 py-4 rounded-full hover:bg-orange-600 transition-colors duration-200 font-medium text-sm mx-2"
      >
        Search
      </button>
    </div>
  );
}