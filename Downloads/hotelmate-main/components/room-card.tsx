"use client"

import { useState, useEffect, useCallback } from "react"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bed, Users, Maximize, Check, Baby, Plus, Minus } from "lucide-react"
import { useBooking, type RoomBooking } from "@/components/booking-context"
import type { Room as OriginalRoom } from "@/lib/data"

type Room = OriginalRoom & {
  mainimageurl?: string
  triplerate: number
  sglrate: number
  doublerate: number
  exadultrate: number
  qdplrate: number
  familyerate: number
  maxAdult: number
  maxChild: number
  childrate: number
  roomsize?: number
  childagelower?: number
  childagehigher?: number
  mealPlans: {
    mealplan: string
    mealplandesc: string
    singlerate: number
    doublerate: number
    triplerate: number
    qdplrate: number
    familyerate: number
    childrate: number
    exadultrate: number
  }[]
  // Additional fields from API response
  roomtypedesc: string
  discount: number
  availability: number
  minstay?: number
  popular?: boolean
  defaultMealPlan?: string
  availableMealPlans?: string[]
  bedType?: string
  features?: string[]
  amenities?: string[]
  policies?: string[]
  photos?: string[]
  seq?: number
}
import { useCurrency } from "@/components/currency-context"
import { RoomGuestSelector } from "@/components/room-guest-selector"

interface RoomCardProps {
  room: Room
  isSelected?: boolean
  onToggleSelect?: () => void
  showQuantitySelector?: boolean
}

