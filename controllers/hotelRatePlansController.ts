import { HotelRatePlansResponse } from "@/types/hotelRatePlans";
import { HotelRatePlans, axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

interface GetHotelRatePlansParams {
  token: string;
  hotelId: number;
  isCmActive?: boolean;
}

export const getHotelRatePlans = async ({
  token,
  hotelId,
  isCmActive = false,
}: GetHotelRatePlansParams) => {
  try {
    const response = await axiosInstance.get<HotelRatePlansResponse>(
      `${HotelRatePlans}/hotel/${hotelId}`,
      {
        params: { isCmActive },
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
