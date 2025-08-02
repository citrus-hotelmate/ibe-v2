import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector"
import { CurrencySelector } from "@/components/currency-selector"
import { SearchBar } from "@/components/search-bar"
import { CircleUserRound } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="w-full px-6 py-4 relative" style={{ backgroundColor: "#e2e0df" }}>
      <div className="flex justify-center w-full relative">
        {/* Left Logo */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center">
          <Link href="/">
            <Image
              src="/logo-01.png"
              alt="Logo"
              width={130}
              height={60}
              className="rounded-md"
            />
          </Link>
        </div>

        {/* Centered SearchBar */}

        {/* Right side - absolute positioned to avoid pushing the search bar */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <Link href="/login">
            <CircleUserRound className="w-9 h-9 text-black hover:text-gray-700" />
          </Link>
          <LanguageSelector />
          <CurrencySelector />
        </div>
      </div>
    </nav>
  )
}