export function RoomCard({
  room,
  isSelected = false,
  onToggleSelect,
  showQuantitySelector = false,
}: RoomCardProps) {
  const { bookingDetails, addRoom, updateRoom, incrementRoomQuantity, decrementRoomQuantity } = useBooking()
  const { convertPrice, formatPrice } = useCurrency()
  const [showModal, setShowModal] = useState(false)

  // Find if this room is already in the selected rooms
  const selectedRoom = bookingDetails.selectedRooms.find((r) => r.roomId === room.id)
  const quantity = selectedRoom?.quantity || 0

  // Default guest counts for this room
  const [roomAdults, setRoomAdults] = useState(selectedRoom?.adults || 2)
  const [roomChildren, setRoomChildren] = useState(selectedRoom?.children || 0)
  const [childAges, setChildAges] = useState<number[]>([]);
  const [selectedMealPlan, setSelectedMealPlan] = useState(room.defaultMealPlan)

  const [features, setFeatures] = useState<string[]>([])

  const [localPrice, setLocalPrice] = useState(room.price);

  const fetchFeatures = useCallback(async () => {
    try {
      const response = await fetch(`https://ipg.citrusibe.com/API/GetRoomFeatures.aspx?roomtypeid=${room.id}`)
      const data = await response.json()
      const featureList = data.map((item: any) => item.Feature)
      setFeatures(featureList)
    } catch (error) {
      console.error("Failed to fetch room features", error)
    }
  }, [room.id])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  useEffect(() => {
    if (selectedMealPlan) {
      handleMealPlanChange(selectedMealPlan);
    }
  }, []);

  const handleSelectRoom = () => {
    const newRoom: RoomBooking = {
      roomId: room.id,
      roomName: room.name,
      price: localPrice,
      mealPlanId: selectedMealPlan,
      adults: roomAdults,
      children: roomChildren,
      quantity: 1,
    }

    addRoom(newRoom)
  }

  const handleGuestChange = (adults: number, children: number, ages?: number[]) => {
    if (adults > room.maxAdult) adults = room.maxAdult;
    if (children > room.maxChild) children = room.maxChild;
    setRoomAdults(adults);
    setRoomChildren(children);
    if (ages) setChildAges(ages);

    const selectedPlan = room.mealPlans.find(mp => mp.mealplan === selectedMealPlan);
    let rate = 0;

    if (selectedPlan) {
      const childAgeLower = room.childagelower ?? 6;
      const childAgeUpper = room.childagehigher ?? 12;

      let applicableChildren = 0;
      let additionalAdultsFromChildren = 0;

      if (Array.isArray(ages)) {
        ages.forEach(age => {
          if (age >= childAgeLower && age <= childAgeUpper) {
            applicableChildren += 1;
          } else if (age > childAgeUpper) {
            additionalAdultsFromChildren += 1;
          }
        });
      }

      const totalAdults = adults + additionalAdultsFromChildren;
      const totalChildren = applicableChildren;

      switch (totalAdults) {
        case 1:
          rate = selectedPlan.singlerate ?? 0;
          break;
        case 2:
          rate = selectedPlan.doublerate ?? 0;
          break;
        case 3:
          rate = selectedPlan.triplerate ?? 0;
          break;
        case 4:
          rate = selectedPlan.qdplrate ?? 0;
          break;
        default:
          rate = selectedPlan.qdplrate ?? 0;
      }

      const childRate = typeof selectedPlan.childrate === "number" ? selectedPlan.childrate : 0;
      rate += childRate * totalChildren;

      if (!rate) {
        rate = room.price ?? 0;
      }
    } else {
      // fallback if no meal plan is selected
      rate = room.price ?? 0;
    }

    room.price = rate;
    setLocalPrice(rate);
    updateRoom(room.id, { adults, children, price: rate });
  }

  const handleMealPlanChange = (mealPlanId: string) => {
    setSelectedMealPlan(mealPlanId);

    // Find the selected meal plan object
    const selectedPlan = room.mealPlans.find(mp => mp.mealplan === mealPlanId);
    let rate = 0;
    if (selectedPlan) {
      // Child age rules
      const childAgeLower = room.childagelower ?? 6;
      const childAgeUpper = room.childagehigher ?? 12;
      let freeChildren = 0;
      let applicableChildren = 0;
      let additionalAdultsFromChildren = 0;
      if (Array.isArray(childAges) && childAges.length > 0) {
        childAges.forEach(age => {
          if (age < childAgeLower) {
            freeChildren += 1;
          } else if (age >= childAgeLower && age <= childAgeUpper) {
            applicableChildren += 1;
          } else if (age > childAgeUpper) {
            additionalAdultsFromChildren += 1;
          }
        });
      } else {
        // If no ages, fallback to all children as charged
        applicableChildren = roomChildren;
      }
      const totalAdults = roomAdults + additionalAdultsFromChildren;
      const baseRate = (() => {
        switch (totalAdults) {
          case 1: return selectedPlan.singlerate ?? selectedPlan.doublerate ?? 0;
          case 2: return selectedPlan.doublerate ?? 0;
          case 3: return selectedPlan.triplerate ?? selectedPlan.doublerate ?? 0;
          case 4: return selectedPlan.qdplrate ?? selectedPlan.doublerate ?? 0;
          case 5: return selectedPlan.familyerate ?? selectedPlan.doublerate ?? 0;
          default: return selectedPlan.familyerate ?? selectedPlan.doublerate ?? 0;
        }
      })();
      const childRate = typeof selectedPlan.childrate === "number" ? selectedPlan.childrate : 0;
      rate = baseRate + (childRate * applicableChildren);
      // Fallback: if rate is still zero, use room.price if available
      if (!rate) {
        rate = room.price ?? 0;
      }
    } else {
      // fallback to original room price
      rate = room.price ?? 0;
    }
    room.price = rate;
    setLocalPrice(rate);
    updateRoom(room.id, {
      mealPlanId,
      adults: roomAdults,
      children: roomChildren,
      price: rate
    });
  };

  const currentPlan = room.mealPlans.find(mp => mp.mealplan === selectedMealPlan)
  console.log("Current Plan Rates:", currentPlan);

  // Check if same-day booking is available
  const isSameDay = new Date().toDateString() === (bookingDetails.checkIn?.toDateString() || "")

  // Calculate nights and minimum stay enforcement
  const checkIn = new Date(bookingDetails.checkIn);
  const checkOut = new Date(bookingDetails.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const minimumStayNotMet = typeof room.minstay === "number" && room.minstay > 0 && nights < room.minstay;
  console.log("CheckIn:", checkIn, "CheckOut:", checkOut, "Nights:", nights, "MinStay:", room.minstay, "Blocked:", minimumStayNotMet);

  if (!bookingDetails.checkIn || !bookingDetails.checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    console.warn("Invalid check-in/check-out dates. Skipping min stay check.");
  // keep rendering but let user see the restriction visually
  }

  return (
    <div className="overflow-hidden rounded-md border">
    <Card className={`rounded-b-none border-none ${isSelected ? "border-primary border-2" : ""}`}>
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-2 relative h-48 md:h-full">
          <div onClick={() => setShowModal(true)} className="cursor-pointer">
            <Image
              src={room.mainimageurl || "/placeholder.svg?height=300&width=500"}
              alt={room.name}
              fill
              className="object-cover"
            />
          </div>
          {room.popular && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              Popular Choice
            </Badge>
          )}
          {isSameDay && (
            <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">Available Today</Badge>
          )}
        </div>
        <div className="p-4 md:col-span-3 flex flex-col">
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <p className={`text-sm ${(room.availability - quantity) > 5 ? "text-green-600" : "text-amber-600"}`}>
                  {Math.max(0, room.availability - quantity)} rooms left
                </p>
                {typeof room.minstay === "number" && room.minstay > 0 && (
                  <p className={`text-sm ${minimumStayNotMet ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                    Minimum stay: {room.minstay} night{room.minstay > 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatPrice(convertPrice(localPrice))}
                  <span className="text-sm font-normal text-muted-foreground">/period</span>
                </div>
                {room.discount > 0 && (
                  <div className="text-xs text-green-600 font-medium">
                    {room.discount}% off
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 my-3">
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {room.maxAdult} {room.maxAdult === 1 ? "adult" : "adults"}
                  {room.maxChild > 0 && ` and ${room.maxChild} ${room.maxChild === 1 ? "child" : "children"}`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span>{room.bedType}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Maximize className="h-4 w-4 text-muted-foreground" />
                <span>{room.roomsize} sqft</span>
              </div>
            </div>

            {/* Child Policy for this room */}
            {room.childPolicy && (
              <div className="mb-4 flex items-start gap-2 text-sm bg-blue-50 p-2 rounded">
                <Baby className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>{room.childPolicy}</span>
              </div>
            )}

            

            {room.mealPlans.length > 0 && (
              <>
                <ul className="text-sm text-muted-foreground mb-2 list-disc list-inside">
                  {room.mealPlans.map((plan) => (
                    <li key={plan.mealplan}>
                      {plan.mealplandesc} - {formatPrice(convertPrice(plan.doublerate))}/period
                    </li>
                  ))}
                </ul>
                <div className="mb-2">
                  <div className="text-sm font-medium mb-1">Select Meal Plan:</div>
                  <Select onValueChange={handleMealPlanChange} value={selectedMealPlan}>
                    <SelectTrigger className="w-full sm:w-60">
                      <SelectValue placeholder="Choose a meal plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {room.mealPlans.map((plan) => (
                        <SelectItem key={plan.mealplan} value={plan.mealplan}>
                          {plan.mealplandesc} - {formatPrice(convertPrice(plan.doublerate))}/period
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {/* Room-specific guest selector and booking button, side by side */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium mb-2">Guests for this room:</div>
                <RoomGuestSelector
                  adults={roomAdults}
                  children={roomChildren}
                  childAges={childAges}
                  onChange={handleGuestChange}
                  maxGuests={room.capacity}
                  maxAdult={room.maxAdult}
                  maxChild={room.maxChild}
                  childAgeLower={room.childagelower}
                  childAgeUpper={room.childagehigher}
                />
                {/* <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  <p>Child rate: {formatPrice(convertPrice(currentPlan?.childrate ?? 0))} per child</p>
                  <p>Single rate: {formatPrice(convertPrice(currentPlan?.singlerate ?? 0))}</p>
                  <p>Double rate: {formatPrice(convertPrice(currentPlan?.doublerate ?? 0))}</p>
                  <p>Triple rate: {formatPrice(convertPrice(currentPlan?.triplerate ?? 0))}</p>
                  <p>Quadruple rate: {formatPrice(convertPrice(currentPlan?.qdplrate ?? 0))}</p>
                  <p>Family rate: {formatPrice(convertPrice(currentPlan?.familyerate ?? 0))}</p>
                  <p>Extra adult rate: {formatPrice(convertPrice(currentPlan?.exadultrate ?? 0))}</p>
                  <p>Meal plan: {currentPlan?.mealplandesc}</p>
                </div> */}
              </div>
              <div className="flex justify-end sm:justify-start">
                {minimumStayNotMet ? (
                  <div className="text-xs text-red-600 font-medium">
                    This room requires a minimum stay of {room.minstay} night{room.minstay > 1 ? "s" : ""}.
                  </div>
                ) : showQuantitySelector && quantity > 0 ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => decrementRoomQuantity(room.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => incrementRoomQuantity(room.id)}
                      disabled={quantity >= room.availability}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : onToggleSelect ? (
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    onClick={onToggleSelect}
                    className="flex items-center gap-1"
                  >
                    {isSelected ? "Selected" : "Select Room"}
                    {!isSelected && <Plus className="h-4 w-4" />}
                  </Button>
                ) : (
                  <Button onClick={handleSelectRoom}>Add to Booking</Button>
                )}
              </div>
            </div>
          </div>

          {/* The booking button and guest selector are now combined above */}
        </div>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white text-lg"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <Image
              src={room.mainimageurl || "/placeholder.svg?height=800&width=1200"}
              alt={room.name}
              width={1200}
              height={800}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
    </Card>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-4 bg-muted">
      {features.map((feature, index) => (
        <div key={index} className="flex items-center gap-1">
          <Check className="h-3 w-3 text-green-500" />
          <span>{feature}</span>
        </div>
      ))}
    </div>
    </div>
  )
}
