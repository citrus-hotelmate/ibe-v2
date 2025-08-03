"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";
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
import Header from "@/components/header";
import { useCurrency } from "@/components/currency-context";
import { CurrencySelector } from "@/components/currency-selector";

export default function PaymentPage() {
  const router = useRouter();
  const { bookingDetails, updateBookingDetails } = useBooking();
  const { convertPrice, formatPrice } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [allowPayAtProperty, setAllowPayAtProperty] = useState(false);
  const [isIPGActive, setIsIPGActive] = useState(false);

  // isMounted state for client-only rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchPaymentOptions = async () => {
      try {
        const res = await fetch(
          "https://ipg.citrusibe.com/API/GetHotelDetail.aspx"
        );
        const data = await res.json();
        setAllowPayAtProperty(data?.IBE_AllowPayAtProperty === true);
        setIsIPGActive(data?.IBE_isIPGActive === true);
      } catch (error) {
        console.error("Error fetching hotel payment settings", error);
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
    selectedRooms: RoomBooking[];
    checkIn?: Date;
    checkOut?: Date;
    nights: number;
    paymentMethod?: string;
    bookingId?: string;
    currency: "USD" | "LKR";
  }

  interface MealPlan {
    id: string;
    name: string;
    priceAdult: number;
    priceChild: number;
  }

  // Calculate total price
  const roomsTotal = bookingDetails.selectedRooms.reduce((total, room) => {
    return total + room.price * room.quantity * bookingDetails.nights;
  }, 0);
  const baseTotal = roomsTotal;

  // Packages, promo, and final total calculations (from booking step)
  const packagesTotal =
    bookingDetails.selectedPackages?.reduce((total, pkg) => {
      return total + pkg.Price;
    }, 0) || 0;

  const promoDiscount = bookingDetails.promoCode ? 0.15 * roomsTotal : 0;
  const finalTotal = roomsTotal + packagesTotal - promoDiscount;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const bookingId = generateBookingId();
    updateBookingDetails({ bookingId });

    if (bookingDetails.paymentMethod === "arrival") {
      try {
        // Build payload dynamically from bookingDetails
        const {
          bookingId,
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
          paymentMethod,
          nights,
          selectedPackages,
          totalPrice,
          currency,
          children,
          adults
        } = bookingDetails;

        const payload = {
          data: [
            {
              id: bookingId,
              attributes: {
                id: bookingId,
                meta: {
                  ruid: bookingId,
                },
                status: "new",
                services: [],
                currency: currency || "USD",
                amount: totalPrice.toFixed(2),
                agent: null,
                inserted_at: new Date().toISOString(),
                ota_name: "CitrusIBE",
                property_id: "",
                channel_id: "",
                unique_id: parseInt(bookingId.replace(/\D/g, "").slice(0, 10)) || Date.now(),
                system_id: "",
                booking_id: bookingId,
                notes: specialRequests || "No remarks",
                arrival_date: checkIn ? format(new Date(checkIn), "MM/dd/yyyy") : "",
                arrival_hour: "12.00AM",
                departure_date: checkOut ? format(new Date(checkOut), "MM/dd/yyyy") : "",
                promotion: {
                  code: promoCode || null,
                  discount_amount: promoDetails?.Value || null,
                },
                customer: {
                  meta: {
                    is_genius: false,
                  },
                  name,
                  surname: "",
                  address: "",
                  country: nationality,
                  city: "",
                  zip: null,
                  mail: email,
                  phone,
                },
                payment_collect: "paid",
                deposits: null,
                guarantee: null,
                rooms: selectedRooms.map((room, idx) => ({
                  meta: {
                    mapping_id: `mapping-id-${idx}`,
                    parent_rate_plan_id: `rate-plan-${idx}`,
                    rate_plan_code: 9536508,
                    room_type_code: room.roomId,
                    days_breakdown: [
                      {
                        date: checkIn ? format(new Date(checkIn), "yyyy-MM-dd") : "",
                        amount: (room.price * room.quantity).toFixed(2),
                        promotion: {
                          code: promoCode || null,
                          discount_amount: promoDetails?.Value || null,
                        },
                        rate_code: 9536508,
                        rate_plan: `rate-plan-${idx}`,
                      }
                    ],
                    cancel_penalties: [
                      {
                        amount: "0.00",
                        currency: currency || "USD",
                        from: new Date().toISOString()
                      }
                    ],
                    meal_plan: room.mealPlanId || "BB",
                    policies: null,
                    room_remarks: [],
                    smoking_preferences: null
                  },
                  taxes: [],
                  amount: (room.price * room.quantity).toFixed(2),
                  services: [],
                  days: {
                    [checkIn ? format(new Date(checkIn), "yyyy-MM-dd") : ""]: (room.price * room.quantity).toFixed(2)
                  },
                  booking_room_id: `room-booking-${idx}`,
                  rate_plan_id: `rate-plan-${idx}`,
                  room_type_id: room.roomId,
                  guests: [
                    {
                      name,
                      surname: "",
                    }
                  ],
                  occupancy: {
                    children: room.children || 0,
                    adults: room.adults || 2,
                    infants: 0
                  },
                  ota_commission: "00.00",
                  checkin_date: checkIn ? format(new Date(checkIn), "MM/dd/yyyy") : "",
                  checkout_date: checkOut ? format(new Date(checkOut), "MM/dd/yyyy") : "",
                  is_cancelled: false,
                  ota_unique_id: null
                })),
                secondary_ota: null,
                occupancy: {
                  children,
                  adults,
                  infants: 0
                },
                acknowledge_status: "pending",
                ota_commission: "00.00",
                ota_reservation_code: bookingId,
                raw_message: "{}"
              },
              relationships: {
                data: {
                  property: {
                    id: "",
                    type: "property"
                  },
                  booking: {
                    id: "",
                    type: "booking"
                  }
                }
              }
            }
          ],
          meta: {
            total: 1,
            limit: 10,
            order_by: "inserted_at",
            page: 1,
            order_direction: "asc"
          }
        };
        const response = await fetch("/api/post-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.status === "success") {
          router.push("/confirmed");
          return;
        } else {
          console.error("Booking failed:", result);
          setIsProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Booking error:", error);
        setIsProcessing(false);
        return;
      }
    } else if (bookingDetails.paymentMethod === "stripe") {
      try {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://testsecureacceptance.cybersource.com/pay";
        form.name = "myform";

        const addHiddenField = (name: string, value: string) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };

        // Static fields
        addHiddenField("access_key", "9511dcceccde31438d7e46bab222241c");
        addHiddenField("profile_id", "F87AFFC2-E55B-403D-93F5-BE17FC99A2BA");
        addHiddenField("transaction_uuid", bookingDetails.bookingId || generateBookingId());
        addHiddenField("signed_field_names", "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,bill_address1,bill_city,bill_country");
        addHiddenField("unsigned_field_names", "");
        addHiddenField("signed_date_time", new Date().toISOString());
        addHiddenField("locale", "en");

        // Payment details
        addHiddenField("transaction_type", "sale");
        addHiddenField("reference_number", bookingDetails.bookingId || "");
        addHiddenField("amount", finalTotal.toFixed(2));
        addHiddenField("currency", bookingDetails.currency || "USD");

        // Billing info
        addHiddenField("bill_address1", "215SS");
        addHiddenField("bill_city", "HORANA");
        addHiddenField("bill_country", "US");

        document.body.appendChild(form);
        form.submit();
        return;
      } catch (error) {
        console.error("Payment redirection error:", error);
        setIsProcessing(false);
        return;
      }
    }

    setTimeout(() => {
      setIsProcessing(false);
      router.push("/confirmed");
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
          <CurrencySelector allowedCurrencies={["USD", "LKR"]} defaultCurrency="USD" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handlePaymentSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={bookingDetails.paymentMethod}
                    onValueChange={(value) => {
                      updateBookingDetails({ paymentMethod: value });
                      if (value === "arrival") {
                        localStorage.setItem("payment_collect", "hotelcollect");
                      } else if (value === "stripe") {
                        localStorage.setItem("payment_collect", "paid");
                      }
                    }}
                    className="space-y-4"
                  >
                    {isIPGActive && (
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label
                          htmlFor="stripe"
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
                          Pay on Arrival
                        </Label>
                      </div>
                    )}
                  </RadioGroup>

                  {bookingDetails.paymentMethod === "stripe" && null}

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
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "Processing..."
                        : bookingDetails.paymentMethod === "arrival"
                        ? "Get Booking Confirmation"
                        : `Pay ${
                            bookingDetails.currency === "LKR"
                              ? formatPrice(finalTotal)
                              : formatPrice(convertPrice(finalTotal))
                          }`}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
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
                    {bookingDetails.selectedPackages?.length > 0 && (
                      <>
                        <div className="text-sm font-semibold text-foreground mt-4 mb-2">
                          Packages
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1 mb-1">
                          {bookingDetails.selectedPackages.map((pkg, idx) => (
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

