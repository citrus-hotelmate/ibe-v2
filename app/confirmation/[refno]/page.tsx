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
import { CheckCircle, Download } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Info,
  CalendarCheck,
  CreditCard,
  Percent,
  BadgeInfo,
} from "lucide-react";
import { useRouter } from "next/navigation";
import HotelNetworkScript from "@/components/hotelNetworkScript";

export default function BookingConfirmationPage({
  params,
}: {
  params: { refno: string };
}) {
  const [loading, setLoading] = useState(true);
  const [reservationData, setReservationData] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [hotelData, setHotelData] = useState<any>({ images: [] });

  console.log("reservationData : ", reservationData);

  const router = useRouter();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://your-api-base-url.com";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/API_IBE/GetResDetailForVoucher.aspx?refno=${params.refno}`
        );
        const data = await res.json();

        if (data?.length > 0) {
          const booking = data[0];
          if (booking.Status === "TENTATIVE") {
            // 🚀 redirect to the tentative page
            router.replace(`/tentative/${params.refno}`);
            return; // Stop further execution
          }
        }

        setReservationData(data);
        setHotelData(data[0]?.HotelNetworkID || "");
      } catch (error) {
        console.error("Error fetching reservation details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.refno, router]);

  if (loading) {
    return <div className="text-center py-12">Loading booking details...</div>;
  }

  if (reservationData.length === 0) {
    return <div className="text-center py-12">No reservation found.</div>;
  }

  const booking = reservationData[0];
  const totalAmount = reservationData.reduce(
    (sum, item) => sum + (item.RoomRate || 0),
    0
  );

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

      pdf.save(`Booking-${params.refno}.pdf`);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <HotelNetworkScript propertyId={hotelData || ""} />
      <Card className="border border-green-500 shadow-lg">
        {booking.IBE_LogoURL && (
          <div className="flex justify-center mt-4">
            <img
              src={booking.IBE_LogoURL}
              width={100}
              height={100}
              alt="Hotel Logo"
              className="rounded-md shadow"
            />
          </div>
        )}

        <CardHeader className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <CardTitle className="text-2xl font-bold">
            Booking Confirmed!
          </CardTitle>
          <p className="text-muted-foreground">
            Thanks <strong>{booking.BookerFullName}</strong>, your stay at{" "}
            <strong>{booking.HotelName}</strong> is confirmed.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Confirmation #: <strong>{booking.ReservationNo}</strong>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {booking.IBE_Header && (
            <div className="bg-gray-50 border rounded-md p-4 text-center font-medium text-black">
              {booking.IBE_Header}
            </div>
          )}

          <ReservationDetails booking={booking} params={params} />
          <RoomDetails
            reservationData={reservationData}
            totalAmount={totalAmount}
          />
          <ContactDetails booking={booking} />
          <IbeFooterInfo booking={booking} />
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() =>
              window.open(
                "https://sharavi.citrusibe.com/bookingpolicy.html",
                "_blank"
              )
            }
          >
            View Booking Policy
          </Button>
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
            onClick={() => {
              router.replace("/");
            }}
          >
            <Download className="w-4 h-4" /> Download as PDF
          </Button>
        </CardFooter>
      </Card>

      <div
        ref={printRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "750px",
          background: "white",
        }}
      >
        <div style={{ pageBreakInside: "avoid" }}>
          <Card className="border border-green-500">
            {/* NO LOGO IN PDF */}
            <CardHeader
              className="text-center space-y-2"
              style={{
                marginTop: 0,
                paddingTop: "8px",
                paddingBottom: "8px",
              }}
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <CardTitle className="text-2xl font-bold">
                Booking Confirmed!
              </CardTitle>
              <p className="text-muted-foreground">
                Thanks <strong>{booking.BookerFullName}</strong>, your stay at{" "}
                <strong>{booking.HotelName}</strong> is confirmed.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Confirmation #: <strong>{booking.ReservationNo}</strong>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.IBE_Header && (
                <div className="bg-gray-50 border rounded-md p-3 text-center font-medium text-black">
                  {booking.IBE_Header}
                </div>
              )}
              <ReservationDetails booking={booking} params={params} />
              <RoomDetails
                reservationData={reservationData}
                totalAmount={totalAmount}
              />
              <ContactDetails booking={booking} />
              <IbeFooterInfo booking={booking} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** ReservationDetails uses ResCheckIn/ResCheckOut for date and IBE_*Time for time */
