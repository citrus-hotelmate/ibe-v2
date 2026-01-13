"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer({ hotelName }: { hotelName?: string }) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const [headerColor, setHeaderColor] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [logoWidth, setLogoWidth] = useState<number>(80);
  const [logoHeight, setLogoHeight] = useState<number>(80);

  console.log("selectedHotel in footer", selectedHotel);

  useEffect(() => {
    const loadHotelData = () => {
      const selectedHotelStr = localStorage.getItem("selectedHotel");
      if (selectedHotelStr) {
        try {
          const hotelData = JSON.parse(selectedHotelStr);
          setSelectedHotel(hotelData);

          console.log("hotelData", hotelData);
          if (hotelData.ibeHeaderColour) {
            setHeaderColor(hotelData.ibeHeaderColour);
          }
          if (hotelData.logoWidth && hotelData.logoHeight) {
            setLogoWidth(hotelData.logoWidth);
            setLogoHeight(hotelData.logoHeight);
          }
        } catch (error) {
          console.error(
            "Failed to parse selectedHotel from localStorage",
            error
          );
        }
      }
    };

    loadHotelData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedHotel") {
        loadHotelData();
      }
    };

    const handleHotelUpdate = () => {
      loadHotelData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("hotelDataUpdated", handleHotelUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("hotelDataUpdated", handleHotelUpdate);
    };
  }, []);

  return (
    <footer className="notranslate no-print">
      {/* ====== HOTEL DETAIL SECTION (dynamic color) ====== */}
      {pathname !== "/" && selectedHotel && (
        <div
          className="border-t text-white "
          style={{
            backgroundColor: headerColor,
            transition: "background-color 0.3s ease",
          }}
        >
          <div className="flex flex-col items-center text-center gap-3 ">
            <div className="p-3 border-b border-white/20">
              <div className="flex flex-col items-center space-y-1">
                {/* Hotel Logo (NO LINK) */}
                {selectedHotel.logoURL && logoWidth && logoHeight && (
                  <div
                    className="flex items-center justify-center"
                    style={{ height: `${logoHeight}px` }}
                  >
                    <div className="h-full flex items-center">
                      <Image
                        src={selectedHotel.logoURL}
                        alt="Hotel Logo"
                        width={logoWidth}
                        height={logoHeight}
                        className="h-full w-auto object-contain rounded-md"
                        priority
                      />
                    </div>
                  </div>
                )}

                {/* Hotel Name */}
                <h3 className="text-xl font-semibold text-white notranslate">
                  {selectedHotel.name}
                </h3>

                {/* Hotel Contact Details */}
                <div className="flex flex-col items-center">
                  {selectedHotel.address && (
                    <div className="flex items-center space-x-2 notranslate">
                      <MapPin size={16} className="text-white" />
                      <span className="text-sm text-white">
                        {selectedHotel.address}
                      </span>
                    </div>
                  )}

                  {selectedHotel.phone && (
                    <div className="flex items-center space-x-2 notranslate">
                      <Phone size={16} className="text-white" />
                      <a
                        href={`tel:${selectedHotel.phone}`}
                        className="text-sm text-white hover:underline"
                      >
                        {selectedHotel.phone}
                      </a>
                    </div>
                  )}

                  {selectedHotel.email && (
                    <div className="flex items-center space-x-2 notranslate">
                      <Mail size={16} className="text-white" />
                      <a
                        href={`mailto:${selectedHotel.email}`}
                        className="text-sm text-white hover:underline"
                      >
                        {selectedHotel.email}
                      </a>
                    </div>
                  )}

                  {(selectedHotel.hotelWebsite || selectedHotel.website) && (
                    <div className="flex items-center space-x-2 notranslate">
                      <Link
                        href={
                          selectedHotel.hotelWebsite || selectedHotel.website
                        }
                        target="_blank"
                        className="text-sm text-white hover:underline"
                      >
                        {selectedHotel.hotelWebsite || selectedHotel.website}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== CONTACT + SOCIAL + COPYRIGHT SECTION (constant #D3D3D3) ====== */}
      <div className="border-t" style={{ backgroundColor: "#D3D3D3" }}>
        <div className="w-full notranslate">
          <div className=" py-6 text-sm text-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-center w-full">
              {/* LEFT — Logo */}
              <div className="flex items-center pl-4 sm:pl-8">
                <Image
                  src="/WhiteLogo.png"
                  alt="IBE Logo"
                  width={120}
                  height={50}
                  className="object-contain"
                />
              </div>

              {/* RIGHT — Copyright */}
              <div className="mt-4 sm:mt-0 text-center sm:text-right pr-4 sm:pr-8">
                <p className="notranslate text-gray-800">
                  &copy; {currentYear}{" "}
                  {pathname === "/" ? "HotelMateIBE" : "CitrusIBE"}. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
