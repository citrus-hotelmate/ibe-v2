"use client"

import { useState, useEffect } from "react"
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
  childAgeUpper: number;
  childAges?: number[];
  onChildAgesChange?: (ages: number[]) => void;
}

export function RoomGuestSelector({
  adults: propAdults,
  children: propChildren,
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
  
  // Initialize with API values from peopleCount if available, otherwise use props
  const initialAdults = propAdults;
  const initialChildren = propChildren;
  
  // Local state to track current selections
  const [currentAdults, setCurrentAdults] = useState(initialAdults);
  const [currentChildren, setCurrentChildren] = useState(initialChildren);
  
  const [childAges, setChildAges] = useState<number[]>(() => {
    if (propChildAges && propChildAges.length > 0) {
      return propChildAges;
    }
    return Array(initialChildren).fill(childAgeLower);
  });
  
  
  // Update child ages array when children count changes
  useEffect(() => {
    const currentLength = childAges.length;
    if (currentLength !== currentChildren) {
      let newChildAges = [...childAges];
      
      if (currentChildren > currentLength) {
        // Add more ages if needed
        newChildAges = [...newChildAges, ...Array(currentChildren - currentLength).fill(childAgeLower)];
      } else if (currentChildren < currentLength) {
        // Remove excess ages
        newChildAges = newChildAges.slice(0, currentChildren);
      }
      
      setChildAges(newChildAges);
      if (onChildAgesChange) onChildAgesChange(newChildAges);
    }
  }, [currentChildren, childAges.length, childAgeLower, onChildAgesChange]);

  // Update local state when API values (peopleCount) change
  useEffect(() => {
    if (propAdults|| propChildren) {
      setCurrentAdults(propAdults);
      setCurrentChildren(propChildren);
      
      // Update child ages array if children count changed
      if (propChildren !== childAges.length) {
        const newChildAges = Array(propChildren).fill(childAgeLower);
        setChildAges(newChildAges);
        if (onChildAgesChange) onChildAgesChange(newChildAges);
      }
    }
  }, [propAdults,propChildren, childAgeLower, onChildAgesChange]);

  const handleAdultChange = (change: number) => {
 
    // Calculate maximum adults allowed (minimum of total capacity minus children, or maxAdult)
    const maxAdults = Math.min(maxGuests - currentChildren, maxAdult);
    // Calculate new value ensuring it's between 1 and maxAdults
    const newValue = Math.max(1, Math.min(maxAdults, currentAdults + change));
    
    // Update local state
    setCurrentAdults(newValue);
    
    // Call parent onChange with new values
    onChange(newValue, currentChildren, childAges);
  }

  const handleChildrenChange = (change: number) => {
    // Calculate maximum children allowed (minimum of total capacity minus adults, or maxChild)
    const maxChildren = Math.min(maxGuests - currentAdults, maxChild);
    // Calculate new value ensuring it's between 0 and maxChildren
    const newValue = Math.max(0, Math.min(maxChildren, currentChildren + change));
    
    // Only proceed if there's an actual change
    if (newValue !== currentChildren) {
      let updatedAges = [...childAges];

      if (change > 0) {
        // Add new child with default age
        updatedAges.push(childAgeLower);
      } else if (change < 0 && updatedAges.length > 0) {
        // Remove the last child age
        updatedAges = updatedAges.slice(0, -1);
      }

      // Update local state
      setCurrentChildren(newValue);
      setChildAges(updatedAges);
      
      // Notify parent
      onChange(currentAdults, newValue, updatedAges);
      if (onChildAgesChange) onChildAgesChange(updatedAges);
    }
  }

  const totalGuests = currentAdults + currentChildren
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Users className="mr-2 h-4 w-4" />
          <span>
            {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"} ({currentAdults} {currentAdults === 1 ? "Adult" : "Adults"}
            {currentChildren > 0 && `, ${currentChildren} ${currentChildren === 1 ? "Child" : "Children"}`})
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
                disabled={currentAdults <= 1} // Prevent reducing adults below 1
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="w-8 text-center">{currentAdults || 0}</div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAdultChange(1)}
                disabled={currentAdults >= Math.min(maxGuests - currentChildren, maxAdult)} // Disable when max adults reached
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
                disabled={currentChildren <= 0} // Prevent negative children count
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-8 text-center">{currentChildren}</div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleChildrenChange(1)}
                disabled={currentChildren >= Math.min(maxGuests - currentAdults, maxChild)} // Prevent exceeding maximum children
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentChildren > 0 && (
            <div className="border-t pt-3">
              <h4 className="font-medium mb-2">Child Ages</h4>
              {childAges.map((age, index) => (
                <div key={`child-age-${index}`} className="flex items-center justify-between mt-2">
                  <span className="text-sm">Child {index + 1}</span>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm flex-grow max-w-[100px]"
                    value={age}
                    onChange={(e) => {
                      const newAges = [...childAges];
                      newAges[index] = parseInt(e.target.value);
                      setChildAges(newAges);
                      if (onChildAgesChange) onChildAgesChange(newAges);
                    }}
                  >
                    {Array.from(
                      { length: childAgeUpper - childAgeLower + 1 }, 
                      (_, i) => i + childAgeLower
                    ).map((optAge) => (
                      <option key={optAge} value={optAge}>{optAge} years</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full mt-2" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
