// @ts-nocheck
"use client"

import { Suspense } from "react"
import type React from "react"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
import { useEffect, useState } from "react"
import { fetchCountries } from "@/lib/utils" // Adjust path as needed
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { AlertCircle, Calendar, CheckCircle, Minus, Plus } from "lucide-react"
import { RoomBooking, useBooking } from "@/components/booking-context"

function SearchParamLoader({ onLoaded }: { onLoaded: (params: URLSearchParams) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onLoaded(searchParams);
  }, [searchParams]);
  return null;
}

function RoomTypeLoader({ onLoaded }: { onLoaded: (roomTypeNames: string[]) => void }) {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    if (params) {
      const roomTypeNames = params.get("roomTypes")?.split(",") || [];
      onLoaded(roomTypeNames);
    }
  }, [params]);

  return (
    <Suspense fallback={null}>
      <SearchParamLoader onLoaded={setParams} />
    </Suspense>
  );
}



// Define RoomType interface (update fields as needed to match your data)
interface RoomType {
  id: string
  roomName: string
  bedType: string
  price: number
  availability: number
  // Add other fields as needed
}

// Define Country type if not imported
type Country = {
  code: string
  name: string
}

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PhoneInput } from "@/components/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Header from "@/components/header"
import { useCurrency } from "@/components/currency-context"
import { CurrencySelector } from "@/components/currency-selector"

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  specialRequests?: string
  terms?: string
}

// Make sure BookingDetails includes specialRequests
// If BookingDetails is imported from elsewhere, update it there instead:
// Extend BookingDetails to support promoCode and promoDetails
interface BookingDetails {
  name: string
  email: string
  phone: string
  nationality: string
  checkIn: Date | null
  checkOut: Date | null
  nights: number
  selectedRooms: any[]
  specialRequests?: string
  promoCode?: string
  promoDetails?: any
  selectedPackages?: any[]
}

