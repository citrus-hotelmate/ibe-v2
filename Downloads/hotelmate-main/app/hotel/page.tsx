"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
    CalendarIcon,
    Search,
    Mountain,
    Star,
    StarHalf,
    ArrowRight,
    Users,
} from "lucide-react";
import { useBooking } from "@/components/booking-context";
import { cn } from "@/lib/utils";
import { GuestSelector } from "@/components/guest-selector";
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector";

// Types for the API response
interface HotelRoomImage {
    imageID: number;
    hotelID: number;
    hotelRoomTypeID: number;
    imageURL: string;
    description: string;
    isMain: boolean;
    finAct: boolean;
    base64Image?: string;
}

interface HotelRoomType {
    hotelRoomTypeID: number;
    hotelID: number;
    roomType: string;
    adultSpace: number;
    childSpace: number;
    noOfRooms: number;
}

interface RoomFeature {
    roomFeatureID: number;
    featureCategory: string;
    featureName: string;
}

interface HotelRoomFeatureResponse {
    hotelRoomFeatureID: number;
    hotelID: number;
    roomFeatureID: number;
    roomFeature: RoomFeature;
    hotelRoomTypeID: number;
    hotelRoomType: HotelRoomType;
    isTrue: boolean;
    hotelRoomTypeImage: HotelRoomImage[];
}

