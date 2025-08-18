// types/hotelRoomTypeImage.ts

export interface HotelRoomTypeImage {
  imageID: number;
  hotelID: number;
  hotelRoomTypeID: number;
  imageURL: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;   // ISO datetime string from API
  createdBy: string;
  updatedOn: string;   // ISO datetime string from API
  updatedBy: string;
  base64Image: string;
  imageFileName: string;
}

export type HotelRoomTypeImageList = HotelRoomTypeImage[];