"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
  const [dialCode, setDialCode] = useState("+1")
  const [dialOptions, setDialOptions] = useState<DialOption[]>([])

  useEffect(() => {
    const fetchDialOptions = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all")
        const data = await res.json()
        interface Country {
          idd?: {
            root?: string
            suffixes?: string[]
          }
          name: {
            common: string
          }
        }

        const options: DialOption[] = (data as Country[])
          .filter((c) => c.idd?.root && c.idd?.suffixes?.[0])
          .map((c) => ({
            code: `${c.idd!.root!}${c.idd!.suffixes![0]}`,
            name: c.name.common,
          }))
          .sort((a, b) => parseInt(a.code.replace("+", "")) - parseInt(b.code.replace("+", "")))
        setDialOptions(options)
      } catch (err) {
        console.error("Failed to fetch country codes", err)
      }
    }

    fetchDialOptions()
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
          <option value="+1">+1</option>
          {dialOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.code}
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
