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
  dialCode?: string
}

export function PhoneInput({
  value,
  onChange,
  id,
  required,
  placeholder = "Phone number",
  error,
  countryCode,
  dialCode: providedDialCode,
}: PhoneInputProps) {
  const [currentDialCode, setCurrentDialCode] = useState(providedDialCode || "+1")

  // Update dialCode when it changes from props
  useEffect(() => {
    if (providedDialCode && providedDialCode !== currentDialCode) {
      setCurrentDialCode(providedDialCode)
      // Update phone number with new dial code
      const phoneOnly = value.replace(/^\+\d+\s*/, "")
      onChange(`${providedDialCode} ${phoneOnly}`)
    }
  }, [providedDialCode, currentDialCode, value, onChange])

  const phoneOnly = value.replace(/^\+\d+\s*/, "")

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = e.target.value.replace(/[^\d]/g, "")
    onChange(`${currentDialCode} ${sanitizedValue}`)
  }

  return (
    <div className="flex gap-2">
      <div className="flex items-center w-28 h-11 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-900 px-3">
        <div className="w-full bg-transparent">
          {currentDialCode}
        </div>
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
