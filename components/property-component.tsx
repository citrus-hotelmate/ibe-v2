import { useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getHotelRoomTypeImagesByHotelId } from "@/controllers/hotelRoomTypeImageController";
import { CalendarIcon, Trash2 } from "lucide-react";
import { GuestSelector } from "@/components/guest-selector";
import { DateRangePicker } from "react-date-range";
import {
  getHotelRatePlanAvailability,
  getHotelRatePlans,
} from "@/controllers/hotelRatePlansController";
import { AvailableRoom } from "@/types/roomType";
import RoomCard from "@/components/room-card";
import { HotelRatePlan } from "@/types/hotelRatePlans";
import { useBooking } from "@/components/booking-context";

export default function PropertyPage() {
  // Get booking context
  const { bookingDetails, updateBookingDetails, addRoom } = useBooking();

  // Helper function to calculate minimum available rooms across dates
  const calculateMinimumAvailability = (availability: Array<{date: string, count: number}>) => {
    if (!availability || availability.length === 0) return 0;
    return Math.min(...availability.map(item => item.count));
  };

  // Initialize local state from booking context if available and keep them in sync
  useEffect(() => {
    // Sync dates from booking context
    if (bookingDetails.checkIn && bookingDetails.checkOut) {
      setDateRange({
        from: bookingDetails.checkIn,
        to: bookingDetails.checkOut,
      });
    }
    
    // Sync guests from booking context
    if (bookingDetails.adults !== undefined && bookingDetails.children !== undefined) {
      setGuests({
        adults: bookingDetails.adults,
        children: bookingDetails.children,
        rooms: bookingDetails.rooms || 1,
      });
    }
  }, [bookingDetails.checkIn, bookingDetails.checkOut, bookingDetails.adults, bookingDetails.children, bookingDetails.rooms]);

  // One-time initialization effect to ensure we load any existing booking context data on mount
  useEffect(() => {
    console.log("🔧 Initializing property component with booking context:", {
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      adults: bookingDetails.adults,
      children: bookingDetails.children,
      rooms: bookingDetails.rooms
    });
  }, []);

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: bookingDetails.checkIn || undefined,
    to: bookingDetails.checkOut || undefined,
  });
  const [ratePlans, setRatePlans] = useState<HotelRatePlan[] | null>(null);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[] | null>(
    null
  );
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [roomTypeImages, setRoomTypeImages] = useState<Record<number, string>>({});
  const [currentHotelId, setCurrentHotelId] = useState<number | null>(null);
  const [guests, setGuests] = useState<{
    adults: number;
    children: number;
    rooms: number;
  }>({
    adults: bookingDetails.adults || 2,
    children: bookingDetails.children || 0,
    rooms: bookingDetails.rooms || 1,
  });

  // Detect hotel changes and update currentHotelId
  useEffect(() => {
    const hotelDataString = localStorage.getItem("selectedHotel");
    if (hotelDataString) {
      try {
        const hotelData = JSON.parse(hotelDataString);
        const newHotelId = hotelData.id;
        
        // Only update if hotel actually changed
        if (newHotelId !== currentHotelId) {
          console.log("🏨 Hotel changed from", currentHotelId, "to", newHotelId);
          setCurrentHotelId(newHotelId);
          
          // Clear previous hotel data
          setRatePlans(null);
          setAvailableRooms(null);
          setRoomTypeImages({});
        }
      } catch (error) {
        console.error("Failed to parse selectedHotel from localStorage", error);
      }
    }
  }, []); // Run once on mount, then we'll use an interval to detect changes

  // Poll for hotel changes in localStorage (since localStorage changes don't trigger React updates across components)
  useEffect(() => {
    const checkForHotelChanges = () => {
      const hotelDataString = localStorage.getItem("selectedHotel");
      if (hotelDataString) {
        try {
          const hotelData = JSON.parse(hotelDataString);
          const newHotelId = hotelData.id;
          
          if (newHotelId !== currentHotelId) {
            console.log("🏨 Hotel changed detected via polling:", currentHotelId, "→", newHotelId);
            setCurrentHotelId(newHotelId);
            
            // Clear previous hotel data
            setRatePlans(null);
            setAvailableRooms(null);
            setRoomTypeImages({});
          }
        } catch (error) {
          console.error("Failed to parse selectedHotel from localStorage", error);
        }
      }
    };

    // Check every 500ms for hotel changes
    const interval = setInterval(checkForHotelChanges, 500);
    
    return () => clearInterval(interval);
  }, [currentHotelId]);

  // Fetch initial data when hotel changes
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentHotelId) return;
      
      try {
        console.log("🔄 Fetching initial data for hotel ID:", currentHotelId);
        
        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
        if (!token) return;

        // Fetch rate plans
        const ratePlansData = await getHotelRatePlans({ token, hotelId: currentHotelId });
        setRatePlans(ratePlansData);

        // Fetch room type images
        const imagesData = await getHotelRoomTypeImagesByHotelId({ hotelId: currentHotelId, token });
        console.log('Room Type Images Data:', imagesData);
        const imagesMap = imagesData.reduce((acc: Record<number, string>, img) => {
          // Check if it's the main image and has a URL
          if (img.hotelRoomTypeID && img.isMain && img.imageURL) {
            // Trim the URL to remove query parameters
            const trimmedUrl = img.imageURL.split('?')[0];
            console.log('Room Type ID:', img.hotelRoomTypeID, 'Original URL:', img.imageURL, 'Trimmed URL:', trimmedUrl);
            acc[img.hotelRoomTypeID] = trimmedUrl;
          }
          return acc;
        }, {});
        console.log('Final Images Map:', imagesMap);
        setRoomTypeImages(imagesMap);
        
        console.log("✅ Initial data fetched successfully for hotel ID:", currentHotelId);
      } catch (error) {
        console.error("❌ Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
  }, [currentHotelId]); // Now depends on currentHotelId!

  // Manual refresh handler (backup option)
  const handleViewAvailableRooms = async () => {
    if (!dateRange.from || !dateRange.to) {
      alert("Please select check-in and check-out dates.");
      return;
    }
    
    if (!ratePlans || ratePlans.length === 0) {
      alert("Hotel rate plans are still loading. Please try again in a moment.");
      return;
    }

    if (!currentHotelId) {
      alert("Hotel information not available. Please refresh the page.");
      return;
    }

    // Since live filtering is already working, this is mainly for manual refresh
    console.log("🔄 Manual refresh triggered for hotel ID:", currentHotelId);
    setIsLoadingRooms(true);
    
    try {
      const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
      
      if (!token) {
        alert("Configuration error. Please refresh the page.");
        return;
      }

      const startDate = dateRange.from.toISOString().split("T")[0];
      const endDate = dateRange.to.toISOString().split("T")[0];

      const rooms = await getHotelRatePlanAvailability({
        hotelId: currentHotelId,
        startDate,
        endDate,
        token,
      });

      const totalGuestCount = guests.adults + guests.children;

      const filteredRooms = rooms
        .filter((item: any) => {
          const roomTotalCapacity = item.adultCount + item.childCount;
          return roomTotalCapacity >= totalGuestCount;
        })
        .map((item: any) => {
          const minAvailability = calculateMinimumAvailability(item.availability);
          return {
            ...item,
            totalCapacity: item.adultCount + item.childCount,
            minRoomsLeft: minAvailability,
          };
        });
        
      const groupedRooms = Object.values(
        filteredRooms.reduce((acc: any, room: any) => {
          if (!acc[room.roomTypeId]) {
            acc[room.roomTypeId] = {
              roomTypeID: room.roomTypeId,
              roomType: room.roomType,
              roomCount: room.minRoomsLeft,
              totalCapacity: room.totalCapacity,
              adultCount: room.adultCount,
              childCount: room.childCount,
              averageRate: room.averageRate,
              rooms: [],
            };
          }
          acc[room.roomTypeId].rooms.push(room);
          return acc;
        }, {})
      ) as AvailableRoom[];

      setAvailableRooms(groupedRooms);
      console.log("✅ Manual refresh completed");
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
      alert("Failed to fetch available rooms. Please try again.");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Create a mapping from roomTypeID to mealPlanID
  const mealPlanMap = ratePlans
    ? ratePlans.reduce((acc: Record<number, number>, plan: any) => {
      acc[plan.hotelRoomType.hotelRoomTypeID] = plan.mealPlanID;
      return acc;
    }, {})
    : {};

  // Live filtering effect - automatically fetch rooms when dates or guests change
  useEffect(() => {
    const fetchRoomsForDateRange = async () => {
      if (
        !dateRange.from ||
        !dateRange.to ||
        !ratePlans ||
        ratePlans.length === 0 ||
        !currentHotelId
      )
        return;
      
      setIsLoadingRooms(true);
      let allRooms: any[] = [];
      try {
        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
        if (!token) return;

        const startDate = dateRange.from.toISOString().split("T")[0];
        const endDate = dateRange.to.toISOString().split("T")[0];

        console.log("🔄 Live filtering rooms for hotel ID:", currentHotelId, "dates:", startDate, "to", endDate);

        const rooms = await getHotelRatePlanAvailability({
          hotelId: currentHotelId,
          startDate,
          endDate,
          token,
          rateCodeId: 2
        });
        allRooms = rooms;

        // Calculate total number of guests
        const totalGuestCount = guests.adults + guests.children;

        // Filter rooms that have sufficient capacity for all guests
        const filteredRooms = allRooms
          .filter((item: any) => {
            const roomTotalCapacity = item.adultCount + item.childCount;
            return roomTotalCapacity >= totalGuestCount;
          })
          .map((item: any) => {
            // Calculate minimum availability across the stay period
            const minAvailability = calculateMinimumAvailability(item.availability);
            return {
              ...item,
              totalCapacity: item.adultCount + item.childCount,
              minRoomsLeft: minAvailability,
            };
          });

        // Process the rooms after fetching
        const groupedRooms = Object.values(
          filteredRooms.reduce((acc: any, room: any) => {
            if (!acc[room.roomTypeId]) {
              acc[room.roomTypeId] = {
                roomTypeID: room.roomTypeId,
                roomType: room.roomType,
                roomCount: room.minRoomsLeft, // Use minimum availability instead of total room count
                totalCapacity: room.totalCapacity,
                adultCount: room.adultCount,
                childCount: room.childCount,
                averageRate: room.averageRate,
                rooms: [],
              };
            }
            acc[room.roomTypeId].rooms.push(room);
            return acc;
          }, {})
        ) as AvailableRoom[];
        
        console.log("✅ Live filtered rooms updated:", groupedRooms.length, "room types");
        console.log("Rooms types:", groupedRooms.map(room => room.roomType).join(", "));
        setAvailableRooms(groupedRooms);
      } catch (err) {
        console.error("❌ Error in live room filtering:", err);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRoomsForDateRange();
  }, [
    currentHotelId,  // Added this - now triggers when hotel changes!
    ratePlans,
    dateRange.from,
    dateRange.to,
    guests.adults,
    guests.children,
  ]);

  return (
    <div className="container w-full max-w-[98rem]">
      {/* Top Bar: Dates, Guests, Promo, Button */}
      <Card className="mb-4 mx-2">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Check-in / Check-out
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full justify-start text-left font-normal border border-gray-300 rounded-md p-2 flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {dateRange.from && dateRange.to
                        ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                        : "Select dates"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateRangePicker
                    onChange={(item) => {
                      const from = item.selection.startDate;
                      const to = item.selection.endDate;
                      setDateRange({ from, to });

                      // Update booking context with the selected dates
                      updateBookingDetails({
                        checkIn: from,
                        checkOut: to,
                      });
                    }}
                    moveRangeOnFirstSelection={false}
                    minDate={new Date()} // This disables all past dates
                    ranges={[
                      {
                        startDate: dateRange.from || new Date(),
                        endDate: dateRange.to || new Date(),
                        key: "selection",
                      },
                    ]}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Guests</label>
              <GuestSelector 
                setGuestCount={setGuests}
                onChange={(guestData) => {
                  // Update local state
                  setGuests(guestData);
                  // Update booking context to keep in sync
                  updateBookingDetails({
                    adults: guestData.adults,
                    children: guestData.children,
                    rooms: guestData.rooms,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Promo Code</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter promo code"
                value=""
                readOnly
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleViewAvailableRooms}>
                View Available Rooms
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-8 mx-2">
        <div className="md:col-span-2">
          {/* Tabs */}
          <Tabs value="rooms" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="promotions">Promotions</TabsTrigger>
            </TabsList>
            <TabsContent value="rooms" className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Available Room Types
                </h2>
              </div>
              {isLoadingRooms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                    <span className="text-muted-foreground">Loading available rooms...</span>
                  </div>
                </div>
              ) : availableRooms && availableRooms.length > 0 ? (
                availableRooms.map((roomGroup: any) => (
                  <RoomCard
                    key={roomGroup.roomTypeID}
                    roomName={roomGroup.roomType}
                    roomsLeft={roomGroup.roomCount}
                    mealPlanId={mealPlanMap[roomGroup.roomTypeID] || 0}
                    averageRate={roomGroup.averageRate}
                    onAddToBooking={(room) => {
                      // Add the selected room to booking context
                      addRoom({
                        roomId: String(roomGroup.roomTypeID), // Use consistent numeric ID from API
                        roomName: roomGroup.roomType,
                        price: room.price || 0,
                        mealPlanId: String(
                          mealPlanMap[roomGroup.roomTypeID] || 0
                        ),
                        adults: room.adults || 0, // Use selected guest count from room card
                        children: room.children || 0, // Use selected guest count from room card
                        quantity: 1,
                        averageRate: roomGroup.averageRate || 0
                      });
                    }}
                    adultCount={roomGroup.adultCount}
                    childCount={roomGroup.childCount}
                    roomTypeId={roomGroup.roomTypeID}
                    imageUrl={roomTypeImages[roomGroup.roomTypeID]}
                    showQuantitySelector={
                      Array.isArray(bookingDetails.selectedRooms) &&
                      bookingDetails.selectedRooms.some(
                        (r) => r.roomId === String(roomGroup.roomTypeID)
                      )
                    }
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {dateRange.from && dateRange.to 
                      ? "No rooms available for the selected dates and guest count." 
                      : "Please select check-in and check-out dates to view available rooms."}
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="packages" className="pt-4">
              <h2 className="text-xl font-semibold mb-4">Available Packages</h2>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground">
                    No packages available at the moment.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="promotions" className="pt-4">
              <h2 className="text-xl font-semibold mb-4">
                Available Promotions
              </h2>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground">
                    No promotions available at the moment.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* Reservation Summary Card */}
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
                        ? `${bookingDetails.checkIn.toLocaleDateString()} - ${bookingDetails.checkOut.toLocaleDateString()}`
                        : "Select dates"}
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t">
                    <div className="font-medium mb-2">Selected Rooms:</div>
                    {bookingDetails.selectedRooms &&
                      bookingDetails.selectedRooms.length > 0 ? (
                      bookingDetails.selectedRooms.map(
                        (room: any, idx: number) => (
                          <div
                            key={`${room.roomId}-${idx}`}
                            className="flex flex-col mb-4 border border-separate border-spacing-8 p-2"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold">
                                  {room.roomName.toUpperCase()}
                                </div>
                                <div className="text-sm text-gray-600">
                                   {room.quantity} room • {room.adults} adults • {room.children} children
                                </div>
                                <div className="text-sm text-gray-600">
                                  Meal Plan:{" "}
                                  {room.mealPlanId === "1"
                                    ? "BB"
                                    : room.mealPlanId}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  $
                                  {(() => {
                                    if (!dateRange.from || !dateRange.to) return '0.00';
                                    const nights = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
                                    return ((room.averageRate || 0) * nights * room.quantity).toFixed(2);
                                  })()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  ${(() => {
                                    if (!dateRange.from || !dateRange.to) return '0.00';
                                    const nights = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
                                    return ((room.averageRate || 0) * nights * room.quantity).toFixed(2);
                                  })()}/night
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end mt-2 mb-2">
                              <button
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  // Create a new array without the room that's being deleted
                                  const updatedRooms =
                                    bookingDetails.selectedRooms.filter(
                                      (_, i) => i !== idx
                                    );
                                  // Update the booking context
                                  updateBookingDetails({
                                    selectedRooms: updatedRooms,
                                    totalPrice: updatedRooms.reduce(
                                      (total, r) =>
                                        total + r.price * r.quantity,
                                      0
                                    ),
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No rooms selected.
                      </div>
                    )}
                  </div>
                </div>
                {bookingDetails.checkIn &&
                  bookingDetails.checkOut &&
                  bookingDetails.checkIn.toDateString() ===
                  new Date().toDateString() && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-md mt-4 mb-2">
                      <div className="rounded-full bg-green-100 p-1">
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
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                      <span className="text-sm">
                        Same-day check-in available!
                      </span>
                    </div>
                  )}
                <div className="pt-4 mt-4 border-t">
                  <div className="flex justify-between font-medium text-sm">
                    <span>Total</span>
                    <span>
                      $
                      {(() => {
                        if (
                          !dateRange.from ||
                          !dateRange.to ||
                          !bookingDetails.selectedRooms ||
                          bookingDetails.selectedRooms.length === 0
                        )
                          return "0.00";
                        const nights = Math.ceil(
                          (dateRange.to.getTime() - dateRange.from.getTime()) /
                          (1000 * 60 * 60 * 24)
                        );
                        const total = bookingDetails.selectedRooms.reduce(
                          (acc, room) =>
                            acc + (room.averageRate || 0) * room.quantity,
                          0
                        );
                        return (total * nights).toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
                <br />
                <Button
                  className="w-full"
                  onClick={() => {
                    // Only proceed if at least one room is selected and dates are set
                    if (
                      bookingDetails.selectedRooms.length > 0 &&
                      bookingDetails.checkIn &&
                      bookingDetails.checkOut
                    ) {
                      window.location.href = "/book";
                    } else {
                      alert(
                        "Please select dates and at least one room to proceed"
                      );
                    }
                  }}
                >
                  Proceed to Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}