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

export interface HotelMaster {
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
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: boolean;
  planId: number;
  hotelImage: HotelImage;
  lowestRate: number;
}

export interface RoomFeature {
  roomFeatureID: number;
  featureCategory: string;
  featureName: string;
}

export interface HotelRoomType {
  hotelRoomTypeID: number;
  hotelID: number;
  roomType: string;
  adultSpace: number;
  childSpace: number;
  noOfRooms: number;
}

export interface HotelRoomImage {
  imageID: number;
  hotelID: number;
  hotelRoomTypeID: number;
  imageURL: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  base64Image?: string;
}

export interface HotelRoomFeature {
  hotelRoomFeatureID: number;
  hotelID: number;
  hotelMaster: HotelMaster;
  roomFeatureID: number;
  roomFeature: RoomFeature;
  hotelRoomTypeID: number;
  hotelRoomType: HotelRoomType;
  isTrue: boolean;
  hotelRoomTypeImage: HotelRoomImage[];
  
}