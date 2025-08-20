export interface ReservationResponse {
  data: Array<{
    attributes: {
      id: string;
      meta: {
        ruid: string;
        is_genius: boolean;
      };
      status: string;
      services: string[];
      currency: string;
      amount: string;
      rate_code_id: number;
      created_by: string;
      remarks_internal: string;
      remarks_guest: string;
      guest_profile_id: number;
      agent: string;
      inserted_at: string;
      channel_id: string;
      property_id: string;
      hotel_id: number;
      unique_id: string;
      system_id: string;
      ota_name: string;
      booking_id: string;
      notes: string;
      arrival_date: string;
      arrival_hour: string;
      customer: {
        meta: {
          ruid: string;
          is_genius: boolean;
        };
        name: string;
        zip: string;
        address: string;
        country: string;
        city: string;
        language: string;
        mail: string;
        phone: string;
        surname: string;
        company: string;
      };
      departure_date: string;
      deposits: string[];
      ota_commission: string;
      ota_reservation_code: string;
      payment_collect: string;
      payment_type: string;
      rooms: Array<{
        is_foc: boolean;
        reservation_status_id: number;
        meta: {
          mapping_id: string;
          parent_rate_plan_id: string;
          rate_plan_code: number;
          room_type_code: string;
          days_breakdown: Array<{
            amount: string;
            date: string;
            promotion: {
              id: string;
              title: string;
            };
            rateCode: number;
            ratePlan: string;
          }>;
          cancel_penalties: Array<{
            amount: string;
            currency: string;
            from: string;
          }>;
          smokingPreferences: string;
          additionalDetails: string[];
          booking_com_room_index: number;
          meal_plan: string;
          policies: string;
          promotion: Array<{
            fromCode: string;
            fromName: string;
            promotionId: string;
            toCode: string;
          }>;
          room_remarks: string[];
        };
        taxes: Array<{
          isInclusive: boolean;
          name: string;
          nights: number;
          persons: number;
          priceMode: string;
          price_per_unit: string;
          total_price: string;
          type: string;
          version: string;
        }>;
        services: string[];
        amount: string;
        days: {
          [key: string]: string;
        };
        guest_profile_id: number;
        ota_commission: string;
        guests: Array<{
          name: string;
          surname: string;
        }>;
        occupancy: {
          children: number;
          adults: number;
          ages: number[];
          infants: number;
        };
        rate_plan_id: string;
        room_type_id: string;
        hotel_room_type_id: number;
        booking_room_id: string;
        checkin_date: string;
        checkout_date: string;
        is_cancelled: boolean;
        ota_unique_id: string;
        disc_percen: number;
        discount: number;
        child_rate: number;
        suppliment: number;
        net_rate: number;
        is_day_room: boolean;
      }>;
      occupancy: {
        children: number;
        adults: number;
        ages: number[];
        infants: number;
      };
      guarantee: {
        token: string;
        cardNumber: string;
        cardType: string;
        cardholderName: string;
        cvv: string;
        expirationDate: string;
        isVirtual: boolean;
      };
      secondary_ota: string;
      acknowledge_status: string;
      raw_message: string;
      is_crs_revision: boolean;
      is_day_room: boolean;
      release_date: string;
      ref_no: string;
      group_name: string;
      tour_no: string;
    };
    id: string;
    type: string;
    relationships: {
      data: {
        property: {
          id: string;
          type: string;
        };
        booking: {
          id: string;
          type: string;
        };
      };
    };
  }>;
  meta: {
    total: number;
    limit: number;
    order_by: string;
    page: number;
    order_direction: string;
  };
  dateTime: string;
}