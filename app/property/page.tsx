"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react";
import SearchParamsWrapper from "@/components/SearchParamsWrapper";
import { RoomSelector } from "@/components/room-selector"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { matchPromoCode } from "@/lib/promotion-utils";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Wifi,
  Car,
  Coffee,
  Tv,
  Utensils,
  Wind,
  CalendarIcon,
  Baby,
  Trash2,
  CircleCheckBig,
  CircleX,
} from "lucide-react"
import { format } from "date-fns"
import { useBooking } from "@/components/booking-context"
import { propertyData as rawPropertyData } from "@/lib/data"

// Define a type for propertyData that includes images
type PropertyData = {
  images: string[]
  bedrooms?: number
  bathrooms?: number
  [key: string]: any
}

// Ensure propertyData always has an images property to avoid type errors
const propertyData: PropertyData = {
  images: [],
  ...rawPropertyData,
}
if (!propertyData.images) {
  propertyData.images = [];
}

// Extend the Room type to include all properties required by RoomCard and API variables
type Room = {
  id: number
  name: string
  description: string
  mainimageurl: string
  capacity: number
  maxAdult: number
  maxChild: number
  mealPlan: string
  price: number
  available: number
  discount?: number
  triplerate: number // Ensure this is always a number
  bedtype?: string
  roomsize?: string
  features?: string[]
  image?: string
  amenities?: string[]
  policies?: string[]
  photos?: string[]
  // Add missing properties for compatibility with RoomCard
  availability?: number
  popular?: boolean
  defaultMealPlan?: string
  availableMealPlans?: string[]
  // Additional API variables for RoomCard
  mealplandesc?: string;
  childagelower?: number;
  childagehigher?: number;
  seq?: number;
  qdplrate: number;
  familyerate: number;
  exadultrate: number;
}

import { RoomCard } from "@/components/room-card"
import { AvailabilityCalendar } from "@/components/availability-calendar"
import { ReviewsSection } from "@/components/reviews-section"
import { GuestSelector } from "@/components/guest-selector"
import { cn } from "@/lib/utils"
import Header from "@/components/header"
import { useCurrency } from "@/components/currency-context"
import { CurrencySelector } from "@/components/currency-selector"

