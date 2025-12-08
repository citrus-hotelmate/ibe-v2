"use client";

import Link from "next/link";
import Image from "next/image";
import { CircleUserRound } from "lucide-react";
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector";
import { CurrencySelector } from "@/components/currency-selector";
import { useState, useEffect } from "react";

type NavbarProps = {
  showWishlist: boolean;
  onToggleWishlistAction: () => void;
};

export default function Navbar({ showWishlist, onToggleWishlistAction }: NavbarProps) {
  const [headerColor, setHeaderColor] = useState(""); // Default color
  const [logoURL, setLogoURL] = useState("/WhiteLogo.png"); // Default logo

  useEffect(() => {
    // Get hotel details from localStorage
    const selectedHotelStr = localStorage.getItem("selectedHotel");
    
    if (selectedHotelStr) {
      try {
        const selectedHotel = JSON.parse(selectedHotelStr);
        
        // Set header color from ibeHeaderColour or headerColor
        if (selectedHotel.ibeHeaderColour) {
          setHeaderColor(selectedHotel.ibeHeaderColour);
        } else if (selectedHotel.headerColor) {
          setHeaderColor(selectedHotel.headerColor);
        }
        
        // Set logo URL if available, otherwise use default
        if (selectedHotel.logoURL) {
          // Trim query parameters from logo URL
          const trimmedLogoURL = selectedHotel.logoURL.split('?')[0];
          setLogoURL(trimmedLogoURL);
        } else if (selectedHotel.image) {
          // Fallback to base64 image if logoURL not available
          setLogoURL(selectedHotel.image);
        }
        
        console.log("🎨 Navbar using hotel branding:", {
          color: selectedHotel.ibeHeaderColour || selectedHotel.headerColor,
          logo: selectedHotel.logoURL ? "logoURL" : selectedHotel.image ? "image" : "default"
        });
      } catch (error) {
        console.error("Failed to parse selectedHotel from localStorage", error);
      }
    } else {
      // Fallback to old localStorage keys if selectedHotel not found
      const storedColor = localStorage.getItem("ibeHeaderColour");
      if (storedColor) {
        setHeaderColor(storedColor);
      }
    }
  }, []);

  return (
<nav className="w-full p-2" style={{ backgroundColor: headerColor }}>
  <div className="flex justify-between items-center w-full">
    
    {/* LEFT — Logo */}
    <div className="flex items-center">
      <Image
        src={logoURL}
        alt="Hotel Logo"
        width={60}
        height={60}
        className="rounded-md h-10 w-auto sm:h-12 lg:h-14 object-contain"
        unoptimized={logoURL.startsWith("http") || logoURL.startsWith("data:")}
        onError={(e) => {
          // Fallback to default logo if image fails to load
          const target = e.target as HTMLImageElement;
          target.src = "/WhiteLogo.png";
        }}
      />
    </div>

    {/* RIGHT — Wishlist + Language + Currency + User */}
    <div className="flex items-center justify-end gap-1 sm:gap-3">

      {/* Wishlist */}
      <button
        onClick={onToggleWishlistAction}
        className="
          shrink-0
          w-8 h-8 sm:w-10 sm:h-10
          flex items-center justify-center
          rounded-full bg-white hover:bg-white/100
          transition-all duration-200 shadow-sm hover:shadow-md
        "
        title="Wishlist"
        aria-label="Toggle wishlist"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={showWishlist ? headerColor : "none"}
          stroke={showWishlist ? headerColor : "currentColor"}
          className="w-4 h-4 sm:w-5 sm:h-5"
          strokeWidth={1.5}
        >
          <path d="M12 21s-6-4.35-9-8.33C.52 9.28 2.24 4 6.5 4c1.74 0 3.41 1.01 4.5 2.09C12.09 5.01 13.76 4 15.5 4 19.76 4 21.48 9.28 18 12.67 15 16.65 12 21 12 21z" />
        </svg>
      </button>

      {/* Language Selector */}
      <div className="shrink-0 scale-90 sm:scale-100 origin-right">
        <LanguageSelector />
      </div>

      {/* Currency Selector */}
      <div className="shrink-0 scale-90 sm:scale-100 origin-right">
        <CurrencySelector />
      </div>

      {/* User Login */}
      {/* <Link href="/login" className="shrink-0" aria-label="Login">
        <CircleUserRound className="w-6 h-6 sm:w-8 sm:h-8 text-black hover:text-gray-700" />
      </Link> */}

    </div>
  </div>
</nav>
  );
}