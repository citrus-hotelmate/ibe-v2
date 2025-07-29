import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import axios from 'axios'

export type Country = {
  code: string
  name: string
}

export const fetchCountries = async (): Promise<Country[]> => {
  const response = await axios.get('https://restcountries.com/v3.1/all')
  return response.data.map((country: any) => ({
    code: country.cca2,
    name: country.name.common,
  }))
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateBookingId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Function to generate unavailable dates for the availability calendar
export function getUnavailableDates(month: Date) {
  const unavailableDates: Date[] = []

  // Get the current month and year
  const currentMonth = month.getMonth()
  const currentYear = month.getFullYear()

  // Generate some random unavailable dates for the current month
  // In a real app, this would come from a database
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Make 30% of the days unavailable randomly
  const numberOfUnavailableDays = Math.floor(daysInMonth * 0.3)

  for (let i = 0; i < numberOfUnavailableDays; i++) {
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1
    const unavailableDate = new Date(currentYear, currentMonth, randomDay)

    // Check if this date is already in the array
    if (
      !unavailableDates.some(
        (date) =>
          date.getDate() === unavailableDate.getDate() &&
          date.getMonth() === unavailableDate.getMonth() &&
          date.getFullYear() === unavailableDate.getFullYear(),
      )
    ) {
      unavailableDates.push(unavailableDate)
    }
  }

  return unavailableDates
}

export function convertPrice(value: number): number {
  return value; // Placeholder for actual currency conversion logic
}
