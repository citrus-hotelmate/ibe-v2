"use client";

import Link from "next/link";
import Image from "next/image";
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector";
import { CurrencySelector } from "@/components/currency-selector";
import { useState, useEffect } from "react";

type NavbarProps = {
  showWishlist: boolean;
  onToggleWishlistAction: () => void;
};

export default function Navbar({ showWishlist, onToggleWishlistAction }: NavbarProps) {
  const [headerColor, setHeaderColor] = useState("");
  const [logoURL, setLogoURL] = useState<string>("");
  const [logoWidth, setLogoWidth] = useState<number>();
  const [logoHeight, setLogoHeight] = useState<number>();

  useEffect(() => {
    const selectedHotelStr = localStorage.getItem("selectedHotel");
    if (selectedHotelStr) {
      try {
        const selectedHotel = JSON.parse(selectedHotelStr);

        setHeaderColor(selectedHotel.ibeHeaderColour || selectedHotel.headerColor || "");

        if (selectedHotel.logoURL) {
          const trimmedLogoURL = selectedHotel.logoURL.split("?")[0];
          setLogoURL(trimmedLogoURL);
        }

        // Set logo dimensions from selectedHotel
        if (selectedHotel.logoWidth) {
          setLogoWidth(selectedHotel.logoWidth);
        }
        if (selectedHotel.logoHeight) {
          setLogoHeight(selectedHotel.logoHeight);
        }
      } catch (e) {
        console.error("Failed to parse selectedHotel from localStorage", e);
      }
    }
  }, []);

  return (
    <nav className="w-full p-2" style={{ backgroundColor: headerColor }}>
      <div className="flex h-full items-center justify-between w-full">
        {/* LEFT — Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {logoURL && (
              <Image
                src={logoURL}
                alt="App Logo"
                height={logoHeight}
                width={logoWidth}
                className="rounded-md"
                priority
              />
            )}
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-end gap-1 sm:gap-3">
          <button
            onClick={onToggleWishlistAction}
            className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white hover:bg-white/100 transition-all duration-200 shadow-sm hover:shadow-md"
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

          <div className="shrink-0 scale-90 sm:scale-100 origin-right">
            <LanguageSelector />
          </div>

          <div className="shrink-0 scale-90 sm:scale-100 origin-right">
            <CurrencySelector />
          </div>
        </div>
      </div>

      {/* debug if you want */}
      {/* <pre className="text-xs text-white">{logoWidth} x {logoHeight}</pre> */}
    </nav>
  );
}