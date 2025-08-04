"use client";

import Link from "next/link"
import FeaturedAccommodationCard from "@/components/featuredAccommodationCard";
import Navbar from "@/components/navbar";
import { getHotelRoomFeaturesByHotelId } from "@/controllers/hotelRoomFeatureController";
import { HotelRoomFeature } from "@/types/hotelRoomFeature";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector";
import { Hotel } from "@/types/ibe";
import { getAllHotels } from "@/controllers/ibeController";
import { ArrowRight, ArrowUpRight, Star, StarHalf } from "lucide-react";
import { useBooking } from "@/components/booking-context";
import { RoomSearchBar } from "@/components/room-searchbar";
import PropertyPage from "@/components/propertyPage";


const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function LandingPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const router = useRouter();
  const { bookingDetails, updateBookingDetails } = useBooking();
  const [hotelData, setHotelData] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roomFeatures, setRoomFeatures] = useState<HotelRoomFeature[]>([]);
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  // Track window width for responsive grid calculations
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 0);
  // Listen to window resize for grid calculations
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Removed auto-scrolling and transition effect for hero image carousel.

  useEffect(() => {
    const fetchHotelInfo = async () => {
      try {
        setIsLoading(true);
        const allHotels = await getAllHotels({
          token: process.env.NEXT_PUBLIC_ACCESS_TOKEN || '',
        });

        const matchedHotel = allHotels.find(
          (h) => slugify(h.hotelName) === slug
        );

        if (matchedHotel) {
          setHotelData([matchedHotel]);
          localStorage.setItem('hotelData', JSON.stringify(matchedHotel));
        }
      } catch (error) {
        console.error("Error fetching hotel by slug:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchHotelInfo();
    }
  }, [slug]);

  console.log('hotel hotelDate', hotelData)

  // Fetch room features and images
  useEffect(() => {
    const fetchRoomFeatures = async () => {
      try {
        const storedHotelData = localStorage.getItem('hotelData');
        if (!storedHotelData) return;

        const parsedHotel = JSON.parse(storedHotelData);
        const hotelId = parsedHotel?.hotelID;
        console.log("Fetching room features for hotel ID:", hotelId);

        if (!hotelId) return;

        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '';
        const data = await getHotelRoomFeaturesByHotelId(hotelId, token);
        console.log("Fetched room features:", data);
        setRoomFeatures(data);

        // Process the data to create featured rooms
        const roomMap = new Map<number, any>();

        data.forEach((feature) => {
          const roomTypeId = feature.hotelRoomTypeID;

          if (!roomMap.has(roomTypeId)) {
            const mainImage = feature.hotelRoomTypeImage?.find(img => img.isMain) ||
              feature.hotelRoomTypeImage?.[0];

            roomMap.set(roomTypeId, {
              id: roomTypeId,
              name: feature.hotelRoomType.roomType,
              adultCapacity: feature.hotelRoomType.adultSpace,
              childCapacity: feature.hotelRoomType.childSpace,
              totalRooms: feature.hotelRoomType.noOfRooms,
              image: mainImage?.imageURL || mainImage?.base64Image,
              features: [],
              price: generateMockPrice(feature.hotelRoomType.roomType, feature.hotelRoomType.adultSpace),
              rating: generateMockRating(),
            });
          }
        });

        // Remove allowedRoomTypeIds filter to display all rooms
        const filteredRooms = Array.from(roomMap.values());

        console.log("Filtered rooms:", filteredRooms);
        setFeaturedRooms(filteredRooms);
      } catch (err) {
        console.error("Error fetching room features:", err);
      }
    };

    fetchRoomFeatures();
  }, []);

  console.log("Featured Rooms:", featuredRooms);

  // Helper function to generate mock prices based on room type
  const generateMockPrice = (roomType: string, adultSpace: number): number => {
    const basePrice = 150;
    const typeMultiplier = roomType.toLowerCase().includes('suite') ? 1.8 :
      roomType.toLowerCase().includes('deluxe') ? 1.5 :
        roomType.toLowerCase().includes('premium') ? 1.3 : 1.0;
    const capacityMultiplier = adultSpace > 2 ? 1.2 : 1.0;
    return Math.round(basePrice * typeMultiplier * capacityMultiplier);
  };

  // Helper function to generate mock ratings
  const generateMockRating = (): number => {
    return Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-current text-primary" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-current text-primary" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />);
    }

    return stars;
  };


  // Get hotel name with fallback
  const getHotelName = () => {
    if (isLoading) return "Loading...";
    if (!hotelData || !Array.isArray(hotelData)) return "Hotel Name Unavailable";
    return hotelData[0]?.hotelName || "Hotel Name Unavailable";
  };

  // Components for orange card
  const HotelNameDisplay = ({ name }: { name: string }) => (
    <h3 className="text-2xl font-bold font-urbanist">{name}</h3>
  );

  const HotelDescriptionDisplay = ({ description }: { description: string }) => (
    <p className="text-base font-urbanist mt-1">{description}</p>
  );

  console.log("Hotel Name wwwwwwwwwww:", getHotelName());

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#e2e0df" }}>
      {/* <Navbar /> */}
      {/* Logo - stays at the top-left */}
      <div className="absolute left-4 sm:left-8 lg:left-12 top-4 sm:top-8 lg:top-12 flex items-center z-30">
        <Link href="/">
          <Image
            src="/logo-01.png"
            alt="Logo"
            width={130}
            height={60}
            className="rounded-md h-auto w-20 sm:w-24 md:w-28 lg:w-[130px]"
          />
        </Link>
      </div>
      {/* Hotel Name Section */}
      <div className="relative z-20 text-center mt-6 sm:mt-8 md:mt-10 px-4">
        <h1 className="font-urbanist text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[80px] 2xl:text-[100px] tracking-tight leading-tight relative inline-block notranslate">
          {/* Unblurred main text */}
          <span className="relative z-10 block">
            {getHotelName()}
          </span>
          {/* Blurred overlay showing only bottom 25% */}
          <span className="absolute inset-0 z-20 blur-overlay pointer-events-none">
            {getHotelName()}
          </span>
        </h1>
      </div>

      {/* Hero + SearchBar Wrapper */}
      <div className="relative w-full flex flex-col items-center">

        {/* Hero Section */}
        {(() => {
          // Carousel images
          const images = [
            "/rooms/gary-meulemans-aAgFJnedkJc-unsplash.jpg",
            "/rooms/hotel-room.jpg",
            "/rooms/khanh-do-bvN15iQgqog-unsplash.jpg",
            "/rooms/yosuke-ota-0R1GMsc2E7w-unsplash.jpg",
            "/rooms/yu-yi-tsai-UX_Pn1L2FkQ-unsplash.jpg"
          ];
          const [currentIndex, setCurrentIndex] = useState(0);
          const scrollRefLocal = useRef<HTMLDivElement>(null);
          const handleNext = () => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
          };
          return (
            <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] max-w-[98rem] w-full mx-auto mt-[-20px] sm:mt-[-25px] md:mt-[-22px] mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl md:rounded-[3rem] overflow-hidden z-15 group">
              <div
                ref={scrollRefLocal}
                className="flex h-full w-full transition-transform duration-500"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {images.map((img, index) => (
                  <div key={index} className="flex-shrink-0 w-full h-full">
                    <Image
                      src={img}
                      alt={`Hotel Image ${index + 1}`}
                      width={1600}
                      height={700}
                      className="object-cover w-full h-full"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleNext}
                className="hidden md:group-hover:flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-2 sm:right-4"
              >
                <ArrowRight className="text-white w-6 h-6 sm:w-8 sm:h-8 drop-shadow-lg" />
              </button>

              {/* Subtle top glass overlay with fade-out mask */}
              <div className="absolute inset-0 z-30 pointer-events-none">
                <div className="w-full h-full bg-white/10 backdrop-blur-md mask-fade" />
              </div>
              {/* Google Translate Language Selector */}
              {/* <div className="absolute top-4 right-4 z-40">
                        <LanguageSelector />
                    </div> */}
            </div>
          );
        })()}

        {/* Floating Search Bar */}
        <div className="absolute -bottom-[4px] sm:-bottom-[7px] w-full max-w-5xl px-2 sm:px-4 z-40 drop-shadow-xl">
          <RoomSearchBar
            onSearch={(destination, hotelName) => {
              console.log('Search triggered with:', destination, hotelName);
            }}
          />
        </div>

      </div>

      {/* Featured Accommodations */}
      <div className="w-full flex justify-center py-6 sm:py-8 md:py-10 px-2 sm:px-4">
        <div className="w-full max-w-[98rem]">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="font-urbanist text-lg sm:text-xl md:text-2xl lg:text-3xl font-semi-bold tracking-tight text-foreground">
              Featured Accommodation
            </h2>
          </div>
          {featuredRooms.length > 0 && (
            <div className="w-full overflow-x-auto pb-4 md:overflow-hidden">
              <div className="flex gap-4 sm:gap-6 w-max md:w-full md:justify-center">
                {featuredRooms.map((room) => (
                  <div key={room.id} className="w-[252px] flex-shrink-0">
                    <FeaturedAccommodationCard room={room} />
                  </div>
                ))}

                {/* Orange Card - maintaining same width on all devices */}
                <div className="w-[252px] md:flex-grow md:min-w-[252px] rounded-[3rem] bg-[#ff9100] text-white shadow-md overflow-hidden flex flex-col justify-between p-6 font-urbanist relative transition-all duration-300 flex-shrink-0">
                  <div className="self-start">
                    <h3 className="text-xl lg:text-2xl font-bold font-urbanist">{getHotelName()}</h3>
                    <div className="text-sm lg:text-base font-urbanist mt-1 overflow-y-auto max-h-20 lg:max-h-32 pr-1">
                      {hotelData[0]?.hotelDesc || "Your perfect stay awaits"}
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 rounded-full bg-white w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center">
                    <ArrowUpRight className="text-[#ff9100] w-6 h-6 lg:w-7 lg:h-7" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Property Page Integration */}
      <div className="mt-1 w-full mx-auto sm:px-4">
        <PropertyPage />
      </div>
    </div>
  );
}
