import axios from "axios";

export const Admin = "Admin";
export const HotelRoomFeature = "HotelRoomFeature";


export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});
