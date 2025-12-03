"use client";

import Link from "next/link";
import FeaturedAccommodationCard from "@/components/featuredAccommodationCard";
import Navbar from "@/components/navbar";
import { getHotelRatePlanAvailability } from "@/controllers/hotelRatePlansController";
import { getHotelImagesByHotelId } from "@/controllers/hotelImageController";
import { getHotelRoomTypeImagesByHotelId } from "@/controllers/hotelRoomTypeImageController";
import { HotelImage } from "@/types/hotelImage";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector";
import { Hotel } from "@/types/ibe";
import { getAllHotels } from "@/controllers/ibeController";
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin, Star, StarHalf } from "lucide-react";
import HotelMap from "@/components/hotel-map";
import { useBooking } from "@/components/booking-context";
import { RoomSearchBar } from "@/components/room-searchbar";
import PropertyPage from "@/components/property-component";

const generateHotelSlug = (hotelName: string, city: string) => {
  const slugify = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };
  return `${slugify(hotelName)}-${slugify(city)}`;
};

const normalizeSlug = (raw?: string | null, hotelName?: string, city?: string) => {
  if (!raw || !raw.trim()) {
    return hotelName && city ? generateHotelSlug(hotelName, city) : "";
  }
  let s = raw.trim();
  if (/^https?:\/\//i.test(s)) {
    try { s = new URL(s).pathname; } catch { }
  }
  s = s.replace(/^\/?hotels\//i, "").replace(/^\/+|\/+$/g, "");
  const parts = s.split("/").filter(Boolean);
  s = parts[parts.length - 1] || s;
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "");
};

