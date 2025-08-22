import { Hotel } from "@/types/ibe";
import { Ibe , axiosInstance} from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const getAllHotels = async ({ 
  token, 
  hotelName, 
  city 
}: { 
  token: string; 
  hotelName?: string; 
  city?: string; 
}) => {
  try {
    const params: Record<string, string> = {};
    if (hotelName) params.hotelName = hotelName;
    if (city) params.city = city;

    const response = await axiosInstance.get<Hotel[]>(
      `${Ibe}/hotels`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: Object.keys(params).length > 0 ? params : undefined
      }
    );

    if (response.status !== 200)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
