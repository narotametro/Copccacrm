/**
 * Date and time utility functions
 * Provides consistent date formatting and manipulation across the application
 */

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const day = d.getDate();
  const month = months[d.getMonth()];
  const fullMonth = fullMonths[d.getMonth()];
  const year = d.getFullYear();

  switch (format) {
    case 'short':
      return `${month} ${day}`;
    case 'long':
      return `${fullMonth} ${day}, ${year}`;
    case 'medium':
    default:
      return `${month} ${day}, ${year}`;
  }
}

/**
 * Formats a time to 12-hour format
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Time';
  }

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Formats a date with time
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date, 'medium')} at ${formatTime(date)}`;
}

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (Math.abs(diffSec) < 60) {
    return 'just now';
  } else if (Math.abs(diffMin) < 60) {
    return diffMin > 0 ? `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago` : `in ${Math.abs(diffMin)} minute${diffMin !== -1 ? 's' : ''}`;
  } else if (Math.abs(diffHour) < 24) {
    return diffHour > 0 ? `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago` : `in ${Math.abs(diffHour)} hour${diffHour !== -1 ? 's' : ''}`;
  } else if (Math.abs(diffDay) < 7) {
    return diffDay > 0 ? `${diffDay} day${diffDay !== 1 ? 's' : ''} ago` : `in ${Math.abs(diffDay)} day${diffDay !== -1 ? 's' : ''}`;
  } else if (Math.abs(diffWeek) < 4) {
    return diffWeek > 0 ? `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago` : `in ${Math.abs(diffWeek)} week${diffWeek !== -1 ? 's' : ''}`;
  } else if (Math.abs(diffMonth) < 12) {
    return diffMonth > 0 ? `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago` : `in ${Math.abs(diffMonth)} month${diffMonth !== -1 ? 's' : ''}`;
  } else {
    return diffYear > 0 ? `${diffYear} year${diffYear !== 1 ? 's' : ''} ago` : `in ${Math.abs(diffYear)} year${diffYear !== -1 ? 's' : ''}`;
  }
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Checks if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < new Date().getTime();
}

/**
 * Checks if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > new Date().getTime();
}

/**
 * Adds days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Gets the start of day (00:00:00)
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of day (23:59:59)
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Gets the difference between two dates in days
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
