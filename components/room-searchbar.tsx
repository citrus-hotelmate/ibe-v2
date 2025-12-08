'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Users } from 'lucide-react';
import { Calendar as DatePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { useBooking } from "@/components/booking-context";

interface RoomSearchBarProps {
    onSearch?: (checkIn: string, checkOut: string, adults: number, children: number, rooms: number) => void;
}

export function RoomSearchBar({ onSearch }: RoomSearchBarProps) {
    const { bookingDetails, updateBookingDetails } = useBooking();
    const [headerColor, setHeaderColor] = useState("#792868");
    
    useEffect(() => {
        const selectedHotelStr = localStorage.getItem("selectedHotel");
        if (selectedHotelStr) {
            try {
                const selectedHotel = JSON.parse(selectedHotelStr);
                if (selectedHotel.ibeHeaderColour) {
                    setHeaderColor(selectedHotel.ibeHeaderColour);
                }
            } catch (error) {
                console.error("Failed to parse selectedHotel from localStorage", error);
            }
        }
    }, []);
    
    // Initialize state from booking context
    const [checkInDate, setCheckInDate] = useState(bookingDetails.checkIn || new Date());
    const [checkOutDate, setCheckOutDate] = useState(
      bookingDetails.checkOut || new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    ); // Tomorrow
    const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
    const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [adults, setAdults] = useState(bookingDetails.adults || 2);
    const [children, setChildren] = useState(bookingDetails.children || 0);
    const [rooms, setRooms] = useState(bookingDetails.rooms || 1);

    // 🔁 track if we've already auto-ran the search
    const [hasAutoSearched, setHasAutoSearched] = useState(false);

    // Refs for the dropdown components
    const checkInCalendarRef = useRef<HTMLDivElement>(null);
    const checkOutCalendarRef = useRef<HTMLDivElement>(null);
    const guestDropdownRef = useRef<HTMLDivElement>(null);
    const checkInButtonRef = useRef<HTMLDivElement>(null);
    const checkOutButtonRef = useRef<HTMLDivElement>(null);
    const guestButtonRef = useRef<HTMLDivElement>(null);

    // Sync with booking context changes
    useEffect(() => {
      console.log("🧾 RoomSearchBar saw bookingDetails:", {
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        adults: bookingDetails.adults,
        children: bookingDetails.children,
        rooms: bookingDetails.rooms,
      });

      if (bookingDetails.checkIn) {
        setCheckInDate(bookingDetails.checkIn);
      }
      if (bookingDetails.checkOut) {
        setCheckOutDate(bookingDetails.checkOut);
      }
      if (bookingDetails.adults !== undefined) {
        setAdults(bookingDetails.adults);
      }
      if (bookingDetails.children !== undefined) {
        setChildren(bookingDetails.children);
      }
      if (bookingDetails.rooms !== undefined) {
        setRooms(bookingDetails.rooms);
      }
    }, [
      bookingDetails.checkIn,
      bookingDetails.checkOut,
      bookingDetails.adults,
      bookingDetails.children,
      bookingDetails.rooms,
    ]);

    // ✅ Auto-run search once when bookingDetails (from URL/localStorage) are ready
    useEffect(() => {
      if (!onSearch) return;
      if (hasAutoSearched) return;

      if (!bookingDetails.checkIn || !bookingDetails.checkOut) return;

      const checkIn = bookingDetails.checkIn.toISOString().split("T")[0];
      const checkOut = bookingDetails.checkOut.toISOString().split("T")[0];

      const autoAdults = bookingDetails.adults ?? adults;
      const autoChildren = bookingDetails.children ?? children;
      const autoRooms = bookingDetails.rooms ?? rooms;

      console.log("🚀 Auto-search from bookingDetails:", {
        checkIn,
        checkOut,
        adults: autoAdults,
        children: autoChildren,
        rooms: autoRooms,
      });

      onSearch(checkIn, checkOut, autoAdults, autoChildren, autoRooms);
      setHasAutoSearched(true);
    }, [
      onSearch,
      bookingDetails.checkIn,
      bookingDetails.checkOut,
      bookingDetails.adults,
      bookingDetails.children,
      bookingDetails.rooms,
      adults,
      children,
      rooms,
      hasAutoSearched,
    ]);

    // Enhanced setters that sync with booking context
    const updateAdults = (value: number) => {
        setAdults(value);
        updateBookingDetails({ adults: value });
    };

    const updateChildren = (value: number) => {
        setChildren(value);
        updateBookingDetails({ children: value });
    };

    const updateRooms = (value: number) => {
        setRooms(value);
        updateBookingDetails({ rooms: value });
    };

    const handleSearch = () => {
        const checkIn = checkInDate.toISOString().split('T')[0];
        const checkOut = checkOutDate.toISOString().split('T')[0];
        onSearch?.(checkIn, checkOut, adults, children, rooms);
    };

    const handleCheckInDateChange = (date: Date) => {
        setCheckInDate(date);
        if (checkOutDate <= date) {
            const newCheckOut = new Date(date.getTime() + 24 * 60 * 60 * 1000);
            setCheckOutDate(newCheckOut);
            updateBookingDetails({
                checkIn: date,
                checkOut: newCheckOut,
            });
        } else {
            updateBookingDetails({
                checkIn: date,
            });
        }
    };

    const handleCheckOutDateChange = (date: Date) => {
        setCheckOutDate(date);
        updateBookingDetails({
            checkOut: date,
        });
    };

    // Handle clicks outside the dropdown components
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                showCheckInCalendar &&
                checkInCalendarRef.current &&
                !checkInCalendarRef.current.contains(event.target as Node) &&
                checkInButtonRef.current &&
                !checkInButtonRef.current.contains(event.target as Node)
            ) {
                setShowCheckInCalendar(false);
            }

            if (
                showCheckOutCalendar &&
                checkOutCalendarRef.current &&
                !checkOutCalendarRef.current.contains(event.target as Node) &&
                checkOutButtonRef.current &&
                !checkOutButtonRef.current.contains(event.target as Node)
            ) {
                setShowCheckOutCalendar(false);
            }

            if (
                showGuestDropdown &&
                guestDropdownRef.current &&
                !guestDropdownRef.current.contains(event.target as Node) &&
                guestButtonRef.current &&
                !guestButtonRef.current.contains(event.target as Node)
            ) {
                setShowGuestDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCheckInCalendar, showCheckOutCalendar, showGuestDropdown]);

    return (
        <div className="w-full max-w-4xl mx-auto rounded-3xl shadow-xl flex flex-col sm:flex-row gap-2 sm:gap-0 items-stretch sm:items-center border border-white overflow-visible relative z-10 bg-white">
            {/* Check In */}
            <div className="flex-1 px-2 sm:px-4 py-2 relative w-full sm:w-auto">
                <div
                    ref={checkInButtonRef}
                    className="flex items-center gap-1 sm:gap-2 cursor-pointer"
                    onClick={() => {
                        setShowCheckInCalendar(!showCheckInCalendar);
                        setShowCheckOutCalendar(false);
                        setShowGuestDropdown(false);
                    }}
                >
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-[#792868] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist">Check in</div>
                        <div className="text-gray-500 font-semibold font-urbanist text-sm sm:text-base">
                            {checkInDate ? format(checkInDate, "MMM d, yyyy") : 'Add dates'}
                        </div>
                    </div>
                </div>

                {showCheckInCalendar && (
                    <div
                        ref={checkInCalendarRef}
                        className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="sm:w-[330px]  overflow-visible">
                            <DatePicker
                                date={checkInDate}
                                onChange={handleCheckInDateChange}
                                minDate={new Date()}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Check Out */}
            <div className="flex-1 px-2 sm:px-4 py-2 relative w-full sm:w-auto">
                <div
                    ref={checkOutButtonRef}
                    className="flex items-center gap-1 sm:gap-3 cursor-pointer"
                    onClick={() => {
                        setShowCheckOutCalendar(!showCheckOutCalendar);
                        setShowCheckInCalendar(false);
                        setShowGuestDropdown(false);
                    }}
                >
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" style={{ color: headerColor }} />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist notranslate">Check out</div>
                        <div className="text-gray-500 font-semibold font-urbanist text-sm sm:text-base">
                            {checkOutDate ? format(checkOutDate, "MMM d, yyyy") : 'Add dates'}
                        </div>
                    </div>
                </div>

                {showCheckOutCalendar && (
                    <div
                        ref={checkOutCalendarRef}
                        className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className=" sm:w-[330px] overflow-visible">
                            <DatePicker
                                date={checkOutDate}
                                onChange={handleCheckOutDateChange}
                                minDate={checkInDate ? new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000) : new Date()}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Guest & Rooms */}
            <div className="flex-1 px-2 sm:px-4 py-2 relative w-full sm:w-auto">
                <div
                    ref={guestButtonRef}
                    className="flex items-center gap-1 sm:gap-3 cursor-pointer guest-dropdown-toggle"
                    onClick={() => {
                        setShowGuestDropdown(prev => !prev);
                        setShowCheckInCalendar(false);
                        setShowCheckOutCalendar(false);
                    }}
                >
                    <Users className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" style={{ color: headerColor }} />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist notranslate">Guest & Rooms</div>
                        <div className="text-gray-400 font-medium font-urbanist notranslate text-xs sm:text-base truncate">
                          {adults} Adults, {rooms} Room{rooms > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {showGuestDropdown && (
                <div
                    ref={guestDropdownRef}
                    className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-xl p-6 w-80 sm:w-100 guest-dropdown font-urbanist notranslate">
                    <div className="max-w-4xl mx-auto">
                        {[
                            { label: 'Adults', desc: 'Ages 13 or above', value: adults, setter: updateAdults },
                            { label: 'Children', desc: 'Ages 2–12', value: children, setter: updateChildren },
                            { label: 'Rooms', desc: 'Number of rooms', value: rooms, setter: updateRooms },
                        ].map(({ label, desc, value, setter }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <div className="font-medium text-sm text-gray-800">{label}</div>
                                    <div className="text-xs text-gray-500">{desc}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setter(Math.max(0, value - 1))}
                                        className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center"
                                    >−</button>
                                    <span className="w-4 text-center text-sm">{value}</span>
                                    <button
                                        onClick={() => setter(value + 1)}
                                        className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center"
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Button (manual override still works) */}
            <button
                onClick={handleSearch}
                className="text-white p-3 sm:p-4 rounded-2xl mt-2 sm:mb-0 sm:mt-0 sm:ml-2 w-full sm:w-auto mr-[5px]"
                style={{ backgroundColor: headerColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = headerColor + '90'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = headerColor}
            >
                <Search className="w-4 sm:w-5 h-4 sm:h-5 mx-auto" />
            </button>
        </div>
    );
}