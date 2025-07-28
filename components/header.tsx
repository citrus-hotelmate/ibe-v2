"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Image from "next/image";
import LanguageSelector from "@/components/LanguageSelector";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API_IBE/GetHotelDetail.aspx`);
        const data = await res.json();
        if (data.IBE_LogoURL) {
          setLogoUrl(data.IBE_LogoURL);
        }
        if (
          data.IBEHeaderColour &&
          /^#([0-9A-Fa-f]{3}){1,2}$/.test(data.IBEHeaderColour)
        ) {
          document.documentElement.style.setProperty(
            "--header-bg-color",
            data.IBEHeaderColour
          );
          const hex = data.IBEHeaderColour.replace("#", "");
          const bigint = parseInt(
            hex.length === 3
              ? hex
                  .split("")
                  .map((x: string) => x + x)
                  .join("")
              : hex,
            16
          );
          const r = (bigint >> 16) & 255;
          const g = (bigint >> 8) & 255;
          const b = bigint & 255;
          document.documentElement.style.setProperty(
            "--header-bg-color-rgb",
            `${r}, ${g}, ${b}`
          );
        } else {
          console.warn(
            "Invalid or missing IBEHeaderColour:",
            data.IBEHeaderColour
          );
          document.documentElement.style.setProperty(
            "--header-bg-color",
            "transparent"
          ); // Default to transparent
          // Optionally remove the RGB fallback or set to white
          document.documentElement.style.setProperty(
            "--header-bg-color-rgb",
            "255, 255, 255"
          );
        }
      } catch (err) {
        console.error("Failed to fetch logo", err);
      }
    };

    fetchLogo();
  }, []);

  // removed selectedLang state and useEffect for storedLang

  const getActiveClass = (path: string) => {
    if (pathname === path) {
      return "text-white font-medium border-b-2 border-white";
    }
    return "text-sm font-medium transition-colors hover:text-white text-white";
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b shadow-sm transition-colors duration-300 ${
        scrolled ? "backdrop-blur" : ""
      }`}
      style={{
        backgroundColor: scrolled
          ? "rgba(var(--header-bg-color-rgb, 255, 255, 255), 0.8)"
          : "rgb(var(--header-bg-color-rgb, 255, 255, 255))",
      }}
    >
      <div className="relative container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {logoUrl && (
               <Image
        src={logoUrl}
        alt="App Logo"
        height={70}
        width={0} // required, but overridden
        style={{ height: "70px", width: "auto" }}
        className="rounded-md"
        priority
      />
            )}
          </Link>
        </div>

        {/* Center: Nav links - absolutely centered
    <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
      <Link href="/" className={getActiveClass("/")}>
        Property
      </Link>
      <Link href="/book" className={getActiveClass("/book")}>
        Book Now
      </Link>
    </nav> */}

        {/* Right: Language Selector */}
        <div className="hidden md:flex items-center">
          <LanguageSelector />
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden p-4">
            <div className="mb-4">
              <LanguageSelector />
            </div>
            {/* <nav className="flex flex-col py-2">
          <Link
            href="/"
            className="py-2 text-sm font-medium transition-colors hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Property
          </Link>
          <Link
            href="/book"
            className="py-2 text-sm font-medium transition-colors hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Book Now
          </Link>
        </nav> */}
          </div>
        )}
      </div>
    </header>
  );
}
