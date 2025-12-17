export interface HotelImage {
  imageID: number;
  hotelID: number;
  imageFileName: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  base64Image: string;
  bucketName: string;
}

export interface BookingDetails {
  hotelId: string;
  roomId: string;
  currency: string;
  promoCode?: string;
  promoDetails?: any;
  specialRequests?: string;
  selectedPackages?: Array<{
    id: string;
    name: string;
    Price: number;
  }>;
  selectedRooms: Array<{
    averageRate?: number;
    quantity: number;
  }>;
  bookingId?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalNotes?: string;
  roomCount: number;
  status?: string;
  totalAmount: number;
  bookingRevision?: string;
  paymentMethod?: string;
  nights: number;
}

export interface Hotel {
  hotelID: number;
  hotelGUID: string;
  finAct: boolean;
  hotelName: string;
  hotelCode: number;
  userGUID_HotelOwner: string;
  hotelType: string;
  hotelAddress: string;
  city: string;
  zipCode: string | null;
  country: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelWeb: string;
  noOfRooms: number;
  latitude: string;
  longitude: string;
  currencyCode: string;
  languageCode: string;
  createdOn: string;
  createdTimeStamp: string;
  lastUpdatedOn: string | null;
  lastUpdatedTimeStamp: string | null;
  lastUpdatedBy_UserGUID: string;
  starCatgeory: number;
  cM_PropertyID: string;
  hotelDesc: string;
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: boolean;
  planId: number | null;
  hotelImage: HotelImage;
  lowestRate: number;
  slug: string | null;
  logoURL: string;
  ibE_CancellationPolicy: string;
  ibE_ChildPolicy: string;
  ibE_TaxPolicy: string;
  isIBEActive: boolean;
  ibeHeaderColour: string | null;
  grC_Para1: string | null;
  proforma_Terms: string | null;
  grC_Para3: string | null;

  bankName: string | null;
  bankBranch: string | null;
  accountName: string | null;
  accountNo: string | null;
  swiftCode: string | null;

  deactivatedBy: string | null;
  deactivatedTimeStamp: string | null;

  stripePaymentRef: string | null;
  isPaymentTrue: boolean | null;
  stripeAuthCode: string | null;
  authTimeStamp: string | null;

  cmActivationRequested: boolean | null;
  cmActivationRequestedOn: string | null;
  cmActivationRequestedBy: string | null;

  groupName: string | null;

  // IBE-specific properties
  IBE_AllowPayAtProperty?: boolean;
  IBE_isIPGActive?: boolean;
  IBE_Pay50?: boolean;
  IBE_LogoURL?: string;
  IBEHeaderColour?: string;
  HotelName?: string;
  Address?: string;
  HotelScore?: number;
  StarCat?: number;
  WhatsAppNo?: string;
  HotelNetworkID?: string;
  images?: any[];
}