export default function PropertyPage() {
  // REMOVED: localStorage.clear() - this was causing the date loss
  // useEffect(() => {
  //   localStorage.clear();
  // }, []);
  
  // Ref for the "View Available Rooms" button
  const viewRoomsButtonRef = useRef<HTMLButtonElement>(null);
  // PromoDetails type includes all fields present in promo JSON
  type PromoDetails = {
    PromoID: number;
    PromoType: string;
    PromoCode: string;
    Value: number;
    FreeNights?: number;
    DateFrom?: string;
    DateTo?: string;
    isActive?: boolean;
    isShowOnIBE?: boolean;
    EBDayCount?: number;
    Description?: string;
    [key: string]: any;
  };
  const [promoCode, setPromoCode] = useState("");

  // State to store all fetched promotions
  const [allPromos, setAllPromos] = useState<PromoDetails[]>([]);

  // Populate promo code from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promo = params.get("promo");
    if (promo) {
      setPromoCode(promo);
    }
  }, []);

  const [promoDetails, setPromoDetails] = useState<PromoDetails | null>(null);
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // Extend BookingDetails type to include childAges and ensure 'rooms' is present
  type BookingDetails = {
    checkIn: Date | null
    checkOut: Date | null
    adults: number
    children: number
    rooms: number // This property is required and always present
    nights?: number
    selectedRooms: any[]
    childAges?: number[] // Add childAges property to fix type error
    [key: string]: any
  }
  // Extend the bookingDetails type to include childAges and rooms for type safety
  type BookingDetailsWithChildAges = typeof bookingDetails & { childAges?: number[]; rooms: number };
  const { bookingDetails, updateBookingDetails, removeRoom } = useBooking();

  // Load reservation details from localStorage on mount - MOVED UP BEFORE OTHER EFFECTS
  useEffect(() => {
    const saved = localStorage.getItem("reservationSummary");
    if (saved) {
      const parsed = JSON.parse(saved);

      // Convert checkIn and checkOut to Date objects if present
      if (parsed.checkIn) parsed.checkIn = new Date(parsed.checkIn);
      if (parsed.checkOut) parsed.checkOut = new Date(parsed.checkOut);

      updateBookingDetails(parsed);
      if (parsed.promoCode) setPromoCode(parsed.promoCode);
      if (parsed.selectedPackages) setSelectedPackages(parsed.selectedPackages);
    }
  }, []);

    useEffect(() => {
      const fetchPromoCodes = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/GetPromoCodes.aspx`);
          const data = await res.json();
          console.log("Fetched promo data:", data);
          setAllPromos(data);

          // Centralized promotion matching logic via matchPromoCode helper
          const matched = matchPromoCode(data, promoCode, bookingDetails);

          setPromoDetails(matched || null);
        } catch (err) {
          console.error("Promo fetch failed", err);
        }
      };

      fetchPromoCodes();
    }, [promoCode, bookingDetails.checkIn, bookingDetails.nights]);

  // Provide a default value for rooms, adults, and children if not present
  const bookingDetailsWithRooms: BookingDetailsWithChildAges = {
    ...bookingDetails,
    adults: typeof bookingDetails.adults === "number" ? bookingDetails.adults : 2,
    children: typeof bookingDetails.children === "number" ? bookingDetails.children : 0,
    rooms: typeof bookingDetails.rooms === "number" ? bookingDetails.rooms : 1,
    childAges: bookingDetails.childAges ?? [],
  };
  const { convertPrice, formatPrice, currency } = useCurrency()
  const [selectedTab, setSelectedTab] = useState("rooms")
  // Ensure hotelData always has an images property to avoid type errors
  const [hotelData, setHotelData] = useState<any>({ images: [] })
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/GetPackages.aspx?currency=${currency}`);
        const data = await res.json();
        setPackages(data);
      } catch (error) {
        console.error("Failed to fetch packages", error);
      }
    };

    fetchPackages();
  }, [currency]);
  
  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API/GetHotelDetail.aspx`)
        const data = await res.json()
        setHotelData(data)
        if (data.WhatsAppNo) {
          setWhatsappNumber(data.WhatsAppNo)
        }
      } catch (error) {
        console.error("Failed to fetch hotel details", error)
      }
    }

    fetchHotelDetails()
  }, [])

  type DateRange = { from: Date | undefined; to?: Date | undefined }

  // FIXED: Initialize dateRange from bookingDetails instead of default today/tomorrow
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Use dates from booking context if available, otherwise use defaults
    if (bookingDetails.checkIn && bookingDetails.checkOut) {
      return {
        from: bookingDetails.checkIn,
        to: bookingDetails.checkOut,
      };
    }
    
    // Only use defaults if no dates are available
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    return {
      from: today,
      to: tomorrow,
    };
  });

  // ADDED: Update dateRange when bookingDetails change
  useEffect(() => {
    if (bookingDetails.checkIn && bookingDetails.checkOut) {
      setDateRange({
        from: bookingDetails.checkIn,
        to: bookingDetails.checkOut,
      });
    }
  }, [bookingDetails.checkIn, bookingDetails.checkOut]);

  interface AvailableRoom extends Room {}

  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])


  // Handle date range changes without creating a circular dependency
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range) {
      setDateRange({ from: undefined, to: undefined })
      updateBookingDetails({
        selectedRooms: [],
        checkIn: null,
        checkOut: null,
      })
      return
    }

    setDateRange(range)
    updateBookingDetails({
      selectedRooms: [],
      checkIn: range.from || null,
      checkOut: range.to || null,
    })
    // Do not update bookingDetails here; update on button click instead
  }

    useEffect(() => {
      const fetchRoomRates = async () => {
        if (!bookingDetailsWithRooms.checkIn || !bookingDetailsWithRooms.checkOut) return;

        const dateFrom = format(bookingDetailsWithRooms.checkIn, "MM/dd/yyyy");
        const dateTo = format(bookingDetailsWithRooms.checkOut, "MM/dd/yyyy");

        // Utility to safely parse rates as numbers, fallback to 0 if invalid
        const parseRate = (val: any) => Number(val) || 0;

        try {
          const res = await fetch(
            `${API_BASE_URL}/API/GetRoomRates.aspx?datefrom=${dateFrom}&dateto=${dateTo}&currency=US$`
          );
          const data: RoomRateApiResponse[] = await res.json();

          // Sort data array by seq before mapping
          interface RoomRateApiResponse {
            seq?: number;
            roomtypeid: number;
            roomtype: string;
            roomtypedesc: string;
            mainimageurl: string;
            standardoccupancy: number;
            maxavailable: number;
            maxadult: number;
            maxchild: number;
            mealplan: string;
            singlerate: number | string;
            doublerate: number | string;
            triplerate: number | string;
            qdplrate?: number | string;
            familyerate?: number | string;
            childrate?: number | string;
            childagelower?: number | string;
            childagehigher?: number | string;
            discount?: number;
            bedType?: string;
            size?: string;
            features?: string[];
            image?: string;
            amenities?: string[];
            policies?: string[];
            photos?: string[];
            availability?: number;
            popular?: boolean;
            defaultMealPlan?: string;
            availableMealPlans?: string[];
          }

          data.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

          const totalGuests = (bookingDetailsWithRooms.adults || 0) + (bookingDetailsWithRooms.children || 0);
          const requiredRooms = bookingDetailsWithRooms.rooms || 1;

          const roomsWithRates = data
            .filter((room) => {
              const maxGuestsPerRoom = room.maxadult + room.maxchild;
              return room.maxavailable >= requiredRooms && maxGuestsPerRoom >= totalGuests / requiredRooms;
            })
            .map((room) => {
              const adults = bookingDetailsWithRooms.adults || 0;
              const children = bookingDetailsWithRooms.children || 0;

              let baseRate = 0;

              if (adults === 1) {
                baseRate = parseRate(room.singlerate);
              } else if (adults === 2) {
                baseRate = parseRate(room.doublerate);
              } else if (adults === 3) {
                baseRate = parseRate(room.triplerate);
              } else if (adults === 4) {
                baseRate = parseRate(room.qdplrate);
              } else if (adults > 4) {
                baseRate = parseRate(room.familyerate);
              }
              // Add extra adult charge if adults > 4
              if (adults > 4) {
                baseRate += parseRate(room.exadultrate) * (adults - 4);
              }

              const childRate = parseRate(room.childrate);
              const childAgeLower = parseRate(room.childagelower);
              const childAgeHigher = parseRate(room.childagehigher);

              let applicableChildren = 0;
              if (Array.isArray(bookingDetailsWithRooms.childAges)) {
                applicableChildren = bookingDetailsWithRooms.childAges.filter(
                  (age) => age >= childAgeLower && age <= childAgeHigher
                ).length;
              } else {
                applicableChildren = children; // fallback if no specific ages
              }

              const rate = baseRate + (childRate > 0 ? childRate * applicableChildren : 0);

              // Log the parsed rate fields for debugging
              console.log("Parsed Room Rate:", {
                id: room.roomtypeid,
                singlerate: parseRate(room.singlerate),
                doublerate: parseRate(room.doublerate),
                triplerate: parseRate(room.triplerate),
                qdplrate: parseRate(room.qdplrate),
                familyerate: parseRate(room.familyerate),
                childrate: parseRate(room.childrate),
                exadultrate: parseRate(room.exadultrate),
                discount: parseRate(room.discount),
                childagelower: parseRate(room.childagelower),
                childagehigher: parseRate(room.childagehigher),
                mealplan: room.mealplan,
              });

              return {
                id: room.roomtypeid,
                name: room.roomtype,
                description: room.roomtypedesc,
                mainimageurl: room.mainimageurl,
                capacity: room.standardoccupancy,
                available: room.maxavailable,
                maxAdult: room.maxadult,
                maxChild: room.maxchild,
                mealPlan: room.mealplan,
                price: rate,
                // Include all required rate types for dynamic pricing
                singlerate: parseRate(room.singlerate),
                doublerate: parseRate(room.doublerate),
                triplerate: parseRate(room.triplerate),
                qdplrate: parseRate(room.qdplrate),
                familyerate: parseRate(room.familyerate),
                childrate: parseRate(room.childrate),
                exadultrate: parseRate(room.exadultrate),
                discount: parseRate(room.discount),
                // Add missing properties with default or placeholder values
                roomsize: room.roomsize || "Unknown",
                bedType: room.bedtype || "Unknown",
                size: room.size || "Unknown",
                // Updated: set defaults for features, amenities, policies, photos
                features: room.features || [],
                amenities: room.amenities || [],
                policies: room.policies || [],
                photos: room.photos || [],
                // Add missing properties for RoomCard compatibility with defaults
                availability: room.availability ?? room.maxavailable ?? 0,
                popular: room.popular ?? false,
                defaultMealPlan: room.defaultMealPlan ?? room.mealplan ?? "",
                availableMealPlans: room.availableMealPlans ?? [room.mealplan ?? ""],
                // Additional properties as requested
                mealplandesc: room.mealplandesc,
                maxavailable: room.maxavailable,
                childagelower: parseRate(room.childagelower),
                childagehigher: parseRate(room.childagehigher),
                seq: room.seq ?? 0,
                minstay: parseRate(room.minstay),
              };
            });

          setAvailableRooms(roomsWithRates);
        } catch (error) {
          console.error("Failed to fetch room rates", error);
        }
      };

      fetchRoomRates();
    }, [bookingDetailsWithRooms.checkIn, bookingDetailsWithRooms.checkOut, bookingDetailsWithRooms.adults, bookingDetailsWithRooms.children]);

  const nextImage = () => {
    const images = hotelData?.images || propertyData.images || [];
    setCurrentImageIndex((prev) =>
      images.length === 0
        ? 0
        : prev === images.length - 1
        ? 0
        : prev + 1
    );
  };

  const prevImage = () => {
      const images = hotelData?.images || propertyData.images || [];
      setCurrentImageIndex((prev) => (images.length === 0 ? 0 : prev === 0 ? images.length - 1 : prev - 1));
    }

  const handleProceedToBooking = () => {
    if (bookingDetails.selectedRooms.length === 0) {
      // Show error or notification that no rooms are selected
      return
    }

    
    // Store reservation details in localStorage before routing
    const reservationSummary = {
      selectedRooms: bookingDetails.selectedRooms,
      promoCode,
      selectedPackages,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      nights: bookingDetails.nights,
      adults: bookingDetails.adults,
      children: bookingDetails.children,
      rooms: bookingDetails.rooms,
      childAges: bookingDetails.childAges
    };
    localStorage.setItem("reservationSummary", JSON.stringify(reservationSummary));
    if (promoDetails) {
      localStorage.setItem("parsedPromoDetails", JSON.stringify(promoDetails));
    }
    const selectedRoomTypes = bookingDetails.selectedRooms.map((room) => room.roomName).join(",");
    const packageIDs = selectedPackages.map(pkg => pkg.PackageID).join(",");
    const promo = promoCode ? `&promo=${encodeURIComponent(promoCode)}` : "";
    router.push(`/book?roomTypes=${encodeURIComponent(selectedRoomTypes)}${promo}&packages=${encodeURIComponent(packageIDs)}`);
  }

  // Calculate total price for all selected rooms
  const totalSelectedPrice = bookingDetails.selectedRooms.reduce((total, room) => {
    return total + room.price * room.quantity * (bookingDetails.nights || 1)
  }, 0)

  const discountValue = (() => {
    if (!promoDetails) return 0;

    if (promoDetails.PromoType === "PERCENTAGE") {
      return (promoDetails.Value / 100) * totalSelectedPrice;
    }

    if (
      promoDetails.PromoType === "FREE NIGHTS" &&
      promoDetails.Value &&
      promoDetails.FreeNights &&
      bookingDetails.nights >= promoDetails.Value
    ) {
      const totalRoomPrice = bookingDetails.selectedRooms.reduce((total, room) => {
        return total + room.price * room.quantity;
      }, 0);

      return totalRoomPrice * promoDetails.FreeNights;
    }

    return 0;
  })();

  const adjustedTotal = totalSelectedPrice - discountValue;

  // On initial mount, trigger the same as clicking "View Available Rooms"
  useEffect(() => {
    const timeout = setTimeout(() => {
      viewRoomsButtonRef.current?.click();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsWrapper onTabChange={setSelectedTab} />
      </Suspense>
      <Header />
      {/* Property Title, Rating, Location, Description */}
      <div className="container max-w-7xl mx-auto px-4 pt-4">
        {/* Hotel name, score, star category, and Currency Selector */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-3xl font-bold">{hotelData?.HotelName || "Property Name"}</h1>
          {hotelData?.Address && (
            <div className="flex items-center text-sm text-muted-foreground mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13 21.314l-4.657-4.657A8 8 0 1117.657 16.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{hotelData.Address}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center text-m text-muted-foreground">
              <div className="flex items-center">
                <Star className="h-2 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span>{hotelData?.HotelScore || "-"}</span>&nbsp;&nbsp;
              </div>
              <span>•</span>&nbsp;
              <span>{hotelData?.StarCat ? `${hotelData.StarCat}-Star Property` : "Location Unavailable"}</span>
            </div>
            <CurrencySelector />
          </div>
        </div>
      </div>
      <div className="container max-w-7xl mx-auto px-4 py-2">


        {/* Date and Guest Selection Bar */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-in / Check-out</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        <span>Select dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" sideOffset={4}>
                    <div className="w-[370px] sm:w-auto overflow-x-auto sm:overflow-visible [&_.rdrDefinedRangesWrapper]:hidden">
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
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Guests</label>
                <GuestSelector />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Promo Code</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 pr-10"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  {promoCode && (
                    promoDetails ? (
                      <CircleCheckBig className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5" />
                    ) : (
                      <CircleX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600 w-5 h-5" />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  ref={viewRoomsButtonRef}
                  className="w-full"
                  onClick={() => {
                    if (dateRange.from && dateRange.to) {
                      updateBookingDetails({
                        checkIn: dateRange.from,
                        checkOut: dateRange.to,
                      })
                    }
                    setSelectedTab("rooms")
                  }}
                >
                  View Available Rooms
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Rooms Summary (if any) */}
        {bookingDetails.selectedRooms.length > 0 && (
          <Card className="mb-8 border-primary block md:hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Your Reservation</h2>
                <Button onClick={handleProceedToBooking} className="bg-primary">
                  Proceed to Booking
                </Button>
              </div>

              <div className="space-y-3">
                {bookingDetails.selectedRooms.map((room) => (
                  <div key={room.roomId} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{room.roomName}</div>
                      <div className="text-sm text-muted-foreground">
                        {room.quantity} {room.quantity === 1 ? "room" : "rooms"} •{room.adults}{" "}
                        {room.adults === 1 ? "adult" : "adults"}
                        {room.children > 0 && `, ${room.children} ${room.children === 1 ? "child" : "children"}`}
                      </div>
                      {room.mealPlanId && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Meal Plan: {room.mealPlanId}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between h-full">
                      <div className="text-right">
                        <div>{formatPrice(convertPrice(room.price * room.quantity))}/period</div>
                        <div className="text-sm text-muted-foreground">
                          Total: {formatPrice(convertPrice(room.price * room.quantity * (bookingDetails.nights || 1)))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 mt-2"
                        onClick={() => removeRoom(room.roomId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add-Ons block */}
                {selectedPackages.length > 0 && (
                  <div className="pt-3 mt-3 border-t">
                    <div className="font-medium mb-2">Add-Ons:</div>
                    {selectedPackages.map((pkg, index) => (
                      <div key={`${pkg.PackageID}-${index}`} className="flex justify-between items-center text-sm mb-1">
                        <div>{pkg.Description}</div>
                        <div className="flex items-center gap-2">
                          <span>{formatPrice(convertPrice(pkg.Price))}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() =>
                              setSelectedPackages(prev => {
                                const newArr = [...prev];
                                newArr.splice(index, 1);
                                return newArr;
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {discountValue > 0 && (
                  <div className="flex justify-between items-center pt-1 text-sm text-green-600">
                    <span>Promo ({promoDetails?.PromoCode ?? ""})</span>
                    <span>-{formatPrice(convertPrice(discountValue))}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t mt-3">
                  <div className="font-medium">
                    Total for {bookingDetails.nights || 1} {(bookingDetails.nights || 1) === 1 ? "night" : "nights"}
                  </div>
                  <div className="font-bold text-lg">{formatPrice(convertPrice(adjustedTotal))}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
                <TabsTrigger value="promotions">Promotions</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4">
                <div className="grid gap-8">
                  {/* Capacity */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {availableRooms[0]?.maxAdult || 0} {availableRooms[0]?.maxAdult === 1 ? "adult" : "adults"}
                          {availableRooms[0]?.maxChild > 0 && ` and ${availableRooms[0].maxChild} ${availableRooms[0].maxChild === 1 ? "child" : "children"}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <path d="M2 9V5c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v4" />
                          <path d="M2 13h20" />
                          <path d="M4 21h16a2 2 0 0 0 2-2v-4H2v4a2 2 0 0 0 2 2Z" />
                        </svg>
                        <span>{propertyData.bedrooms} bedrooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
                          <line x1="10" x2="8" y1="5" y2="7" />
                          <line x1="2" x2="22" y1="12" y2="12" />
                          <line x1="7" x2="7" y1="19" y2="21" />
                          <line x1="17" x2="17" y1="19" y2="21" />
                        </svg>
                        <span>{propertyData.bathrooms} bathrooms</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Amenities */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-muted-foreground" />
                        <span>Free WiFi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <span>Free parking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-muted-foreground" />
                        <span>Coffee maker</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tv className="h-5 w-5 text-muted-foreground" />
                        <span>Smart TV</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Utensils className="h-5 w-5 text-muted-foreground" />
                        <span>Fully equipped kitchen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5 text-muted-foreground" />
                        <span>Air conditioning</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Separator />

                  {/* Check-in Info */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Check-in Information</h2>
                    <div className="grid gap-2">
                      <p>
                        <strong>Check-in:</strong> After 3:00 PM
                      </p>
                      <p>
                        <strong>Check-out:</strong> Before 11:00 AM
                      </p>
                      <p>
                        <strong>Self check-in:</strong> Lockbox with key
                      </p>
                      <p className="mt-2">Detailed check-in instructions will be provided after booking.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rooms" className="pt-4">
                <h2 className="text-xl font-semibold mb-4">Available Room Types</h2>

                {/* Handler to update room price on meal plan change */}
                {/*
                  handleMealPlanChange will be passed to RoomCard for dynamic pricing
                */}
                {(() => {
                  // Handler to update availableRooms and bookingDetails.selectedRooms with new price for a given room
                  const handleMealPlanChange = (roomId: number, newRate: number) => {
                    setAvailableRooms(prevRooms =>
                      prevRooms.map(room =>
                        room.id === roomId ? { ...room, price: newRate } : room
                      )
                    );

                    // Update selectedRooms if the room is already selected
                    updateBookingDetails({
                      selectedRooms: bookingDetails.selectedRooms.map(room =>
                        Number(room.roomId) === roomId
                          ? {
                              ...room,
                              price: newRate,
                              selectedMealPlanPrice: newRate, // optional, for clarity
                            }
                          : room
                      )
                    });
                  };
                  return (
                    <>
                      {availableRooms.length > 0 ? (
                        <div className="grid gap-6">
                          {Object.values(
                            availableRooms.reduce<Record<string, typeof availableRooms[number] & { mealPlans: any[] }>>((acc, room) => {
                              const key = String(room.id);
                              if (!acc[key]) {
                                acc[key] = {
                                  ...room,
                                  mealPlans: [],
                                  id: room.id,
                                  bedtype: room.bedtype || "Unknown",
                                  bedType: room.bedType || room.bedtype || "Unknown",
                                  size: room.size || room.roomsize || "Unknown",
                                  features: room.features ?? [],
                                };
                              }
                              // Build mealPlans array with correct dynamic pricing for each meal plan
                              // If room.availableMealPlans is supplied, map through it, else fallback to current mealPlan
                              // Find rates for each meal plan (using room rates for this id and mealplan)
                              // availableRooms may contain multiple entries for the same room id but different mealPlan
                              // So, collect all availableRooms with the same id and different mealPlan
                              // Only push if not already in mealPlans
                              if (acc[key].mealPlans.every(mp => mp.mealplan !== room.mealPlan)) {
                                acc[key].mealPlans.push({
                                  mealplan: room.mealPlan,
                                  mealplandesc: room.mealPlan,
                                  singlerate: room.singlerate,
                                  doublerate: room.doublerate,
                                  triplerate: room.triplerate,
                                  qdplrate: room.qdplrate,
                                  familyerate: room.familyerate,
                                  childrate: room.childrate,
                                  exadultrate: room.exadultrate
                                });
                              }
                              // Set room.price to the price of the default selected meal plan (first in mealPlans)
                              if (acc[key].mealPlans.length === 1) {
                                acc[key].price = room.price;
                              }
                              return acc;
                            }, {})
                          ).map((room) => (
                            <RoomCard
                              key={room.id}
                              room={room}
                              showQuantitySelector={
                                Array.isArray(bookingDetails.selectedRooms) &&
                                bookingDetails.selectedRooms.some((r) => Number(r.roomId) === Number(room.id))
                              }
                              onMealPlanChange={(newRate: number) => handleMealPlanChange(room.id, newRate)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center border rounded-md">
                          <p className="text-muted-foreground mb-2">No rooms available for the selected dates and guests.</p>
                          <p>Please try different dates or adjust your guest count.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="packages" className="pt-4">
                <h2 className="text-xl font-semibold mb-4">Available Packages</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-6">
                      {packages.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {packages.map((pkg) => (
                            <div
                              key={pkg.PackageID}
                              className="relative border rounded-md overflow-hidden shadow-sm bg-background hover:shadow-lg transition group cursor-pointer"
                              onClick={() => setSelectedPackages(prev => [...prev, pkg])}
                            >
                              {/* Show check icon when selected */}
                              {selectedPackages.some(sel => sel.PackageID === pkg.PackageID) && (
                                <CircleCheckBig className="w-5 h-5 text-green-600 absolute top-3 right-3" />
                              )}
                              <div className="flex flex-col justify-between h-full p-4 gap-2">
                                <div>
                                  <div className="text-lg font-semibold text-black group-hover:underline">{pkg.Description}</div>
                                  {selectedPackages.filter(sel => sel.PackageID === pkg.PackageID).length > 0 && (
                                    <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                                      <span className="font-semibold">
                                        {selectedPackages.filter(sel => sel.PackageID === pkg.PackageID).length}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-sm text-muted-foreground mb-2">{pkg.PackageCode}</p>
                                </div>
                                <div className="mt-auto flex items-center justify-between">
                                  <span className="text-md font-semibold">{formatPrice(convertPrice(pkg.Price))}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No packages available at the moment.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="promotions" className="pt-4">
                <h2 className="text-xl font-semibold mb-4">Available Promotions</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {allPromos.filter(p => !!p.isShowOnIBE).map(promo => (
                          <div
                            key={promo.PromoID}
                            className="relative border rounded-md p-4 shadow-sm bg-background hover:shadow-md transition cursor-pointer"
                            onClick={() => setPromoCode(promo.PromoCode)}
                          >
                            {promo.PromoCode === promoCode && (
                              promoDetails ? (
                                <CircleCheckBig className="w-5 h-5 text-green-600 absolute top-3 right-3" />
                              ) : (
                                <CircleX className="w-5 h-5 text-red-600 absolute top-3 right-3" />
                              )
                            )}
                            <div className="font-bold text-lg mb-1 flex items-center gap-2">
                              {promo.PromoCode}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">{promo.Description}</div>
                            <div className="text-sm">
                              {promo.PromoType === "PERCENTAGE"
                                ? `${promo.Value}% off`
                                : promo.PromoType === "FREE NIGHTS"
                                ? `Stay ${promo.Value} nights, get ${promo.FreeNights} free`
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Card */}
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold mb-6">Your Reservation</div>

                <div className="mb-4 p-4 bg-muted rounded-md">
                  <h3 className="font-semibold mb-2">Your Stay</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Dates</span>
                      <span>
                        {bookingDetails.checkIn && bookingDetails.checkOut
                          ? `${format(bookingDetails.checkIn, "MMM d")} - ${format(bookingDetails.checkOut, "MMM d, yyyy")}`
                          : "Select dates"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Guests</span>
                      <span>
                        {bookingDetails.adults} {bookingDetails.adults === 1 ? "adult" : "adults"}
                        {bookingDetails.children > 0 &&
                          `, ${bookingDetails.children} ${bookingDetails.children === 1 ? "child" : "children"}`}
                      </span>
                    </div>

                    {/* Selected Rooms Summary */}
                    {bookingDetails.selectedRooms.length > 0 && (
                      <div className="pt-2 mt-2 border-t">
                        <div className="font-medium mb-2">Selected Rooms:</div>
                        {bookingDetails.selectedRooms.map((room) => (
                          <div key={room.roomId} className="flex justify-between items-center p-3 border rounded-md mb-1">
                            <div>
                              <div className="font-medium">{room.roomName}</div>
                              <div className="text-sm text-muted-foreground">
                                {room.quantity} {room.quantity === 1 ? "room" : "rooms"} •{room.adults}{" "}
                                {room.adults === 1 ? "adult" : "adults"}
                                {room.children > 0 && `, ${room.children} ${room.children === 1 ? "child" : "children"}`}
                              </div>
                              {room.mealPlanId && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Meal Plan: {room.mealPlanId}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end justify-between h-full">
                              <div className="text-right">
                                <div className="text-sm">{formatPrice(convertPrice(room.price * room.quantity))}/period</div>
                                <div className="text-sm text-muted-foreground">
                                  Total: {formatPrice(convertPrice(room.price * room.quantity * (bookingDetails.nights || 1)))}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 mt-2"
                                onClick={() => removeRoom(room.roomId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Same Day Availability */}
                  {new Date().toDateString() === (bookingDetails.checkIn?.toDateString() || "") && (
                    <div className="mb-4 p-3 bg-green-50 rounded-md text-sm">
                      <div className="flex items-center gap-2 text-green-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        <span className="font-medium">Same-day check-in available!</span>
                      </div>
                    </div>
                  )}

                  {selectedPackages.length > 0 && (
                    <div className="pt-4 mt-4 border-t">
                      <div className="font-medium mb-2">Selected Packages:</div>
                      {selectedPackages.map((pkg, index) => (
                        <div key={`${pkg.PackageID}-${index}`} className="flex justify-between items-center text-sm mb-1">
                          <div>{pkg.Description}</div>
                          <div className="flex items-center gap-2">
                            <span>{formatPrice(convertPrice(pkg.Price))}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() =>
                                setSelectedPackages(prev => {
                                  const newArr = [...prev];
                                  newArr.splice(index, 1);
                                  return newArr;
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Price Block */}
                  {(bookingDetails.selectedRooms.length > 0 || selectedPackages.length > 0) && (
                    <>
                      {discountValue > 0 && (
                        <div className="flex justify-between items-center pt-1 text-sm text-green-600">
                          <span>Promo ({promoDetails?.PromoCode ?? ""})</span>
                          <span>-{formatPrice(convertPrice(discountValue))}</span>
                        </div>
                      )}
                      <div className="pt-4 mt-4 border-t">
                        <div className="flex justify-between font-medium text-sm">
                          <span>Total</span>
                          <span>
                            {formatPrice(
                              convertPrice(
                                adjustedTotal +
                                  selectedPackages.reduce((sum, pkg) => sum + pkg.Price, 0)
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {bookingDetails.selectedRooms.length > 0 ? (
                    <>
                      <br />
                      <Button onClick={handleProceedToBooking} className="w-full">
                        Proceed to Booking
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setSelectedTab("rooms")} className="w-full">
                      Select Rooms
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    {/* WhatsApp Floating Chat Button */}
    <div
      className="fixed bottom-6 right-6 z-50"
      style={{ zIndex: 9999 }}
    >
      <a
        href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.52 3.48A11.87 11.87 0 0012 0C5.37 0 0 5.37 0 12a11.94 11.94 0 001.67 6.13L0 24l5.87-1.54A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22a9.94 9.94 0 01-5.09-1.39l-.36-.21-3.49.92.93-3.4-.23-.36A9.94 9.94 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.25-7.85c-.29-.15-1.7-.84-1.97-.93-.26-.1-.45-.15-.64.15-.18.29-.74.93-.91 1.12-.17.18-.34.2-.63.07-.29-.14-1.23-.45-2.34-1.43-.86-.76-1.44-1.7-1.61-1.98-.17-.29-.02-.45.13-.6.14-.14.29-.34.44-.5.15-.17.2-.29.3-.48.1-.2.05-.36-.03-.51-.07-.14-.64-1.55-.88-2.13-.23-.56-.47-.49-.64-.5l-.54-.01c-.18 0-.47.07-.71.34-.24.27-.94.91-.94 2.21s.97 2.56 1.1 2.74c.13.18 1.91 2.91 4.63 4.08.65.28 1.15.44 1.54.57.65.21 1.24.18 1.7.11.52-.08 1.7-.69 1.94-1.36.24-.66.24-1.22.17-1.34-.07-.12-.26-.18-.54-.32z" />
        </svg>
      </a>
    </div>
    </>
  )
}