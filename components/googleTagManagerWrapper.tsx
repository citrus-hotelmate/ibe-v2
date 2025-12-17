"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type HotelDetail = {
  GoogleTag?: string | null;
  GoogleAnalyticsID?: string | null;
  HotelName?: string;
};

export function GoogleTagManagerWrapper() {
  const [gtmId, setGtmId] = useState<string | null>(null);
  const [data, setData] = useState<HotelDetail | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const GTM_REGEX = /GTM-[A-Z0-9]+/i;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API_IBE/GetHotelDetail.aspx`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: HotelDetail = await res.json();
        if (cancelled) return;

        setData(json);

        const rawId = json.GoogleTag ?? json.GoogleAnalyticsID ?? null;
        const id = rawId ? rawId.match(GTM_REGEX)?.[0] ?? null : null;

        setGtmId(id ?? null);

        console.log(
          "%c✅ GoogleTagManagerWrapper mounted",
          "color: green; font-weight: bold;"
        );
        console.log("Hotel Name:", json.HotelName);
        console.log("GoogleTag (from API):", json.GoogleTag);
        console.log("Extracted GTM ID:", id);
      } catch (e) {
        console.error("❌ Failed to fetch hotel details / GTM id:", e);
        if (!cancelled) setGtmId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL]);

  if (!gtmId) return null;

  return (
    <>
      <Script id="gtm-script" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>

      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
