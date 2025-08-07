import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bed, Users, Maximize, Baby } from "lucide-react"
import { useEffect, useState } from "react";
import { getMealPlanById } from "@/controllers/mealPlanController";
import { MealPlan } from "@/types/mealPlan";
import { RoomGuestSelector } from "@/components/room-guest-selector";
import { getHotelRoomTypeById } from "@/controllers/hotelRoomTypeController";
import { HotelRoomType } from "@/types/hotelRoomType";
import { HotelRatePlan } from "@/types/hotelRatePlans";
import { useBooking } from "@/components/booking-context";

interface RoomCardProps {
  roomName: string;
  roomsLeft: number;
  mealPlanId: number;
  onAddToBooking: (room: any) => void;
  onUpdateRoomQuantity?: (roomTypeID: number, delta: number) => void;
  roomTypeID?: number;
  isSelected?: boolean;
  onRemoveFromBooking?: (roomTypeID: number) => void;
  price?: number;
  ratePlansMap?: Record<number, HotelRatePlan[]>;
}

export default function RoomCard({ roomName, roomsLeft, mealPlanId, onAddToBooking, onUpdateRoomQuantity, roomTypeID, isSelected, onRemoveFromBooking, price, ratePlansMap }: RoomCardProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [roomCount, setRoomCount] = useState(1);
  const [roomDetails, setRoomDetails] = useState<HotelRoomType | null>(null);
  const [localPrice, setLocalPrice] = useState<number>(price ?? 0);
  const { updateRoomGuests, getRoomGuests } = useBooking();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
    if (!token || !mealPlanId || !roomTypeID) return;

    const fetchData = async () => {
      try {
        const [plan, room] = await Promise.all([
          getMealPlanById(token, mealPlanId),
          getHotelRoomTypeById({ token, id: roomTypeID })
        ]);
        setMealPlans([plan]);
        setRoomDetails(room);
        const existingGuests = getRoomGuests(roomTypeID ?? -1);
        if (existingGuests) {
          setGuests((prev) => ({
            ...prev,
            adults: existingGuests.adults,
            children: existingGuests.children,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, [mealPlanId, roomTypeID]);

  // console.log("meal plan id",mealPlanId);
  //   console.log("room left",roomsLeft);

  return (
    <div className="overflow-hidden rounded-md border">
      <Card className="rounded-b-none border-none">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative h-48 md:h-full">
            <div className="cursor-pointer">
              <img
                src="/placeholder.svg?height=300&width=500"
                alt={roomName}
                className="object-cover w-full h-full"
                style={{ objectFit: "cover" }}
              />
            </div>
            <Badge className="absolute top-2 left-2" variant="secondary">
              Popular Choice
            </Badge>
            <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
              Available Today
            </Badge>
          </div>
          <div className="p-4 md:col-span-3 flex flex-col">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{roomName}</h3>
                  <p className="text-sm text-green-600">
                    {roomsLeft} rooms left
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Minimum stay: 2 nights
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {price && price > 0 ? `$${price.toFixed(2)}` : "Price on request"}
                    <span className="text-sm font-normal text-muted-foreground">/period</span>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    10% off
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 my-3">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {roomDetails?.adultSpace ?? 2} adults and {roomDetails?.childSpace ?? 1} child
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>{roomDetails?.bedType || "King Bed"}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <span>{roomDetails?.roomSize ?? "300 sqft"}</span>
                </div>
              </div>

              <div className="mb-4 flex items-start gap-2 text-sm bg-blue-50 p-2 rounded">
                <Baby className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>{roomDetails?.roomDescription || "Child policy details go here."}</span>
              </div>

              <>
                <div className="mb-2">
                  <div className="text-sm font-medium mb-1">Select Meal Plan:</div>
                  <select className="w-full sm:w-60 border rounded p-2">
                    {mealPlans.length > 0 ? (
                      mealPlans.map((plan) => (
                        <option key={plan.mealPlanID}>
                          {plan.mealPlan} - ${plan.defaultRate ?? 0}/period
                        </option>
                      ))
                    ) : (
                      <option>Loading meal plans...</option>
                    )}
                  </select>
                </div>
              </>

              <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-2">Guests for this room:</div>
                  <RoomGuestSelector
                    adults={guests.adults}
                    children={guests.children}
                    childAges={[]}
                    onChange={(adults, children, childAges) => {
                      setGuests({ adults, children, rooms: roomCount });

                      const paxKey = `pax${adults}`;
                      const ratePlans = ratePlansMap?.[roomTypeID ?? -1] ?? [];

                      const updatedPrice = ratePlans.reduce((total, plan) => {
                        const rate = plan.hotelRates?.[0]; // Use first rate for now
                        const baseRate = Number(rate?.[paxKey] ?? rate?.defaultRate ?? 0);
                        const childRate = Number(rate?.child ?? 0);
                        return total + baseRate + children * childRate;
                      }, 0);

                      setLocalPrice(updatedPrice);
                      updateRoomGuests(roomTypeID ?? -1, { adults, children, childAges }, updatedPrice);
                    }}
                    maxGuests={(roomDetails?.adultSpace ?? 2) + (roomDetails?.childSpace ?? 1)}
                    maxAdult={roomDetails?.adultSpace ?? 2}
                    maxChild={roomDetails?.childSpace ?? 1}
                    childAgeLower={roomDetails?.childAgeLower ?? 6}
                    childAgeUpper={roomDetails?.childAgeHigher ?? 12}
                  />
                </div>
                <div className="flex justify-end sm:justify-start gap-2">
                  {isSelected ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (roomCount > 1) {
                            setRoomCount(roomCount - 1);
                            if (onUpdateRoomQuantity && roomTypeID !== undefined) {
                              onUpdateRoomQuantity(roomTypeID, -1);
                            }
                          } else {
                            if (onRemoveFromBooking && roomTypeID !== undefined) {
                              onRemoveFromBooking(roomTypeID);
                            }
                          }
                        }}
                      >
                        -
                      </Button>
                      <div className="px-4 py-2 border rounded-md">{roomCount}</div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setRoomCount(roomCount + 1);
                          if (onUpdateRoomQuantity && roomTypeID !== undefined) {
                            onUpdateRoomQuantity(roomTypeID, 1);
                          }
                        }}
                      >
                        +
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        onAddToBooking({
                          roomName,
                          mealPlan: mealPlans[0]?.mealPlan || "Room Only",
                          price: price ?? mealPlans[0]?.defaultRate || 0,
                          guests,
                          count: roomCount,
                          roomTypeID,
                        });
                      }}
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
  )
}
