"use client";

import Link from "next/link";
import Image from "next/image";
import { CircleUserRound } from "lucide-react";
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector";
import { CurrencySelector } from "@/components/currency-selector";

type NavbarProps = {
  showWishlist: boolean;
  onToggleWishlistAction: () => void;
};

export default function Navbar({ showWishlist, onToggleWishlistAction }: NavbarProps) {
  return (
    <nav className="w-full px-3 sm:px-6 py-3 sm:py-4 bg-[#ff9100]">
      <div className="flex justify-between items-center w-full">
        <div className="flex-1" />

        <Link href="/" className="flex-1 flex justify-center">
          <Image
            src="/WhiteLogo.png"
            alt="Logo"
            width={130}
            height={60}
            className="rounded-md h-auto w-24 sm:w-28 lg:w-[130px]"
          />
        </Link>

        {/* Right: Language + Wishlist + Currency + User */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            {/* Wishlist Button (uses parent handler) */}
          <button
            onClick={onToggleWishlistAction}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-white/100 transition-all duration-200 shadow-sm hover:shadow-md"
            title="Wishlist"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={showWishlist ? "#ff9100" : "none"}
              stroke={showWishlist ? "#ff9100" : "currentColor"}
              className="w-5 h-5"
              strokeWidth={1.5}
            >
              <path d="M12 21s-6-4.35-9-8.33C.52 9.28 2.24 4 6.5 4c1.74 0 3.41 1.01 4.5 2.09C12.09 5.01 13.76 4 15.5 4 19.76 4 21.48 9.28 18 12.67 15 16.65 12 21 12 21z" />
            </svg>
          </button>
          <LanguageSelector />
          <CurrencySelector />
          <Link href="/login">
            <CircleUserRound className="w-7 h-7 sm:w-8 sm:h-8 text-black hover:text-gray-700" />
          </Link>
        </div>
      </div>
    </nav>
  );
}