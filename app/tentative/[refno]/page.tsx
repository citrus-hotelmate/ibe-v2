// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Download, Baby, X, Info, CalendarCheck, CreditCard, Percent, BadgeInfo } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Confetti from "react-confetti";
import { useWindowSize } from "@react-hook/window-size";
import { useCurrency } from "@/components/currency-context";
import { getAllHotels } from "@/controllers/adminController";

export default function TentativeBookingPage({
  params,
}: {
  params: { refno: string };
}) {
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [hotelDetails, setHotelDetails] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [paymentCollect, setPaymentCollect] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [width, height] = useWindowSize();
  const [bookingId, setBookingId] = useState<string>("");
  const [logoURL, setLogoURL] = useState<string>("");
  const [logoWidth, setLogoWidth] = useState<number>();
  const [logoHeight, setLogoHeight] = useState<number>();



  const router = useRouter();
  const { currency, convertPrice } = useCurrency();

  // Format price in selected currency for display
  const formatPrice = (value: number) => `${currency} ${value.toFixed(2)}`;

  // Always format total price in USD
  const formatPriceUSD = (value: number) => `USD ${value.toFixed(2)}`;

  // Get booking ID from params or localStorage
  useEffect(() => {
    const refno = params?.refno || localStorage.getItem("currentBookingId") || "";
    console.log("=== BOOKING ID DEBUG ===");
    console.log("params:", params);
    console.log("params.refno:", params?.refno);
    console.log("localStorage currentBookingId:", localStorage.getItem("currentBookingId"));
    console.log("Final bookingId:", refno);
    setBookingId(refno);
  }, [params]);

  console.log("Booking Details:", bookingDetails);
  console.log("Booking ID State:", bookingId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load booking details from localStorage
        const stored = localStorage.getItem("bookingDetails");
        if (stored) {
          const parsedBooking = JSON.parse(stored);

          // Merge with reservation summary
          const reservation = localStorage.getItem("reservationSummary");
          if (reservation) {
            const parsedReservation = JSON.parse(reservation);

            // Inject promo details if available
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

            const roomTotal = parsedReservation.selectedRooms?.reduce((sum: number, room: any) => {
              return sum + room.averageRate * room.quantity * parsedReservation.nights;
            }, 0) || 0;

            const packageTotal = parsedReservation.selectedPackages?.reduce((sum: number, pkg: any) => {
              return sum + pkg.Price;
            }, 0) || 0;

            const promoDiscount = parsedReservation.promoCode ? 0.15 * roomTotal : 0;

            setBookingDetails({
              ...parsedBooking,
              bookingId: bookingId, // Add booking ID from state
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
            });
          } else {
            setBookingDetails({ ...parsedBooking, bookingId: bookingId });
          }
        }

        // Load selected hotel
        const hotelStr = localStorage.getItem("selectedHotel");
        if (hotelStr) {
          const hotel = JSON.parse(hotelStr);
          setSelectedHotel(hotel);

          // Set logo URL (trim query parameters)
          if (hotel.logoURL) {
            const trimmedLogoURL = hotel.logoURL.split("?")[0];
            setLogoURL(trimmedLogoURL);
          }

          // Set logo dimensions
          if (hotel.logoWidth) {
            setLogoWidth(hotel.logoWidth);
          }
          if (hotel.logoHeight) {
            setLogoHeight(hotel.logoHeight);
          }
        }

        // Load payment collection method
        const collect = localStorage.getItem("payment_collect");
        setPaymentCollect(collect);

        // Fetch hotel details
        const res = await getAllHotels({ token: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "" });
        setHotelDetails(res);
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.refno]);

  console.log("hoteldetails in tentative", hotelDetails);

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Clean up localStorage after booking confirmation
    // Wait a bit to ensure data is loaded first
    const cleanupTimer = setTimeout(() => {
      console.log("🧹 Cleaning up localStorage after successful booking...");

      // Clear booking-related data
      const itemsToRemove = [
        'reservationSummary',
        'bookingDetails',
        'currentBookingId',
        'parsedPromoDetails',
        'payment_collect'
      ];

      itemsToRemove.forEach(item => {
        localStorage.removeItem(item);
        console.log(`✅ Removed: ${item}`);
      });

      console.log("✨ LocalStorage cleanup complete");
    }, 3000); // Clean up after 3 seconds (after data is loaded)

    return () => {
      clearTimeout(timer);
      clearTimeout(cleanupTimer);
    };
  }, []);

  const downloadPDF = async () => {
    if (printRef.current) {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Booking-${bookingId}.pdf`);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading booking details...</div>;
  }

  if (!bookingDetails) {
    return <div className="text-center py-12">No booking found.</div>;
  }

  const totalAmount = bookingDetails.total ?? bookingDetails.totalPrice ?? 0;

  return (
    <>
      <style jsx global>{`
        @page {
          margin: 0;
        }
        @media print {
          .no-print,
          footer {
            display: none !important;
          }
          body {
            margin: 1.6cm;
          }
        }
      `}</style>

      <div className="container max-w-2xl mx-auto py-12 px-4">
        <div className="no-print">
          {showConfetti && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />}
        </div>

        <Card className="border border-green-500 shadow-lg">
          {logoURL && (
            <div className="flex justify-center mt-4">
              <Image
                src={logoURL}
                width={logoWidth}
                height={logoHeight}
                alt="Hotel Logo"
                className="rounded-md shadow object-contain"
              />
            </div>
          )}

          <CardHeader className="text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <CardTitle className="text-2xl font-bold">
              Booking Confirmed!
            </CardTitle>
            <p className="text-muted-foreground">
              Thanks <strong>{bookingDetails.name}</strong>, your booking at{" "}
              <strong>{selectedHotel?.name || "Hotel"}</strong> has been confirmed.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Confirmation #: <strong>{bookingId}</strong>
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <ReservationDetails booking={bookingDetails} bookingId={bookingId} />
            <RoomDetails
              bookingDetails={bookingDetails}
              totalAmount={totalAmount}
              formatPrice={formatPrice}
              convertPrice={convertPrice}
              formatPriceUSD={formatPriceUSD}
            />
            <ContactDetails hotelDetails={hotelDetails} />
            <PaymentInfo paymentCollect={paymentCollect} />
          </CardContent>

          <CardFooter className="flex flex-col gap-3 no-print">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => window.print()}
            >
              Print Confirmation
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={downloadPDF}
            >
              <Download className="w-4 h-4" /> Download as PDF
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => router.push(selectedHotel?.slug ? `/hotels/${selectedHotel.slug}` : "/")}
            >
              Book Another Room
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

/** ReservationDetails component */
function ReservationDetails({ booking, bookingId }: any) {
  return (
    <div className="bg-gray-50 border rounded-md p-4 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase">
        Reservation Details
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Booking Ref</span>
          <div className="font-medium">{bookingId}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Nights</span>
          <div className="font-medium">{booking.nights || 0}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Check-in</span>
          <div className="font-medium">
            {booking.checkIn
              ? format(new Date(booking.checkIn), "EEE, MMM d, yyyy")
              : "-"}
          </div>
          <div className="text-xs text-muted-foreground">After 3:00 PM</div>
        </div>
        <div>
          <span className="text-muted-foreground">Check-out</span>
          <div className="font-medium">
            {booking.checkOut
              ? format(new Date(booking.checkOut), "EEE, MMM d, yyyy")
              : "-"}
          </div>
          <div className="text-xs text-muted-foreground">Before 11:00 AM</div>
        </div>
      </div>
    </div>
  );
}

function RoomDetails({ bookingDetails, totalAmount, formatPrice, convertPrice, formatPriceUSD }: any) {
  return (
    <div className="bg-gray-50 border rounded-md p-4 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase">
        Room Details
      </h3>
      {bookingDetails.selectedRooms?.map((room: any, idx: number) => (
        <div key={idx} className="text-sm mb-2 border-b pb-2">
          <div className="font-medium">{room.roomName}</div>
          <div className="text-muted-foreground">
            {room.quantity} {room.quantity === 1 ? "room" : "rooms"} •{" "}
            {bookingDetails.nights} {bookingDetails.nights === 1 ? "night" : "nights"}
          </div>
          <div className="text-muted-foreground">
            Adults: {room.adults} | Children: {room.children || 0}
          </div>
          {room.mealPlanId && (
            <div className="text-muted-foreground">Meal Plan: {room.mealPlanId}</div>
          )}
          <div className="text-muted-foreground">
            {formatPrice(convertPrice(room.averageRate ?? 0))} per night
          </div>
        </div>
      ))}

      {/* Packages */}
      {bookingDetails.selectedPackages?.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <div className="text-sm font-semibold mb-2">Packages</div>
          {bookingDetails.selectedPackages.map((pkg: any, idx: number) => (
            <div key={idx} className="text-sm flex justify-between mb-1">
              <span>{pkg.Description}</span>
              <span>{formatPrice(convertPrice(pkg.Price))}</span>
            </div>
          ))}
        </div>
      )}

      {/* Promo */}
      {bookingDetails.promoCode && (
        <div className="mt-4 border-t pt-4">
          <div className="text-sm flex justify-between text-green-600">
            <span>Promo ({bookingDetails.promoCode})</span>
            <span>-{formatPrice(convertPrice(bookingDetails.discount || 0))}</span>
          </div>
        </div>
      )}

      <div className="mt-4 border-t pt-4 text-center">
        <div className="text-sm uppercase font-semibold text-muted-foreground">
          Total Price
        </div>
        <div className="text-2xl font-bold text-green-700 mt-1">
          {formatPrice(convertPrice(totalAmount))}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          * All payments are processed in USD
        </div>
      </div>
    </div>
  );
}


function ContactDetails() {
  const [contactHotel, setContactHotel] = useState<any>(null);

  useEffect(() => {
    try {
      const hotelStr = localStorage.getItem("selectedHotel");
      if (!hotelStr) return;

      const hotelObj = JSON.parse(hotelStr);
      setContactHotel(hotelObj);
    } catch (e) {
      console.error("Failed to parse selectedHotel from localStorage", e);
      setContactHotel(null);
    }
  }, []);

  if (!contactHotel) return null;

  // NOTE: Your stored object might be Phone/Email/Address OR phone/email/address.
  const phone = contactHotel.Phone ?? contactHotel.phone ?? contactHotel.tel;
  const email = contactHotel.Email ?? contactHotel.email;
  const address = contactHotel.Address ?? contactHotel.address;

  return (
    <div className="bg-gray-50 border rounded-md p-4 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase">
        Contact Hotel
      </h3>

      <div className="text-sm space-y-2">
        {phone && (
          <div>
            <span className="text-muted-foreground">Phone:</span>{" "}
            <span className="font-medium">{phone}</span>
          </div>
        )}

        {email && (
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{email}</span>
          </div>
        )}

        {address && (
          <div>
            <span className="text-muted-foreground">Address:</span>{" "}
            <span className="font-medium">{address}</span>
          </div>
        )}

        {!phone && !email && !address && (
          <div className="text-muted-foreground">No contact details available.</div>
        )}
      </div>
    </div>
  );
}

function PaymentInfo({ paymentCollect }: any) {
  if (!paymentCollect) return null;

  return (
    <div className="border rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 space-y-4 shadow-inner">
      <div className="flex items-start gap-2 text-blue-800">
        <CreditCard className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-semibold">Payment Status:</span>{" "}
          {(paymentCollect === "hotelcollect" || paymentCollect === "later" || paymentCollect === "property") ? "Pay at Hotel" : "Paid Online"}
        </div>
      </div>
    </div>
  );
}
