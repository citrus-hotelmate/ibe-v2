import { ReservationResponse } from "@/types/reservation";
import { Reservation, axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const getBookingFeed = async ({ token }: { token: string }) => {
  try {
    const response = await axiosInstance.get<ReservationResponse>(
      `${Reservation}/booking-feed`,
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