function ReservationDetails({ booking, params }: any) {
  return (
    <div className="bg-gray-50 border rounded-md p-4 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase">
        Reservation Details
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Reserved Date</span>
          <div className="font-medium">
            {booking.ReservationDate
              ? format(new Date(booking.ReservationDate), "EEEE, MMMM d, yyyy")
              : "-"}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Booking Ref</span>
          <div className="font-medium">{params.refno}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Check-in</span>
          <div className="font-medium">
            {booking.ResCheckIn
              ? `${format(new Date(booking.ResCheckIn), "yyyy, MMMM d")} (${
                  booking.IBE_CheckInTime || "-"
                })`
              : "-"}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Check-out</span>
          <div className="font-medium">
            {booking.ResCheckOut
              ? `${format(new Date(booking.ResCheckOut), "yyyy, MMMM d")} (${
                  booking.IBE_CheckOutTime || "-"
                })`
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomDetails({ reservationData, totalAmount }: any) {
  return (
    <div className="bg-gray-50 border rounded-md p-4 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase">
        Room Details
      </h3>
      {reservationData.map((room: any, idx: number) => (
        <div key={idx} className="text-sm mb-2 border-b pb-2">
          <div className="font-medium">
            {room.RoomType} - {room.ResvOccupancy}
          </div>
          <div className="text-muted-foreground">
            {room.CurrencyCode} {room.RoomRate}
          </div>
          <div className="text-muted-foreground">
            Adults: {room.Adults} | Children: {room.Child}
          </div>
          <div className="text-muted-foreground">Meal Plan: {room.Basis}</div>
        </div>
      ))}
      <div className="mt-4 border-t pt-4 text-center">
        <div className="text-sm uppercase font-semibold text-muted-foreground">
          Total Price
        </div>
        <div className="text-2xl font-bold text-green-700 mt-1">
          {reservationData[0]?.CurrencyCode} {totalAmount.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function ContactDetails({ booking }: any) {
  return (
    <div className="bg-gray-50 border rounded-md p-4 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase">
        Contact Hotel
      </h3>
      <div className="text-sm">
        <div>
          <span className="text-muted-foreground">Phone:</span>{" "}
          <span className="font-medium">{booking.Phone}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Email:</span>{" "}
          <span className="font-medium">{booking.Email}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Address:</span>{" "}
          <span className="font-medium">{booking.Address}</span>
        </div>
      </div>
    </div>
  );
}

export function IbeFooterInfo({ booking }: any) {
  return (
    <div className="border rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 space-y-4 shadow-inner">
      {booking.IBE_Important && (
        <div className="flex items-start gap-2 text-blue-800">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Important:</span>{" "}
            {booking.IBE_Important}
          </div>
        </div>
      )}

      {booking.IBE_PayWithin_Days && (
        <div className="flex items-start gap-2 text-blue-800">
          <CalendarCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Pay Within:</span>{" "}
            {booking.IBE_PayWithin_Days} days
          </div>
        </div>
      )}

      {booking.IBE_Payments && (
        <div className="flex items-start gap-2 text-blue-800">
          <CreditCard className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Payments Accepted:</span>{" "}
            {booking.IBE_Payments}
          </div>
        </div>
      )}

      {booking.IBE_Taxes && (
        <div className="flex items-start gap-2 text-blue-800">
          <Percent className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Taxes:</span> {booking.IBE_Taxes}
          </div>
        </div>
      )}

      {booking.IBE_Footer && (
        <div className="flex items-start gap-2 text-gray-600 text-xs pt-2 border-t border-blue-200">
          <BadgeInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>{booking.IBE_Footer}</div>
        </div>
      )}
    </div>
  );
}
