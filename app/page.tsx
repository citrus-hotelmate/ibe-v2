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
    <div className="px-2 sm:px-4 md:px-6 p-2">
      <div className="border-t border-gray-300 mb-4 sm:mb-6"></div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold font-urbanist notranslate">{title}</h2>

        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => {
              const el = document.getElementById(`scroll-${title}`);
              if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
          >
            ‹
          </button>
          <button
            onClick={() => {
              const el = document.getElementById(`scroll-${title}`);
              if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
          >
            ›
          </button>
        </div>
      </div>

      <div
        className="w-full max-w-[1920px] mx-auto overflow-x-auto sm:overflow-x-visible scroll-smooth scrollbar-hide"
        id={`scroll-${title}`}
      >
        <div
          className="
    flex overflow-x-auto scroll-smooth scrollbar-hide
    sm:grid sm:overflow-x-visible
    sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
    gap-3 sm:gap-4
  "
        >
          {properties.map((property) => (
            <div
              key={property.id}
              className="
        flex-shrink-0 w-[42%] xs:w-[50%] sm:w-auto flex justify-center
      "
            >
              <HotelCard
                title={property.type}
                location={property.location}
                image={property.image}
                rating={property.rating}
                price={property.lowestRate}
                onClick={() => onHotelClick(property.slug)}
              />
            </div>
          ))}
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




  const [allHotels, setAllHotels] = useState<Hotel[]>([]);

  // Fetch all hotels once
  useEffect(() => {
    const fetchInitialHotels = async () => {
      setLoading(true);
      try {
        const hotels = await getAllHotels({ token: process.env.NEXT_PUBLIC_ACCESS_TOKEN || '' });
        setAllHotels(hotels);
        filterAndSetHotels(hotels, '', '');
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialHotels();
  }, []);

  // Filter hotels whenever user types
  const filterAndSetHotels = (hotels: Hotel[], city: string, hotelName: string) => {
    const filtered = hotels.filter(hotel => {
      const hotelCity = (hotel.city || '').toLowerCase();
      const hotelNameLower = hotel.hotelName.toLowerCase();

      const cityMatch = city ? hotelCity.startsWith(city.toLowerCase()) : true;
      const hotelMatch = hotelName ? hotelNameLower.includes(hotelName.toLowerCase()) : true;

      return cityMatch && hotelMatch;
    });

    const transformed = filtered.map(hotel => ({
      id: hotel.hotelID,
      type: hotel.hotelName,
      location: hotel.city || hotel.hotelAddress || 'Unknown',
      rating: hotel.starCatgeory,
      image: hotel.hotelImage?.imageFileName || '',
      hotelCode: hotel.hotelCode,
      lowestRate: hotel.lowestRate || 0,
      slug: slugify(hotel.hotelName),
    }));

    // Group by city
    const grouped: { [key: string]: PropertyListing[] } = {};
    transformed.forEach(prop => {
      const cityKey = prop.location || 'Unknown';
      if (!grouped[cityKey]) grouped[cityKey] = [];
      grouped[cityKey].push(prop);
    });

    setPropertiesByCity(grouped);
  };

  const handleSearch = (city: string, hotel: string) => {
    filterAndSetHotels(allHotels, city, hotel);
    setSearchParams({
      destination: city,
      hotelName: hotel,
      searchType:
        city && hotel
          ? "both"
          : city
            ? "destinations"
            : hotel
              ? "hotel name"
              : "none",
    });
  };


  useEffect(() => {
    fetchHotels();
  }, []);

  const filterHotels = (hotels: Hotel[], params: SearchParams): Hotel[] => {
    const city = params.destination.toLowerCase().trim();
    const hotelName = params.hotelName.toLowerCase().trim();

    return hotels.filter((hotel) => {
      const hotelCity = (hotel.city || '').toLowerCase();
      const hotelCountry = (hotel.country || '').toLowerCase();
      const hotelFullLocation = `${hotelCity} ${hotelCountry}`.trim();
      const hotelNameLower = hotel.hotelName.toLowerCase();

      // Case 1: City only
      if (city && !hotelName) {
        return hotelCity === city; // exact city match
      }

      // Case 2: Hotel name only
      if (!city && hotelName) {
        return hotelNameLower.includes(hotelName);
      }

      // Case 3: Both city and hotel name
      if (city && hotelName) {
        return hotelCity === city && hotelNameLower.includes(hotelName);
      }

      // Case 4: Nothing entered
      return true;
    });
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
    window.open(`/hotels/${slug}`, '_blank', 'noopener,noreferrer');
    console.log(`Opening hotel with slug in new tab: ${slug}`);
  };




  return (
    <main className="min-h-screen bg-[#e2e0df]">
      <Navbar />
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8">


        <SearchBar onSearch={handleSearch} />

        {loading ? (
          <div className="flex justify-center items-center py-10 sm:py-20">
            <div className="text-base sm:text-lg text-gray-600">Loading hotels...</div>
          </div>
        ) : Object.keys(propertiesByCity).length === 0 ? (
          <div className="flex justify-center items-center py-10 sm:py-20 px-4">
            <div className="text-base sm:text-lg text-gray-600 font-urbanist text-center">
              {searchParams.hotelName && !searchParams.destination
                ? "No hotels found matching your search."
                : searchParams.destination && !searchParams.hotelName
                  ? "No destination found matching your search."
                  : "No hotels or destinations found matching your search."}
            </div>
          </div>
        ) : (
          Object.entries(propertiesByCity).map(([city, properties]) => (
            <PropertyListings
              key={city}
              title={city}
              destination={city}
              properties={properties}
              onHotelClick={(slug) => window.open(`/hotels/${slug}`, '_blank')}
            />
          ))
        )}
      </div>
    </main>
  );
}