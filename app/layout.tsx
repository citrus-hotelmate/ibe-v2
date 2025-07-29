import type React from "react";
import { Toaster, toast } from "sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { BookingProvider } from "@/components/booking-context";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/components/currency-context";
import { GoogleTranslateLoader } from "@/components/GoogleTranslateLoader";
import ClientLayout from "@/components/ClientLayout";
import { ThemeColorLoader } from "@/components/ThemeColorLoader";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalyticsWrapper } from "@/components/googleAnalyticsWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CitrusIBE",
  description: "CirusIBE",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Analytics />

        <GoogleAnalyticsWrapper />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider>
            <BookingProvider>
              <ClientLayout>
                <div className="flex flex-col min-h-screen">
                  {/* Header will be conditionally rendered in each page */}
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </ClientLayout>
            </BookingProvider>
          </CurrencyProvider>
        </ThemeProvider>
        <ThemeColorLoader />
        <GoogleTranslateLoader />
        <Toaster
          richColors
          position="bottom-right"
          closeButton
          visibleToasts={1}
          style={{ marginTop: "50px", pointerEvents: "auto" }}
          toastOptions={{
            style: {
              transform: "translateY(0)",
              transition: "none",
            },
          }}
        />
      </body>
    </html>
  );
}
