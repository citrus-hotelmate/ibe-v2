"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import Link from "next/link"
import { useEffect, useState } from "react"
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [contact, setContact] = useState({
    email: "info@hotelmateibe.com",
    phone: "+1 234 567 890",
    address: "123 Beachside Ave, Paradise City",
  })

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API_IBE/GetHotelDetail.aspx`)
        const data = await res.json()
        setContact({
          email: data.Email || "",
          phone: data.Phone || "",
          address: data.Address || "",
        })
      } catch (err) {
        console.error("Failed to fetch hotel contact info", err)
      }
    }

    fetchContact()
  }, [])

  return (
    <footer className="bg-white border-t" translate="no">
      <div>
        <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0 items-center">
            <div className="flex items-center space-x-2">
              <MapPin size={14} className="hidden sm:inline text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{contact.address || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{contact.email || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{contact.phone || "N/A"}</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Facebook size={18} />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Instagram size={18} />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Twitter size={18} />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Linkedin size={18} />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} CitrusIBE. All rights reserved.</p>
        </div>
      </div>
      </div>
    </footer>
  )
}
