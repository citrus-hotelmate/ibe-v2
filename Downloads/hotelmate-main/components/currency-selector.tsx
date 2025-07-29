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
      <SelectTrigger className="w-[110px] h-9.3 text-sm flex items-center justify-between px-3 border rounded-md shadow-sm bg-white hover:bg-gray-50">
        <SelectValue placeholder="Currency">
          <div className="flex items-center gap-2">
            <span>{selectedLabel}</span>
          </div>
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
