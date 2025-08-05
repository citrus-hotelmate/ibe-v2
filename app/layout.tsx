"use client";

import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { BookingProvider } from "@/components/booking-context";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/components/currency-context";
import Script from "next/script";
import { useEffect, useState } from "react";
import { MessageCircle, X, Globe } from "lucide-react";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

// Create a client-only component for the floating buttons
// const FloatingButtons = dynamic(() => import('./FloatingButtons'), {
//     ssr: false,
//     loading: () => null
// });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setIsMounted(true);

        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.cssText = "position:fixed; top:-1000px; left:-1000px; visibility:hidden; z-index:-1;";
        document.body.appendChild(div);

        window.googleTranslateElementInit = () => {
            if (window.google?.translate) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'en',
                        includedLanguages: 'en,es,fr,de,it,pt,ru,ja,ko,zh,ar,hi,th,vi,nl,sv',
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                        autoDisplay: false,
                        multilanguagePage: true,
                    },
                    'google_translate_element'
                );
            }
        };

        return () => {
            div.remove();
        };
    }, []);

    const [hotelName, setHotelName] = useState<string | null>(null);

    useEffect(() => {
        const storedHotelData = localStorage.getItem("hotelData");
        if (storedHotelData) {
            try {
                const parsed = JSON.parse(storedHotelData);
                setHotelName(parsed.hotelName || null);
            } catch (error) {
                console.error("Error parsing hotelData from localStorage", error);
            }
        }
    }, []);

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <title>Hotel Mate IBE</title>
                <meta name="description" content="Hotel Mate IBE" />
                <meta name="generator" content="v0.dev" />
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className={inter.className} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <CurrencyProvider>
                        <BookingProvider>
                            <div className="flex flex-col min-h-screen" suppressHydrationWarning>
                                <main className="flex-1">{children}</main>
                                {isMounted && <Footer hotelName={hotelName || undefined} />}
                            </div>
                            
                            {/* Client-only floating buttons */}
                        </BookingProvider>
                    </CurrencyProvider>
                </ThemeProvider>

                {isMounted && (
                    <Script
                        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
                        strategy="afterInteractive"
                        onError={() => {
                            console.log("Google Translate script failed to load");
                        }}
                    />
                )}
            </body>
        </html>
    );
}