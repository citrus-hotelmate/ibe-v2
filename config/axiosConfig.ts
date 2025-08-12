import axios from "axios";

export const Admin = "Admin";
export const Ibe = "Ibe";
export const HotelRoomFeature = "HotelRoomFeature";
export const RoomType = "RoomType";
export const RoomFeature = "RoomFeature";
export const MealPlan = "MealPlan";
export const HotelRatePlans = "HotelRatePlans";
export const HotelRoomTypeImage = "HotelRoomTypeImage";
export const HotelImage = "HotelImage";


export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});
