"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { getAllHotels } from "@/controllers/ibeController";
import { Hotel } from "@/types/ibe";

export function Footer({ hotelName }: { hotelName?: string }) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const [headerColor, setHeaderColor] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  useEffect(() => {
    const selectedHotelStr = localStorage.getItem("selectedHotel");
    if (selectedHotelStr) {
      try {
        const hotelData = JSON.parse(selectedHotelStr);
        setSelectedHotel(hotelData);
        if (hotelData.ibeHeaderColour) {
          setHeaderColor(hotelData.ibeHeaderColour);
        }
      } catch (error) {
        console.error("Failed to parse selectedHotel from localStorage", error);
      }
    }
  }, []);

  const [contact, setContact] = useState({
    email: "",
    phone: "",
    address: "",
  });

  const [hotelDisplayName, setHotelDisplayName] = useState("");

  const [hotelDataVersion, setHotelDataVersion] = useState(0);

  const params = useParams();
  const hotelCodeFromParams = Array.isArray(params?.hotelCode)
    ? params.hotelCode[0]
    : params?.hotelCode;

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
        const hotels: Hotel[] = await getAllHotels({ token });

        let matchedHotel = hotels[0];
        let code: string | null = null;
        const storedHotel = localStorage.getItem("hotelData");
        if (storedHotel) {
          try {
            const parsed = JSON.parse(storedHotel);
            code = parsed?.hotelCode?.toString() || null;
          } catch (e) {
            console.error("Failed to parse hotelData from localStorage", e);
          }
        }
        code = hotelCodeFromParams || code;
        if (code) {
          matchedHotel =
            hotels.find((h) => h.hotelCode?.toString() === code) || hotels[0];
        } else if (hotelName) {
          matchedHotel =
            hotels.find((h) => h.hotelName === hotelName) || hotels[0];
        }

        setContact({
          email: matchedHotel.hotelEmail || "",
          phone: matchedHotel.hotelPhone || "",
          address: matchedHotel.city || "",
        });
        setHotelDisplayName(matchedHotel.hotelName || "");
      } catch (err) {
        console.error("Failed to fetch hotel contact info", err);
      }
    };

    fetchContact();
  }, [hotelCodeFromParams, hotelName, hotelDataVersion]);

  useEffect(() => {
    const handleStorageChange = () => {
      setHotelDataVersion((prev) => prev + 1);
    };

    window.addEventListener("storage", handleStorageChange);

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === "hotelData") {
        handleStorageChange();
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <footer className="notranslate">
      {/* ====== HOTEL DETAIL SECTION (dynamic color) ====== */}
      {pathname !== "/" && selectedHotel && (
        <div
          className="border-t text-white"
          style={{
            backgroundColor: headerColor,
            transition: "background-color 0.3s ease",
          }}
        >
          <div className="container mx-auto">
            <div className="p-6 border-b border-white/20">
              <div className="flex flex-col items-center space-y-1">
                {/* Hotel Logo */}
                {selectedHotel.logoURL && (
                  <div className="flex justify-center">
                    <Image
                      src={selectedHotel.logoURL.split("?")[0]}
                      alt={`${selectedHotel.name} logo`}
                      width={80}
                      height={80}
                      className="object-contain max-h-12 sm:max-h-16"
                    />
                  </div>
                )}

                {/* Hotel Name */}
                <h3 className="text-xl font-semibold text-white notranslate">
                  {selectedHotel.name}
                </h3>

                {/* Hotel Contact Details — stacked vertically, tighter gap */}
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

                  {selectedHotel.website && (
                    <div className="flex items-center space-x-2 notranslate">
                      <Link
                        href={selectedHotel.website}
                        target="_blank"
                        className="text-sm text-white hover:underline"
                      >
                        Website
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
            {/* BOTTOM ROW: Logo Left + Copyright Right */}
            <div
              className="
        flex flex-col sm:flex-row 
        justify-between items-center
        w-full
      "
            >
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
