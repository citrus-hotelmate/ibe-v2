// controllers/hotelRoomTypeImageController.ts
import { axiosInstance, HotelRoomTypeImage as HotelRoomTypeImageEndpoint } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { HotelRoomTypeImage } from "@/types/hotelRoomTypeImage"; 

export const getHotelRoomTypeImagesByHotelId = async ({
  hotelId,
  token,
}: {
  hotelId: number;
  token: string;
}) => {
  try {
    const response = await axiosInstance.get<HotelRoomTypeImage[]>(
      `${HotelRoomTypeImageEndpoint}/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};