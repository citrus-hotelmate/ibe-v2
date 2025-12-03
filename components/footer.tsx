"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [headerColor, setHeaderColor] = useState("#792868");

  useEffect(() => {
    const storedColor = localStorage.getItem("ibeHeaderColour");
    if (storedColor) {
      setHeaderColor(storedColor);
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
    <footer className="bg-white border-t notranslate">
      <div className="container mx-auto  notranslate">
        {/* Extra Footer Links (Support, Discover, etc.) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mt-12 text-sm text-muted-foreground text-left notranslate" style={{ '--hover-color': headerColor } as React.CSSProperties}>
          <div>
            <h4 className="font-medium mb-4" style={{ color: headerColor }}>
              <strong>Support</strong>
            </h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-[--hover-color]" style={{ textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = headerColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>Coronavirus (COVID-19) FAQs</Link></li>
              <li><Link href="#">Manage your trips</Link></li>
              <li><Link href="#">Contact Customer Service</Link></li>
              <li><Link href="#">Safety Resource Center</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4" style={{ color: headerColor }}>
              <strong>Discover</strong>
            </h4>
            <ul className="space-y-2">
              <li><Link href="#">Genius loyalty program</Link></li>
              <li><Link href="#">Seasonal and holiday deals</Link></li>
              <li><Link href="#">Travel articles</Link></li>
              <li><Link href="#">Booking.com for Business</Link></li>
              <li><Link href="#">Traveller Review Awards</Link></li>
              <li><Link href="#">Car rental</Link></li>
              <li><Link href="#">Flight finder</Link></li>
              <li><Link href="#">Restaurant reservations</Link></li>
              <li><Link href="#">Booking.com for Travel Agents</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4" style={{ color: headerColor }}>
              <strong>Terms and settings</strong>
            </h4>
            <ul className="space-y-2">
              <li><Link href="#">Privacy & cookies</Link></li>
              <li><Link href="#">Terms & conditions</Link></li>
              <li><Link href="#">Accessibility Statement</Link></li>
              <li><Link href="#">Partner dispute</Link></li>
              <li><Link href="#">Modern Slavery Statement</Link></li>
              <li><Link href="#">Human Rights Statement</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4" style={{ color: headerColor }}>
              <strong>Partners</strong>
            </h4>
            <ul className="space-y-2">
              <li><Link href="#">Extranet login</Link></li>
              <li><Link href="#">Partner help</Link></li>
              <li><Link href="#">List your property</Link></li>
              <li><Link href="#">Become an affiliate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4" style={{ color: headerColor }}>
              <strong>About</strong>
            </h4>
            <ul className="space-y-2">
              <li><Link href="#">About Booking.com</Link></li>
              <li><Link href="#">How We Work</Link></li>
              <li><Link href="#">Sustainability</Link></li>
              <li><Link href="#">Press center</Link></li>
              <li><Link href="#">Careers</Link></li>
              <li><Link href="#">Investor relations</Link></li>
              <li><Link href="#">Corporate contact</Link></li>
            </ul>
          </div>
        </div>
        {/* Copyright */}
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground notranslate">
          {/* Contact + Social */}
          {pathname !== "/" && (
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0 items-center">
              <div className="flex items-center space-x-2 notranslate">
                <MapPin size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground notranslate">
                  {contact.address || "N/A"}
                </span>
              </div>
              <div className="flex items-center space-x-2 notranslate">
                <Mail size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground notranslate">
                  {contact.email || "N/A"}
                </span>
              </div>
              <div className="flex items-center space-x-2 notranslate">
                <Phone size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground notranslate">
                  {contact.phone || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex space-x-4 notranslate">
              <Link href="#" className="text-muted-foreground" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = headerColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                <Facebook size={18} />
                <span className="sr-only notranslate">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = headerColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                <Instagram size={18} />
                <span className="sr-only notranslate">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = headerColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                <Twitter size={18} />
                <span className="sr-only notranslate">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = headerColor} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                <Linkedin size={18} />
                <span className="sr-only notranslate">LinkedIn</span>
              </Link>
            </div>
          </div>
        )}
          <p className="notranslate p-4">
            &copy; {currentYear}{" "}
            {pathname === "/"
              ? "HotelMateIBE"
              : hotelDisplayName || "CitrusIBE"}
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}