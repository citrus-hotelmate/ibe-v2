// use client
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Users, Minus, Plus } from "lucide-react"
import { useBooking } from "@/components/booking-context"

export function GuestSelector({ 
  setGuestCount,
  onChange,
  initialAdults,
  initialChildren,
  initialRooms,
  useContextValues = true
}: { 
  setGuestCount?: (guests: { adults: number; children: number; rooms: number }) => void;
  onChange?: (guests: { adults: number; children: number; rooms: number }) => void;
  initialAdults?: number;
  initialChildren?: number;
  initialRooms?: number;
  useContextValues?: boolean;
}) {
  const { bookingDetails, updateBookingDetails } = useBooking()
  const [open, setOpen] = useState(false)
  const [headerColor, setHeaderColor] = useState("#792868")

  useEffect(() => {
    const selectedHotelStr = localStorage.getItem("selectedHotel")
    if (selectedHotelStr) {
      try {
        const selectedHotel = JSON.parse(selectedHotelStr)
        if (selectedHotel.ibeHeaderColour) {
          setHeaderColor(selectedHotel.ibeHeaderColour)
        }
      } catch (error) {
        console.error("Failed to parse selectedHotel from localStorage", error)
      }
    }
  }, [])
  
  // Local state for when not using context values
  const [localAdults, setLocalAdults] = useState(initialAdults ?? 2)
  const [localChildren, setLocalChildren] = useState(initialChildren ?? 0)
  const [localRooms, setLocalRooms] = useState(initialRooms ?? 1)

  useEffect(() => {
    // Update local state when props change
    if (initialAdults !== undefined) setLocalAdults(initialAdults)
    if (initialChildren !== undefined) setLocalChildren(initialChildren)
    if (initialRooms !== undefined) setLocalRooms(initialRooms)
  }, [initialAdults, initialChildren, initialRooms])

  useEffect(() => {
    if (
      useContextValues &&
      bookingDetails.adults == null &&
      bookingDetails.children == null &&
      bookingDetails.rooms == null
    ) {
      updateBookingDetails({ adults: initialAdults ?? 2, children: initialChildren ?? 0, rooms: initialRooms ?? 1 });
    }
  }, [useContextValues]);

  // Use either context values or local state based on useContextValues prop
  const adults = useContextValues 
    ? (bookingDetails.adults != null ? bookingDetails.adults : 2)
    : localAdults;
  const children = useContextValues 
    ? (bookingDetails.children != null ? bookingDetails.children : 0)
    : localChildren;
  const rooms = useContextValues 
    ? (bookingDetails.rooms != null ? bookingDetails.rooms : 1)
    : localRooms;

  const handleAdultChange = (change: number) => {
    const newValue = Math.max(1, Math.min(10, adults + change))
    
    if (useContextValues) {
      updateBookingDetails({ adults: newValue })
    } else {
      setLocalAdults(newValue)
    }
    
    onChange?.({ adults: newValue, children, rooms })
  }

  const handleChildrenChange = (change: number) => {
    const newValue = Math.max(0, Math.min(6, children + change))
    
    if (useContextValues) {
      updateBookingDetails({ children: newValue })
    } else {
      setLocalChildren(newValue)
    }
    
    onChange?.({ adults, children: newValue, rooms })
  }

  const totalGuests = adults + children

  // Update the guest count with the latest values whenever they change
  useEffect(() => {
    setGuestCount({ adults, children, rooms });
    
    // If using context, ensure the context is updated
    if (useContextValues) {
      updateBookingDetails({ 
        adults, 
        children, 
        rooms 
      });
    }
  }, [adults, children, rooms, setGuestCount, useContextValues]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Users className="mr-2 h-4 w-4" style={{ color: headerColor }} />
          <span>
            {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"} ({adults}{" "}
            {adults === 1 ? "Adult" : "Adults"}
            {children > 0 &&
              `, ${children} ${children === 1 ? "Child" : "Children"}`}
            )
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Guests</h4>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Adults</p>
              <p className="text-sm text-muted-foreground">Ages 13+</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAdultChange(-1)}
                disabled={adults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{adults}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAdultChange(1)}
                disabled={adults >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Children</p>
              <p className="text-sm text-muted-foreground">Ages 0-12</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleChildrenChange(-1)}
                disabled={children <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{children}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleChildrenChange(1)}
                disabled={children >= 6}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rooms</p>
              <p className="text-sm text-muted-foreground">Number of rooms</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newRooms = Math.max(1, rooms - 1);
                  if (useContextValues) {
                    updateBookingDetails({ rooms: newRooms });
                  } else {
                    setLocalRooms(newRooms);
                  }
                  onChange?.({ adults, children, rooms: newRooms });
                }}
                disabled={rooms <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{rooms}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newRooms = Math.min(10, rooms + 1);
                  if (useContextValues) {
                    updateBookingDetails({ rooms: newRooms });
                  } else {
                    setLocalRooms(newRooms);
                  }
                  onChange?.({ adults, children, rooms: newRooms });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button className="w-full mt-2" onClick={() => setOpen(false)} style={{ backgroundColor: headerColor }}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
