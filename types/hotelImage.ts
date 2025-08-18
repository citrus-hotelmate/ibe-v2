export interface HotelImage {
    imageID: number;
    hotelID: number;
    imageFileName: string;
    description: string;
    isMain: boolean;
    finAct: boolean;
    createdOn: string | Date;
    createdBy: string;
    updatedOn: string | Date;
    updatedBy: string;
    base64Image: string;
}