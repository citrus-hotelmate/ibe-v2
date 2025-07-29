"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Users, Minus, Plus } from "lucide-react"

interface RoomGuestSelectorProps {
  adults: number;
  children: number;
  onChange: (adults: number, children: number, ages?: number[]) => void;
  maxGuests: number;
  maxAdult: number;
  maxChild: number;
  childAgeLower: number;
  childAgeHigher: number;
  childAges?: number[];
  onChildAgesChange?: (ages: number[]) => void;
}

export function RoomGuestSelector({
  adults,
  children,
  onChange,
  maxGuests,
  maxAdult,
  maxChild,
  childAgeLower,
  childAgeUpper,
  childAges: propChildAges,
  onChildAgesChange,
}: RoomGuestSelectorProps) {
  const [open, setOpen] = useState(false)
  const [childAges, setChildAges] = useState<number[]>(propChildAges ?? Array(children).fill(childAgeLower));

  const handleAdultChange = (change: number) => {
    const maxAdults = Math.min(maxGuests - children, maxAdult);
    const newValue = Math.max(1, Math.min(maxAdults, adults + change));
    onChange(newValue, children, childAges);
  }

  const handleChildrenChange = (change: number) => {
    const maxChildren = Math.min(maxGuests - adults, maxChild);
    const newValue = Math.max(0, Math.min(maxChildren, children + change));
    const updatedAges = [...childAges];

    if (change > 0) {
      updatedAges.push(childAgeLower);
    } else if (change < 0 && updatedAges.length > 0) {
      updatedAges.pop();
    }

    setChildAges(updatedAges);
    onChange(adults, newValue, updatedAges);
    if (onChildAgesChange) onChildAgesChange(updatedAges);
  }

  const totalGuests = adults + children

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Users className="mr-2 h-4 w-4" />
          <span>
            {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"} ({adults} {adults === 1 ? "Adult" : "Adults"}
            {children > 0 && `, ${children} ${children === 1 ? "Child" : "Children"}`})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Guests for this room</h4>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Adults</p>
              <p className="text-sm text-muted-foreground">Ages above {childAgeUpper}</p>
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
                disabled={adults >= Math.min(maxGuests - children, maxAdult)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Children</p>
              <p className="text-sm text-muted-foreground">
                Ages {childAgeLower} to&nbsp;{childAgeUpper}
              </p>
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
                disabled={children >= Math.min(maxGuests - adults, maxChild)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {childAges.map((age, index) => (
            <div key={index} className="flex items-center gap-2 mt-2">
              <span className="text-sm">Child {index + 1} Age:</span>
              <select
                className="form-select"
                value={age}
                onChange={(e) => {
                  const newAges = [...childAges];
                  newAges[index] = parseInt(e.target.value);
                  setChildAges(newAges);
                  if (onChildAgesChange) onChildAgesChange(newAges);
                }}
              >
                {Array.from({ length: 17 }, (_, i) => i + 1).map((optAge) => (
                  <option key={optAge} value={optAge}>{optAge}</option>
                ))}
              </select>
            </div>
          ))}

          <Button className="w-full mt-2" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
