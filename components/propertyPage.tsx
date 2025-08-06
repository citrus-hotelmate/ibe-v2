import { useState, useEffect } from "react";
// TypeScript interfaces for hotel room types and rate plans
interface HotelRoomType {
  hotelRoomTypeID: number;
  roomType: string;
  noOfRooms: number;
  adultSpace: number;
  childSpace: number;
}

interface HotelRatePlan {
  hotelRatePlanID: number;
  hotelID: number;
  defaultRate: number;
  currencyCode: string;
  hotelRoomType: HotelRoomType;
}
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { GuestSelector } from "@/components/guest-selector";
import { DateRangePicker } from "react-date-range";
import { getHotelRatePlans, getHotelRatePlansAvailability } from "@/controllers/hotelRatePlansController";
import { getAvailableRooms } from "@/controllers/roomTypeController";
import { AvailableRoom } from "@/types/roomType";
import RoomCard from "@/components/room-card";

export default function PropertyPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: undefined, to: undefined });
  const [ratePlans, setRatePlans] = useState<HotelRatePlan[] | null>(null);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[] | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [selectedRoomIDs, setSelectedRoomIDs] = useState<number[]>([]);

  useEffect(() => {
    const fetchRatePlans = async () => {
      try {
        const hotelDataString = localStorage.getItem("hotelData");
        if (!hotelDataString) return;
        const hotelData = JSON.parse(hotelDataString);
        const hotelId = hotelData.hotelID;

        console.log("Fetching rate plans for hotel ID:", hotelId);

        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
        if (!token || !hotelId) return;

        const data = await getHotelRatePlans({ token, hotelId });
        setRatePlans(data);
        console.log("Hotel Rate Plans length:", data.length);
        console.log("Hotel Rate Plans", data)
      } catch (error) {
        console.error("Failed to fetch hotel rate plans:", error);
      }
    };

    fetchRatePlans();
  }, []);


  // Fetch available rooms only on button click, not automatically.
  console.log("available :", availableRooms);

  // Handler to fetch available rooms on button click
  const handleViewAvailableRooms = async () => {
    if (!ratePlans || ratePlans.length === 0) return;

    try {
      const hotelDataString = localStorage.getItem("hotelData");
      if (!hotelDataString) return;

      const hotelData = JSON.parse(hotelDataString);
      const hotelId = hotelData.hotelID;
      const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
      if (!token || !hotelId) return;

      const checkInDate = dateRange.from ? dateRange.from.toISOString().split("T")[0] : "";
      const checkOutDate = dateRange.to ? dateRange.to.toISOString().split("T")[0] : "";
      if (!checkInDate || !checkOutDate) {
        alert("Please select check-in and check-out dates.");
        return;
      }

      const ratePlansAvailability = await getHotelRatePlansAvailability({
        token,
        hotelId,
        startDate: checkInDate,
        endDate: checkOutDate,
      });
      console.log("Hotel Rate Plans Availability:", ratePlansAvailability);

      // Transform ratePlansAvailability into grouped room data for RoomCard
      const groupedRooms = ratePlansAvailability.map((room: any) => {
        const minAvailableCount = Math.min(...room.availability.map((a: any) => a.count));
        return {
          roomTypeID: room.roomTypeId,
          roomType: room.roomType,
          rooms: Array(minAvailableCount).fill({})  // mock room entries based on min availability
        };
      });

      setAvailableRooms(groupedRooms);

    } catch (error) {
      console.error("Failed to fetch hotel rate plans availability:", error);
    }
  };

  // Create a mapping from roomTypeID to mealPlanID
  const mealPlanMap = ratePlans
    ? ratePlans.reduce((acc: Record<number, number>, plan: any) => {
      acc[plan.hotelRoomType.hotelRoomTypeID] = plan.mealPlanID;
      return acc;
    }, {})
    : {};


  return (
    <div className="container max-w-10xl mx-auto">
      {/* Top Bar: Dates, Guests, Promo, Button */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in / Check-out</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full justify-start text-left font-normal border border-gray-300 rounded-md p-2 flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {dateRange.from && dateRange.to
                        ? `${dateRange.from.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} - ${dateRange.to.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} (${Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} ${Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) === 1 ? "night" : "nights"})`
                        : "Select dates"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateRangePicker
                    onChange={(item) => {
                      if (item.selection.startDate && item.selection.endDate) {
                        console.log("Date range changed:", item.selection);
                        setDateRange({
                          from: item.selection.startDate,
                          to: item.selection.endDate
                        });
                      }
                    }}
                    moveRangeOnFirstSelection={false}
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
              <GuestSelector />
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

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Tabs */}
          <Tabs value="rooms" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="promotions">Promotions</TabsTrigger>
            </TabsList>
            <TabsContent value="rooms" className="pt-4">
              <h2 className="text-xl font-semibold mb-4">Available Room Types</h2>
              {availableRooms && availableRooms.length > 0 ? (
                availableRooms.map((roomGroup: any) => (
                  <RoomCard
                    key={roomGroup.roomTypeID}
                    roomName={roomGroup.roomType}
                    roomsLeft={roomGroup.rooms.length}
                    mealPlanId={mealPlanMap[roomGroup.roomTypeID] || 0}
                    roomTypeID={roomGroup.roomTypeID}
                    onAddToBooking={(room) => {
                      setSelectedRooms((prev) => [...prev, {...room, roomCount: 1}]);
                      if (room.roomTypeID !== undefined) {
                        setSelectedRoomIDs((prev) => [...prev, room.roomTypeID]);
                      }
                    }}
                    onRemoveFromBooking={(roomTypeID) => {
                      setSelectedRooms((prev) => prev.filter((r) => r.roomTypeID !== roomTypeID));
                      setSelectedRoomIDs((prev) => prev.filter((id) => id !== roomTypeID));
                    }}
                    onUpdateRoomQuantity={(roomTypeID, delta) => {
                      setSelectedRooms((prev) => prev.map(room => 
                        room.roomTypeID === roomTypeID 
                          ? { ...room, roomCount: (room.roomCount || 1) + delta }
                          : room
                      ));
                    }}
                    isSelected={selectedRoomIDs.includes(roomGroup.roomTypeID)}
                  />
                ))
              ) : (
                <p>No rooms available.</p>
              )}
            </TabsContent>
            <TabsContent value="packages" className="pt-4">
              <h2 className="text-xl font-semibold mb-4">Available Packages</h2>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground">No packages available at the moment.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="promotions" className="pt-4">
              <h2 className="text-xl font-semibold mb-4">Available Promotions</h2>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground">No promotions available at the moment.</p>
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
                    {dateRange.from && dateRange.to ? (
                      <span>
                        {dateRange.from.toLocaleDateString('en-US', { month: "short", day: "numeric" })} -{" "}
                        {dateRange.to.toLocaleDateString('en-US', { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    ) : (
                      <span>Select dates</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Guests</span>
                    {selectedRooms.length > 0 ? (
                      (() => {
                        const totalAdults = selectedRooms.reduce((sum, r) => sum + (r.guests?.adults || 0), 0);
                        const totalChildren = selectedRooms.reduce((sum, r) => sum + (r.guests?.children || 0), 0);
                        const totalGuests = totalAdults + totalChildren;
                        return (
                          <span>
                            {totalGuests} Guests ({totalAdults} Adults
                            {totalChildren > 0 ? `, ${totalChildren} Children` : ""})
                          </span>
                        );
                      })()
                    ) : (
                      <span>0 adults</span>
                    )}
                  </div>
                    <div className="pt-2 mt-2 border-t">
                      <div className="font-medium mb-2">Selected Rooms:</div>
                      {selectedRooms.length > 0 ? (
                        selectedRooms.map((room, idx) => (
                          <div key={idx} className="border p-3 mb-2 rounded-md text-sm relative">
                            <div className="flex justify-between font-semibold mb-1">
                              <span>{room.roomName.toUpperCase()}</span>
                              <span>${room.price.toFixed(2)}/period</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>{room.roomCount || 1} room{(room.roomCount || 1) > 1 ? 's' : ''} • {room.guests?.adults || 0} adult{room.guests?.adults > 1 ? "s" : ""}</span>
                              <span>Total: ${((room.price || 0) * (room.roomCount || 1)).toFixed(2)}</span>
                            </div>
                            <div className="text-muted-foreground">Meal Plan: {room.mealPlan}</div>
                            <button
                              className="absolute bottom-2 right-2 text-red-500 hover:text-red-700"
                              onClick={() => {
                                const updated = [...selectedRooms];
                                const removed = updated.splice(idx, 1)[0];
                                setSelectedRooms(updated);
                                if (removed.roomTypeID !== undefined) {
                                  setSelectedRoomIDs((prev) => prev.filter((id) => id !== removed.roomTypeID));
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No rooms selected.</div>
                      )}
                    </div>
                </div>
                <div className="pt-4 mt-4 border-t">
                  <div className="flex justify-between font-medium text-sm">
                    <span>Total</span>
                    <span>${selectedRooms.reduce((sum, r) => sum + ((r.price || 0) * (r.roomCount || 1)), 0).toFixed(2)}</span>
                  </div>
                </div>
                <br />
                <Button className="w-full">Proceed to Booking</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}