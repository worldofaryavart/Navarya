import { parseISO, format } from 'date-fns';

export const formatDateToDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    // Handle the backend format "21 January 2025 at 11:44:27 UTC+5:30"
    if (dateStr.includes('at') && dateStr.includes('UTC')) {
      return dateStr; // Already in desired format
    }
    
    // Handle ISO format or other formats
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, "dd MMMM yyyy 'at' HH:mm:ss 'UTC+5:30'");
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

export const parseDateFromDisplay = (displayDate: string): Date => {
  try {
    // Remove UTC offset and parse
    const cleanDate = displayDate.split(' UTC')[0];
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

export const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date) return '';
  try {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};
