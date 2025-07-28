"use client";
import { useEffect } from "react";

interface Props {
  propertyId: string;
}

export default function HotelNetworkScript({ propertyId }: Props) {
  useEffect(() => {
    if (!propertyId) return;

    // Avoid adding script twice
    if (document.getElementById("hotel-network-script")) return;

    const script = document.createElement("script");
    script.id = "hotel-network-script";
    script.src = `https://www.thehotelsnetwork.com/js/loader.js?property_id=${propertyId}`;
    script.async = true;
    document.body.appendChild(script);
  }, [propertyId]);

  return null;
}
