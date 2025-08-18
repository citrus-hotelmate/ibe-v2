import { HotelImage as HotelImageType } from "@/types/hotelImage";
import { axiosInstance, HotelImage } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const getHotelImagesByHotelId = async ({ 
  token, 
  hotelId 
}: { 
  token: string;
  hotelId: number;
}) => {
  try {
    const response = await axiosInstance.get<HotelImageType[]>(
      `${HotelImage}/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};