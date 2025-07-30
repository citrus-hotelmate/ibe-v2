'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { SearchBar } from '@/components/search-bar';
import { useCurrency } from "@/components/currency-context"
import { CurrencySelector } from "@/components/currency-selector"
import { getAllHotels } from '@/controllers/adminController';
import HotelCard from "@/components/hotelCards";

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

interface PropertyListing {
  id: number;
  type: string;
  location: string;
  rating: number;
  image: string;
  hotelCode: number;
  lowestRate: number;
}

interface SearchParams {
  destination: string;
  hotelName: string;
  searchType: 'destinations' | 'hotel name' | 'both' | 'none';
}

// Your exact UI PropertyListings component with click functionality
function PropertyListings({
  title,
  destination,
  properties,
  onHotelClick
}: {
  title: string;
  destination: string;
  properties: PropertyListing[];
  onHotelClick: (hotelCode: number) => void;
}) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6  lg:gap-4 2xl:gap-4">
        {properties.map((property) => {
          return (
            <div className=" " key={property.id}>
              <HotelCard
                title={property.type}
                location={property.location}
                image={property.image}
                rating={property.rating}
                price={property.lowestRate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { convertPrice, formatPrice, currency } = useCurrency()
  const [propertiesByCity, setPropertiesByCity] = useState<{ [key: string]: PropertyListing[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    destination: '',
    hotelName: '',
    searchType: 'none'
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const filterHotels = (hotels: Hotel[], params: SearchParams): Hotel[] => {
    if (params.searchType === 'none') {
      return hotels.slice(0, 6);
    }

    let filtered = hotels;

    if (params.searchType === 'destinations') {
      // Destination only - filter by location
      filtered = filtered.filter(hotel => {
        const location = `${hotel.city} ${hotel.country}`.toLowerCase();
        return location.includes(params.destination.toLowerCase());
      });
    } else if (params.searchType === 'hotel name') {
      // Hotel name only - filter by name
      filtered = filtered.filter(hotel =>
        hotel.hotelName.toLowerCase().includes(params.hotelName.toLowerCase())
      );
    } else if (params.searchType === 'both') {
      // Both criteria - hotel must match name AND (have matching location OR have no location data)
      filtered = filtered.filter(hotel => {
        const location = `${hotel.city} ${hotel.country}`.toLowerCase();
        const locationMatches = location.includes(params.destination.toLowerCase());
        const nameMatches = hotel.hotelName.toLowerCase().includes(params.hotelName.toLowerCase());

        // For BOTH search: hotel must match name AND (have matching location OR have no location data)
        const hasLocationData = hotel.city && hotel.country;
        return nameMatches && (!hasLocationData || locationMatches);
      });
    }

    return filtered;
  };

  const fetchHotels = async (params: SearchParams = { destination: '', hotelName: '', searchType: 'none' }) => {
    try {
      setLoading(true);
      const allHotels = await getAllHotels({
        token: process.env.NEXT_PUBLIC_ACCESS_TOKEN || '',
      });

      console.log('Fetched Hotels:', allHotels); // Debug log

      const filteredHotels = filterHotels(allHotels, params);

      const transformedProperties: PropertyListing[] = filteredHotels.map((hotel) => ({
        id: hotel.hotelID,
        type: hotel.hotelName,
        location: hotel.city || hotel.hotelAddress,
        price: "",
        nights: 2,
        rating: hotel.starCatgeory,
        occupancy: "",
        amenities: [],
        image: (hotel as any).hotelImage?.imageFileName || '',
        hotelCode: hotel.hotelCode,
        lowestRate: hotel.lowestRate || 0,
      }));

      const groupedByCity: { [key: string]: PropertyListing[] } = {};
      transformedProperties.forEach((property) => {
        const city = property.location || 'Unknown';
        if (!groupedByCity[city]) groupedByCity[city] = [];
        groupedByCity[city].push(property);
      });
      setPropertiesByCity(groupedByCity);
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
      setPropertiesByCity({});
    } finally {
      setLoading(false);
    }
  };

  const handleHotelClick = (hotelCode: number) => {
    console.log('Navigating to hotel with code:', hotelCode); // Debug log
    router.push(`/hotel?hotelCode=${hotelCode}`);
  };

  const handleSearch = (destinationInput: string, hotelNameInput: string) => {
    const searchType: SearchParams['searchType'] =
      destinationInput && hotelNameInput
        ? 'both'
        : destinationInput
        ? 'destinations'
        : hotelNameInput
        ? 'hotel name'
        : 'none';

    const params: SearchParams = {
      destination: destinationInput,
      hotelName: hotelNameInput,
      searchType
    };
    console.log('Search Params:', params);

    setSearchParams(params);
    // updateDisplayTitle(params); (Removed)
    fetchHotels(params);
  };

  return (
    <main className="min-h-screen bg-[#e2e0df]">
      <Header />
      <div className="w-full px-2 sm:px-4  mx-auto">
        <div className="flex flex-col sm:flex-row justify-center items-center p-4 gap-4">
          <SearchBar onSearch={handleSearch} />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-lg text-gray-600">Loading hotels...</div>
          </div>
        ) : (
          Object.entries(propertiesByCity).map(([city, properties]) => (
            <PropertyListings
              key={city}
              title={city}
              destination={city}
              properties={properties}
              onHotelClick={handleHotelClick}
            />
          ))
        )}
      </div>
    </main>
  );
}