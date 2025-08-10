

import { HotelRoomFeature } from "@/types/hotelRoomFeature";
import { axiosInstance, HotelRoomFeature as HotelRoomFeatureEndpoint } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const getHotelRoomFeaturesByHotelId = async (hotelId: number, token: string): Promise<HotelRoomFeature[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomFeature[]>(
      `/${HotelRoomFeatureEndpoint}/hotel-id/${hotelId}`,
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