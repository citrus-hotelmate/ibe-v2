import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { useBooking } from "@/components/booking-context";

export default function PropertyPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: undefined, to: undefined });
  const [ratePlans, setRatePlans] = useState<HotelRatePlan[] | null>(null);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[] | null>(null);
  const { selectedRooms, removeRoom } = useBooking();
  const selectedRoomIDs = selectedRooms.map((r) => r.roomTypeID);
const [guests, setGuests] = useState<{ adults: number; children: number }>({
  adults: 2,
  children: 0,
});

  const fetchRoomRatesFromNewAPI = async ({
    token,
    hotelId,
    checkIn,
    checkOut,
    adults,
    children,
    setAvailableRooms,
  }: {
    token: string;
    hotelId: number;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
    setAvailableRooms: (rooms: Room[]) => void;
  }) => {
    try {
      const ratePlanData = await getHotelRatePlans({ token, hotelId });
      console.log("Rate plan roomTypeIDs:", ratePlanData.map(p => p.hotelRoomType.hotelRoomTypeID));
      console.log("rate plan", ratePlanData)

      // --- BEGIN PATCHED BLOCK ---
      const paxKey = `pax${adults}`;
      const dateFrom = format(checkIn, "yyyy-MM-dd");
      const dateTo = format(checkOut, "yyyy-MM-dd");

      // Fetch availability data and build map
      const availabilityData = await getHotelRatePlansAvailability({
        token,
        hotelId,
        startDate: dateFrom,
        endDate: dateTo,
      });
      console.log("Availability roomTypeIDs:", availabilityData.map(a => a.roomTypeId));
      console.log("availabilityData", availabilityData);

      const availabilityMap: Record<number, number> = {};
      availabilityData.forEach((item: any) => {
        const minCount = Math.min(...item.availability.map((a: any) => a.count));
        availabilityMap[item.roomTypeId] = minCount;
      });

      // Patch: show all rooms from availability, even if no rate plan
      const ratePlanMap: Record<number, any[]> = {};
      ratePlanData.forEach((item) => {
        const roomTypeId = item.hotelRoomType.hotelRoomTypeID;
        if (!ratePlanMap[roomTypeId]) ratePlanMap[roomTypeId] = [];
        ratePlanMap[roomTypeId].push(item);
      });

      const filteredRooms: Room[] = availabilityData.map((item: any) => {
        const roomTypeId = item.roomTypeId;
        const availabilityCount = availabilityMap[roomTypeId];
        if (availabilityCount === undefined || availabilityCount === 0) return null;

        const ratePlans = ratePlanMap[roomTypeId] || [];
        const first = ratePlans[0];

        const roomType = first?.hotelRoomType || {
          hotelRoomTypeID: roomTypeId,
          roomType: item.roomType,
          roomDescription: "",
          noOfRooms: item.roomCount,
          adultSpace: 2,
          childSpace: 0,
        };

        const mealPlan = first?.mealPlanMaster;
        const hotel = first?.hotelMaster;

        const totalRate = ratePlans.length > 0
          ? ratePlans.reduce((sum, entry) => {
            const rateObj = entry.hotelRates.find((rate: any) => {
              const date = new Date(rate.rateDate).toISOString().split("T")[0];
              return date >= dateFrom && date <= dateTo;
            });
            const baseRate = Number(rateObj?.[paxKey] ?? rateObj?.defaultRate ?? 0);
            const childRate = Number(rateObj?.child ?? 0);
            return sum + baseRate + children * childRate;
          }, 0)
          : 0;

        return {
          id: roomType.hotelRoomTypeID,
          name: roomType.roomType,
          description: roomType.roomDescription || "",
          mainimageurl: hotel?.hotelImage || "",
          price: totalRate,
          capacity: roomType.adultSpace + roomType.childSpace,
          maxAdult: roomType.adultSpace,
          maxChild: roomType.childSpace,
          available: availabilityMap[roomType.hotelRoomTypeID] ?? roomType.noOfRooms,
          mealPlan: mealPlan?.mealPlan || "",
          mealplandesc: mealPlan?.mealPlan || "",
          triplerate: first?.hotelRates?.[0]?.pax3 ?? 0,
          doublerate: first?.hotelRates?.[0]?.pax2 ?? 0,
          sglrate: first?.hotelRates?.[0]?.pax1 ?? 0,
          qdplrate: first?.hotelRates?.[0]?.pax4 ?? 0,
          familyerate: first?.hotelRates?.[0]?.pax5 ?? 0,
          exadultrate: first?.hotelRates?.[0]?.pax6 ?? 0,
          childrate: first?.hotelRates?.[0]?.child ?? 0,
          childagelower: 0,
          childagehigher: 17,
          features: [],
          amenities: [],
          policies: [],
          photos: [],
          availability: roomType.noOfRooms,
          popular: false,
          defaultMealPlan: mealPlan?.mealPlan ?? "",
          availableMealPlans: [mealPlan?.mealPlan ?? ""],
          bedType: "Standard",
          roomsize: "",
          seq: 0,
        };
      }).filter(Boolean);

      filteredRooms.sort((a, b) => (a?.price ?? 0) - (b?.price ?? 0));
      setAvailableRooms(filteredRooms);
      // --- END PATCHED BLOCK ---
    } catch (error) {
      console.error("Error fetching room rates:", error);
    }
  };


  // Fetch available rooms only on button click, not automatically.
  console.log("available :", availableRooms);

  // Handler to fetch available rooms on button click
  const handleViewAvailableRooms = async () => {
    try {
      const hotelDataString = localStorage.getItem("hotelData");
      if (!hotelDataString) return;

      const hotelData = JSON.parse(hotelDataString);
      const hotelId = hotelData.hotelID;
      const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
      if (!token || !hotelId || !dateRange.from || !dateRange.to) {
        alert("Missing token, hotel ID, or date range.");
        return;
      }

      await fetchRoomRatesFromNewAPI({
        token,
        hotelId,
        checkIn: dateRange.from,
        checkOut: dateRange.to,
        adults: guests.adults, // pull from guest selector
        children: guests.children,
        setAvailableRooms,
      });
    } catch (error) {
      console.error("Error loading room data:", error);
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
              <GuestSelector
                adults={guests.adults}
                children={guests.children}
                onChange={(adults, children) => setGuests({ adults, children })}
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
                    key={roomGroup.id}
                    roomName={roomGroup.name}
                    roomsLeft={roomGroup.available}
                    mealPlanId={mealPlanMap[roomGroup.id] || 0}
                    roomTypeID={roomGroup.id}
                    price={roomGroup.price}
                    onAddToBooking={(room) => {
                      // no-op here; handled in context
                    }}
                    onRemoveFromBooking={(roomTypeID) => {
                      removeRoom(roomTypeID);
                    }}
                    onUpdateRoomQuantity={(roomTypeID, delta) => {
                      // optional logic if needed later
                    }}
                    isSelected={selectedRoomIDs.includes(roomGroup.id)}
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
                            <span>{(availableRooms?.find(r => r.id === room.roomTypeID)?.name.toUpperCase()) || "Unnamed Room"}</span>
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
                              removeRoom(room.roomTypeID);
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