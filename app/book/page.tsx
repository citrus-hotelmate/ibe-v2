// @ts-nocheck
"use client";

import { Suspense } from "react";
import type React from "react";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { useEffect, useState, useReducer } from "react";
import { fetchCountries } from "@/lib/utils"; // Adjust path as needed
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { RoomBooking, useBooking } from "@/components/booking-context";

function SearchParamLoader({
  onLoaded,
}: {
  onLoaded: (params: URLSearchParams) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onLoaded(searchParams);
  }, [searchParams]);
  return null;
}

function RoomTypeLoader({
  onLoaded,
}: {
  onLoaded: (roomTypeNames: string[]) => void;
}) {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    if (params) {
      const roomTypeNames = params.get("roomTypes")?.split(",") || [];
      onLoaded(roomTypeNames);
    }
  }, [params]);

  return (
    <Suspense fallback={null}>
      <SearchParamLoader onLoaded={setParams} />
    </Suspense>
  );
}

// Define RoomType interface (update fields as needed to match your data)
interface RoomType {
  id: string;
  roomName: string;
  bedType: string;
  price: number;
  availability: number;
  // Add other fields as needed
}

// Define Country type if not imported
type Country = {
  code: string;
  name: string;
  dialCode: string;
};

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PhoneInput } from "@/components/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/header";
import { useCurrency } from "@/components/currency-context";
import { CurrencySelector } from "@/components/currency-selector";
import HotelNetworkScript from "@/components/hotelNetworkScript";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  specialRequests?: string;
  terms?: string;
}

// Make sure BookingDetails includes specialRequests
// If BookingDetails is imported from elsewhere, update it there instead:
// Extend BookingDetails to support promoCode and promoDetails
interface BookingDetails {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
  selectedRooms: any[];
  specialRequests?: string;
  promoCode?: string;
  promoDetails?: any;
  selectedPackages?: any[];
  address?: string;
  city?: string;
}

// Put this near your other utility functions:
function expandSelectedRooms(selectedRooms: RoomBooking[]): RoomBooking[] {
  const expanded: RoomBooking[] = [];
  for (const room of selectedRooms) {
    for (let i = 0; i < room.quantity; i++) {
      expanded.push({
        ...room,
        quantity: 1,
      });
    }
  }
  return expanded;
}

