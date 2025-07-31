'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import HeroSection from '@/components/hero-section';
import Navbar from '@/components/navbar';
import { SearchBar } from '@/components/search-bar';
import { useCurrency } from "@/components/currency-context"
import { CurrencySelector } from "@/components/currency-selector"
import { getAllHotels } from '@/controllers/ibeController';
import HotelCard from "@/components/hotelCards";
import { Hotel } from 'lucide-react';

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
  hotelImage?: {
    imageFileName?: string;
    isMain?: boolean;
  };
}

interface PropertyListing {
  id: number;
  type: string;
  location: string;
  rating: number;
  image: string;
  hotelCode: number;
  lowestRate: number;
  slug: string;
}

interface SearchParams {
  destination: string;
  hotelName: string;
  searchType: 'destinations' | 'hotel name' | 'both' | 'none';
}

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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
  onHotelClick: (slug: string) => void;
}) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
      </div>
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(220px,_1fr))] gap-4">
          {properties.map((property) => {
            return (
              <div className=" " key={property.id}>
                <HotelCard
                  title={property.type}
                  location={property.location}
                  image={property.image}
                  rating={property.rating}
                  price={property.lowestRate}
                  onClick={() => onHotelClick(property.slug)} 
                />
              </div>
            );
          })}
        </div>
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
      return hotels;
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

      const transformedProperties: PropertyListing[] = filteredHotels.map((hotel) => {
        const rawImage = hotel.hotelImage?.imageFileName;
        const decodedImage = rawImage && hotel.hotelImage?.isMain
          ? decodeURIComponent(rawImage)
          : null;
        const imageUrl = decodedImage ? decodedImage.split('?')[0] : '';

        return {
          id: hotel.hotelID,
          type: hotel.hotelName,
          location: (hotel.city || hotel.hotelAddress || 'Unknown').trim(),
          price: "",
          nights: 2,
          rating: hotel.starCatgeory,
          occupancy: "",
          amenities: [],
          image: imageUrl,
          hotelCode: hotel.hotelCode,
          lowestRate: hotel.lowestRate || 0,
          slug: slugify(hotel.hotelName),
        };
      });

      console.log('Transformed Properties:', transformedProperties); // Debug log

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



const handleHotelClick = (slug: string) => {
  router.push(`/hotels/${slug}`);
  console.log(`Navigating to hotel with slug: ${slug}`);
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
      <Navbar />
      {/* <Header /> */}
      <HeroSection />
      {/* <div className="relative z-20 -mt-20 flex justify-center px-4">
        <SearchBar onSearch={handleSearch} />
      </div> */}
      <div className="w-full max-w-[1920px] mx-auto px-4">

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