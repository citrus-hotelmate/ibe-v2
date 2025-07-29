"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Currency = {
  code: string
  rate: number
}

type CurrencyContextType = {
  currency: string
  setCurrency: (code: string) => void
  convertPrice: (priceInUSD: number) => number
  formatPrice: (price: number) => string
  currencies: Currency[]
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("USD")
  const [rates, setRates] = useState<Record<string, number>>({})
  const [currencies, setCurrencies] = useState<Currency[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    const savedCurrency = localStorage.getItem("preferredCurrency")
    if (savedCurrency) setCurrency(savedCurrency)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("preferredCurrency", currency)
  }, [currency])

  useEffect(() => {
    if (typeof window === "undefined") return

    fetch("https://open.er-api.com/v6/latest/USD")
  .then((res) => res.json())
  .then((data) => {
    if (data && data.rates) {
      const currencyList = Object.entries(data.rates).map(([code, rate]) => ({ code, rate }))
      setCurrencies(currencyList)
      setRates(data.rates)
    }
  })
      .catch((err) => {
        console.error("Currency fetch failed:", err)
        setCurrencies([{ code: "USD", rate: 1 }]) // fallback
        setRates({ USD: 1 })
      })
  }, [])

  const convertPrice = (priceInUSD: number): number => {
    if (!rates || !currency || !rates[currency]) return priceInUSD
    return priceInUSD * rates[currency]
  }

  const formatPrice = (price: number): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
      }).format(price)
    } catch {
      return `${price.toFixed(2)} ${currency}`
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice, currencies }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error("useCurrency must be used within a CurrencyProvider")
  return context
}
