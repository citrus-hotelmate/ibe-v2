"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import Navbar from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { useCurrency } from "@/components/currency-context";
import { CurrencySelector } from "@/components/currency-selector";
import { getAllHotels } from "@/controllers/ibeController";
import HotelCard from "@/components/hotelCards";
import { Hotel as HotelIcon } from "lucide-react";
import { useRef } from "react";
import { Hotel } from "@/types/ibe";

interface PropertyListing {
  id: number;
  /** Hotel name */
  type: string;
  /** City or address (displayed under card) */
  location: string;
  rating: number;
  image: string;
  hotelCode: number;
  lowestRate: number;
  slug: string;
  /** NEW: used for grouping when destination is searched */
  hotelType: string;
}

interface SearchParams {
  destination: string;
  hotelName: string;
  hotelType: string;
  searchType: "destinations" | "hotel name" | "both" | "none" | "all" | "destination-type" | "hotel-type" | "hotel type";
}

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const titleCase = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, (m) => m.toUpperCase());

/** The horizontally scrollable row with buttons (unchanged) */
function PropertyListings({
  title,
  destination,
  properties,
  onHotelClick,
}: {
  title: string;
  destination: string;
  properties: PropertyListing[];
  onHotelClick: (slug: string) => void;
}) {
  const rowId = `scroll-${slugify(title)}`;

  const scrollByCards = (dir: "left" | "right") => {
    const row = document.getElementById(rowId);
    if (!row) return;
    const first = row.querySelector<HTMLElement>("[data-card]");
    const step = first ? first.offsetWidth + 16 : 320; // 16 = gap
    row.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <div className="px-2 sm:px-4 md:px-6 p-2">
      <div className="border-t border-gray-300 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold font-urbanist notranslate">
            {title}
          </h2>

          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scrollByCards("left")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              onClick={() => scrollByCards("right")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto">
        <div
          id={rowId}
          className="
            flex overflow-x-auto scroll-smooth scrollbar-hide
            gap-3 sm:gap-4
            snap-x snap-mandatory
          "
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {properties.map((property: PropertyListing) => (
            <div
              key={property.id}
              data-card
              className="
                flex-shrink-0 w-[42%] xs:w-[50%] sm:w-auto
                flex justify-center overflow-hidden
                snap-start
              "
            >
              <HotelCard
                title={property.type}
                location={property.location}
                image={property.image}
                rating={property.rating}
                price={property.lowestRate}
                hotelType={property.hotelType}
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
  const { convertPrice, formatPrice, currency } = useCurrency();

  // Grouped sections. Key is a readable title ("Hotels in Colombo" OR "Colombo")
  const [groupedSections, setGroupedSections] = useState<{
    [sectionTitle: string]: PropertyListing[];
  }>({});

  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    destination: "",
    hotelName: "",
    hotelType: "",
    searchType: "none",
  });

  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Fetch all hotels once
  useEffect(() => {
    const fetchInitialHotels = async () => {
      setLoading(true);
      try {
        const hotels = await getAllHotels({
          token: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
        });
        setAllHotels(hotels);
        // initial: no destination => group by city (current behavior)
        groupAndSet(hotels, "", "", "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialHotels();
  }, []);

  // Handle scroll to show/hide sticky search bar
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (searchBarRef.current) {
            const searchBarBottom = searchBarRef.current.getBoundingClientRect().bottom;
            setShowStickySearch(searchBarBottom < -20); // Add slight offset for better UX
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /** Core filter */
  const filterHotels = (hotels: Hotel[], params: SearchParams): Hotel[] => {
    const city = params.destination.toLowerCase().trim();
    const hotelName = params.hotelName.toLowerCase().trim();
    const hotelType = params.hotelType.toLowerCase().trim();

    return hotels.filter((hotel) => {
      const hotelCity = (hotel.city || "").toLowerCase().trim();
      const hotelNameLower = (hotel.hotelName || "").toLowerCase();
      const hotelTypeLower = (hotel.hotelType || "").toLowerCase();

      // Apply individual filters
      let matches = true;

      // City filter
      if (city) {
        matches = matches && hotelCity.startsWith(city);
      }

      // Hotel name filter
      if (hotelName) {
        matches = matches && hotelNameLower.includes(hotelName);
      }

      // Hotel type filter
      if (hotelType) {
        matches = matches && hotelTypeLower.includes(hotelType);
      }

      return matches;
    });
  };

  /** Transform to your PropertyListing */
  const transform = (hotel: Hotel): PropertyListing => {
    const rawImage = hotel.hotelImage?.imageFileName;
    const decodedImage =
      rawImage && hotel.hotelImage?.isMain ? decodeURIComponent(rawImage) : null;
    const imageUrl = decodedImage ? decodedImage.split("?")[0] : "";

    return {
      id: hotel.hotelID,
      type: hotel.hotelName, // card title (unchanged)
      location: (hotel.city || hotel.hotelAddress || "Unknown").trim(),
      rating: hotel.starCatgeory,
      image: imageUrl,
      hotelCode: hotel.hotelCode,
      lowestRate: hotel.lowestRate || 0,
      slug: slugify(hotel.hotelName),
      hotelType: titleCase(hotel.hotelType || "Other"),
    };
  };

  /** Grouping logic:
   *  - If a destination (city) is provided → group by hotelType with section titles like "Hotels in Colombo"
   *  - Otherwise → group by City (current behavior)
   */
  const groupAndSet = (hotels: Hotel[], city: string, hotelName: string, hotelType: string = '') => {
    const filtered = filterHotels(hotels, {
      destination: city,
      hotelName,
      hotelType,
      searchType: "none",
    });

    const transformed = filtered.map(transform);

    const grouped: { [sectionTitle: string]: PropertyListing[] } = {};
    const hasCity = !!city.trim();
    const hasHotelType = !!hotelType.trim();

    if (hasCity) {
      const prettyCity = titleCase(city);
      if (hasHotelType) {
        // If both city and hotel type are specified, group by hotel type in that city
        const sectionTitle = `${hotelType}s in ${prettyCity}`;
        grouped[sectionTitle] = transformed;
      } else {
        // Group by different hotel types in the city
        transformed.forEach((prop) => {
          const type = prop.hotelType || "Other";
          const plural =
            type.toLowerCase().endsWith("s") ? type : `${type}s`; // e.g., Villa -> Villas
          const sectionTitle = `${plural} in ${prettyCity}`;
          if (!grouped[sectionTitle]) grouped[sectionTitle] = [];
          grouped[sectionTitle].push(prop);
        });
      }
    } else if (hasHotelType) {
      // If only hotel type is specified, group by cities with that hotel type
      transformed.forEach((prop) => {
        const cityKey = prop.location || "Unknown";
        const sectionTitle = `${hotelType}s in ${cityKey}`;
        if (!grouped[sectionTitle]) grouped[sectionTitle] = [];
        grouped[sectionTitle].push(prop);
      });
    } else {
      // Fallback: group by city (as before)
      transformed.forEach((prop) => {
        const cityKey = prop.location || "Unknown";
        if (!grouped[cityKey]) grouped[cityKey] = [];
        grouped[cityKey].push(prop);
      });
    }

    setGroupedSections(grouped);
  };

  /** Called by SearchBar */
  const handleSearch = (city: string, hotel: string, hotelType: string = '') => {
    groupAndSet(allHotels, city, hotel, hotelType);
    setSearchParams({
      destination: city,
      hotelName: hotel,
      hotelType,
      searchType:
        city && hotel && hotelType
          ? "all"
          : city && hotel
            ? "both"
            : city && hotelType
              ? "destination-type"
              : hotel && hotelType
                ? "hotel-type"
                : city
                  ? "destinations"
                  : hotel
                    ? "hotel name"
                    : hotelType
                      ? "hotel type"
                      : "none",
    });
  };

  // (Optional) refresh list on mount the older way — now delegated to initial effect

  const handleHotelClick = (slug: string) => {
    window.open(`/hotels/${slug}`, "_blank", "noopener,noreferrer");
    console.log(`Opening hotel with slug in new tab: ${slug}`);
  };

  return (
    <main className="min-h-screen bg-[#e2e0df]">
      <Navbar />

      {/* Sticky Search Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-[100] bg-[#e2e0df]/95 backdrop-blur-sm shadow-lg border-b border-gray-200 transition-all duration-500 ease-out transform ${showStickySearch
            ? 'translate-y-0 opacity-100 scale-100'
            : '-translate-y-full opacity-0 scale-95 pointer-events-none'
          }`}
        style={{
          transitionTimingFunction: showStickySearch
            ? 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'cubic-bezier(0.55, 0.06, 0.68, 0.19)'
        }}
      >
        <div className={`w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 transition-all duration-300 ease-out ${showStickySearch ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <div className={`w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 transition-all duration-500 ease-out ${showStickySearch ? 'pt-20 sm:pt-24' : ''}`}>
        <div ref={searchBarRef} className="py-6">
          <SearchBar onSearch={handleSearch} />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10 sm:py-20">
            <div className="text-base sm:text-lg text-gray-600">
              Loading hotels...
            </div>
          </div>
        ) : Object.keys(groupedSections).length === 0 ? (
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
          Object.entries(groupedSections).map(([sectionTitle, properties]) => (
            <PropertyListings
              key={sectionTitle}
              title={sectionTitle}
              destination={sectionTitle}
              properties={properties}
              onHotelClick={(slug) => window.open(`/hotels/${slug}`, "_blank")}
            />
          ))
        )}
      </div>
    </main>
  );
}