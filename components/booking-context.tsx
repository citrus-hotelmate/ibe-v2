"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export const INITIAL_BOOKING_DETAILS: BookingDetails = {
  checkIn: null,
  checkOut: null,
  adults: 2,
  children: 0,
  guests: 2,
  nights: 0,
  totalPrice: 0,
  name: "",
  email: "",
  phone: "",
  paymentMethod: "",
  bookingId: "",
  nationality: "",
  selectedRooms: [],
  rooms: 0,
  currency: "USD",
  totalAmount: 0,
  hotelId: "",
  roomId: "",
  selectedPackages: [],
  promoCode: "",
  promoDetails: null,
  specialRequests: "",
  additionalNotes: "",
  roomCount: 0,
  status: "new",
  extraBed: 0,
  roomType: "",
};

export type BookingContextType = {
  bookingDetails: BookingDetails;
  updateBookingDetails: (details: Partial<BookingDetails>) => void;
  resetBookingDetails: () => void;
  addRoom: (room: RoomBooking) => void;
  updateRoom: (roomId: string, updates: Partial<RoomBooking>) => void;
  removeRoom: (roomId: string) => void;
  incrementRoomQuantity: (roomId: string) => void;
  decrementRoomQuantity: (roomId: string) => void;
};

export type RoomBooking = {
  roomId: string;
  roomName: string;
  price: number;
  mealPlanId: string;
  adults: number;
  children: number;
  quantity: number;
  roomCount?: number;
  averageRate?: number;
  hotelCode?: number;
};

interface BookingDetails {
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
  guests: number;
  nights: number;
  totalPrice: number;
  name: string;
  email: string;
  phone: string;
  paymentMethod: string;
  bookingId: string;
  nationality: string;
  selectedRooms: RoomBooking[];
  rooms: number;
  roomCount?: number;
  hotelName?: string;
  hotelImageUrl?: string;
  currency: string;
  promoCode?: string;
  promoDetails?: any;
  specialRequests?: string;
  selectedPackages?: Array<{
    id: string;
    name: string;
    Price: number;
  }>;
  additionalNotes?: string;
  totalAmount: number;
  bookingRevision?: string;
  status?: string;
  hotelId: string;
  roomId: string;
  extraBed?: number;
  roomType?: string;
}

