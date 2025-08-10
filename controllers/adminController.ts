import { HotelResponse } from "@/types/admin";
import { Admin , axiosInstance} from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const getAllHotels = async ({ token }: { token: string }) => {
  try {
    const response = await axiosInstance.get<HotelResponse[]>(
      `${Admin}/all-hotels`,
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
