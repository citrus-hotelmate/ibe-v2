import Link from "next/link"
import { Button } from "@/components/ui/button"
import LanguageSelector from "@/components/GoogleTranslate/LanguageSelector"
import { CurrencySelector } from "@/components/currency-selector"

export default function Navbar() {
  return (
    <nav className="w-full px-6 py-4" style={{ backgroundColor: "#e2e0df" }}>
      <div className="flex items-center justify-between">
        {/* Menu button on the left */}
        <Button
          variant="ghost"
          className="bg-white/60 hover:bg-white/80 text-gray-800 px-4 py-2 rounded-full font-medium"
        >
          Menu
        </Button>

        {/* Login button and selectors on the right */}
        <div className="flex items-center gap-4">
          <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-full" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <div className="hidden md:flex items-center gap-4">
            <div className="w-[130px]">
              <LanguageSelector />
            </div>
            <div className="w-[140px]">
              <CurrencySelector />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
