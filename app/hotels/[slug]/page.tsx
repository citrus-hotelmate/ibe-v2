"use client";

import FeaturedAccommodationCard from "@/components/featuredAccommodationCard";
import { getHotelRoomFeaturesByHotelId } from "@/controllers/hotelRoomFeatureController";
import { HotelRoomFeature } from "@/types/hotelRoomFeature";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector";
import { Hotel } from "@/types/ibe";
import { getAllHotels } from "@/controllers/ibeController";
import { ArrowRight, Star, StarHalf } from "lucide-react";
import { useBooking } from "@/components/booking-context";
import { SearchBar } from "@/components/search-bar";


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

                    if (feature.isTrue && feature.roomFeature) {
                        const room = roomMap.get(roomTypeId);
                        room.features.push({
                            category: feature.roomFeature.featureCategory,
                            name: feature.roomFeature.featureName,
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

    console.log("Hotel Name wwwwwwwwwww:", getHotelName());

    return (
        <div className="min-h-screen flex flex-col">
            <div className="relative z-20 text-center mt-2">
                <h1 className="font-urbanist text-[80px] md:text-[80px] 2xl:text-[100px]  tracking-tight leading-tight relative inline-block notranslate">
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

            {/* Hero Section */}
            <div className="relative h-[70vh] mx-8 mt-[-35px] mb-6 rounded-[3rem] overflow-hidden z-10">
                <Image
                    src="/rooms/hotel-room.jpg"
                    alt="Hotel Room"
                    fill
                    className="object-cover"
                    priority
                />

                {/* Subtle top glass overlay with fade-out mask */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                    <div className="w-full h-full bg-white/10 backdrop-blur-md mask-fade" />
                </div>

                {/* Google Translate Language Selector */}
                <div className="absolute top-4 right-4 z-40">
                    <LanguageSelector />
                </div>
            </div>

            {/* Search Bar */}
            <div className="mx-auto px-4 -mt-16 relative z-30 mb-0 max-w-5xl w-full">
                <SearchBar onSearch={(destination, hotelName) => {
                    console.log('Search triggered with:', destination, hotelName);
                }} />
            </div>

            {/* Travel & Experiences Tabs */}
            <div className="mx-auto max-w-5xl w-full mt-16 text-center">
                <h2 className="font-urbanist text-lg md:text-xl  mb-4">
                    Seamless travel & experiences
                </h2>
                <div className="flex justify-center space-x-2 bg-neutral-100 rounded-full p-1 max-w-md mx-auto">
                    {["Flights", "Trains", "Bus & Travel", "Activity"].map((tab, index) => (
                        <button
                            key={index}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                tab === "Activity"
                                    ? "bg-white text-black shadow"
                                    : "text-neutral-500 hover:text-black"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Featured Accommodations */}
            <div className="container mx-auto px-4 py-10">
                <div className="text-center mb-12">
                    <h2 className="font-urbanist text-xl md:text-3xl lg:text-3xl font-semi-bold tracking-tight text-foreground">
                        Featured Accommodation
                    </h2>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,_minmax(270px,_1fr))] gap-3">
                    {featuredRooms.length > 0 && (
                        featuredRooms.map((room) => (
                            <div key={room.id} className="flex justify-center">
                                <FeaturedAccommodationCard
                                    room={room}
                                    renderStarRating={renderStarRating}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
