import axios from 'axios';

export interface Room {
  triplerate: number
  id: string
  name: string
  description: string
  price: number
  capacity: number
  bedType: string
  size: number
  features: string[]
  image: string
  availability: number
  popular: boolean
  defaultMealPlan: string
  availableMealPlans: string[]
  childPolicy?: string
}

export interface Review {
  id: string
  name: string
  avatar: string
  date: string
  rating: number
  comment: string
  roomType: string
  response?: string
}

export interface MealPlan {
  id: string
  name: string
  description: string
  icon: string
  priceAdult: number
  priceChild: number
  minChildren?: number
}

export interface Country {
  code: string
  name: string
}



export const reviews: Review[] = [

]


export const propertyData = {
  
}

export const fetchCountries = async (): Promise<Country[]> => {
  const response = await axios.get('https://restcountries.com/v3.1/all');
  return response.data.map((country: any) => ({
    code: country.cca2,
    name: country.name.common,
  }));
};
