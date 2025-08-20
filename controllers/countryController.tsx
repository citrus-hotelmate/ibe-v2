// controllers/countryController.ts
import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { Country } from "@/types/country";

export const getCountries = async (token?: string): Promise<Country[]> => {
    try {
        const response = await axiosInstance.get<Country[]>(
            "Country",
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