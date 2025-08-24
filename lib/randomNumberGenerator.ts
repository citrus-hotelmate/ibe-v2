/**
 * Generates an 8-character alphanumeric reference number
 * Format: XXXXXXXX (mix of uppercase letters and numbers)
 * Example: A7B9C2X1
 */
export function generateRefNo(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}
