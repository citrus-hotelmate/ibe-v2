"use client";

import { useEffect } from "react";

export function GoogleAnalyticsLoader({ gaId }: { gaId: string }) {
  useEffect(() => {
    if (!gaId) return;

    if (document.getElementById("__ga_script")) return;

    const script1 = document.createElement("script");
    script1.id = "__ga_script";
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(script2);
  }, [gaId]);

  return null;
}