const _defaultBookingDetails: BookingDetails = {
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
  paymentMethod: "",
  bookingId: "",
  nationality: "",
  selectedRooms: [],
  rooms: 1,
  currency: "USD",
  promoCode: "",
  promoDetails: null,
  specialRequests: "",
  selectedPackages: [],
  additionalNotes: "",
  totalAmount: 0,
  status: "new",
  hotelId: "",
  roomId: "",
  roomCount: 0,
  extraBed: 0,
  roomType: "",
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>(_defaultBookingDetails);

  // 1) Initial hydrate: merge localStorage + URL (URL wins) and save back to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    let next: BookingDetails = { ..._defaultBookingDetails };

    // ---- Load from localStorage (base) ----
    const savedBooking = localStorage.getItem("bookingDetails");
    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);

        if (parsed.checkIn) parsed.checkIn = new Date(parsed.checkIn);
        if (parsed.checkOut) parsed.checkOut = new Date(parsed.checkOut);

        next = { ...next, ...parsed };
      } catch (error) {
        console.error("Failed to parse booking details from localStorage", error);
      }
    }

    // ---- Overlay URL params on top (URL is source of truth) ----
    const params = new URLSearchParams(window.location.search);

    const parseYMD = (value: string | null): Date | null => {
      if (!value) return null;
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
      if (!m) return null;
      const [, y, mo, d] = m;
      const date = new Date(Number(y), Number(mo) - 1, Number(d));
      return isNaN(date.getTime()) ? null : date;
    };

    const email = params.get("email");
    const name = params.get("name");
    const contact = params.get("contact");
    const checkInStr = params.get("checkIn");
    const checkOutStr = params.get("checkOut");
    const adultStr = params.get("adult");
    const childStr = params.get("child");
    const roomStr = params.get("room");
    const extraBedStr = params.get("extraBed");
    const roomType = params.get("roomType");

    const checkInDate = parseYMD(checkInStr);
    const checkOutDate = parseYMD(checkOutStr);

    const urlPatch: Partial<BookingDetails> = {
      ...(email && { email }),
      ...(name && { name }),
      ...(contact && { phone: contact }),
      ...(checkInDate && { checkIn: checkInDate }),
      ...(checkOutDate && { checkOut: checkOutDate }),
      ...(adultStr && { adults: Number(adultStr) }),
      ...(childStr && { children: Number(childStr) }),
      ...(roomStr && { rooms: Number(roomStr) }),
      ...(extraBedStr && { extraBed: Number(extraBedStr) }),
      ...(roomType && { roomType }),
    };

    const hasUrlPatch = Object.keys(urlPatch).length > 0;

    if (hasUrlPatch) {
      next = { ...next, ...urlPatch };
      console.log("🌐 Hydrating booking from URL + localStorage:", next);
    } else {
      console.log("💾 Hydrating booking from localStorage only:", next);
    }

    setBookingDetails(next);
    // Immediately persist merged value so localStorage is in sync with URL
    localStorage.setItem("bookingDetails", JSON.stringify(next));
  }, []);

  // 2) Keep localStorage in sync whenever bookingDetails changes later
  useEffect(() => {
    localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));
  }, [bookingDetails]);

  // Calculate nights and total price whenever check-in or check-out dates change
  useEffect(() => {
    if (bookingDetails.checkIn && bookingDetails.checkOut) {
      const nights = Math.ceil(
        (bookingDetails.checkOut.getTime() - bookingDetails.checkIn.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const totalPrice = bookingDetails.selectedRooms.reduce((sum, room) => {
        return sum + room.price * nights * room.quantity;
      }, 0);

      if (bookingDetails.nights !== nights || bookingDetails.totalPrice !== totalPrice) {
        setBookingDetails((prev) => ({
          ...prev,
          nights,
          totalPrice,
        }));
      }
    }
  }, [bookingDetails.checkIn, bookingDetails.checkOut, bookingDetails.selectedRooms]);

  // Update guests count when adults or children change
  useEffect(() => {
    const totalGuests = bookingDetails.adults + bookingDetails.children;

    if (bookingDetails.guests !== totalGuests) {
      setBookingDetails((prev) => ({
        ...prev,
        guests: totalGuests,
      }));
    }
  }, [bookingDetails.adults, bookingDetails.children, bookingDetails.guests]);

  const updateBookingDetails = useCallback((details: Partial<BookingDetails>) => {
    setBookingDetails((prev) => ({ ...prev, ...details }));
  }, []);

  const resetBookingDetails = useCallback(() => {
    setBookingDetails(_defaultBookingDetails);
    localStorage.removeItem("bookingDetails");
  }, []);

  const addRoom = useCallback((room: RoomBooking) => {
    setBookingDetails((prev) => {
      const existingRoomIndex = prev.selectedRooms.findIndex((r) => r.roomId === room.roomId);

      if (existingRoomIndex >= 0) {
        const updatedRooms = [...prev.selectedRooms];
        updatedRooms[existingRoomIndex] = {
          ...updatedRooms[existingRoomIndex],
          quantity: updatedRooms[existingRoomIndex].quantity + 1,
        };
        return { ...prev, selectedRooms: updatedRooms };
      } else {
        return { ...prev, selectedRooms: [...prev.selectedRooms, { ...room, quantity: 1 }] };
      }
    });
  }, []);

  const updateRoom = useCallback((roomId: string, updates: Partial<RoomBooking>) => {
    setBookingDetails((prev) => {
      const updatedRooms = prev.selectedRooms.map((room) =>
        room.roomId === roomId ? { ...room, ...updates } : room,
      );
      return { ...prev, selectedRooms: updatedRooms };
    });
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      selectedRooms: prev.selectedRooms.filter((room) => room.roomId !== roomId),
    }));
  }, []);

  const incrementRoomQuantity = useCallback((roomId: string) => {
    setBookingDetails((prev) => {
      const updatedRooms = prev.selectedRooms.map((room) =>
        room.roomId === roomId ? { ...room, quantity: room.quantity + 1 } : room,
      );
      return { ...prev, selectedRooms: updatedRooms };
    });
  }, []);

  const decrementRoomQuantity = useCallback((roomId: string) => {
    setBookingDetails((prev) => {
      const updatedRooms = prev.selectedRooms.map((room) =>
        room.roomId === roomId && room.quantity > 1
          ? { ...room, quantity: room.quantity - 1 }
          : room,
      );
      return { ...prev, selectedRooms: updatedRooms };
    });
  }, []);

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
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}