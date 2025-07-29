"use client";

import { useEffect, useState } from "react";
import { GoogleAnalyticsLoader } from "./googleAnalyticsLoader";

export function GoogleAnalyticsWrapper() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [gaId, setGaId] = useState<string | null>(null);

  console.log("gaId", gaId);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API_IBE/GetHotelDetail.aspx`);
        const data = await res.json();
        setGaId(data?.GoogleAnalyticsID ?? null);
      } catch (error) {
        console.error("Failed to fetch hotel details", error);
      }
    };

    fetchHotelDetails();
  }, []);

  if (!gaId) return null;

  return <GoogleAnalyticsLoader gaId={gaId} />;
}
