"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "./currency-context"
import { usePathname } from "next/navigation"

export function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency()
  const pathname = usePathname()

  const isPaymentPage = pathname === "/payment" || pathname === "/confirmed";
  const allowedCodes = isPaymentPage ? ["USD", "LKR"] : currencies.map((c) => c.code)

  const filteredCurrencies = currencies.filter((c) => allowedCodes.includes(c.code))

  const selectedLabel = filteredCurrencies.find((c) => c.code === currency)?.code || currency

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-[140px] h-8 text-sm">
        <SelectValue placeholder="Currency">
          {selectedLabel}
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
