"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "./currency-context"
import { usePathname } from "next/navigation"
import { CircleDollarSign } from "lucide-react"

export function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency()
  const pathname = usePathname()

  const isPaymentPage = pathname === "/payment" || pathname.startsWith("/tentative");
  const allowedCodes = isPaymentPage ? ["USD", "LKR"] : currencies.map((c) => c.code)

  const filteredCurrencies = currencies.filter((c) => allowedCodes.includes(c.code))

  const selectedLabel = filteredCurrencies.find((c) => c.code === currency)?.code || currency

  return (
    <Select value={currency} onValueChange={setCurrency}>
 <SelectTrigger
  className="w-13 h-10 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-50 [&>svg]:hidden"
>
  <SelectValue placeholder="Currency">
    <CircleDollarSign className="h-6 w-6 text-black mx-auto" />
  </SelectValue>
</SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-auto">
        {filteredCurrencies.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            {curr.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
