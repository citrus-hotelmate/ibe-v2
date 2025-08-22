"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

function PaymentResponseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failure' | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    if (!searchParams) return;
    
    // Get payment response parameters from URL
    const decision = searchParams.get('decision');
    const transactionId = searchParams.get('transaction_id');
    const referenceNumber = searchParams.get('req_reference_number');
    const amount = searchParams.get('req_amount');
    const currency = searchParams.get('req_currency');
    const reasonCode = searchParams.get('reason_code');
    const message = searchParams.get('message');

    console.log("🔄 Processing CyberSource payment response:", {
      decision,
      transactionId,
      referenceNumber,
      reasonCode,
      message
    });

    setTransactionDetails({
      decision,
      transactionId,
      referenceNumber,
      amount,
      currency,
      reasonCode,
      message
    });

    // Determine payment status based on CyberSource response
    if (decision === 'ACCEPT') {
      setPaymentStatus('success');
      console.log("✅ Payment successful");
      
      // Clear localStorage booking data on successful payment
      localStorage.removeItem('reservationSummary');
      localStorage.removeItem('selectedHotel');
      localStorage.removeItem('bookingDetails');
      
    } else {
      setPaymentStatus('failure');
      console.log("❌ Payment failed:", { decision, reasonCode, message });
    }

    setIsProcessing(false);
  }, [searchParams]);

  const handleContinue = () => {
    if (paymentStatus === 'success') {
      // Redirect to confirmation page with booking details
      router.push(`/confirmed?bookingId=${transactionDetails.referenceNumber}`);
    } else {
      // Redirect back to payment page to retry
      router.push('/payment');
    }
  };

  if (isProcessing) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              <span className="ml-3">Processing payment response...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {paymentStatus === 'success' ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Payment Successful
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Payment Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentStatus === 'success' ? (
            <div className="space-y-4">
              <p className="text-green-700">
                Your payment has been processed successfully!
              </p>
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-semibold mb-2">Transaction Details:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Booking ID:</strong> {transactionDetails.referenceNumber}</p>
                  <p><strong>Transaction ID:</strong> {transactionDetails.transactionId}</p>
                  <p><strong>Amount:</strong> {transactionDetails.currency} {transactionDetails.amount}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-700">
                Unfortunately, your payment could not be processed.
              </p>
              <div className="bg-red-50 p-4 rounded-md">
                <h4 className="font-semibold mb-2">Error Details:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Reference:</strong> {transactionDetails.referenceNumber}</p>
                  <p><strong>Reason:</strong> {transactionDetails.message || 'Payment declined'}</p>
                  <p><strong>Code:</strong> {transactionDetails.reasonCode}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Please check your payment details and try again, or contact your bank if the problem persists.
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <Button onClick={handleContinue} className="w-full">
              {paymentStatus === 'success' ? 'View Booking Confirmation' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentResponsePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading payment results...</div>}>
      <PaymentResponseContent />
    </Suspense>
  );
}
