import { axiosInstance, HotelRoomType as HotelRoomTypeEndpoint } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { HotelRoomType } from "@/types/hotelRoomType";

export const getHotelRoomTypeById = async ({
  token,
  id,
}: {
  token: string;
  id: number;
}): Promise<HotelRoomType> => {
  try {
    const response = await axiosInstance.get<HotelRoomType>(
      `/${HotelRoomTypeEndpoint}/${id}`,
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
