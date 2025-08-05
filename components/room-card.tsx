import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bed, Users, Maximize, Baby } from "lucide-react"
import { useEffect, useState } from "react";
import { getMealPlanById } from "@/controllers/mealPlanController";
import { MealPlan } from "@/types/mealPlan";
import { GuestSelector } from "@/components/guest-selector";

interface RoomCardProps {
  roomName: string;
  roomsLeft: number;
  mealPlanId: number;
  onAddToBooking: (room: any) => void;
}

export default function RoomCard({ roomName, roomsLeft, mealPlanId, onAddToBooking }: RoomCardProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
    if (!token) return;

    const fetchMealPlans = async () => {
      try {
        const plan = await getMealPlanById(token, mealPlanId);
        setMealPlans([plan]);
      } catch (err) {
        console.error("Failed to fetch meal plans:", err);
      }
    };

    fetchMealPlans();
  }, [mealPlanId]);

  console.log("meal plan id",mealPlanId);
    console.log("room left",roomsLeft);

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
                    $0
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
                    2 adults and 1 child
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>King Bed</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <span>300 sqft</span>
                </div>
              </div>

              <div className="mb-4 flex items-start gap-2 text-sm bg-blue-50 p-2 rounded">
                <Baby className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>Child policy details go here.</span>
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
                  <GuestSelector
                    onChange={(newGuests) => setGuests(newGuests)}
                  />
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    onClick={() =>
                      onAddToBooking({
                        roomName,
                        mealPlan: mealPlans[0]?.mealPlan || "Room Only",
                        price: mealPlans[0]?.defaultRate || 0,
                        guests,
                      })
                    }
                  >
                    Add to Booking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
