import { MealPlan } from "@/types/mealPlan";
import { axiosInstance, MealPlan as MealPlanEndpoint } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const getMealPlans = async (token: string): Promise<MealPlan[]> => {
  try {
    const response = await axiosInstance.get<MealPlan[]>(
      `/${MealPlanEndpoint}`,
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
