"use client"

import { useBooking } from "./booking-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { BedDouble } from "lucide-react"

export function RoomSelector() {
  const { bookingDetails, updateBookingDetails } = useBooking()

  const increment = () =>
    updateBookingDetails({
      rooms: Math.min(10, (bookingDetails.rooms || 1) + 1),
    })

  const decrement = () =>
    updateBookingDetails({
      rooms: Math.max(1, (bookingDetails.rooms || 1) - 1),
    })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal gap-2"
        >
          <BedDouble className="w-4 h-4 opacity-70" />
          {bookingDetails.rooms || 1} {bookingDetails.rooms === 1 ? "Room" : "Rooms"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Rooms</div>
              <div className="text-sm text-muted-foreground">Max 10</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={decrement}
              >
                -
              </Button>
              <div>{bookingDetails.rooms || 1}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={increment}
              >
                +
              </Button>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => document.activeElement && (document.activeElement as HTMLElement).blur()}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}