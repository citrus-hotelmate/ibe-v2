"use client";

import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#e2e0df" }}>
      <div className="relative w-[130px] mb-6">
        <img
          src="/logo-01.png"
          alt="Logo"
          className="w-full h-auto"
        />
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-lg font-urbanist text-muted-foreground">Loading hotel details...</p>
    </div>
  );
}
