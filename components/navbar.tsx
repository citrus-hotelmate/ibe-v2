import Link from "next/link"
import Image from "next/image"
import { CircleUserRound } from "lucide-react"
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector"
import { CurrencySelector } from "@/components/currency-selector"

export default function Navbar() {
  return (
    <nav className="w-full px-3 sm:px-6 py-3 sm:py-4 bg-[#e2e0df]">
      {/* Top Row: Logo + Language + Currency + User */}
      <div className="flex justify-between items-center w-full">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/WhiteLogo.png"
            alt="Logo"
            width={130}
            height={60}
            className="rounded-md h-auto w-24 sm:w-28 lg:w-[130px]"
          />
        </Link>

        {/* Right: Language + Currency + User */}
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector />
          <CurrencySelector />
          <Link href="/login">
            <CircleUserRound className="w-7 h-7 sm:w-8 sm:h-8 text-black hover:text-gray-700" />
          </Link>
        </div>
      </div>
    </nav>
  )
}