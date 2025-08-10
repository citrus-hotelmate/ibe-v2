import { axiosInstance, RoomFeature as RoomFeatureEndpoint } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { RoomFeature } from "@/types/roomFeature";

export const getRoomFeatureById = async (id: number, token: string): Promise<RoomFeature> => {
  try {
    const response = await axiosInstance.get<RoomFeature>(
      `/${RoomFeatureEndpoint}/id/${id}`,
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