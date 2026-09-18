/**
 * Utility functions for friendly date and timestamp formatting.
 */

/**
 * Formats any date string, ISO timestamp, or relative time text into a
 * user-friendly relative format (e.g., '2 hours ago', 'Just now', '3 days ago').
 */
export function formatRelativeTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return 'Recently';

  const rawStr = typeof dateInput === 'string' ? dateInput.trim() : '';

  // Handle immediate 'just now' cases
  if (rawStr.toLowerCase() === 'just now' || rawStr.toLowerCase() === 'recently') {
    return 'Just now';
  }

  // Handle existing relative shorthand patterns (e.g., '2 hrs ago', '45m ago', '1 hr ago', '3 days ago')
  const shorthandMatch = rawStr.match(
    /^(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months|y|yr|yrs|year|years)\s*(ago)?$/i
  );

  if (shorthandMatch) {
    const count = parseInt(shorthandMatch[1], 10);
    const unit = shorthandMatch[2].toLowerCase();

    if (unit.startsWith('m') && !unit.startsWith('mo')) {
      return `${count} ${count === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (unit.startsWith('h')) {
      return `${count} ${count === 1 ? 'hour' : 'hours'} ago`;
    }
    if (unit.startsWith('d')) {
      return `${count} ${count === 1 ? 'day' : 'days'} ago`;
    }
    if (unit.startsWith('w')) {
      return `${count} ${count === 1 ? 'week' : 'weeks'} ago`;
    }
    if (unit.startsWith('mo')) {
      return `${count} ${count === 1 ? 'month' : 'months'} ago`;
    }
    if (unit.startsWith('y')) {
      return `${count} ${count === 1 ? 'year' : 'years'} ago`;
    }
  }

  // Attempt to parse standard date strings / ISO timestamps / numeric timestamps
  const parsedDate =
    typeof dateInput === 'object' && dateInput instanceof Date
      ? dateInput
      : typeof dateInput === 'number'
      ? new Date(dateInput)
      : new Date(rawStr);

  if (!isNaN(parsedDate.getTime())) {
    const diffInMs = Date.now() - parsedDate.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);

    // If future or within last 45 seconds
    if (diffInSec < 45) {
      return 'Just now';
    }

    // Minutes: up to 55 minutes
    if (diffInSec < 55 * 60) {
      const minutes = Math.max(1, Math.round(diffInSec / 60));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Hours: up to 23 hours
    if (diffInSec < 23.5 * 3600) {
      const hours = Math.max(1, Math.round(diffInSec / 3600));
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // Days: up to 6.5 days
    if (diffInSec < 6.5 * 86400) {
      const days = Math.max(1, Math.round(diffInSec / 86400));
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    // Weeks: up to 4 weeks
    if (diffInSec < 28 * 86400) {
      const weeks = Math.max(1, Math.round(diffInSec / (7 * 86400)));
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }

    // Months: up to 11 months
    if (diffInSec < 345 * 86400) {
      const months = Math.max(1, Math.round(diffInSec / (30.4 * 86400)));
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }

    // Years
    const years = Math.max(1, Math.round(diffInSec / (365.25 * 86400)));
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }

  // Fallback if parsing wasn't recognized: return the clean string
  return rawStr;
}
