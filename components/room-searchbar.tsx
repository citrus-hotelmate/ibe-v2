'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Users } from 'lucide-react';
import { Calendar as DatePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";

interface RoomSearchBarProps {
    onSearch?: (checkIn: string, checkOut: string, adults: number, children: number, rooms: number) => void;
}

export function RoomSearchBar({ onSearch }: RoomSearchBarProps) {
    const [checkInDate, setCheckInDate] = useState(new Date());
    const [checkOutDate, setCheckOutDate] = useState(new Date(new Date().getTime() + 24 * 60 * 60 * 1000)); // Tomorrow
    const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
    const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [rooms, setRooms] = useState(1);
    
    // Refs for the dropdown components
    const checkInCalendarRef = useRef<HTMLDivElement>(null);
    const checkOutCalendarRef = useRef<HTMLDivElement>(null);
    const guestDropdownRef = useRef<HTMLDivElement>(null);
    const checkInButtonRef = useRef<HTMLDivElement>(null);
    const checkOutButtonRef = useRef<HTMLDivElement>(null);
    const guestButtonRef = useRef<HTMLDivElement>(null);

    const handleSearch = () => {
        const checkIn = checkInDate.toISOString().split('T')[0];
        const checkOut = checkOutDate.toISOString().split('T')[0];
        onSearch?.(checkIn, checkOut, adults, children, rooms);
    };

    const handleCheckInDateChange = (date: Date) => {
        setCheckInDate(date);
        // If check-out is before check-in, adjust it
        if (checkOutDate <= date) {
            setCheckOutDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
        }
    };

    const handleCheckOutDateChange = (date: Date) => {
        setCheckOutDate(date);
    };
    
    // Handle clicks outside the dropdown components
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Close check-in calendar if click is outside
            if (
                showCheckInCalendar &&
                checkInCalendarRef.current && 
                !checkInCalendarRef.current.contains(event.target as Node) &&
                checkInButtonRef.current && 
                !checkInButtonRef.current.contains(event.target as Node)
            ) {
                setShowCheckInCalendar(false);
            }
            
            // Close check-out calendar if click is outside
            if (
                showCheckOutCalendar &&
                checkOutCalendarRef.current && 
                !checkOutCalendarRef.current.contains(event.target as Node) &&
                checkOutButtonRef.current && 
                !checkOutButtonRef.current.contains(event.target as Node)
            ) {
                setShowCheckOutCalendar(false);
            }
            
            // Close guest dropdown if click is outside
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
        
        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);
        
        // Clean up
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCheckInCalendar, showCheckOutCalendar, showGuestDropdown]);

    return (
        <div className="w-full max-w-4xl mx-auto bg-white/70 rounded-3xl shadow-xl flex flex-col sm:flex-row gap-2 sm:gap-0 items-stretch sm:items-center border border-white/30 overflow-visible relative z-10">
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
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-[#ff9100] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist">Check in</div>
                        <div className="text-gray-500 font-semibold font-urbanist text-sm sm:text-base">
                            {checkInDate ? format(checkInDate, "MMM d, yyyy") : 'Add dates'}
                        </div>
                    </div>
                </div>

                {/* Check In Calendar Popup */}
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
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-[#ff9100] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist notranslate">Check out</div>
                        <div className="text-gray-500 font-semibold font-urbanist text-sm sm:text-base">
                            {checkOutDate ? format(checkOutDate, "MMM d, yyyy") : 'Add dates'}
                        </div>
                    </div>
                </div>

                {/* Check Out Calendar Popup */}
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
                    <Users className="w-4 sm:w-5 h-4 sm:h-5 text-[#ff9100] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium font-urbanist notranslate">Guest & Rooms</div>
                        <div className="text-gray-400 font-medium font-urbanist notranslate text-xs sm:text-base truncate">{adults} Adults, {rooms} Room{rooms > 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>

            {showGuestDropdown && (
                <div 
                  ref={guestDropdownRef}
                  className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-xl p-6 w-80 sm:w-100 guest-dropdown font-urbanist notranslate">
                    <div className="max-w-4xl mx-auto">
                        {[
                            { label: 'Adults', desc: 'Ages 13 or above', value: adults, setter: setAdults },
                            { label: 'Children', desc: 'Ages 2–12', value: children, setter: setChildren },
                            { label: 'Rooms', desc: 'Number of rooms', value: rooms, setter: setRooms },
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

            {/* Search Button */}
            <button
                onClick={handleSearch}
                className="bg-[#ff9100] hover:bg-[#ff9100]/90 text-white p-3 sm:p-4 rounded-2xl mt-2 sm:mb-0 sm:mt-0 sm:ml-2 w-full sm:w-auto mr-[5px]"
            >
                <Search className="w-4 sm:w-5 h-4 sm:h-5 mx-auto" />
            </button>
        </div>
    );
}