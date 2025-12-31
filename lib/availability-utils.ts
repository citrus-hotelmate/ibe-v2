/**
 * Calculate the minimum available rooms across a date range
 * @param availability - Array of availability objects with date and count
 * @returns The minimum count across all dates, or 0 if no availability data
 */
export const calculateMinimumAvailability = (
  availability: Array<{ date: string; count: number }>
): number => {
  if (!availability || availability.length === 0) return 0;
  return Math.min(...availability.map((item) => item.count));
};
