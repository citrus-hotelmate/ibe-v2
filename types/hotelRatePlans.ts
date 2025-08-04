

export interface HotelRatePlan {
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string;
  defaultRate: number;
  pax1: number;
  pax2: number;
  pax3: number;
  pax4: number;
  pax5: number;
  pax6: number;
  pax7: number;
  pax8: number;
  pax9: number;
  pax10: number;
  pax11: number;
  pax12: number;
  pax13: number;
  pax14: number;
  pax15: number;
  pax16: number;
  pax17: number;
  pax18: number;
  child: number;
  dateFrom: string;
  dateTo: string;
  sellMode: string;
  rateMode: string;
  roomTypeID: number;
  primaryOccupancy: number;
  increaseBy: number;
  decreaseBy: number;
}

export type HotelRatePlansResponse = HotelRatePlan[];