export default function LandingPage() {
  const params = useParams();
  const rawParam = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const slug = normalizeSlug(rawParam || "");
  const router = useRouter();
  const { bookingDetails, updateBookingDetails } = useBooking();
  const [headerColor, setHeaderColor] = useState("#792868");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedColor = localStorage.getItem("ibeHeaderColour");
    if (storedColor) {
      setHeaderColor(storedColor);
    }
  }, []);
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [hotelImages, setHotelImages] = useState<HotelImage[]>([]);
  const [roomTypeImages, setRoomTypeImages] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showWishlist, setShowWishlist] = useState(false);

  // Track window width for responsive grid calculations
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Define featured row ID for scrolling
  const featuredRowId = "featured-rooms-row";

  // Function to handle scrolling of featured cards
  const scrollByFeaturedCards = (direction: "left" | "right") => {
    const container = document.getElementById(featuredRowId);
    if (!container) return;

    const scrollAmount = 300; // Adjust this value based on your needs
    const scrollPosition = direction === "left"
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: scrollPosition,
      behavior: "smooth"
    });
  };

  // Listen to window resize for grid calculations
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Combined fetch function for all hotel data
  const fetchAllHotelData = async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
      const hotelsData = await getAllHotels({ token });

      // 1) Try matching normalized API slug to normalized route slug
      let matchedHotel =
        hotelsData.find((h) => normalizeSlug(h.slug, h.hotelName, h.city) === slug)
        // 2) Fallback: generated slug (hotelName-city)
        || hotelsData.find((h) => generateHotelSlug(h.hotelName, h.city) === slug);

      // 3) Fallback: numeric ID in path
      if (!matchedHotel) {
        const hotelId = parseInt(slug, 10);
        if (!Number.isNaN(hotelId)) {
          matchedHotel = hotelsData.find((h) => h.hotelID === hotelId);
        }
      }

      if (!matchedHotel) {
        setError("Hotel not found");
        return;
      }

      console.log("✅ Found hotel:", matchedHotel.hotelName, "in", matchedHotel.city);

      // Save hotel name and image to local storage
      const hotelToSave = {
        name: matchedHotel.hotelName,
        image: matchedHotel.hotelImage?.base64Image || null,
        // Store additional hotel details that might be useful
        id: matchedHotel.hotelID,
        city: matchedHotel.city,
        rating: matchedHotel.starCatgeory
      };
      localStorage.setItem('selectedHotel', JSON.stringify(hotelToSave));

      setCurrentHotel(matchedHotel);

      // Parallel fetch for rate plans, hotel images, and room type images
      const [ratePlansData, imagesData, roomTypeImagesData] = await Promise.all([
        getHotelRatePlanAvailability({
          token,
          hotelId: matchedHotel.hotelID,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rateCodeId: 2
        }),
        getHotelImagesByHotelId({ token, hotelId: matchedHotel.hotelID }),
        getHotelRoomTypeImagesByHotelId({ hotelId: matchedHotel.hotelID, token })
      ]);

      // Process room type images
      const roomTypeImagesMap = roomTypeImagesData.reduce((acc: Record<number, string>, img) => {
        // Check if it's the main image and has a URL
        if (img.hotelRoomTypeID && img.isMain && img.imageURL) {
          // Trim the URL to remove query parameters
          const trimmedUrl = img.imageURL.split('?')[0];
          acc[img.hotelRoomTypeID] = trimmedUrl;
        }
        return acc;
      }, {});
      setRoomTypeImages(roomTypeImagesMap);

      // Process rate plans data to create featured rooms
      const roomMap = new Map<number, any>();
      ratePlansData.forEach((ratePlan: any) => {
        const roomTypeId = ratePlan.roomTypeId;
        if (!roomMap.has(roomTypeId)) {
          roomMap.set(roomTypeId, {
            id: roomTypeId,
            name: ratePlan.roomType,
            adultCapacity: ratePlan.adultCount,
            childCapacity: ratePlan.childCount,
            totalRooms: 10, // Mock total rooms
            image: roomTypeImagesMap[roomTypeId] || '/placeholder.svg?height=300&width=500',
            features: [],
            price: parseFloat((ratePlan.averageRate || 0).toFixed(2)),
          });
        }
      });

      // Update state with all fetched data
      setFeaturedRooms(Array.from(roomMap.values()));
      setHotelImages(imagesData.filter(img => !img.isMain));

    } catch (error) {
      console.error("Error fetching hotel data:", error);
      setError("Failed to fetch hotel details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHotelData();
  }, [slug]);

  // Function to refetch featured rooms with new dates
  const refetchFeaturedRooms = async (checkIn: string, checkOut: string) => {
    if (!currentHotel?.hotelID) return;
    
    try {
      setIsLoading(true);
      const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
      
      const ratePlansData = await getHotelRatePlanAvailability({
        token,
        hotelId: currentHotel.hotelID,
        startDate: checkIn,
        endDate: checkOut,
        rateCodeId: 2
      });

      // Process rate plans data to create featured rooms
      const roomMap = new Map<number, any>();
      ratePlansData.forEach((ratePlan: any) => {
        const roomTypeId = ratePlan.roomTypeId;
        if (!roomMap.has(roomTypeId)) {
          roomMap.set(roomTypeId, {
            id: roomTypeId,
            name: ratePlan.roomType,
            adultCapacity: ratePlan.adultCount,
            childCapacity: ratePlan.childCount,
            totalRooms: 10, 
            image: roomTypeImages[roomTypeId] || '/placeholder.svg?height=300&width=500',
            features: [],
            price: parseFloat((ratePlan.averageRate || 0).toFixed(2)),
          });
        }
      });

      setFeaturedRooms(Array.from(roomMap.values()));
    } catch (error) {
      console.error("Error refetching featured rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

// Room data is now fetched in fetchAllHotelData using getHotelRatePlanAvailability







// Get hotel data from local state
const getHotelData = () => {
  return currentHotel;
};

// Get hotel name with fallback
const getHotelName = () => {
  if (isLoading) return "Loading...";
  const hotel = getHotelData();
  return hotel?.hotelName || "Hotel Name Unavailable";
};

// Components for orange card
const HotelNameDisplay = ({ name }: { name: string }) => (
  <h3 className="text-2xl font-bold font-urbanist">{name}</h3>
);

const HotelDescriptionDisplay = ({
  description,
}: {
  description: string;
}) => <p className="text-base font-urbanist mt-1">{description}</p>;

return (
  <div
    className="min-h-screen flex flex-col"
    style={{ backgroundColor: "#e2e0df" }}
  >
    {/* ✅ Navbar goes here */}
    <Navbar
      showWishlist={showWishlist}
      onToggleWishlistAction={() => setShowWishlist(!showWishlist)}
    />
    {/* Hotel Name Section */}
    <div className="relative z-20 text-center sm:mt-8 md:mt-10 px-4">
      <h1 className="font-urbanist text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[80px] 2xl:text-[100px] tracking-tight leading-tight relative inline-block notranslate">
        {/* Unblurred main text */}
        <span className="relative z-10 block">{getHotelName()}</span>
        {/* Blurred overlay showing only bottom 25% */}
        <span className="absolute inset-0 z-20 blur-overlay pointer-events-none">
          {getHotelName()}
        </span>
      </h1>
    </div>

    {/* Hero + SearchBar Wrapper */}
    <div className="relative w-full flex flex-col items-center mt-2">
      {/* Hero Section */}
      {(() => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const scrollRefLocal = useRef<HTMLDivElement>(null);
        const [hotelImages, setHotelImages] = useState<HotelImage[]>([]);

        useEffect(() => {
          const fetchHotelImages = async () => {
            try {
              if (!currentHotel?.hotelID) return;

              console.log("Fetching images for hotel:", currentHotel.hotelName);

              const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
              const response = await getHotelImagesByHotelId({
                token,
                hotelId: currentHotel.hotelID
              });

              console.log("Hotel images response:", response);

              // ✅ Prefer isMain, else take the first image
              let images: HotelImage[] = [];
              const mainImage = response.find(img => img.isMain);

              if (mainImage) {
                images = response; // keep all, hero will naturally start with isMain
              } else if (response.length > 0) {
                images = [response[0], ...response.slice(1)]; // first image + rest
              }

              setHotelImages(images);
            } catch (error) {
              console.error("Error fetching hotel images:", error);
            }
          };

          fetchHotelImages();
        }, [currentHotel]);

        console.log("Fetched hotel images:", hotelImages);

        const handleNext = () => {
          if (hotelImages.length === 0) return;
          setCurrentIndex((prev) => (prev + 1) % hotelImages.length);
        };

        // NEW: go left (wrap around)
        const handlePrev = () => {
          if (hotelImages.length === 0) return;
          setCurrentIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
        };

        if (hotelImages.length === 0) {
          // When no images, add spacing to prevent hotel name overlap with search bar
          return (
            <div className="w-full sm:h-[2vh] md:h-[2vh] max-w-[98rem] mx-auto mb-4 sm:mb-6">
              {/* Empty spacer div to prevent overlap */}
            </div>
          );
        }
        // --- Scroll helpers for Featured Accommodation row ---
        const featuredRowId = "featured-scroll";

        const scrollByFeaturedCards = (dir: "left" | "right") => {
          const row = document.getElementById(featuredRowId);
          if (!row) return;
          const first = row.querySelector<HTMLElement>("[data-card]");
          const step = first ? first.offsetWidth + 16 /* gap-4 */ : 320;
          row.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
        };

        return (
          <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] max-w-[98rem] w-full mx-auto mt-[-10px] sm:mt-[-25px] md:mt-[-22px] mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl md:rounded-[3rem] overflow-hidden z-15 group">
            <div
              ref={scrollRefLocal}
              className="flex h-full w-full transition-transform duration-500"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {hotelImages.map((img, index) => (
                <div key={index} className="flex-shrink-0 w-full h-full">
                  <Image
                    src={img.imageFileName}
                    alt={img.description || `Hotel Image ${index + 1}`}
                    width={1600}
                    height={700}
                    className="object-cover w-full h-full"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
            {/* Left arrow */}
            <button
              onClick={handlePrev}
              className="hidden md:group-hover:flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-2 sm:left-4"
              aria-label="Previous image"
            >
              <ArrowLeft className="text-white w-6 h-6 sm:w-8 sm:h-8 drop-shadow-lg" />
            </button>

            {/* Right arrow (existing) */}
            <button
              onClick={handleNext}
              className="hidden md:group-hover:flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-2 sm:right-4"
              aria-label="Next image"
            >
              <ArrowRight className="text-white w-6 h-6 sm:w-8 sm:h-8 drop-shadow-lg" />
            </button>

            {/* Subtle top glass overlay with fade-out mask */}
            <div className="absolute inset-0 z-30 pointer-events-none">
              <div className="w-full h-full bg-white/10" />
            </div>

          </div>
        );
      })()}

      {/* Floating Search Bar */}
      <div className="absolute -bottom-[4px] sm:-bottom-[7px] w-full max-w-5xl px-2 sm:px-4 z-40 drop-shadow-xl">
        <RoomSearchBar
          onSearch={(checkIn, checkOut, adults, children, rooms) => {
            console.log("Search triggered with:", checkIn, checkOut, adults, children, rooms);
            // Refetch featured rooms with new dates to get updated rates
            refetchFeaturedRooms(checkIn, checkOut);
          }}
        />
      </div>
    </div>

    {/* Featured Accommodations */}
    <div className="w-full flex justify-center py-6 sm:py-8 md:py-10 px-2 sm:px-4">
      <div className="w-full max-w-[98rem]">
        {/* Header + scroll buttons */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
          <h2 className="font-urbanist text-lg sm:text-xl md:text-2xl lg:text-3xl font-semi-bold tracking-tight text-foreground text-center w-full">
            Featured Accommodation
          </h2>

          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scrollByFeaturedCards("left")}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: headerColor }}
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              onClick={() => scrollByFeaturedCards("right")}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: headerColor }}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </div>

        {featuredRooms.length > 0 && (
          <div
            id={featuredRowId}
            className="flex gap-4 px-4 pb-2 w-full overflow-x-auto scroll-smooth scrollbar-hide"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {/* Room cards */}
            {featuredRooms.map((room) => (
              <div key={room.id} data-card className="w-[252px] flex-shrink-0">
                <FeaturedAccommodationCard room={room} />
              </div>
            ))}

            {/* Orange Card */}
            <div
              className={`rounded-[3rem] text-white shadow-md overflow-hidden flex flex-col justify-between p-6 font-urbanist relative transition-all duration-300 ${featuredRooms.length <= 2
                ? "flex-1 min-w-[300px] max-w-[800px]"
                : "w-[252px] flex-shrink-0"
                }`}
              style={{ backgroundColor: headerColor }}
            >
              <div className="self-start">
                <h3 className="text-xl lg:text-2xl font-bold font-urbanist">
                  {getHotelName()}
                </h3>
                <div
                  className="text-sm lg:text-base font-urbanist mt-1 overflow-y-auto max-h-60 lg:max-h-62 pr-1 scrollbar-hide"
                  style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
                >
                  {getHotelData()?.hotelDesc || "Your perfect stay awaits"}
                </div>
              </div>
              <div className="absolute bottom-4 right-4 rounded-full bg-white w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: headerColor }} />
              </div>
            </div>

            {/* Map Card */}
            <div
              className={`rounded-[3rem] bg-[#4285F4] text-white shadow-md overflow-hidden flex flex-col justify-between font-urbanist relative transition-all duration-300 ${featuredRooms.length <= 2
                ? "flex-1 min-w-[300px] max-w-[800px]"
                : "w-[252px] flex-shrink-0"
                }`}
            >
              <div className="h-full relative">
                <div className="absolute top-0 left-0 w-full p-4 z-10 ">
                  <div className="flex items-center mb-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <h3 className="text-lg font-bold font-urbanist">
                      {getHotelData()?.city || "Location"}
                    </h3>
                  </div>
                </div>
                <div className="w-full h-full min-h-[220px]">
                  <HotelMap
                    latitude={getHotelData()?.latitude || ""}
                    longitude={getHotelData()?.longitude || ""}
                    hotelName={getHotelData()?.hotelName || ""}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    {/* Property Page Integration */}
    <div className="mt-2 flex justify-center">
      <div className="w-full max-w-[98rem]">
        <PropertyPage />
      </div>
    </div>
  </div>
);
}
