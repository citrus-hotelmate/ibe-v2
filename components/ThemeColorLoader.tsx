"use client";

import { useEffect } from "react";

export function ThemeColorLoader() {
  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""; // Set your API base URL here or use env variable
    const fetchHotelDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API_IBE/GetHotelDetail.aspx`);
        const data = await res.json();
        if (
          data.IBEHeaderColour &&
          /^#([0-9A-Fa-f]{3}){1,2}$/.test(data.IBEHeaderColour)
        ) {
          const hex = data.IBEHeaderColour.replace("#", "");
          const bigint = parseInt(
            hex.length === 3
              ? hex
                  .split("")
                  .map((c: any) => c + c)
                  .join("")
              : hex,
            16
          );
          const r = (bigint >> 16) & 255;
          const g = (bigint >> 8) & 255;
          const b = bigint & 255;
          document.documentElement.style.setProperty(
            "--button-color",
            `${rgbToHsl(r, g, b)}`
          );
        }
      } catch (err) {
        console.error("Failed to fetch hotel details", err);
      }
    };

    fetchHotelDetails();
  }, []);

  return null;
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%`;
}