export default function BookPage() {
  const router = useRouter()
  const [roomTypeNames, setRoomTypeNames] = useState<string[]>([])

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])

  // Restore reservation summary from localStorage if available
  const { bookingDetails, updateBookingDetails, updateRoom, incrementRoomQuantity, decrementRoomQuantity } =
    useBooking()
  useEffect(() => {
    const saved = localStorage.getItem("reservationSummary");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.checkIn) parsed.checkIn = new Date(parsed.checkIn);
      if (parsed.checkOut) parsed.checkOut = new Date(parsed.checkOut);
      updateBookingDetails(parsed);
      // Restore promo details if available
      const storedPromoDetails = localStorage.getItem("parsedPromoDetails");
      if (storedPromoDetails) {
        try {
          const parsedPromo = JSON.parse(storedPromoDetails);
          parsed.promoCode = parsedPromo.PromoCode;
          parsed.promoDetails = parsedPromo;
          updateBookingDetails(parsed);
        } catch (e) {
          console.error("Failed to parse stored promo details", e);
        }
      }
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await fetch("/api/rooms") // replace with actual endpoint
        const data: RoomType[] = await response.json()
        const filteredRooms = data.filter(room => roomTypeNames.includes(room.roomName))
        setRoomTypes(filteredRooms)
      } catch (error) {
        console.error("Error fetching room types:", error)
      }
    }

    if (roomTypeNames.length > 0) {
      fetchRoomDetails()
    }
  }, [roomTypeNames])
  const { convertPrice, formatPrice } = useCurrency()
  const [isMounted, setIsMounted] = useState(false)

  // Countries state and fetch
  const [countries, setCountries] = useState<Country[]>([])
  useEffect(() => {
    const getAllCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all")
        if (!response.ok) throw new Error("Failed to fetch countries")

        const data = await response.json()
        const formattedCountries = data
          .map((c: any) => ({
            code: c.cca2,
            name: c.name.common,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setCountries(formattedCountries)
      } catch (err) {
        console.error("Failed to fetch countries", err)
        setCountries([])
      }
    }

    getAllCountries()
  }, [])

  // Hotel policies state and fetch
  const [hotelPolicies, setHotelPolicies] = useState<{
    CancellationPolicy?: string
    ChildPolicy?: string
    Taxation?: string
    Phone?: string
    WhatsAppNo?: string
  }>({})

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/API/GetHotelDetail.aspx?`)

        if (!response.ok) {
          throw new Error("Failed to fetch hotel policies")
        }

        const data = await response.json()
        setHotelPolicies({
          CancellationPolicy: data.CancellationPolicy,
          ChildPolicy: data.ChildPolicy,
          Taxation: data.Taxation,
          Phone: data.Phone,
          WhatsAppNo: data.WhatsAppNo,
        })
      } catch (error) {
        console.error("Error fetching hotel policies:", error)
      }
    }

    fetchPolicies()
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [checkedTerms, setCheckedTerms] = useState(false)
  const [specialRequests, setSpecialRequests] = useState("")



  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    // Basic validation for phone number (at least 5 digits after country code)
    return /\+\d+\s\d{5,}/.test(phone)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const errors: FormErrors = {}

    if (!bookingDetails.name || bookingDetails.name.trim().length < 3) {
      errors.name = "Please enter your full name (at least 3 characters)"
    }

    if (!bookingDetails.email || !validateEmail(bookingDetails.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!bookingDetails.phone || !validatePhone(bookingDetails.phone)) {
      errors.phone = "Please enter a valid phone number with country code"
    }

    if (!checkedTerms) {
      errors.terms = "You must agree to the terms and conditions"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    updateBookingDetails({ specialRequests: specialRequests })

    // Normalize phone number by removing spaces between country code and number
    const cleanedPhone = bookingDetails.phone.replace(/\s+/g, "");
    // Store reservation summary in localStorage before proceeding to payment
    const reservationSummary = {
      ...bookingDetails,
      phone: cleanedPhone,
      specialRequests,
      promoCode: bookingDetails.promoCode,
      selectedPackages: bookingDetails.selectedPackages,
    };
    localStorage.setItem("reservationSummary", JSON.stringify(reservationSummary));

    // Clear errors and proceed
    setFormErrors({})
    router.push("/payment")
  }

  // Calculate meal plan costs for each room
  interface RoomBooking {
    roomId: string
    roomName: string
    price: number
    quantity: number
    adults: number
    children: number
    mealPlanId?: string
  }

  interface MealPlan {
    id: string
    name: string
    priceAdult: number
    priceChild: number
    minChildren?: number
  }

  // Calculate totals
  const baseTotal = bookingDetails.selectedRooms.reduce((total, room) => {
    return total + room.price * room.quantity * bookingDetails.nights
  }, 0)
  const packagesTotal = bookingDetails.selectedPackages?.reduce((total, pkg) => {
    return total + pkg.Price;
  }, 0) || 0;
  // Example promo: 15% off baseTotal if promoCode exists
  const promoDiscount = bookingDetails.promoCode ? 0.15 * baseTotal : 0;
  const finalTotal = baseTotal + packagesTotal - promoDiscount;

  // Update localStorage reservationSummary with the correct total price after calculation
  useEffect(() => {
    if (isMounted) {
      const saved = localStorage.getItem("reservationSummary");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.total = finalTotal;
        localStorage.setItem("reservationSummary", JSON.stringify(parsed));
      }
    }
  }, [isMounted, finalTotal]);


 
  // Check if same-day booking is available
  const isSameDay = new Date().toDateString() === (bookingDetails.checkIn?.toDateString() || "")

  return (
    <>
      <Header />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Heading and Currency Selector */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Complete Your Booking</h1>
            <p className="text-sm text-muted-foreground">Please fill in your details to proceed with your reservation</p>
          </div>
          <CurrencySelector />
        </div>

        <Suspense fallback={null}>
          <RoomTypeLoader onLoaded={setRoomTypeNames} />
        </Suspense>

        {Object.keys(formErrors).length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>Please correct the following errors:</p>
              <ul className="list-disc pl-5 mt-2">
                {Object.entries(formErrors).map(([key, error]) => (
                  <li key={key}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Selected Rooms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookingDetails.selectedRooms.map((roomBooking) => {
                    const room: RoomType | undefined = roomTypes.find((r: RoomType) => r.id === roomBooking.roomId)
                    if (!room) return null

                    function calculateMealPlanCost(roomBooking: RoomBooking) {
                      throw new Error("Function not implemented.")
                    }

                    return (
                      <div key={roomBooking.roomId} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">{roomBooking.roomName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {room.bedType} • {roomBooking.adults} {roomBooking.adults === 1 ? "adult" : "adults"}
                              {roomBooking.children > 0 &&
                                `, ${roomBooking.children} ${roomBooking.children === 1 ? "child" : "children"}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => decrementRoomQuantity(roomBooking.roomId)}
                              disabled={roomBooking.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{roomBooking.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => incrementRoomQuantity(roomBooking.roomId)}
                              disabled={roomBooking.quantity >= room.availability}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mb-3">
                          <Label htmlFor={`mealPlan-${roomBooking.roomId}`} className="text-sm">
                            Meal Plan
                          </Label>
                          <Select
                            value={roomBooking.mealPlanId}
                            onValueChange={(value) => updateRoom(roomBooking.roomId, { mealPlanId: value })}
                          >
                            <SelectTrigger id={`mealPlan-${roomBooking.roomId}`}>
                              <SelectValue placeholder="Select a meal plan" />
                            </SelectTrigger>
                          </Select>
                        </div>

                        <div className="text-sm text-right">
                          <div>
                            Room: {formatPrice(convertPrice(roomBooking.price * roomBooking.quantity))} x{" "}
                            {bookingDetails.nights} nights
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="grid gap-2">
                    <Label>Stay Dates (Selected from Property Page)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-3 bg-muted flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Check-in Date</div>
                          <div>
                            {bookingDetails.checkIn ? format(bookingDetails.checkIn, "MMM d, yyyy") : "Not selected"}
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-md p-3 bg-muted flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Check-out Date</div>
                          <div>
                            {bookingDetails.checkOut ? format(bookingDetails.checkOut, "MMM d, yyyy") : "Not selected"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      To change dates, please return to the{" "}
                      <a href="/" className="text-primary underline">
                        landing page
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={bookingDetails.name}
                      onChange={(e) => updateBookingDetails({ name: e.target.value })}
                      className={formErrors.name ? "border-red-500" : ""}
                      required
                    />
                    {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={bookingDetails.email}
                      onChange={(e) => updateBookingDetails({ email: e.target.value })}
                      className={formErrors.email ? "border-red-500" : ""}
                      required
                    />
                    {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select
                      value={bookingDetails.nationality}
                      onValueChange={(value) => updateBookingDetails({ nationality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {countries.map((country: Country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <PhoneInput
                      id="phone"
                      value={bookingDetails.phone}
                      onChange={(value) => updateBookingDetails({ phone: value })}
                      countryCode={bookingDetails.nationality}
                      error={formErrors.phone}
                      required
                    />
                    {formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="specialRequests">Special Requests (optional)</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special requests or preferences?"
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Policies & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="cancellation">
                      <AccordionTrigger>Cancellation Policy</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm whitespace-pre-line">{hotelPolicies.CancellationPolicy || "Cancellation policy information will be available soon."}</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="children">
                      <AccordionTrigger>Child Policy</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm whitespace-pre-line">{hotelPolicies.ChildPolicy || "Child policy details will be available soon."}</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="taxation">
                      <AccordionTrigger>Taxation Policy</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm whitespace-pre-line">{hotelPolicies.Taxation || "Taxation details will be available soon."}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="pt-4 border-t">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={checkedTerms}
                        onCheckedChange={(checked) => setCheckedTerms(checked === true)}
                        className={formErrors.terms ? "border-red-500" : ""}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="terms"
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                            formErrors.terms ? "text-red-500" : ""
                          }`}
                        >
                          I agree to the terms and conditions
                        </label>
                        <p className="text-sm text-muted-foreground">
                          By checking this box, I confirm that I have read and agree to the booking policies,
                          cancellation policy, and hotel rules.
                        </p>
                        {formErrors.terms && <p className="text-xs text-red-500">{formErrors.terms}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-black text-white hover:bg-black/90"
                    disabled={!checkedTerms}
                  >
                    Proceed to Payment
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>

          <div>
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {bookingDetails.selectedRooms.map((roomBooking) => (
                    <div key={roomBooking.roomId} className="mb-4 p-3 bg-muted rounded-md">
                      <h3 className="font-medium">{roomBooking.roomName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {roomBooking.quantity} {roomBooking.quantity === 1 ? "room" : "rooms"} • {bookingDetails.nights} {bookingDetails.nights === 1 ? "night" : "nights"} •
                        {roomBooking.adults} {roomBooking.adults === 1 ? "adult" : "adults"}
                        {roomBooking.children > 0 &&
                          `, ${roomBooking.children} ${roomBooking.children === 1 ? "child" : "children"}`}
                      </p>
                      <div className="text-sm mt-1 text-muted-foreground">
                        {formatPrice(convertPrice(roomBooking.price))} per night
                        {roomBooking.mealPlanId && (
                          <div className="text-xs mt-1">Meal Plan: {roomBooking.mealPlanId}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="space-y-4">
                    {/* Check-in Date */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-muted-foreground">Check-in Date</div>
                      <span className="text-sm font-medium text-foreground">
                        {bookingDetails.checkIn ? format(bookingDetails.checkIn, "MMM d, yyyy") : "Not selected"}
                      </span>
                    </div>
                    {/* Check-out Date */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-muted-foreground">Check-out Date</div>
                      <span className="text-sm font-medium text-foreground">
                        {bookingDetails.checkOut ? format(bookingDetails.checkOut, "MMM d, yyyy") : "Not selected"}
                      </span>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      {/* Room charges */}
                      <div className="text-sm font-semibold text-foreground mt-4 mb-2">Room charges</div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <span className="text-sm font-medium text-foreground">
                          {isMounted ? formatPrice(convertPrice(baseTotal)) : `$${baseTotal.toFixed(2)}`}
                        </span>
                      </div>
                      {/* Packages */}
                      {bookingDetails.selectedPackages?.length > 0 && (
                        <>
                          <div className="text-sm font-semibold text-foreground mt-4 mb-2">Packages</div>
                          <ul className="text-sm text-muted-foreground space-y-1 mb-1">
                            {bookingDetails.selectedPackages.map((pkg, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{pkg.Description}</span>
                                <span className="text-sm font-medium text-foreground">{formatPrice(convertPrice(pkg.Price))}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Package Cost</span>
                            <span className="text-sm font-medium text-foreground">{formatPrice(convertPrice(packagesTotal))}</span>
                          </div>
                        </>
                      )}
                      {/* Promo */}
                      {bookingDetails.promoCode && (
                        <div className="text-sm font-semibold text-foreground mt-4 mb-2">Promo</div>
                      )}
                      {bookingDetails.promoCode && (
                        <div className="flex justify-between mb-2 text-green-600">
                          <span className="text-sm font-medium">Promo ({bookingDetails.promoCode})</span>
                          <span className="text-sm font-medium">-{formatPrice(convertPrice(promoDiscount))}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 font-bold text-lg text-foreground">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>
                          {isMounted
                            ? formatPrice(convertPrice(finalTotal))
                            : `$${finalTotal.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  You won't be charged until the next step
                </CardFooter>
              </Card>

              {isSameDay && (
                <Card>
                  <CardHeader>
                    <CardTitle>Same Day Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Alert className="bg-green-50 border-green-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>Rooms Available Today!</AlertTitle>
                        <AlertDescription className="text-xs">
                          Your booking is for check-in today. We have confirmed availability for your selected rooms.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our customer support team is available 24/7 to assist you with your booking.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={hotelPolicies.WhatsAppNo ? `https://wa.me/${hotelPolicies.WhatsAppNo}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full" disabled={!hotelPolicies.WhatsAppNo}>
                        WhatsApp
                      </Button>
                    </a>
                    <a href={`tel:${hotelPolicies.Phone?.replace(/\s/g, "")}`}>
                      <Button variant="outline" className="w-full">
                        Call Us
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