export default function LandingPage() {
    const router = useRouter();
    const { bookingDetails, updateBookingDetails } = useBooking();
    const [hotelData, setHotelData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [roomFeatures, setRoomFeatures] = useState<HotelRoomFeatureResponse[]>([]);
    const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: bookingDetails.checkIn || undefined,
        to: bookingDetails.checkOut || undefined,
    });
    
    useEffect(() => {
        const fetchHotelDetails = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `https://api.hotelmate.app/api/Hotel/hotel-guid/113fcfaf-4b55-4766-913a-e04d622bcdf1`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTYwN2I5OWMtOTVhMy00YzA2LWEzMjQtOWM4ZmYyZTg0YzJlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiSWJlVXNlciIsImZ1bGxOYW1lIjoiSUJFIFVzZXIiLCJlbWFpbCI6ImliZXVzZXJAc29tZXRoaW5nLmNvbSIsIm5iZiI6MTc0ODc1NjQ2MywiZXhwIjoyNTM0MDIyODEwMDAsImlzcyI6IkhvdGVsTWF0ZUlzc3VlciIsImF1ZCI6IkhvdGVsTWF0ZU1hbmFnZXIifQ.oDMnqcxsVic1Pke47zwo3f4qyA0v6Fu6UnNDbjskST0`,
                        },
                    }
                );

                if (!res.ok) {
                    console.error(
                        "Failed to fetch hotel details:",
                        res.status,
                        res.statusText
                    );
                    setIsLoading(false);
                    return;
                }

                const data = await res.json();
                console.log("Fetched hotel data:", data);

                // Handle both array and single object responses
                const hotel = Array.isArray(data) ? data[0] : data;
                setHotelData(hotel);
                localStorage.setItem("hotelData", JSON.stringify(hotel));
            } catch (err) {
                console.error("Error during hotel fetch:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHotelDetails();
    }, []);

    // Fetch room features and images
    useEffect(() => {
        const fetchRoomFeatures = async () => {
            try {
                const res = await fetch(
                    "https://api.hotelmate.app/api/HotelRoomFeature/hotel-id/1",
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTYwN2I5OWMtOTVhMy00YzA2LWEzMjQtOWM4ZmYyZTg0YzJlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiSWJlVXNlciIsImZ1bGxOYW1lIjoiSUJFIFVzZXIiLCJlbWFpbCI6ImliZXVzZXJAc29tZXRoaW5nLmNvbSIsIm5iZiI6MTc0ODc1NjQ2MywiZXhwIjoyNTM0MDIyODEwMDAsImlzcyI6IkhvdGVsTWF0ZUlzc3VlciIsImF1ZCI6IkhvdGVsTWF0ZU1hbmFnZXIifQ.oDMnqcxsVic1Pke47zwo3f4qyA0v6Fu6UnNDbjskST0`,
                        },
                    }
                );

                if (!res.ok) {
                    console.error("Failed to fetch room features:", res.status, res.statusText);
                    return;
                }

                const data: HotelRoomFeatureResponse[] = await res.json();
                console.log("Fetched room features:", data);
                setRoomFeatures(data);

                // Process the data to create featured rooms
                const roomMap = new Map<number, any>();

                data.forEach((feature) => {
                    const roomTypeId = feature.hotelRoomTypeID;

                    if (!roomMap.has(roomTypeId)) {
                        // Find the main image or first available image
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
                            // Generate a mock price based on room type and capacity
                            price: generateMockPrice(feature.hotelRoomType.roomType, feature.hotelRoomType.adultSpace),
                            rating: generateMockRating(),
                        });
                    }

                    // Add features to the room
                    if (feature.isTrue && feature.roomFeature) {
                        const room = roomMap.get(roomTypeId);
                        room.features.push({
                            category: feature.roomFeature.featureCategory,
                            name: feature.roomFeature.featureName,
                        });
                    }
                });

                // Filter to only show specific room type IDs: 1, 7, 8, and 11
                const allowedRoomTypeIds = [1, 7, 8, 11];
                const filteredRooms = Array.from(roomMap.values()).filter(room =>
                    allowedRoomTypeIds.includes(room.id)
                );

                console.log("Filtered rooms:", filteredRooms);
                setFeaturedRooms(filteredRooms);
            } catch (err) {
                console.error("Error fetching room features:", err);
            }
        };

        fetchRoomFeatures();
    }, []);

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

    // Set default values only once on component mount
    useEffect(() => {
        // Existing logic for setting check-in/out
        if (!bookingDetails.checkIn && !bookingDetails.checkOut) {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            updateBookingDetails({
                checkIn: today,
                checkOut: tomorrow,
            });

            setDateRange({
                from: today,
                to: tomorrow,
            });
        } else if (bookingDetails.checkIn && bookingDetails.checkOut) {
            setDateRange({
                from: bookingDetails.checkIn,
                to: bookingDetails.checkOut,
            });
        }

        if (!bookingDetails.nationality) {
            updateBookingDetails({ nationality: "US" });
        }
    }, []);

    // Date range handling and search functions
    const handleDateRangeChange = (range: { from: Date | undefined; to?: Date | undefined } | undefined) => {
        if (!range) {
            setDateRange({ from: undefined, to: undefined });
            updateBookingDetails({
                selectedRooms: [],
                checkIn: null,
                checkOut: null,
            });
            return;
        }

        setDateRange(range);

        // Update booking details immediately when dates change
        updateBookingDetails({
            checkIn: range.from || null,
            checkOut: range.to || null,
        });
    };

    const handleSearchClick = () => {
        // Create comprehensive reservation summary with all current booking details
        const reservationSummary = {
            checkIn: dateRange.from || bookingDetails.checkIn,
            checkOut: dateRange.to || bookingDetails.checkOut,
            adults: bookingDetails.adults || 2,
            children: bookingDetails.children || 0,
            rooms: bookingDetails.rooms || 1,
            childAges: bookingDetails.childAges || [],
            nationality: bookingDetails.nationality || "US",
            selectedRooms: bookingDetails.selectedRooms || [],
            // Calculate nights if dates are available
            nights: (dateRange.from && dateRange.to)
                ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
                : 1
        };

        // Save to localStorage
        localStorage.setItem("reservationSummary", JSON.stringify(reservationSummary));

        // Update booking context with final state
        updateBookingDetails(reservationSummary);

        // Navigate to property page
        router.push("/property");
    };

    // Get hotel name with fallback
    const getHotelName = () => {
        if (isLoading) return "Loading...";
        if (!hotelData) return "Hotel Name Unavailable";
        return hotelData.hotelName;
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="relative z-20 text-center mt-2">
                <h1 className="text-[40px] md:text-[80px] font-extrabold tracking-tight leading-tight relative inline-block notranslate">
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
                    src="/hotel/sara-dubler-Koei_7yYtIo-unsplash.jpg"
                    alt="Peaceful Mountain Retreat"
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

            {/* Booking Search Card - ABSOLUTE NO LAYOUT SHIFT */}
            <div className="mx-auto px-4 -mt-16 relative z-30 mb-0 max-w-[700px]">
                <Card className="shadow-lg bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 w-full">
                    <CardContent className="p-4 sm:p-6">
                        {/* FIXED DIMENSIONS - ZERO LAYOUT SHIFT */}
                        <div className="w-full h-[100px] flex flex-col sm:flex-row gap-4">
                            {/* Date Range Picker - LOCKED WIDTH */}
                            <div className="flex-1 min-w-[320px] max-w-[320px]">
                                <div className="w-full h-[20px] mb-2 overflow-hidden">
                                    <label className="text-sm font-medium whitespace-nowrap">
                                        Check-in / Check-out
                                    </label>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[320px] h-[44px] justify-start text-left font-normal",
                                                !dateRange.from && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                            <div className="flex-1 overflow-hidden">
                                                <span className="block truncate">
                                                    {dateRange.from ? (
                                                        dateRange.to ? (
                                                            `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                                                        ) : (
                                                            format(dateRange.from, "MMM d, yyyy")
                                                        )
                                                    ) : (
                                                        "Select dates"
                                                    )}
                                                </span>
                                            </div>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 notranslate" align="start" sideOffset={4}>
                                        <div className="w-[370px] sm:w-auto overflow-x-auto sm:overflow-visible [&_.rdrDefinedRangesWrapper]:hidden notranslate">
                                            <div className="notranslate">
                                                <DateRangePicker
                                                    ranges={[
                                                        {
                                                            startDate: dateRange.from,
                                                            endDate: dateRange.to,
                                                            key: "selection",
                                                        },
                                                    ]}
                                                    onChange={(ranges) => {
                                                        const selection = ranges.selection;
                                                        handleDateRangeChange({ from: selection.startDate, to: selection.endDate });
                                                    }}
                                                    moveRangeOnFirstSelection={false}
                                                    editableDateInputs={true}
                                                    minDate={new Date()}
                                                    showSelectionPreview={true}
                                                    showDateDisplay={false}
                                                    staticRanges={[]}
                                                    inputRanges={[]}
                                                />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Guest Selector - LOCKED WIDTH */}
                            <div className="flex-1 min-w-[220px] max-w-[220px]">
                                <div className="w-full h-[20px] mb-2 overflow-hidden">
                                    <label className="text-sm font-medium whitespace-nowrap">
                                        Guests
                                    </label>
                                </div>
                                <div className="w-[220px] h-[44px]">
                                    <GuestSelector />
                                </div>
                            </div>

                            {/* Search Button - LOCKED WIDTH */}
                            <div className="flex-shrink-0 w-[60px] flex flex-col justify-end">
                                <Button
                                    onClick={handleSearchClick}
                                    className="w-[60px] h-[44px] flex justify-center items-center"
                                >
                                    <Search className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Featured Accommodations */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-xl md:text-3xl lg:text-3xl font-bold tracking-tight text-foreground">
                        Featured Accommodation
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Dynamic Room Cards */}
                    {featuredRooms.length > 0 ? (
                        featuredRooms.map((room, index) => (
                            <div key={room.id} className="rounded-3xl bg-card text-card-foreground shadow-md overflow-hidden">
                                <div className="h-80 w-full relative">
                                    {room.image ? (
                                        room.image.startsWith('data:') ? (
                                            <Image
                                                src={room.image}
                                                alt={room.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Image
                                                src={room.image}
                                                alt={room.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) 
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Mountain className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-2">
                                        {room.name}
                                    </h3>
                                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                                        <Users className="h-4 w-4 mr-1 text-primary" />
                                        <span className="notranslate">{room.adultCapacity}</span> Adults{room.childCapacity > 0 && (
                                            <>, <span className="notranslate">{room.childCapacity}</span> Children</>
                                        )}
                                    </div>
                                    <div className="flex items-center mb-2">
                                        {renderStarRating(room.rating)}
                                    </div>
                                    {room.features.length > 0 && (
                                        <div className="text-xs text-muted-foreground mb-2">
                                            {room.features.slice(0, 2).map((feature: any, idx: number) => (
                                                <span key={idx}>
                                                    {feature.name}{idx < Math.min(room.features.length, 2) - 1 && ', '}
                                                </span>
                                            ))}
                                            {room.features.length > 2 && '...'}
                                        </div>
                                    )}
                                    <div className="text-right text-lg font-bold">
                                        <span className="notranslate">${room.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Fallback content while loading
                        <>
                            {[...Array(3)].map((_, index) => (
                                <div key={index} className="rounded-3xl bg-card text-card-foreground shadow-md overflow-hidden animate-pulse">
                                    <div className="h-48 w-full bg-muted"></div>
                                    <div className="p-4">
                                        <div className="h-6 bg-muted rounded mb-2"></div>
                                        <div className="h-4 bg-muted rounded mb-2"></div>
                                        <div className="h-4 bg-muted rounded mb-2"></div>
                                        <div className="h-6 bg-muted rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* CTA Card */}
                    <div
                        onClick={handleSearchClick}
                        className="bg-primary text-primary-foreground rounded-3xl p-6 flex flex-col justify-between relative shadow-md cursor-pointer"
                    >
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Activity</h3>
                            <p className="text-sm opacity-90">
                                Adventure awaits, book your next experience
                            </p>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-white text-primary rounded-full p-2">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
