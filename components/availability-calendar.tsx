"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { useBooking } from "@/components/booking-context"
import { getUnavailableDates } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

export function AvailabilityCalendar() {
  const { updateBookingDetails } = useBooking()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [nextMonth, setNextMonth] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() + 1)))
  const isMobile = useMobile()

  // Update next month when selected month changes
  useEffect(() => {
    const nextMonthDate = new Date(selectedMonth)
    nextMonthDate.setMonth(selectedMonth.getMonth() + 1)
    setNextMonth(nextMonthDate)
  }, [selectedMonth])

  // Get unavailable dates for the current view
  const unavailableDates = getUnavailableDates(selectedMonth)
  const nextMonthUnavailableDates = getUnavailableDates(nextMonth)

  const handleSelect = (date: Date | undefined) => {
    setDate(date)
    if (date) {
      updateBookingDetails({ checkIn: date })

      // Set checkout to the day after checkin by default
      const checkOut = new Date(date)
      checkOut.setDate(checkOut.getDate() + 1)
      updateBookingDetails({ checkOut })
    }
  }

  const isDateUnavailable = (date: Date) => {
    // Disable dates in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if date is in unavailable dates
    return (
      date < today ||
      unavailableDates.some(
        (unavailableDate) =>
          unavailableDate.getDate() === date.getDate() &&
          unavailableDate.getMonth() === date.getMonth() &&
          unavailableDate.getFullYear() === date.getFullYear(),
      ) ||
      nextMonthUnavailableDates.some(
        (unavailableDate) =>
          unavailableDate.getDate() === date.getDate() &&
          unavailableDate.getMonth() === date.getMonth() &&
          unavailableDate.getFullYear() === date.getFullYear(),
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              disabled={isDateUnavailable}
              onMonthChange={setSelectedMonth}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {!isMobile && (
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                month={nextMonth}
                selected={date}
                onSelect={handleSelect}
                disabled={isDateUnavailable}
                onMonthChange={(month) => {
                  // If user navigates the second calendar, update both calendars
                  const prevMonth = new Date(month)
                  prevMonth.setMonth(month.getMonth() - 1)
                  setSelectedMonth(prevMonth)
                  setNextMonth(month)
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Selected</span>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Select a date to check availability and start your booking</p>
      </div>
    </div>
  )
}
