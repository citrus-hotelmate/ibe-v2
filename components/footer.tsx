"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { getAllHotels } from "@/controllers/adminController";
import { HotelResponse } from "@/types/admin";

export function Footer({ hotelName }: { hotelName?: string }) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  const [contact, setContact] = useState({
    email: "",
    phone: "",
    address: "",
  });

  const params = useParams();
  const hotelCodeFromParams = Array.isArray(params?.hotelCode)
    ? params.hotelCode[0]
    : params?.hotelCode;

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
        const hotels: HotelResponse[] = await getAllHotels({ token });

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
          matchedHotel = hotels.find(h => h.hotelCode?.toString() === code) || hotels[0];
        } else if (hotelName) {
          matchedHotel = hotels.find(h => h.hotelName === hotelName) || hotels[0];
        }

        setContact({
          email: matchedHotel.hotelEmail || "",
          phone: matchedHotel.hotelPhone || "",
          address: matchedHotel.city || "",
        });
      } catch (err) {
        console.error("Failed to fetch hotel contact info", err);
      }
    };

    fetchContact();
  }, [hotelCodeFromParams, hotelName]);
// Debug log

  console.log("Footer contact info:", contact); // Debug log

  return (
    <footer className="bg-white border-t notranslate">
      <div className="container mx-auto px-4 py-8 notranslate">
        {/*Hide contact + social on root route */}
        {pathname !== "/" && (
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0 items-center">
              <div className="flex items-center space-x-2 notranslate">
                <MapPin size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground notranslate">{contact.address || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-2 notranslate">
                <Mail size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground notranslate">{contact.email || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-2 notranslate">
                <Phone size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground notranslate">{contact.phone || "N/A"}</span>
              </div>
            </div>

            <div className="flex space-x-4 notranslate">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook size={18} />
                <span className="sr-only notranslate">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram size={18} />
                <span className="sr-only notranslate">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter size={18} />
                <span className="sr-only notranslate">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Linkedin size={18} />
                <span className="sr-only notranslate">LinkedIn</span>
              </Link>
            </div>
          </div>
        )}

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground notranslate">
          <p className="notranslate">
            &copy; {currentYear} {pathname === "/" ? "HotelMateIBE" : hotelName || "CitrusIBE"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}