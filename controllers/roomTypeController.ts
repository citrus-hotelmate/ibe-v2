

import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { AvailableRoom } from "@/types/roomType";

export const getAvailableRooms = async (
  hotelId: number,
  hotelRoomTypeId: number,
  checkInDate: string,
  checkOutDate: string,
  token: string
): Promise<AvailableRoom[]> => {
  try {
    const response = await axiosInstance.get<AvailableRoom[]>(
      "RoomType/available-rooms",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          hotelId,
          hotelRoomTypeId,
          checkInDate,
          checkOutDate,
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