// Local-time helpers. `toISOString()` is UTC and shows the wrong month/day
// near midnight for anyone not on UTC.
const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM in local time */
export const currentMonth = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** YYYY-MM-DD in local time */
export const today = (d: Date = new Date()) => `${currentMonth(d)}-${pad(d.getDate())}`;
