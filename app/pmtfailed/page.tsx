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
import { XCircle, CreditCard } from "lucide-react";

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="border border-red-500 shadow-lg">
        <CardHeader className="text-center space-y-3">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <CardTitle className="text-2xl font-bold">
            Payment Failed
          </CardTitle>
          <p className="text-muted-foreground">
            Your booking was unsuccessful due to payment issues.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-2 text-red-800">
              <CreditCard className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Payment could not be processed</p>
                <p>
                  Please check your payment details and try again, or contact your bank if the problem persists.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            variant="default"
            onClick={() => router.push("/payment")}
          >
            Try Payment Again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Back to Search
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
