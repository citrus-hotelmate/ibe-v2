// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { useWindowSize } from "@react-hook/window-size"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { CheckCircle, Download, Mail } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import type { MealPlan } from "@/lib/data"
import { CurrencySelector } from "@/components/currency-selector"

import { useCurrency } from "@/components/currency-context"

export default function ConfirmedPage() {
  const [width, height] = useWindowSize()
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(true)
  const [hotelDetails, setHotelDetails] = useState<any>(null)
  const [paymentCollect, setPaymentCollect] = useState<string | null>(null)

  const { currency, convertPrice } = useCurrency()

  const formatPrice = (value: number) => `${currency} ${value.toFixed(2)}`

  // Load booking details from localStorage on mount, then merge with reservationSummary
  useEffect(() => {
    const stored = localStorage.getItem("bookingDetails")
    if (stored) {
      const parsedBooking = JSON.parse(stored)
      // After loading bookingDetails, merge in pricing/room/package info from reservationSummary
      const reservation = localStorage.getItem("reservationSummary");
      if (reservation) {
        const parsedReservation = JSON.parse(reservation);
        // Inject promo details from localStorage (for confirmed page consistency)
        const storedPromoDetails = localStorage.getItem("parsedPromoDetails");
        if (storedPromoDetails) {
          try {
            const parsedPromo = JSON.parse(storedPromoDetails);
            parsedReservation.promoCode = parsedPromo.PromoCode;
            parsedReservation.promoDetails = parsedPromo;
          } catch (e) {
            console.error("Failed to parse stored promo details", e);
          }
        }
        setBookingDetails((prev: any) => {
          // Use parsedBooking as base if prev is null (first load), otherwise use prev
          const previous = prev ?? parsedBooking;
          const roomTotal = parsedReservation.selectedRooms?.reduce((sum: number, room: any) => {
            return sum + room.price * room.quantity * parsedReservation.nights;
          }, 0) || 0;

          const packageTotal = parsedReservation.selectedPackages?.reduce((sum: number, pkg: any) => {
            return sum + pkg.Price;
          }, 0) || 0;

          const promoDiscount = parsedReservation.promoCode ? 0.15 * roomTotal : 0;

          return {
            ...previous,
            selectedRooms: parsedReservation.selectedRooms,
            selectedPackages: parsedReservation.selectedPackages,
            promoCode: parsedReservation.promoCode,
            promoDetails: parsedReservation.promoDetails,
            total: roomTotal + packageTotal,
            totalPrice: roomTotal + packageTotal - promoDiscount,
            nights: parsedReservation.nights,
            checkIn: parsedReservation.checkIn,
            checkOut: parsedReservation.checkOut,
            specialRequests: parsedReservation.specialRequests,
            discount: promoDiscount,
          };
        });
      } else {
        setBookingDetails(parsedBooking)
      }
    }
    const collect = localStorage.getItem("payment_collect");
    setPaymentCollect(collect);
  }, [])

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const res = await fetch("https://ipg.citrusibe.com/API/GetHotelDetail.aspx")
        const data = await res.json()
        setHotelDetails(data)
      } catch (error) {
        console.error("Failed to fetch hotel details", error)
      }
    }
    fetchHotelDetails()
  }, [])

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (!bookingDetails) {
    return <div className="text-center py-8">Loading booking details...</div>
  }

  // Get the selected room, with fallback if selectedRoomId is undefined
  interface BookingDetails {
    bookingId: string
    selectedRoomId?: string
    mealPlanId?: string
    mealPlanCost?: number
    totalPrice?: number
    nationality?: string
    name: string
    adults: number
    children: number
    email: string
    phone: string
    checkIn?: string
    checkOut?: string
    nights: number
    paymentMethod?: string
  }

  interface RoomType {
    id: string
    name: string
    image?: string
    mealPlans?: MealPlan[]
  }

  // const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  // const [hotelDetails, setHotelDetails] = useState<any>(null)

  // TODO: Replace with actual room types data or fetch from API
  const roomTypes: RoomType[] = hotelDetails?.RoomTypes || []

  const selectedRoom: RoomType | undefined = bookingDetails?.selectedRoomId
    ? roomTypes.find((room: RoomType) => room.id === bookingDetails.selectedRoomId)
    : undefined

  // Get the selected meal plan, using mealPlanId from the bookingDetails
  const selectedMealPlan =
    bookingDetails?.mealPlanId && selectedRoom?.mealPlans
      ? selectedRoom.mealPlans.find((plan: MealPlan) => plan.id === bookingDetails.mealPlanId)
      : undefined

  // Calculate meal plan cost (fallback to 0 if not available)
  const mealPlanCost = bookingDetails?.mealPlanCost ?? 0

  // Calculate total price (fallback to 0 if not available)
  const totalPrice = bookingDetails?.totalPrice ?? 0

  // Get nationality
  interface Country {
    code: string
    name: string
  }

  // Assume countries is defined elsewhere and is an array of Country
  const countries: Country[] = [] // TODO: Replace with actual countries data or import

  const nationality: string =
    bookingDetails?.nationality && Array.isArray(countries)
      ? countries.find((country: Country) => country.code === bookingDetails.nationality)?.name || "Not specified"
      : "Not specified"
  // Helper to map RoomType to Room (fill with defaults if needed)
  const mapRoomTypeToRoom = (roomType: RoomType | undefined): Room | undefined => {
    if (!roomType) return undefined
    // Provide default values for missing Room fields
    return {
      ...roomType,
      triplerate: 0,
      description: "",
      price: 0,
      capacity: 0,
      amenities: [],
      refundable: false,
      cancellationPolicy: "",
      available: true,
      // Add any other required Room fields with sensible defaults
    }
  }

  const handleDownload = async () => {
    const element = document.getElementById("booking-card")
    const buttons = document.getElementById("download-email-buttons")
    if (!element) return

    // Hide the buttons before capturing
    if (buttons) buttons.style.display = "none"

    // Wait for layout to settle
    await new Promise(r => setTimeout(r, 300))

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
      })
      const imgData = canvas.toDataURL("image/png")

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`booking-${bookingDetails.bookingId}.pdf`)
    } catch (err) {
      console.error("Failed to render PDF", err)
    } finally {
      if (buttons) buttons.style.display = ""
    }
  }

  const handleEmailBooking = () => {
    // In a real app, this would send an email via an API
    // For this demo, we'll just open the mail client
    const subject = `Your Booking Confirmation: ${bookingDetails.bookingId}`
    const body = `
      Thank you for booking with Peaceful Escape!
      
      Booking ID: ${bookingDetails.bookingId}
      Room: ${selectedRoom?.name || "Standard Room"}
      
      Check-in: ${bookingDetails.checkIn ? format(bookingDetails.checkIn, "MMMM d, yyyy") : ""}
      Check-out: ${bookingDetails.checkOut ? format(bookingDetails.checkOut, "MMMM d, yyyy") : ""}
      Guests: ${bookingDetails.adults} adults${bookingDetails.children > 0 ? `, ${bookingDetails.children} children` : ""}
      
      ${bookingDetails.paymentMethod === "arrival" ? `Amount due: ${totalPrice}` : `Total paid: ${totalPrice}`}
    `

    window.location.href = `mailto:${bookingDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <CurrencySelector />
      </div>
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />}

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-2">Your reservation has been successfully processed.</p>
      </div>

      <Card id="booking-card">
        <CardHeader>
          <CardTitle className="flex justify-between items-center ml-8">
            <span>Booking Details</span>
            <span className="text-sm font-normal text-muted-foreground">ID: {bookingDetails.bookingId}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4 ml-8">
              <div className="w-28 h-28 relative rounded-md overflow-hidden bg-gray-100 p-2">
                <Image
                  src={selectedRoom?.image || hotelDetails?.IBE_LogoURL || "/placeholder.svg?height=80&width=80"}
                  alt="Property"
                  fill
                  className="object-contain"
                  style={{ padding: "0.25rem" }}
                />
              </div>
              <div>
                <h3 className="font-semibold">{hotelDetails?.HotelName || "Hotel Name"}</h3>
                {hotelDetails?.Address && <p className="text-sm text-muted-foreground">{hotelDetails.Address}</p>}
              </div>
            </div>

            {paymentCollect && (
              <div className="flex justify-between">
                <span className="text-sm font-bold text-foreground ml-8">
                  Payment: {paymentCollect === "paid" ? "Paid Online" : "Pay at Hotel"}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 ml-8">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium">
                  {bookingDetails.checkIn ? format(bookingDetails.checkIn, "EEE, MMM d, yyyy") : "Not selected"}
                </p>
                <p className="text-sm">After 3:00 PM</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium">
                  {bookingDetails.checkOut ? format(bookingDetails.checkOut, "EEE, MMM d, yyyy") : "Not selected"}
                </p>
                <p className="text-sm">Before 11:00 AM</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground ml-8">Guest</p>
              <p className="font-medium ml-8">{bookingDetails.name}</p>
              <p className="text-sm ml-8">
                {bookingDetails.adults} {bookingDetails.adults === 1 ? "adult" : "adults"}
                {bookingDetails.children > 0 &&
                  `, ${bookingDetails.children} ${bookingDetails.children === 1 ? "child" : "children"}`}
              </p>
              <p className="text-sm ml-8">Nationality: {nationality}</p>
              <p className="text-sm ml-8">Email: {bookingDetails.email}</p>
              <p className="text-sm ml-8">Phone: {bookingDetails.phone}</p>
            </div>



            {/* Payment Summary */}
            <CardContent className="pt-0">
              {bookingDetails.selectedRooms.map((roomBooking: any) => (
                <div
                  key={roomBooking.roomId}
                  className="mb-4 p-3 bg-muted rounded-md"
                >
                  <h3 className="font-medium">{roomBooking.roomName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {roomBooking.quantity} {roomBooking.quantity === 1 ? "room" : "rooms"} •{" "}
                    {bookingDetails.nights} {bookingDetails.nights === 1 ? "night" : "nights"} •{" "}
                    {roomBooking.adults} {roomBooking.adults === 1 ? "adult" : "adults"}
                    {roomBooking.children > 0 &&
                      `, ${roomBooking.children} ${roomBooking.children === 1 ? "child" : "children"}`}
                  </p>
                  <div className="text-sm mt-1 text-muted-foreground">
                    {formatPrice(convertPrice(roomBooking.price))} per night
                    {roomBooking.mealPlanId && (
                      <div className="text-xs mt-1">
                        Meal Plan: {roomBooking.mealPlanId}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="space-y-4">

                <div className="border-t pt-4 mt-4">
                  <div className="text-sm font-semibold text-foreground mt-4 mb-2">Room charges</div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatPrice(convertPrice(bookingDetails.selectedRooms.reduce((sum: number, room: any) => sum + room.price, 0)))}
                    </span>
                  </div>

                  {bookingDetails.selectedPackages?.length > 0 && (
                    <>
                      <div className="text-sm font-semibold text-foreground mt-4 mb-2">Packages</div>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-1">
                        {bookingDetails.selectedPackages.map((pkg: any, idx: number) => (
                          <li key={idx} className="flex justify-between">
                            <span>{pkg.Description}</span>
                            <span className="text-sm font-medium text-foreground">{formatPrice(convertPrice(pkg.Price))}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Package Cost</span>
                        <span className="text-sm font-medium text-foreground">
                          {formatPrice(convertPrice(bookingDetails.selectedPackages.reduce((sum: number, pkg: any) => sum + pkg.Price, 0)))}
                        </span>
                      </div>
                    </>
                  )}

                  {bookingDetails.promoCode && (
                    <>
                      <div className="text-sm font-semibold text-foreground mt-4 mb-2">Promo</div>
                      <div className="flex justify-between mb-2 text-green-600">
                        <span className="text-sm font-medium">Promo ({bookingDetails.promoCode})</span>
                        <span className="text-sm font-medium">
                          {bookingDetails.discount > 0
                            ? `-${formatPrice(convertPrice(bookingDetails.discount))}`
                            : `-${formatPrice(0)}`}
                        </span>
                      </div>
                    </>
                  )}
                </div>


                <div className="pt-4 font-bold text-lg text-foreground">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>
                      {formatPrice(convertPrice(bookingDetails.totalPrice ?? bookingDetails.total ?? 0))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            
          </div>
        </CardContent>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {hotelDetails?.Address && <p>Address: {hotelDetails.Address}</p>}
          {hotelDetails?.Phone && <p>Phone: {hotelDetails.Phone}</p>}
          {hotelDetails?.Email && <p>Email: {hotelDetails.Email}</p>}<br></br>
        </div>
      </Card>

      {/* Download and Email buttons moved here, above Return to Property */}
      <div
        id="download-email-buttons"
        className="flex flex-col sm:flex-row gap-4 mt-4"
      >
        <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="mt-8 text-center">
        <Button asChild size="lg">
          <Link href="/">Return to Property</Link>
        </Button>
      </div>
      
    </div>
  )
}
