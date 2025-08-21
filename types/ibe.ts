

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
  zipCode: string;
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
  lastUpdatedOn: string;
  lastUpdatedTimeStamp: string;
  lastUpdatedBy_UserGUID: string;
  starCatgeory: number;
  cM_PropertyID: string;
  hotelDesc: string;
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: boolean;
  planId: number;
  hotelImage: HotelImage;
  lowestRate: number;
}