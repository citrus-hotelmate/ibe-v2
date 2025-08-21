import { ReservationResponse } from "@/types/reservation";
import { Reservation, axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const createBookingFeed = async ({ token, payload }: { token: string; payload: any }) => {
  try {
    const response = await axiosInstance.post<ReservationResponse>(
      `${Reservation}/booking-feed`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 201)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
