import { LOCALE } from './constant';

/**
 * Format a date value to a localized string using the app's default locale
 * @param date - The date to format
 * @param options - Optional DateTimeFormatOptions
 * @returns Formatted date string or '-' for null/undefined values
 */
export const formatDate = (
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '-';

  const dateObj = date instanceof Date ? date : new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '-';

  return dateObj.toLocaleDateString(LOCALE, options);
};
