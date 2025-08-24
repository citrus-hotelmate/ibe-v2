"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";
import Image from "next/image";
import { createBookingFeed } from "@/controllers/reservationController";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllHotels } from "@/controllers/adminController";
import { getHotelIPGByHotelId } from "@/controllers/hotelIPGController";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { useBooking } from "@/components/booking-context";
import { generateBookingId } from "@/lib/utils";
import { generateRefNo } from "@/lib/randomNumberGenerator";
import Header from "@/components/header";
import { useCurrency } from "@/components/currency-context";
import { CurrencySelector } from "@/components/currency-selector";

export default function PaymentPage() {
  const router = useRouter();
  const { bookingDetails, updateBookingDetails } = useBooking() as {
    bookingDetails: BookingDetails;
    updateBookingDetails: (details: Partial<BookingDetails>) => void;
  };
  const { convertPrice, formatPrice } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [allowPayAtProperty, setAllowPayAtProperty] = useState(false);
  const [isIPGActive, setIsIPGActive] = useState(false);
  const [ipgCredentials, setIpgCredentials] = useState<any>(null);
  const [currentHotelId, setCurrentHotelId] = useState<number | null>(null);

  // isMounted state for client-only rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Get reservation summary
    const saved = localStorage.getItem("reservationSummary");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.checkIn) parsed.checkIn = new Date(parsed.checkIn);
      if (parsed.checkOut) parsed.checkOut = new Date(parsed.checkOut);
      updateBookingDetails(parsed);
      // Restore and apply stored promotion
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
    
    // Get selected hotel details
    const savedHotel = localStorage.getItem("selectedHotel");
    console.log("Saved hotel from localStorage:", savedHotel);
    
    if (savedHotel) {
      try {
        const hotelData = JSON.parse(savedHotel);
        console.log("Parsed hotel data:", hotelData);
        
        updateBookingDetails({
          hotelId: hotelData.id.toString(),
          hotelName: hotelData.name,
          hotelImageUrl: hotelData.image
        });
        
        console.log("Updated booking details with hotel ID:", hotelData.id.toString());
      } catch (e) {
        console.error("Failed to parse stored hotel details", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPaymentOptions = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
        
        // Get hotel ID from localStorage
        const savedHotel = localStorage.getItem("selectedHotel");
        if (savedHotel) {
          const hotelData = JSON.parse(savedHotel);
          const hotelId = hotelData.id;
          setCurrentHotelId(hotelId);
          
          // Fetch IPG credentials for this hotel
          try {
            const ipgData = await getHotelIPGByHotelId({ 
              token: token || "", 
              hotelId 
            });
            
            if (ipgData && ipgData.length > 0) {
              setIpgCredentials(ipgData[0]);
              setIsIPGActive(ipgData[0].isIPGActive);
              console.log("✅ IPG credentials loaded:", ipgData[0]);
            } else {
              console.log("⚠️ No IPG credentials found for hotel:", hotelId);
              setIsIPGActive(false);
            }
          } catch (ipgError) {
            console.error("❌ Failed to fetch IPG credentials:", ipgError);
            setIsIPGActive(false);
          }
        }
        
        // For now, always allow pay at property
        setAllowPayAtProperty(true);
        
      } catch (error) {
        console.error("Error fetching payment options:", error);
        // Set default values in case of error
        setAllowPayAtProperty(true);
        setIsIPGActive(false);
      }
    };

    fetchPaymentOptions();
  }, []);

  // Calculate meal plan costs for each room
  interface RoomBooking {
    roomId: string;
    roomName: string;
    quantity: number;
    adults: number;
    children: number;
    mealPlanId?: string;
    price: number;
  }

  interface BookingDetails {
    selectedRooms: Array<RoomBooking & { price?: number; averageRate?: number }>;
    checkIn?: Date;
    checkOut?: Date;
    nights: number;
    paymentMethod?: string;
    bookingId?: string;
    currency: "USD" | "LKR";
    promoCode?: string;
    promoDetails?: {
      Value: number;
      PromoCode?: string;
      [key: string]: any;
    };
    specialRequests?: string;
    hotelId: string;
    hotelName?: string;
    hotelImageUrl?: string;
    selectedPackages?: Array<{
      Description: string;
      Price: number;
      [key: string]: any;
    }>;
    name?: string;
    email?: string;
    phone?: string;
    nationality?: string;
    totalPrice?: number;
    children?: number;
    adults?: number;
  }

  interface MealPlan {
    id: string;
    name: string;
    priceAdult: number;
    priceChild: number;
  }

  // Calculate total price
  const roomsTotal = bookingDetails.selectedRooms.reduce((total, room) => {
    return total + (room.averageRate ?? 0) * room.quantity * bookingDetails.nights;
  }, 0);
  const baseTotal = roomsTotal;

  // Packages, promo, and final total calculations (from booking step)
  const packagesTotal =
    bookingDetails.selectedPackages?.reduce((total: number, pkg: { Price: number }) => {
      return total + pkg.Price;
    }, 0) || 0;

  const promoDiscount = bookingDetails.promoCode ? 0.15 * roomsTotal : 0;
  const finalTotal = roomsTotal + packagesTotal - promoDiscount;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const bookingId = generateBookingId();
    updateBookingDetails({ bookingId });

    console.log("Current booking details before payment:", bookingDetails);
    
    if (bookingDetails.paymentMethod === "arrival") {
      try {
        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
        if (!token) {
          throw new Error("No access token available");
        }

        const bookingId = generateBookingId();
        updateBookingDetails({ bookingId });

        const {
          checkIn,
          checkOut,
          selectedRooms,
          name,
          email,
          phone,
          nationality,
          promoCode,
          promoDetails,
          specialRequests,
          nights,
          selectedPackages,
          currency,
          children,
          adults,
          hotelId
        } = bookingDetails;

        console.log("Hotel ID being used:", hotelId);
        console.log("Selected rooms data:", selectedRooms);
        console.log("Room meal plan IDs:", selectedRooms.map(room => ({ 
          roomId: room.roomId, 
          mealPlanId: room.mealPlanId,
          parsedMealPlanId: parseInt(room.mealPlanId || "1") || 1
        })));

        // Expand rooms with quantity > 1 into separate room entries
        const expandedRooms = selectedRooms.reduce((acc: typeof selectedRooms, room) => {
          for (let i = 0; i < room.quantity; i++) {
            acc.push({
              ...room,
              quantity: 1 // Each expanded room has quantity 1
            });
          }
          return acc;
        }, []);

        console.log("Expanded rooms for payload:", expandedRooms);
        console.log("Total rooms being booked:", expandedRooms.length);

        const payload = {
          bookingRevision: 1,
          data: [
            {
              attributes: {
                id: bookingId,
                meta: {
                  ruid: bookingId,
                  is_genius: false,
                },
                status: "new",
                services: [],
                currency: currency || "USD",
                amount: finalTotal.toFixed(2),
                rate_code_id: expandedRooms.length > 0 ? parseInt(expandedRooms[0].roomId) : null,
                created_by: name || "",
                remarks_internal: "",
                remarks_guest: specialRequests || "",
                guest_profile_id: 0,
                agent: "",
                inserted_at: new Date().toISOString(),
                channel_id: "",
                property_id: "",
                hotel_id: parseInt(hotelId) || 0,
                unique_id: (parseInt(bookingId?.replace(/\D/g, "").slice(0, 10) || "") || Date.now()).toString(),
                system_id: "FIT",
                ota_name: "HotelMateIBE",
                booking_id: bookingId,
                notes: specialRequests || "",
                arrival_date: checkIn ? format(new Date(checkIn), "MM/dd/yyyy") : "",
                arrival_hour: "12:00 PM",
                customer: {
                  meta: {
                    ruid: "",
                    is_genius: false,
                  },
                  name: name || "",
                  zip: "",
                  address: "",
                  country: nationality || "",
                  city: "",
                  language: "en",
                  mail: email || "",
                  phone: phone || "",
                  surname: "",
                  company: "",
                },
                departure_date: checkOut ? format(new Date(checkOut), "MM/dd/yyyy") : "",
                deposits: [],
                ota_commission: "0",
                ota_reservation_code: bookingId,
                payment_collect: "property",
                payment_type: "",
                rooms: expandedRooms.map((room, idx) => {
                  // Build days object inline
                  const daysObj: Record<string, string> = {};
                  if (checkIn && checkOut) {
                    const checkInDate = new Date(checkIn);
                    const checkOutDate = new Date(checkOut);
                    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    for (let i = 0; i < totalNights; i++) {
                      const currentDate = new Date(checkInDate);
                      currentDate.setDate(currentDate.getDate() + i);
                      const dateStr = currentDate.toISOString().split('T')[0];
                      const dailyRate = (room.averageRate || room.price || 0);
                      daysObj[dateStr] = dailyRate.toFixed(2);
                    }
                  }
                  
                  const roomAmount = Object.values(daysObj).reduce((sum, v) => sum + parseFloat(v), 0);
                  
                  // Ensure we have a valid rate plan ID (don't use 0 as it causes errors)
                  const validRatePlanId = parseInt(room.mealPlanId || "1") || 1;
                  if (validRatePlanId === 0) {
                    console.warn(`Invalid rate plan ID (0) for room ${room.roomId}, using default value 1`);
                  }
                  
                  return {
                    reservation_status_id: 1,
                    is_foc: false,
                    taxes: [],
                    services: [],
                    amount: roomAmount.toFixed(2),
                    days: daysObj,
                    guest_profile_id: 0,
                    ota_commission: "0",
                    guests: [],
                    occupancy: {
                      children: room.children || 0,
                      adults: room.adults || 2,
                      ages: [],
                      infants: 0,
                    },
                    rate_plan_id: (validRatePlanId === 0 ? 1 : validRatePlanId).toString(),
                    room_type_id: "0",
                    hotel_room_type_id: parseInt(room.roomId) || 0,
                    booking_room_id: `room-${idx}`,
                    checkin_date: checkIn ? format(new Date(checkIn), "MM/dd/yyyy") : "",
                    checkout_date: checkOut ? format(new Date(checkOut), "MM/dd/yyyy") : "",
                    is_cancelled: false,
                    ota_unique_id: "",
                    disc_percen: 0,
                    discount: 0,
                    child_rate: 0,
                    suppliment: 0,
                    net_rate: room.averageRate || room.price || 0,
                    is_day_room: false,
                    parent_rate_plan_id: (validRatePlanId === 0 ? 1 : validRatePlanId).toString(),
                    meta: {
                      meal_plan: room.mealPlanId || "BB",
                      mapping_id: `mapping-id-${idx}`,
                      parent_rate_plan_id: (validRatePlanId === 0 ? 1 : validRatePlanId).toString(),
                      rate_plan_code: (validRatePlanId === 0 ? 1 : validRatePlanId).toString(),
                      room_type_code: room.roomId,
                    },
                  };
                }),
                occupancy: {
                  children: children || 0,
                  adults: adults || 2,
                  ages: [],
                  infants: 0,
                },
                guarantee: undefined,
                secondary_ota: "",
                acknowledge_status: "pending",
                raw_message: "{}",
                is_crs_revision: false,
                is_day_room: false,
                ref_no: "",
                group_name: "",
                tour_no: "",
              },
              id: bookingId,
              type: "booking_revision",
              relationships: {
                data: {
                  property: { id: hotelId?.toString() || "0", type: "property" },
                  booking: { id: bookingId, type: "booking" },
                },
              },
            },
          ],
          meta: {
            total: 1,
            limit: 10,
            order_by: "inserted_at",
            page: 1,
            order_direction: "asc",
          },
          dateTime: new Date().toISOString(),
        };

        console.log("Full payload being sent:", JSON.stringify(payload, null, 2));
        console.log("Total rooms in payload:", payload.data[0].attributes.rooms.length);
        console.log("Room booking IDs:", payload.data[0].attributes.rooms.map(r => r.booking_room_id));
        const response = await createBookingFeed({ token, payload });
        if (response) {
          const refNo = generateRefNo();
          localStorage.setItem("payment_collect", "later");
          router.push(`/confirmed?refno=${refNo}`);
        } else {
          throw new Error("Failed to create booking");
        }
      } catch (error) {
        console.error("Booking error:", error);
        setIsProcessing(false);
      }
    } else if (bookingDetails.paymentMethod === "cybersource") {
      try {
        if (!ipgCredentials) {
          alert("Payment gateway not configured for this hotel.");
          setIsProcessing(false);
          return;
        }

        if (!currentHotelId) {
          alert("Hotel information not available.");
          setIsProcessing(false);
          return;
        }

        const finalBookingId = bookingDetails.bookingId || generateBookingId();
        
        // Calculate final total
        const roomsTotal = bookingDetails.selectedRooms.reduce(
          (total, room) => total + room.price * room.quantity,
          0
        );
        const finalTotal = roomsTotal - voucherAmount;

        // Prepare fields for CyberSource
        const fields: Record<string, string> = {
          access_key: ipgCredentials.accessKeyUSD,
          profile_id: ipgCredentials.profileIdUSD,
          transaction_uuid: finalBookingId,
          signed_field_names: "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,bill_address1,bill_city,bill_country",
          unsigned_field_names: "",
          signed_date_time: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
          locale: "en",
          transaction_type: "sale",
          reference_number: finalBookingId,
          amount: finalTotal.toFixed(2),
          currency: bookingDetails.currency || "USD",
          bill_address1: "Address",
          bill_city: "City",
          bill_country: bookingDetails.nationality || "US",
        };

        console.log("🔄 Generating CyberSource signature...");
        
        // Generate signature via API
        const response = await fetch("/api/sign-cybersource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hotelId: currentHotelId, ...fields }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate signature: ${response.statusText}`);
        }

        const { signature, endpoint } = await response.json();
        console.log("✅ Signature generated successfully");
        console.log("🔗 Using CyberSource endpoint:", endpoint);

        // Create form and submit to CyberSource
        const form = document.createElement("form");
        form.method = "POST";
        form.action = endpoint; // Use endpoint from server
        form.name = "cybersource_payment_form";

        // Add all fields to form
        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        // Add signature
        const sigInput = document.createElement("input");
        sigInput.type = "hidden";
        sigInput.name = "signature";
        sigInput.value = signature;
        form.appendChild(sigInput);

        console.log("🚀 Submitting payment to CyberSource...");
        console.log("Payment Details:", {
          amount: fields.amount,
          currency: fields.currency,
          bookingId: finalBookingId,
          hotelId: currentHotelId
        });

        document.body.appendChild(form);
        form.submit();
        
      } catch (error) {
        console.error("❌ CyberSource payment error:", error);
        alert("Failed to process payment. Please try again.");
        setIsProcessing(false);
      }
    }

    setTimeout(() => {
      setIsProcessing(false);
      const refNo = generateRefNo();
      localStorage.setItem("payment_collect", "paid");
      router.push(`/confirmed?refno=${refNo}`);
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }

    return value;
  };

  return (
    <>
      <Header />
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4 mt-2">
          <h2 className="text-3xl font-bold">Payment</h2>
          {/* <CurrencySelector allowedCurrencies={["USD", "LKR"]} defaultCurrency="USD" /> */}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowConfirmModal(true);
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={bookingDetails.paymentMethod ?? ""}
                    onValueChange={(value) => {
                      updateBookingDetails({ paymentMethod: value });
                      if (value === "arrival") {
                        localStorage.setItem("payment_collect", "hotelcollect");
                      } else if (value === "cybersource") {
                        localStorage.setItem("payment_collect", "paid");
                      }
                    }}
                    className="space-y-4"
                  >
                    {isIPGActive && (
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <RadioGroupItem value="cybersource" id="cybersource" />
                        <Label
                          htmlFor="cybersource"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <CreditCard className="w-5 h-5" />
                          Card Payment
                        </Label>
                      </div>
                    )}
                    {allowPayAtProperty && (
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <RadioGroupItem value="arrival" id="arrival" />
                        <Label
                          htmlFor="arrival"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Wallet className="w-5 h-5" />
                          Pay Later
                        </Label>
                      </div>
                    )}
                  </RadioGroup>

                  {/* Voucher input */}
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                    <Label
                      htmlFor="voucher"
                      className="text-sm font-medium text-green-700"
                    >
                      Voucher Code
                    </Label>
                    <div className="mt-2 flex items-center space-x-2 bg-white border border-green-300 rounded-md p-3">
                      <Wallet className="w-5 h-5 text-green-600" />
                      <input
                        id="voucher"
                        type="text"
                        className="w-full px-2 py-1 text-sm text-green-700 placeholder-green-500 focus:outline-none"
                        placeholder="Enter voucher code"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                      />
                    </div>
                    {voucherAmount > 0 && (
                      <div className="mt-3 flex items-center space-x-2 bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded-md text-sm">
                        <svg
                          className="h-4 w-4 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>
                          Voucher applied: {formatPrice(convertPrice(voucherAmount))}
                        </span>
                      </div>
                    )}
                    {voucherError && (
                      <div className="mt-3 flex items-center space-x-2 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm">
                        <svg
                          className="h-4 w-4 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span>{voucherError}</span>
                      </div>
                    )}
                  </div>

                  {bookingDetails.paymentMethod === "cybersource" && null}

                  {bookingDetails.paymentMethod === "arrival" && (
                    <div className="mt-6 text-sm text-muted-foreground">
                      You have chosen to pay on arrival. No advance payment is
                      required.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="w-full space-y-3">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 text-sm px-4 py-2 rounded text-center">
                      Payment can only be made in <strong>USD</strong> or{" "}
                      <strong>LKR</strong>.
                    </div>
                    <Button
                      type="submit"
                      className="w-full btn-dynamic"
                      disabled={isProcessing || !bookingDetails.paymentMethod}
                    >
                      {isProcessing
                        ? "Processing..."
                        : bookingDetails.paymentMethod === "arrival"
                        ? "Get Booking Confirmation"
                        : isMounted
                        ? `Pay ${
                            bookingDetails.currency === "LKR"
                              ? formatPrice(finalTotal)
                              : formatPrice(convertPrice(finalTotal))
                          }`
                        : `Pay $${finalTotal.toFixed(2)}`}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>

            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Your Booking</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {bookingDetails.paymentMethod === "arrival"
                    ? "You have selected to pay at the hotel. Are you sure you want to confirm your booking?"
                    : "You have selected to pay now. Are you sure you want to confirm and proceed with payment?"}
                </p>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </Button>
                  {bookingDetails.paymentMethod === "arrival" ? (
                    <Button
                      className="btn-dynamic"
                      onClick={handlePaymentSubmit}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Confirm & Pay at Hotel"}
                    </Button>
                  ) : (
                    <Button
                      className="btn-dynamic"
                      onClick={handlePaymentSubmit}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Confirm & Pay Now"}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {bookingDetails.selectedRooms.map((roomBooking) => (
                  <div
                    key={roomBooking.roomId}
                    className="mb-4 p-3 bg-muted rounded-md"
                  >
                    <h3 className="font-medium">{roomBooking.roomName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {roomBooking.quantity}{" "}
                      {roomBooking.quantity === 1 ? "room" : "rooms"} •{" "}
                      {bookingDetails.nights}{" "}
                      {bookingDetails.nights === 1 ? "night" : "nights"} •
                      {roomBooking.adults}{" "}
                      {roomBooking.adults === 1 ? "adult" : "adults"}
                      {roomBooking.children > 0 &&
                        `, ${roomBooking.children} ${
                          roomBooking.children === 1 ? "child" : "children"
                        }`}
                    </p>
                    <div className="text-sm mt-1 text-muted-foreground">
                      {formatPrice(convertPrice(roomBooking.averageRate ?? 0))} per night
                      {roomBooking.mealPlanId && (
                        <div className="text-xs mt-1">
                          Meal Plan: {roomBooking.mealPlanId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="space-y-4">
                  {/* Check-in Date */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      Check-in Date
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {bookingDetails.checkIn
                        ? format(bookingDetails.checkIn, "MMM d, yyyy")
                        : "Not selected"}
                    </span>
                  </div>
                  {/* Check-out Date */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      Check-out Date
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {bookingDetails.checkOut
                        ? format(bookingDetails.checkOut, "MMM d, yyyy")
                        : "Not selected"}
                    </span>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    {/* Room charges */}
                    <div className="text-sm font-semibold text-foreground mt-4 mb-2">
                      Room charges
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {isMounted
                          ? formatPrice(convertPrice(baseTotal))
                          : `$${baseTotal.toFixed(2)}`}
                      </span>
                    </div>
                    {/* Packages */}
                    {(bookingDetails.selectedPackages || []).length > 0 && (
                      <>
                        <div className="text-sm font-semibold text-foreground mt-4 mb-2">
                          Packages
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1 mb-1">
                          {(bookingDetails.selectedPackages || []).map((pkg, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{pkg.Description}</span>
                              <span className="text-sm font-medium text-foreground">
                                {formatPrice(convertPrice(pkg.Price))}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Package Cost
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {formatPrice(convertPrice(packagesTotal))}
                          </span>
                        </div>
                      </>
                    )}
                    {/* Promo */}
                    {bookingDetails.promoCode && (
                      <div className="text-sm font-semibold text-foreground mt-4 mb-2">
                        Promo
                      </div>
                    )}
                    {bookingDetails.promoCode && (
                      <div className="flex justify-between mb-2 text-green-600">
                        <span className="text-sm font-medium">
                          Promo ({bookingDetails.promoCode})
                        </span>
                        <span className="text-sm font-medium">
                          -{formatPrice(convertPrice(promoDiscount))}
                        </span>
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
          </div>
        </div>
      </div>
    </>
  );
}

