"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import { useState, useEffect } from "react"
import Link from "next/link"
import { Home, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { getAllHotels } from "@/controllers/ibeController"
import Image from "next/image"
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector"
import { CurrencySelector } from "@/components/currency-selector"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const [logoUrl, setLogoUrl] = useState("/WhiteLogo.png")
  const [scrolled, setScrolled] = useState(false)
  const [headerColor, setHeaderColor] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Get header color from localStorage first
        const storedColor = localStorage.getItem("ibeHeaderColour");
        if (storedColor) {
          setHeaderColor(storedColor);
        }

        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
        const hotels = await getAllHotels({ token });
        if (hotels && hotels.length > 0) {
          const data = hotels[0];
          if (data.IBE_LogoURL) {
            setLogoUrl(data.IBE_LogoURL);
          }

          // Use API color only if no localStorage color exists
          if (!storedColor && data.IBEHeaderColour) {
            setHeaderColor(data.IBEHeaderColour);
          }
        }
      } catch (err) {
        console.error("Failed to fetch logo", err)
      }
    }

    fetchLogo()
  }, [])

  const getActiveClass = (path: string) => {
    if (pathname === path) {
      return "text-white font-medium border-b-2 border-white"
    }
    return "text-sm font-medium transition-colors hover:text-white text-white"
  }

  if (pathname === "/") {
    return (
      <div className="w-full flex justify-end px-4 py-2">
        <div className="w-[130px]">
          <LanguageSelector />
        </div>
        <div className="w-[140px]">
          <CurrencySelector />
        </div>
      </div>
    );
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b shadow-sm transition-colors duration-300 notranslate ${scrolled ? "backdrop-blur" : ""}`}
      style={{
        backgroundColor: scrolled
          ? `${headerColor}CC` // Adding CC for 80% opacity
          : headerColor
      }}
    >
      <div className="relative container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 md:px-6 notranslate">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 notranslate">
          <Link href="/" className="flex items-center gap-2 font-semibold notranslate">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="App Logo"
                width={90}
                height={90}
                className="rounded-md"
              />
            )}
          </Link>
        </div>

        {/* Center: Nav links - absolutely centered */}
        {/* <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 notranslate">
          <Link 
            href="/" 
            className={`${getActiveClass("/")} notranslate`}
          >
            Property
          </Link>
          <Link 
            href="/book" 
            className={`${getActiveClass("/book")} notranslate`}
          >
            Book Now
          </Link>
        </nav> */}

        {/* Right: Google Translate Language Selector */}
        <div className="hidden md:flex items-center notranslate">
          {/* <div className="w-[130px] mr-2">
            <LanguageSelector />
          </div>
          <div className="w-[140px]">
            <CurrencySelector />
          </div> */}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/20 notranslate"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden p-4 notranslate">
            <div className="mb-4 notranslate">
              <LanguageSelector />
              <div className="mt-2">
                <CurrencySelector />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}