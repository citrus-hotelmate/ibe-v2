// use client
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Users, Minus, Plus } from "lucide-react"
import { useBooking } from "@/components/booking-context"

export function GuestSelector() {
  const { bookingDetails, updateBookingDetails } = useBooking()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (
      bookingDetails.adults == null &&
      bookingDetails.children == null &&
      bookingDetails.rooms == null
    ) {
      updateBookingDetails({ adults: 2, children: 0, rooms: 1 });
    }
  }, []);

  const adults = bookingDetails.adults != null ? bookingDetails.adults : 2;
const children = bookingDetails.children != null ? bookingDetails.children : 0;
const rooms = bookingDetails.rooms != null ? bookingDetails.rooms : 1;

  const handleAdultChange = (change: number) => {
    const newValue = Math.max(1, Math.min(10, adults + change))
    updateBookingDetails({ adults: newValue })
  }

  const handleChildrenChange = (change: number) => {
    const newValue = Math.max(0, Math.min(6, children + change))
    updateBookingDetails({ children: newValue })
  }

  const totalGuests = adults + children

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Users className="mr-2 h-4 w-4" />
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
                onClick={() =>
                  updateBookingDetails({ rooms: Math.max(1, rooms - 1) })
                }
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
                onClick={() =>
                  updateBookingDetails({ rooms: Math.min(10, rooms + 1) })
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button className="w-full mt-2" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
