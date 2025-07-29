
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface DialOption {
  code: string
  name: string
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
  required?: boolean
  placeholder?: string
  error?: string
  countryCode: string
}

export function PhoneInput({
  value,
  onChange,
  id,
  required,
  placeholder = "Phone number",
  error,
  countryCode,
}: PhoneInputProps) {
  const [dialCode, setDialCode] = useState(() => {
    try {
      const stored = localStorage.getItem("selectedCountry")
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed?.IDDCode?.trim() || "+1"
      }
    } catch {
      return "+1"
    }
    return "+1"
  })
  const [dialOptions, setDialOptions] = useState<DialOption[]>([])

  useEffect(() => {
    const fetchDialOptions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API_IBE/getcountry.aspx`)
        const raw = await res.text()
        const fixed = `[${raw.replace(/}\s*{/g, "},{")}]`
        const data = JSON.parse(fixed)

        const seen = new Set()
        const options: DialOption[] = data
          .filter((c: any) => c.IDDCode && !seen.has(c.IDDCode) && (seen.add(c.IDDCode) || true))
          .map((c: any) => ({
            code: c.IDDCode.trim(),
            name: c.CountryName.trim()
          }))
          .sort((a, b) => parseInt(a.code.replace(/\D/g, "")) - parseInt(b.code.replace(/\D/g, "")))

        setDialOptions(options)
      } catch (err) {
        console.error("Failed to fetch country codes", err)
      }
    }

    fetchDialOptions()
  }, [])

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("selectedCountry")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.IDDCode?.trim()) {
            setDialCode(parsed.IDDCode.trim())
          }
        }
      } catch {
        // ignore errors
      }
    }

    window.addEventListener("storage", handleStorageChange)
    handleStorageChange()

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const phoneOnly = value.replace(/^\+\d+\s*/, "")

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = e.target.value.replace(/[^\d]/g, "")
    onChange(`${dialCode} ${sanitizedValue}`)
  }

  return (
    <div className="flex gap-2">
      <div className="flex items-center w-28 h-11 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-900 px-3">
        <select
          value={dialCode}
          onChange={(e) => {
            setDialCode(e.target.value)
            onChange(`${e.target.value} ${phoneOnly}`)
          }}
          className="w-full bg-transparent focus:outline-none"
        >
          <option value={dialCode}>
            {dialCode}
          </option>
          {dialOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name} ({option.code})
            </option>
          ))}
        </select>
      </div>
      <Input
        id={id}
        type="tel"
        placeholder={placeholder}
        value={phoneOnly}
        onChange={handlePhoneNumberChange}
        required={required}
        className={cn(
          "flex-1 h-11 px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400",
          error && "border-red-500"
        )}
      />
    </div>
  )
}
