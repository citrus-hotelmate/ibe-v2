"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) {
      window.location.reload();
    } else {
      hasMounted.current = true;
    }
  }, [pathname]);

  return <>{children}</>;
}