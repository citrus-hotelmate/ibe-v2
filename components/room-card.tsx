import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Users, Maximize, Baby, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getMealPlanById } from "@/controllers/mealPlanController";
import { MealPlan } from "@/types/mealPlan";
import { GuestSelector } from "@/components/guest-selector";
import { RoomGuestSelector } from "./room-guest-selector";
import { useBooking, RoomBooking } from "./booking-context";
import { useCurrency } from "@/components/currency-context";
import { set } from "date-fns";
import { ca, is } from "date-fns/locale";

interface RoomCardProps {
  roomName: string;
  roomsLeft: number;
  mealPlanId: number;
  defaultRate?: number;
  averageRate?: number;
  onAddToBooking: (room: RoomBooking) => void;
  adultCount?: number;
  childCount?: number;
  roomTypeId?: number;
  showQuantitySelector?: boolean;
  imageUrl?: string;
  allImages?: Array<{ imageURL: string; description: string; isMain: boolean }>;
}

export default function RoomCard({
  roomName,
  roomsLeft,
  mealPlanId,
  defaultRate,
  averageRate,
  onAddToBooking,
  adultCount,
  childCount,
  roomTypeId,
  showQuantitySelector,
  imageUrl,
  allImages = [],
}: RoomCardProps) {
  const [headerColor, setHeaderColor] = useState("");
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [childPolicy, setChildPolicy] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    const selectedHotelStr = localStorage.getItem("selectedHotel");
    if (selectedHotelStr) {
      try {
        const selectedHotel = JSON.parse(selectedHotelStr);
        if (selectedHotel.ibeHeaderColour) {
          setHeaderColor(selectedHotel.ibeHeaderColour);
        }
        if (selectedHotel.childPolicy) {
          setChildPolicy(selectedHotel.childPolicy);
        }
      } catch (error) {
        console.error("Failed to parse selectedHotel from localStorage", error);
      }
    }
  }, []);

  // Set initial image index to the main image
  useEffect(() => {
    if (allImages && allImages.length > 0) {
      const mainImageIndex = allImages.findIndex(img => img.isMain);
      setCurrentImageIndex(mainImageIndex >= 0 ? mainImageIndex : 0);
    }
  }, [allImages]);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [price, setPrice] = useState<number>(100); // Default room price

  // Currency conversion & formatting
  const { convertPrice, formatPrice } = useCurrency();

  // Track the actual selected guest count (not room capacity)
  const [selectedAdults, setSelectedAdults] = useState<number>(2); // Default to 2 adults
  const [selectedChildren, setSelectedChildren] = useState<number>(0); // Default to 0 children

  const {
    bookingDetails,
    updateBookingDetails,
    addRoom,
    updateRoom,
    incrementRoomQuantity,
    decrementRoomQuantity,
    removeRoom,
  } = useBooking();

  const selectedRoom = bookingDetails.selectedRooms.find(
    (room) => room.roomId === roomTypeId?.toString()
  );
  const quantity = selectedRoom?.quantity || 0;

  // Uncomment this to fetch meal plans
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
    if (!token) return;
    if (mealPlanId) {
      const fetchMealPlans = async () => {
        try {
          const plan = await getMealPlanById(token, mealPlanId);
          setMealPlans([plan]);
        } catch (err) {
          console.error("Failed to fetch meal plans:", err);
        }
      };
      fetchMealPlans();
    }
  }, [mealPlanId]);

  // Handle guest changes and calculate room price based on complex rules
  const handleGuestChange = (
    adults: number,
    children: number,
    ages?: number[]
  ) => {
    // Update the selected guest count state
    setSelectedAdults(adults);
    setSelectedChildren(children);

    // Update the booking context if this room is already added
    if (selectedRoom) {
      updateRoom(roomTypeId?.toString() || "", {
        adults: adults,
        children: children
      });
    }

    // Enforce maximum limits for adults and children
    const maxAdult = 3;
    const maxChild = 2;

    if (adults > maxAdult) adults = maxAdult;
    if (children > maxChild) children = maxChild;

    // Store child ages if provided
    if (ages) setChildAges(ages);

    // Base price calculation with dynamic pricing model
    const basePrice = 100; // Base price for the room
    let calculatedPrice = basePrice;

    // Dynamic pricing based on adult occupancy
    switch (adults) {
      case 1:
        calculatedPrice = basePrice * 0.85; // 15% discount for single occupancy
        break;
      case 2:
        calculatedPrice = basePrice; // Standard rate for double occupancy
        break;
      case 3:
        calculatedPrice = basePrice * 1.3; // 30% premium for triple occupancy
        break;
      default:
        calculatedPrice = basePrice;
    }

    // Advanced child pricing logic based on age groups
    if (children > 0 && Array.isArray(ages) && ages.length > 0) {
      ages.forEach((age) => {
        if (age < 2) {
          // Infants stay free
          // No additional charge
        } else if (age >= 2 && age <= 5) {
          // Toddlers (2-5)
          calculatedPrice += basePrice * 0.25; // 25% of base price
        } else if (age > 5 && age <= 12) {
          // Children (6-12)
          calculatedPrice += basePrice * 0.5; // 50% of base price
        } else {
          // Teenagers (13+)
          calculatedPrice += basePrice * 0.7; // 70% of base price
        }
      });
    } else if (children > 0) {
      // If child ages not provided, use average child rate (50%)
      calculatedPrice += children * (basePrice * 0.5);
    }

    // Apply dynamic discount for longer stays (simulated from booking context)
    const nights = bookingDetails.nights || 1;
    let stayDiscount = 0;

    if (nights >= 7) {
      stayDiscount = 0.15; // 15% off for 7+ nights
    } else if (nights >= 4) {
      stayDiscount = 0.1; // 10% off for 4-6 nights
    } else if (nights >= 2) {
      stayDiscount = 0.05; // 5% off for 2-3 nights
    }

    // Apply potential seasonal or promotional adjustments
    const isHighSeason = false; // This would come from an API or context
    const hasPromotion = price > 100; // Check if a promotion is active

    if (isHighSeason) {
      calculatedPrice *= 1.2; // 20% premium during high season
    }

    if (hasPromotion) {
      calculatedPrice *= 0.9; // 10% promotion discount
    }

    // Apply stay discount
    calculatedPrice = calculatedPrice * (1 - stayDiscount);

    // Round to whole number for display
    setPrice(Math.round(calculatedPrice));

    // Optionally sync with booking context if needed
    // updateBookingDetails({...}); // If you want to update context here
  };

  // Check if minimum stay requirement is met
  const minimumStayRequired = 1; // Minimum nights required for this room
  const minimumStayNotMet = bookingDetails.nights < minimumStayRequired;
  console.log(defaultRate, "DF");
  // Room is ready for booking
  return (
    <div className="overflow-hidden rounded-md m-3 md:mx-8 lg:mx-4 xl:mx-0 max-w-[1200px] mx-auto">
      <Card className="rounded-b-none border-none w-full">
        <div className="grid md:grid-cols-5 gap-4 relative">
          <div 
            className="md:col-span-2 relative min-h-[300px] h-full"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            <div className="absolute inset-0">
              {allImages && allImages.length > 0 ? (
                <>
                  <img
                    src={allImages[currentImageIndex]?.imageURL || "/placeholder.svg?height=300&width=500"}
                    alt={allImages[currentImageIndex]?.description || roomName}
                    className="object-cover w-full h-full"
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder.svg?height=300&width=500";
                    }}
                  />
                  {allImages.length > 1 && (
                    <>
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all ${isImageHovered ? 'opacity-100' : 'opacity-0'}`}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all ${isImageHovered ? 'opacity-100' : 'opacity-0'}`}
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      {/* Image Counter */}
                      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm transition-all ${isImageHovered ? 'opacity-100' : 'opacity-0'}`}>
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <img
                  src={imageUrl || "/placeholder.svg?height=300&width=500"}
                  alt={roomName}
                  className="object-cover w-full h-full"
                  style={{ objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.svg?height=300&width=500";
                  }}
                />
              )}
            </div>
            {/* <Badge className="absolute top-2 left-2" variant="secondary">
              Popular Choice
            </Badge> */}
            <Badge className="absolute top-2 right-2 bg-[#fa3cb1]">
              {mealPlans.length > 0 ? mealPlans[0].mealPlan : "Loading..."}
            </Badge>
          </div>
          <div className="p-4 md:col-span-3 flex flex-col">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{roomName}</h3>
                  <p className="text-sm text-green-600">
                    {Math.max(0, roomsLeft - quantity)} rooms left
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Minimum stay: 1 night
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-md font-bold">
                    {averageRate && bookingDetails.nights
                      ? formatPrice(convertPrice(averageRate * bookingDetails.nights))
                      : formatPrice(convertPrice(averageRate || 0))}
                    <span className="text-sm font-normal text-muted-foreground">
                      /period
                    </span>
                  </div>
                  {bookingDetails.nights > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {`(${formatPrice(convertPrice(averageRate || 0))} = per night × ${bookingDetails.nights})`}
                    </div>
                  )}
                  {/* {averageRate && averageRate > 100 && (
                    <div className="text-sm text-green-600 font-medium">
                      20% off
                    </div>
                  )} */}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 my-3">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {`${adultCount} adults and ${childCount} children`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>King Bed</span>
                </div>
                {/* <div className="flex items-center gap-1 text-sm">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <span>300 sqft</span>
                </div> */}
              </div>

              {/* <div className="mb-4 flex items-start gap-2 text-xs bg-blue-50 p-2 rounded">
                <Baby className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>{childPolicy || "No child policy available."}</span>
              </div> */}

              <>
                <div className="mb-2">
                  <div className="text-sm font-medium mb-1">
                    Select Meal Plan:
                  </div>
                  <select className="w-full sm:w-60 border rounded p-2 cursor-pointer text-sm">
                    {mealPlans.length > 0 ? (
                      mealPlans.map((plan) => (
                        <option key={plan.mealPlanID} value={plan.mealPlanID}>
                          {plan.mealPlan} -{" "}
                          {averageRate && bookingDetails.nights
                            ? formatPrice(convertPrice(averageRate * bookingDetails.nights))
                            : formatPrice(convertPrice(averageRate || 0))}{" "}
                          /period
                        </option>
                      ))
                    ) : (
                      <option value="">N/A</option>
                    )}
                  </select>
                </div>
              </>

              <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-2">
                    Guests for this room:
                  </div>
                  <RoomGuestSelector
                    adults={selectedAdults} // Use selected adults, not room capacity
                    children={selectedChildren} // Use selected children, not room capacity
                    onChange={(adults, children, ages) => {
                      // Use our enhanced handleGuestChange function
                      handleGuestChange(adults, children, ages);
                    }}
                    maxGuests={(adultCount || 0) + (childCount || 0)}
                    maxAdult={adultCount || 0}
                    maxChild={childCount || 0}
                    childAgeLower={2}
                    childAgeUpper={12}
                    childAges={childAges}
                    onChildAgesChange={setChildAges}
                  />
                </div>
                <div className="flex justify-end sm:justify-start">
                  {minimumStayNotMet ? (
                    <div className="text-xs text-red-600 font-medium">
                      This room requires a minimum stay of {minimumStayRequired}{" "}
                      night
                      {minimumStayRequired > 2 ? "s" : ""}.
                    </div>
                  ) : showQuantitySelector && quantity > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          decrementRoomQuantity(roomTypeId?.toString() || "")
                        }
                      // disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          incrementRoomQuantity(roomTypeId?.toString() || "")
                        }
                        disabled={quantity >= roomsLeft}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        const roomData: any = {
                          roomName,
                          adults: selectedAdults, // Use selected guest count, not room capacity
                          children: selectedChildren, // Use selected guest count, not room capacity
                          mealPlanId:
                            mealPlans[0]?.mealPlanID.toString() || "0",
                          price: price,
                          quantity: 1,
                          roomId: roomTypeId?.toString() || "",
                        };

                        onAddToBooking(roomData);
                      }}
                      disabled={roomsLeft <= 0}
                      style={{ backgroundColor: headerColor }}
                    >
                      Add to Booking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
