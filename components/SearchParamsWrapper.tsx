"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function SearchParamsWrapper({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["rooms", "policies", "reviews"].includes(tab)) {
      onTabChange(tab)
    }
  }, [searchParams, onTabChange])

  return null
}