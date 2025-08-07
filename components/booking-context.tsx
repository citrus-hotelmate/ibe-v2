"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface RoomGuestInfo {
  roomTypeID: number;
  guests: {
    adults: number;
    children: number;
    childAges?: number[];
  };
  price?: number;
}

interface BookingContextType {
  selectedRooms: RoomGuestInfo[];
  updateRoomGuests: (roomTypeID: number, guests: RoomGuestInfo["guests"], price?: number) => void;
  removeRoom: (roomTypeID: number) => void;
  getRoomGuests: (roomTypeID: number) => RoomGuestInfo["guests"] | undefined;
  bookingDetails: { adults: number; children: number; rooms: number };
  updateBookingDetails: (details: { adults: number; children: number; rooms: number }) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRooms, setSelectedRooms] = useState<RoomGuestInfo[]>([]);
  const [bookingDetails, setBookingDetails] = useState<{ adults: number; children: number; rooms: number }>({ adults: 2, children: 0, rooms: 1 });

  const updateRoomGuests = (roomTypeID: number, guests: RoomGuestInfo["guests"], price?: number) => {
    setSelectedRooms((prev) => {
      const existing = prev.find((r) => r.roomTypeID === roomTypeID);
      if (existing) {
        return prev.map((r) =>
          r.roomTypeID === roomTypeID ? { ...r, guests, price } : r
        );
      }
      return [...prev, { roomTypeID, guests, price }];
    });
  };

  const removeRoom = (roomTypeID: number) => {
    setSelectedRooms((prev) => prev.filter((r) => r.roomTypeID !== roomTypeID));
  };

  const getRoomGuests = (roomTypeID: number) => {
    return selectedRooms.find((r) => r.roomTypeID === roomTypeID)?.guests;
  };

  const updateBookingDetails = (details: { adults: number; children: number; rooms: number }) => {
    setBookingDetails(details);
  };

  return (
    <BookingContext.Provider value={{ selectedRooms, updateRoomGuests, removeRoom, getRoomGuests, bookingDetails, updateBookingDetails }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};