export function matchPromoCode(data: any[], promoCode: string, bookingDetails: any) {
  const today = new Date();
  return data.find((p) => {
    const start = new Date(p.DateFrom);
    const end = new Date(p.DateTo);
    const matchCode = p.PromoCode.toLowerCase() === promoCode.toLowerCase();
    const active = p.isActive && today >= start && today <= end;

    if (!matchCode || !active) return false;

    if (p.PromoType === "PERCENTAGE" && p.EBDayCount) {
      const daysBefore = bookingDetails.checkIn
        ? Math.ceil((bookingDetails.checkIn.getTime() - today.getTime()) / (1000 * 3600 * 24))
        : 0;
      return daysBefore >= p.EBDayCount;
    }

    if (p.PromoType === "FREE NIGHTS" && p.Value && bookingDetails.nights) {
      return bookingDetails.nights >= p.Value;
    }

    return true;
  });
}