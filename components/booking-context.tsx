"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type RoomBooking = {
  roomId: string
  roomName: string
  price: number
  mealPlanId: string
  adults: number
  children: number
  quantity: number
}

type BookingDetails = {
  checkIn: Date | null
  checkOut: Date | null
  adults: number
  children: number
  guests: number
  nights: number
  totalPrice: number
  name: string
  email: string
  phone: string
  paymentMethod: string
  bookingId: string
  nationality: string
  selectedRooms: RoomBooking[]
  rooms: number
}

const defaultBookingDetails: BookingDetails = {
  checkIn: null,
  checkOut: null,
  adults: 2,
  children: 0,
  guests: 0,
  nights: 0,
  totalPrice: 0,
  name: "",
  email: "",
  phone: "",
  paymentMethod:"",
  bookingId: "",
  nationality: "",
  selectedRooms: [],
  rooms: 1,
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>(defaultBookingDetails)

  // Load booking details from localStorage on initial render
  useEffect(() => {
    const savedBooking = localStorage.getItem("bookingDetails")
    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking)
        // Convert string dates back to Date objects
        if (parsed.checkIn) parsed.checkIn = new Date(parsed.checkIn)
        if (parsed.checkOut) parsed.checkOut = new Date(parsed.checkOut)
        setBookingDetails(parsed)
      } catch (error) {
        console.error("Failed to parse booking details from localStorage", error)
      }
    }
  }, [])

  // Save booking details to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails))
  }, [bookingDetails])

  // Calculate nights and total price whenever check-in or check-out dates change
  useEffect(() => {
    if (bookingDetails.checkIn && bookingDetails.checkOut) {
      const nights = Math.ceil(
        (bookingDetails.checkOut.getTime() - bookingDetails.checkIn.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Calculate total price based on all selected rooms
      const totalPrice = bookingDetails.selectedRooms.reduce((sum, room) => {
        return sum + room.price * nights * room.quantity
      }, 0)

      setBookingDetails((prev) => ({
        ...prev,
        nights,
        totalPrice,
      }))
    }
  }, [bookingDetails.checkIn, bookingDetails.checkOut, bookingDetails.selectedRooms])

  // Update guests count when adults or children change
  useEffect(() => {
    const totalGuests = bookingDetails.adults + bookingDetails.children

    // Only update if the total has actually changed
    if (bookingDetails.guests !== totalGuests) {
      setBookingDetails((prev) => ({
        ...prev,
        guests: totalGuests,
      }))
    }
  }, [bookingDetails.adults, bookingDetails.children, bookingDetails.guests])

  const updateBookingDetails = (details: Partial<BookingDetails>) => {
    setBookingDetails((prev) => ({ ...prev, ...details }))
  }

  const resetBookingDetails = () => {
    setBookingDetails(defaultBookingDetails)
    localStorage.removeItem("bookingDetails")
  }

  const addRoom = (room: RoomBooking) => {
    setBookingDetails((prev) => {
      // Check if this room is already in the selection
      const existingRoomIndex = prev.selectedRooms.findIndex((r) => r.roomId === room.roomId)

      if (existingRoomIndex >= 0) {
        // If room exists, increment its quantity
        const updatedRooms = [...prev.selectedRooms]
        updatedRooms[existingRoomIndex] = {
          ...updatedRooms[existingRoomIndex],
          quantity: updatedRooms[existingRoomIndex].quantity + 1,
        }
        return { ...prev, selectedRooms: updatedRooms }
      } else {
        // If room doesn't exist, add it with quantity 1
        return { ...prev, selectedRooms: [...prev.selectedRooms, { ...room, quantity: 1 }] }
      }
    })
  }

  const updateRoom = (roomId: string, updates: Partial<RoomBooking>) => {
    setBookingDetails((prev) => {
      const updatedRooms = prev.selectedRooms.map((room) => {
        if (room.roomId === roomId) {
          return { ...room, ...updates }
        }
        return room
      })
      return { ...prev, selectedRooms: updatedRooms }
    })
  }

  const removeRoom = (roomId: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      selectedRooms: prev.selectedRooms.filter((room) => room.roomId !== roomId),
    }))
  }

  const incrementRoomQuantity = (roomId: string) => {
    setBookingDetails((prev) => {
      const updatedRooms = prev.selectedRooms.map((room) => {
        if (room.roomId === roomId) {
          return { ...room, quantity: room.quantity + 1 }
        }
        return room
      })
      return { ...prev, selectedRooms: updatedRooms }
    })
  }

  const decrementRoomQuantity = (roomId: string) => {
    setBookingDetails((prev) => {
      const updatedRooms = prev.selectedRooms.map((room) => {
        if (room.roomId === roomId && room.quantity > 1) {
          return { ...room, quantity: room.quantity - 1 }
        }
        return room
      })
      return { ...prev, selectedRooms: updatedRooms }
    })
  }

  return (
    <BookingContext.Provider
      value={{
        bookingDetails,
        updateBookingDetails,
        resetBookingDetails,
        addRoom,
        updateRoom,
        removeRoom,
        incrementRoomQuantity,
        decrementRoomQuantity,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
}
