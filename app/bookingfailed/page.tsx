"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function BookingFailedPage() {
  const router = useRouter();

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="border border-red-500 shadow-lg">
        <CardHeader className="text-center space-y-3">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <CardTitle className="text-2xl font-bold">
            Booking Failed
          </CardTitle>
          <p className="text-muted-foreground">
            We sincerely apologize, but something went wrong with your booking.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
            <p className="text-sm text-red-800">
              We invite you to try again, or contact the hotel help center for assistance.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            variant="default"
            onClick={() => router.push("/")}
          >
            Back to Search
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/book")}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
