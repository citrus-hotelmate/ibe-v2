"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { format } from "date-fns";

export type RoomBooking = {
  roomId: string;
  roomName: string;
  price: number; // This is always per-night price
  mealPlanId: string;
  adults: number;
  children: number;
  quantity: number;
};

type BookingDetails = {
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
};

const defaultBookingDetails: BookingDetails = {
  checkIn: new Date(),
  checkOut: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  })(),
  adults: 2,
  children: 0,
  guests: 0,
  nights: 1,
  totalPrice: 0,
  name: "",
  email: "",
  phone: "",
  paymentMethod: "",
  bookingId: "",
  nationality: "",
  selectedRooms: [],
  rooms: 1,
};

interface BookingContextType {
  bookingDetails: BookingDetails;
  updateBookingDetails: (details: Partial<BookingDetails>) => void;
  resetBookingDetails: () => void;
  addRoom: (room: RoomBooking) => void;
  updateRoom: (roomId: string, updates: Partial<RoomBooking>) => void;
  removeRoom: (roomId: string) => void;
  incrementRoomQuantity: (roomId: string) => void;
  decrementRoomQuantity: (roomId: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>(
    defaultBookingDetails
  );
  const initialized = useRef(false);

  // Load initial data: localStorage + URL params
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Start with defaults
    let mergedDetails: BookingDetails = { ...defaultBookingDetails };

    // If localStorage exists, use it
    const saved = localStorage.getItem("bookingDetails");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.checkIn) parsed.checkIn = new Date(parsed.checkIn);
        if (parsed.checkOut) parsed.checkOut = new Date(parsed.checkOut);
        mergedDetails = { ...mergedDetails, ...parsed };
      } catch (e) {
        console.error("Error parsing bookingDetails from localStorage", e);
      }
    }

    // Merge URL params over whatever we have
    const params = new URLSearchParams(window.location.search);
    const checkInParam = params.get("checkin");
    const checkOutParam = params.get("checkout");
    const adultParam = params.get("adult");
    const childParam = params.get("child");
    const roomsParam = params.get("rooms");

    const parsedCheckIn = checkInParam
      ? new Date(checkInParam.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"))
      : null;
    const parsedCheckOut = checkOutParam
      ? new Date(checkOutParam.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"))
      : null;

    mergedDetails = {
      ...mergedDetails,
      checkIn: parsedCheckIn ?? mergedDetails.checkIn,
      checkOut: parsedCheckOut ?? mergedDetails.checkOut,
      adults: adultParam ? parseInt(adultParam, 10) : mergedDetails.adults,
      children: childParam ? parseInt(childParam, 10) : mergedDetails.children,
      rooms: roomsParam ? parseInt(roomsParam, 10) : mergedDetails.rooms,
    };

    setBookingDetails(mergedDetails);
    localStorage.setItem("bookingDetails", JSON.stringify(mergedDetails));
    initialized.current = true;
  }, []);

  // Update localStorage whenever state changes
  useEffect(() => {
    if (initialized.current) {
      localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));
    }
  }, [bookingDetails]);

  // Recompute nights and totalPrice if dates or rooms change
  useEffect(() => {
    if (bookingDetails.checkIn && bookingDetails.checkOut) {
      const nights = Math.max(
        1,
        Math.ceil(
          (bookingDetails.checkOut.getTime() -
            bookingDetails.checkIn.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const totalPrice = bookingDetails.selectedRooms.reduce(
        (sum, room) => sum + room.price * room.quantity * nights,
        0
      );
      setBookingDetails((prev) => ({ ...prev, nights, totalPrice }));
    }
  }, [
    bookingDetails.checkIn,
    bookingDetails.checkOut,
    bookingDetails.selectedRooms,
  ]);

  // Recompute guests
  useEffect(() => {
    const totalGuests = bookingDetails.adults + bookingDetails.children;
    if (bookingDetails.guests !== totalGuests) {
      setBookingDetails((prev) => ({ ...prev, guests: totalGuests }));
    }
  }, [bookingDetails.adults, bookingDetails.children, bookingDetails.guests]);

  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopstate = () => {
      const params = new URLSearchParams(window.location.search);
      const checkInParam = params.get("checkin");
      const checkOutParam = params.get("checkout");
      const adultParam = params.get("adult");
      const childParam = params.get("child");
      const roomsParam = params.get("rooms");

      const parsedCheckIn = checkInParam
        ? new Date(
            checkInParam.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")
          )
        : null;
      const parsedCheckOut = checkOutParam
        ? new Date(
            checkOutParam.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")
          )
        : null;

      setBookingDetails((prev) => {
        const updated = {
          ...prev,
          checkIn: parsedCheckIn ?? prev.checkIn,
          checkOut: parsedCheckOut ?? prev.checkOut,
          adults: adultParam ? parseInt(adultParam, 10) : prev.adults,
          children: childParam ? parseInt(childParam, 10) : prev.children,
          rooms: roomsParam ? parseInt(roomsParam, 10) : prev.rooms,
        };
        localStorage.setItem("bookingDetails", JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener("popstate", handlePopstate);
    return () => {
      window.removeEventListener("popstate", handlePopstate);
    };
  }, []);

  const updateBookingDetails = (details: Partial<BookingDetails>) => {
    setBookingDetails((prev) => ({ ...prev, ...details }));
  };

  const resetBookingDetails = () => {
    setBookingDetails(defaultBookingDetails);
    localStorage.removeItem("bookingDetails");
  };

  const addRoom = (room: RoomBooking) => {
    setBookingDetails((prev) => {
      const existingIndex = prev.selectedRooms.findIndex(
        (r) => r.roomId === room.roomId
      );
      if (existingIndex >= 0) {
        const updatedRooms = [...prev.selectedRooms];
        updatedRooms[existingIndex] = {
          ...updatedRooms[existingIndex],
          quantity: updatedRooms[existingIndex].quantity + 1,
        };
        return { ...prev, selectedRooms: updatedRooms };
      }
      return {
        ...prev,
        selectedRooms: [...prev.selectedRooms, { ...room, quantity: 1 }],
      };
    });
  };

  const updateRoom = (roomId: string, updates: Partial<RoomBooking>) => {
    setBookingDetails((prev) => ({
      ...prev,
      selectedRooms: prev.selectedRooms.map((room) =>
        room.roomId === roomId ? { ...room, ...updates } : room
      ),
    }));
  };

  const removeRoom = (roomId: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      selectedRooms: prev.selectedRooms.filter(
        (room) => room.roomId !== roomId
      ),
    }));
  };

  const incrementRoomQuantity = (roomId: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      selectedRooms: prev.selectedRooms.map((room) =>
        room.roomId === roomId ? { ...room, quantity: room.quantity + 1 } : room
      ),
    }));
  };

  const decrementRoomQuantity = (roomId: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      selectedRooms: prev.selectedRooms.map((room) =>
        room.roomId === roomId && room.quantity > 1
          ? { ...room, quantity: room.quantity - 1 }
          : room
      ),
    }));
  };

  // Optionally, keep your ReleaseRooms effect if needed
  useEffect(() => {
    if (!initialized.current) return;
    const releaseRooms = async () => {
      if (bookingDetails.checkIn && bookingDetails.checkOut) {
        const dateFrom = format(bookingDetails.checkIn, "MM/dd/yyyy");
        const dateTo = format(bookingDetails.checkOut, "MM/dd/yyyy");
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/API_IBE/ReleaseRooms.aspx?datefrom=${dateFrom}&dateto=${dateTo}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            const errorText = await res.text();
            console.error("ReleaseRooms API failed:", res.status, errorText);
          }
        } catch (err) {
          console.error("ReleaseRooms API error:", err);
        }
      }
    };
    releaseRooms();
  }, [bookingDetails.checkIn, bookingDetails.checkOut]);

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