export default function BookPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lang = localStorage.getItem("selectedLanguage") || "en";
      const expectedHash = `#googtrans(en|${lang})`;
      if (!window.location.hash.includes("googtrans")) {
        window.location.hash = expectedHash;
      }
    }
  }, []);
  const [showPersonalForm, setShowPersonalForm] = useState(true);
  const router = useRouter();
  const [roomTypeNames, setRoomTypeNames] = useState<string[]>([]);

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  // Packages state
  const [packages, setPackages] = useState<any[]>([]);

  const [hotelData, setHotelData] = useState<any>({ images: [] });

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/API_IBE/GetHotelDetail.aspx`);
        const data = await res.json();
        setHotelData(data);
      } catch (error) {
        console.error("Failed to fetch hotel details", error);
      }
    };

    fetchHotelDetails();
  }, []);

  // Package selection reducer for quantity management
  type PackageSelection = Record<number, { pkg: any; quantity: number }>;
  function selectedPackagesReducer(
    state: PackageSelection,
    action: { type: string; pkg: any }
  ) {
    switch (action.type) {
      case "add":
        return {
          ...state,
          [action.pkg.PackageID]: {
            pkg: action.pkg,
            quantity: state[action.pkg.PackageID]?.quantity + 1 || 1,
          },
        };
      case "remove":
        const updated = { ...state };
        if (updated[action.pkg.PackageID]) {
          if (updated[action.pkg.PackageID].quantity > 1) {
            updated[action.pkg.PackageID].quantity -= 1;
          } else {
            delete updated[action.pkg.PackageID];
          }
        }
        return updated;
      default:
        return state;
    }
  }
  // Use the reducer for selected packages
  const [selectedPackagesState, dispatchPackage] = useReducer(
    selectedPackagesReducer,
    {}
  );

  // Restore reservation summary from localStorage if available
  const {
    bookingDetails,
    updateBookingDetails,
    updateRoom,
    incrementRoomQuantity,
    decrementRoomQuantity,
  } = useBooking();
  useEffect(() => {
    const saved = localStorage.getItem("reservationSummary");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.checkIn) parsed.checkIn = new Date(parsed.checkIn);
      if (parsed.checkOut) parsed.checkOut = new Date(parsed.checkOut);
      // Ensure address and city are retained if present
      parsed.address = parsed.address ?? "";
      parsed.city = parsed.city ?? "";
      updateBookingDetails(parsed);
      // Restore promo details if available
      const storedPromoDetails = localStorage.getItem("parsedPromoDetails");
      if (storedPromoDetails) {
        try {
          const parsedPromo = JSON.parse(storedPromoDetails);
          parsed.promoCode = parsedPromo.PromoCode;
          parsed.promoDetails = parsedPromo;
          updateBookingDetails(parsed);
        } catch (e) {
          console.error("Failed to parse stored promo details", e);
        }
      }
    }
    // eslint-disable-next-line
  }, []);

  const { convertPrice, formatPrice, currency } = useCurrency();

  // Fetch packages whenever currency changes
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/API_IBE/GetPackages.aspx?currency=${currency}`
        );
        const data = await res.json();
        setPackages(data);
      } catch (error) {
        console.error("Failed to fetch packages", error);
      }
    };

    fetchPackages();
  }, [currency]);

  // Hide personal form after packages are fetched
  useEffect(() => {
    if (packages.length > 0) {
      setShowPersonalForm(false);
    }
  }, [packages]);
  const [isMounted, setIsMounted] = useState(false);

  // Countries state and fetch
  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    const getAllCountries = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/API_IBE/getcountry.aspx`);
        const raw = await response.text();

        const fixed = `[${raw.replace(/}\s*{/g, "},{")}]`;

        const data = JSON.parse(fixed);
        // Deduplicate countries by CountryCode
        const seenCodes = new Set();
        const formattedCountries = data
          .filter((c: any) => {
            if (seenCodes.has(c.CountryCode)) return false;
            seenCodes.add(c.CountryCode);
            return true;
          })
          .map((c: any) => ({
            code: c.CountryCode,
            name: c.CountryName.trim(),
            dialCode: c.IDDCode,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(formattedCountries);
      } catch (err) {
        console.error("Failed to fetch countries", err);
        setCountries([]);
      }
    };

    getAllCountries();
  }, []);

  // Hotel policies state and fetch
  const [hotelPolicies, setHotelPolicies] = useState<{
    CancellationPolicy?: string;
    ChildPolicy?: string;
    Taxation?: string;
    Phone?: string;
    WhatsAppNo?: string;
  }>({});

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/API_IBE/GetHotelDetail.aspx?`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch hotel policies");
        }

        const data = await response.json();
        setHotelPolicies({
          CancellationPolicy: data.CancellationPolicy,
          ChildPolicy: data.ChildPolicy,
          Taxation: data.Taxation,
          Phone: data.Phone,
          WhatsAppNo: data.WhatsAppNo,
        });
      } catch (error) {
        console.error("Error fetching hotel policies:", error);
      }
    };

    fetchPolicies();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Basic validation for phone number (at least 5 digits after country code)
    return /\+\d+\s\d{5,}/.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors: FormErrors = {};

    if (!bookingDetails.name || bookingDetails.name.trim().length < 3) {
      errors.name = "Please enter your full name (at least 3 characters)";
    }

    if (!bookingDetails.email || !validateEmail(bookingDetails.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!bookingDetails.phone || !validatePhone(bookingDetails.phone)) {
      errors.phone = "Please enter a valid phone number with country code";
    }

    if (!checkedTerms) {
      errors.terms = "You must agree to the terms and conditions";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    updateBookingDetails({ specialRequests: specialRequests });

    // Normalize phone number by removing spaces between country code and number
    const cleanedPhone = bookingDetails.phone.replace(/\s+/g, "");
    // Resolve selected country name from countries array
    const selectedCountry = bookingDetails.nationality;
    // Store reservation summary in localStorage before proceeding to payment

    const normalizedRooms = expandSelectedRooms(bookingDetails.selectedRooms);

    const reservationSummary = {
      ...bookingDetails,
      phone: cleanedPhone,
      specialRequests,
      selectedRooms: normalizedRooms,
      promoCode: bookingDetails.promoCode,
      selectedPackages: bookingDetails.selectedPackages,
      address: bookingDetails.address,
      city: bookingDetails.city,
      country: selectedCountry,
    };

    console.log("Reservation Summary:", reservationSummary);

    localStorage.setItem(
      "reservationSummary",
      JSON.stringify(reservationSummary)
    );

    // Also update bookingDetails in localStorage to include country
    const bookingDetailsWithCountry = {
      ...bookingDetails,
      phone: cleanedPhone,
      specialRequests,
      address: bookingDetails.address,
      city: bookingDetails.city,
      country: selectedCountry,
    };
    localStorage.setItem(
      "bookingDetails",
      JSON.stringify(bookingDetailsWithCountry)
    );

    // Clear errors and proceed
    setFormErrors({});
    router.push("/payment");
  };

  // Calculate meal plan costs for each room
  interface RoomBooking {
    roomId: string;
    roomName: string;
    price: number;
    quantity: number;
    adults: number;
    children: number;
    mealPlanId?: string;
  }

  interface MealPlan {
    id: string;
    name: string;
    priceAdult: number;
    priceChild: number;
    minChildren?: number;
  }

  // Calculate totals
  const baseTotal = bookingDetails.selectedRooms.reduce((total, room) => {
    return total + room.price * room.quantity;
  }, 0);
  // Use selectedPackages from reducer
  const selectedPackages = Object.values(selectedPackagesState).map((item) => ({
    ...item.pkg,
    quantity: item.quantity,
  }));
  const packagesTotal =
    selectedPackages.reduce((total, pkg) => {
      return total + pkg.Price * (pkg.quantity || 1);
    }, 0) || 0;
  // Example promo: calculate promo discount based on promoDetails if present
  const promoDiscount = (() => {
    const promo = bookingDetails.promoDetails;
    if (!promo) return 0;

    if (promo.PromoType === "PERCENTAGE") {
      return (promo.Value / 100) * baseTotal;
    }

    if (
      promo.PromoType === "FREE NIGHTS" &&
      promo.Value &&
      promo.FreeNights &&
      bookingDetails.nights >= promo.Value &&
      bookingDetails.nights > 0
    ) {
      const perNightPrice = baseTotal / bookingDetails.nights;
      return perNightPrice * promo.FreeNights;
    }

    return 0;
  })();
  const finalTotal = baseTotal + packagesTotal - promoDiscount;

  // Update localStorage reservationSummary with the correct total price after calculation
  useEffect(() => {
    if (isMounted) {
      const saved = localStorage.getItem("reservationSummary");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.total = finalTotal;
        localStorage.setItem("reservationSummary", JSON.stringify(parsed));
      }
    }
  }, [isMounted, finalTotal]);

  // Sync selectedPackagesState with bookingDetails and localStorage
  useEffect(() => {
    const updated = Object.values(selectedPackagesState).map((item) => ({
      ...item.pkg,
      quantity: item.quantity,
    }));
    updateBookingDetails({ selectedPackages: updated });
    const reservationSummary = JSON.parse(
      localStorage.getItem("reservationSummary") || "{}"
    );
    reservationSummary.selectedPackages = updated;
    localStorage.setItem(
      "reservationSummary",
      JSON.stringify(reservationSummary)
    );
  }, [selectedPackagesState]);

  // Check if same-day booking is available
  const isSameDay =
    new Date().toDateString() ===
    (bookingDetails.checkIn?.toDateString() || "");

  return (
    <>
      <Header />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <HotelNetworkScript
          propertyId={hotelData?.HotelNetworkID || "1039100"}
        />
        <div className="flex justify-end items-center mb-4">
          {/* <div>
            <h1 className="text-3xl font-bold">Complete Your Booking</h1>
            <p className="text-sm text-muted-foreground">
              Please fill in your details to proceed with your reservation
            </p>
          </div> */}
          <CurrencySelector />
        </div>

        <Suspense fallback={null}>
          <RoomTypeLoader onLoaded={setRoomTypeNames} />
        </Suspense>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!showPersonalForm && packages.length > 0 && (
                <>
                  <Card className="mb-6 shadow-md border border-border">
                    <CardHeader>
                      <CardTitle>Enhance Your Stay</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <p className="text-muted-foreground">
                        Add packages to your reservation before proceeding.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {packages.map((pkg) => {
                          const quantity =
                            selectedPackagesState[pkg.PackageID]?.quantity || 0;
                          return (
                            <div
                              key={pkg.PackageID}
                              className="flex border rounded-lg p-4 bg-background hover:shadow-md transition-all gap-4"
                            >
                              <img
                                src={pkg.ImageURL}
                                alt={pkg.Description}
                                className="w-32 h-28 object-cover rounded"
                              />
                              <div className="flex flex-col justify-between flex-1">
                                <div>
                                  <h3 className="font-semibold text-lg text-foreground">
                                    {pkg.PackageName}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {pkg.Description}
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="font-medium">
                                    {formatPrice(convertPrice(pkg.Price))}
                                  </div>
                                  {quantity === 0 ? (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        dispatchPackage({ type: "add", pkg })
                                      }
                                      className="btn-dynamic"
                                    >
                                      Add to Booking
                                    </Button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          dispatchPackage({
                                            type: "remove",
                                            pkg,
                                          })
                                        }
                                      >
                                        -
                                      </Button>
                                      <span>{quantity}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          dispatchPackage({ type: "add", pkg })
                                        }
                                      >
                                        +
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full bg-black text-white hover:bg-black/90 btn-dynamic"
                    onClick={() => setShowPersonalForm(true)}
                  >
                    Proceed to Next Step
                  </Button>
                </>
              )}

              {/* Personal Form and Policies & Terms */}
              {showPersonalForm ? (
                <>
                  {/* Personal Information and Policies & Terms */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={bookingDetails.name}
                          onChange={(e) =>
                            updateBookingDetails({ name: e.target.value })
                          }
                          className={formErrors.name ? "border-red-500" : ""}
                          required
                        />
                        {formErrors.name && (
                          <p className="text-xs text-red-500">
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingDetails.email}
                          onChange={(e) =>
                            updateBookingDetails({ email: e.target.value })
                          }
                          className={formErrors.email ? "border-red-500" : ""}
                          required
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-500">
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="nationality">Country</Label>
                          <Select
                            value={bookingDetails.nationality}
                            onValueChange={(value) => {
                              const selectedCountryDetails = countries.find(
                                (c) => c.code === value
                              );
                              const countryName =
                                selectedCountryDetails?.name || "";
                              updateBookingDetails({ nationality: value });

                              const updatedSummary = {
                                ...bookingDetails,
                                nationality: value,
                                country: countryName,
                                address: bookingDetails.address,
                                city: bookingDetails.city,
                              };
                              localStorage.setItem(
                                "reservationSummary",
                                JSON.stringify(updatedSummary)
                              );

                              const updatedDetails = {
                                ...bookingDetails,
                                nationality: value,
                                country: countryName,
                                address: bookingDetails.address,
                                city: bookingDetails.city,
                              };
                              localStorage.setItem(
                                "bookingDetails",
                                JSON.stringify(updatedDetails)
                              );

                              // Store the full country object as JSON
                              if (selectedCountryDetails) {
                                localStorage.setItem(
                                  "selectedCountry",
                                  JSON.stringify({
                                    CountryName: selectedCountryDetails.name,
                                    CountryCode: selectedCountryDetails.code,
                                    IDDCode: selectedCountryDetails.dialCode,
                                  })
                                );
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {countries.map(
                                (country: Country, index: number) => (
                                  <SelectItem
                                    key={`${country.code}-${index}`}
                                    value={country.code}
                                  >
                                    {country.name}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={bookingDetails.city}
                            onChange={(e) =>
                              updateBookingDetails({ city: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={bookingDetails.address}
                          onChange={(e) =>
                            updateBookingDetails({ address: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <PhoneInput
                          id="phone"
                          value={bookingDetails.phone}
                          onChange={(value) =>
                            updateBookingDetails({ phone: value })
                          }
                          dialCode={
                            countries
                              .find(
                                (c) => c.code === bookingDetails.nationality
                              )
                              ?.dialCode?.replace(/\s/g, "") || ""
                          }
                          error={formErrors.phone}
                          required
                        />
                        {formErrors.phone && (
                          <p className="text-xs text-red-500">
                            {formErrors.phone}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="specialRequests">
                          Special Requests (optional)
                        </Label>
                        <Textarea
                          id="specialRequests"
                          placeholder="Any special requests or preferences?"
                          rows={3}
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  {/* Form Errors Alert */}
                  {Object.keys(formErrors).length > 0 && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        <p>Please correct the following errors:</p>
                        <ul className="list-disc pl-5 mt-2">
                          {Object.entries(formErrors).map(([key, error]) => (
                            <li key={key}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  <Card>
                    <CardHeader>
                      <CardTitle>Policies & Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="cancellation">
                          <AccordionTrigger>
                            Cancellation Policy
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm whitespace-pre-line">
                              {hotelPolicies.CancellationPolicy ||
                                "Cancellation policy information will be available soon."}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="children">
                          <AccordionTrigger>Child Policy</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm whitespace-pre-line">
                              {hotelPolicies.ChildPolicy ||
                                "Child policy details will be available soon."}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="taxation">
                          <AccordionTrigger>Taxation Policy</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm whitespace-pre-line">
                              {hotelPolicies.Taxation ||
                                "Taxation details will be available soon."}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <div className="pt-4 border-t">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="terms"
                            checked={checkedTerms}
                            onCheckedChange={(checked) =>
                              setCheckedTerms(checked === true)
                            }
                            className={formErrors.terms ? "border-red-500" : ""}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor="terms"
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                formErrors.terms ? "text-red-500" : ""
                              }`}
                            >
                              I agree to the terms and conditions
                            </label>
                            <p className="text-sm text-muted-foreground">
                              By checking this box, I confirm that I have read
                              and agree to the booking policies, cancellation
                              policy, and hotel rules.
                            </p>
                            {formErrors.terms && (
                              <p className="text-xs text-red-500">
                                {formErrors.terms}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-black text-white hover:bg-black/90 btn-dynamic"
                        disabled={!checkedTerms}
                      >
                        Proceed to Payment
                      </Button>
                    </CardFooter>
                  </Card>
                </>
              ) : null}
            </form>
          </div>

          <div>
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {bookingDetails.selectedRooms.map((roomBooking) => (
                    <div
                      key={roomBooking.roomId}
                      className="mb-4 p-3 bg-muted rounded-md"
                    >
                      <div className="flex justify-between flex-row items-center font-bold">
                        <h3 className="font-medium">{roomBooking.roomName}</h3>
                        <div className="text-sm mt-1 text-muted-foreground">
                          {formatPrice(convertPrice(roomBooking.price))} /per
                          period
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {roomBooking.quantity}{" "}
                        {roomBooking.quantity === 1 ? "room" : "rooms"} •{" "}
                        {bookingDetails.nights}{" "}
                        {bookingDetails.nights === 1 ? "night" : "nights"} •
                        {roomBooking.adults}{" "}
                        {roomBooking.adults === 1 ? "adult" : "adults"}
                        {roomBooking.children > 0 &&
                          `, ${roomBooking.children} ${
                            roomBooking.children === 1 ? "child" : "children"
                          }`}
                      </p>
                      <div className="text-sm mt-1 text-muted-foreground">
                        {roomBooking.mealPlanId && (
                          <div className="text-xs mt-1">
                            Meal Plan: {roomBooking.mealPlanId}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="space-y-4">
                    {/* Check-in Date */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-muted-foreground">
                        Check-in Date
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {bookingDetails.checkIn
                          ? format(bookingDetails.checkIn, "MMM d, yyyy")
                          : "Not selected"}
                      </span>
                    </div>
                    {/* Check-out Date */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-muted-foreground">
                        Check-out Date
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {bookingDetails.checkOut
                          ? format(bookingDetails.checkOut, "MMM d, yyyy")
                          : "Not selected"}
                      </span>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      {/* Room charges */}
                      <div className="text-sm font-semibold text-foreground mt-4 mb-2">
                        Room charges
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Subtotal
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {isMounted
                            ? formatPrice(convertPrice(baseTotal))
                            : `$${baseTotal.toFixed(2)}`}
                        </span>
                      </div>
                      {/* Packages */}
                      {selectedPackages.length > 0 && (
                        <>
                          <div className="text-sm font-semibold text-foreground mt-4 mb-2">
                            Packages
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1 mb-1">
                            {selectedPackages.map((pkg, idx) => (
                              <li
                                key={idx}
                                className="flex justify-between items-center"
                              >
                                <span className="flex flex-col">
                                  <span>{pkg.PackageName}</span>
                                  {pkg.quantity > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                      (x{pkg.quantity})
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {formatPrice(
                                      convertPrice(
                                        pkg.Price * (pkg.quantity || 1)
                                      )
                                    )}
                                  </span>
                                  <button
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() =>
                                      dispatchPackage({ type: "remove", pkg })
                                    }
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between mt-2 pt-2 border-t">
                            <span className="text-sm font-semibold text-foreground">
                              Total Package Cost
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {formatPrice(convertPrice(packagesTotal))}
                            </span>
                          </div>
                        </>
                      )}
                      {/* Promo */}
                      {bookingDetails.promoCode && (
                        <div className="text-sm font-semibold text-foreground mt-4 mb-2">
                          Promo
                        </div>
                      )}
                      {bookingDetails.promoCode && (
                        <div className="flex justify-between mb-2 text-green-600">
                          <span className="text-sm font-medium">
                            Promo ({bookingDetails.promoCode})
                          </span>
                          <span className="text-sm font-medium">
                            -{formatPrice(convertPrice(promoDiscount))}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 font-bold text-lg text-foreground">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>
                          {isMounted
                            ? formatPrice(convertPrice(finalTotal))
                            : `$${finalTotal.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  You won't be charged until the next step
                </CardFooter>
              </Card>

              {isSameDay && (
                <Card>
                  <CardHeader>
                    <CardTitle>Same Day Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Alert className="bg-green-50 border-green-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>Rooms Available Today!</AlertTitle>
                        <AlertDescription className="text-xs">
                          Your booking is for check-in today. We have confirmed
                          availability for your selected rooms.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our customer support team is available 24/7 to assist you
                    with your booking.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={
                        hotelPolicies.WhatsAppNo
                          ? `https://wa.me/${hotelPolicies.WhatsAppNo}`
                          : "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!hotelPolicies.WhatsAppNo}
                      >
                        WhatsApp
                      </Button>
                    </a>
                    <a href={`tel:${hotelPolicies.Phone?.replace(/\s/g, "")}`}>
                      <Button variant="outline" className="w-full">
                        Call Us
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
