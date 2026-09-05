const MS_PER_DAY = 86_400_000;

export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function endOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  return (
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() +
    MS_PER_DAY -
    1
  );
}

export function daysBetween(a: number, b: number): number {
  const aStart = startOfDay(a);
  const bStart = startOfDay(b);
  return Math.round((bStart - aStart) / MS_PER_DAY);
}

export function addDays(timestamp: number, days: number): number {
  return startOfDay(timestamp) + days * MS_PER_DAY;
}

export function isSameDay(a: number, b: number): boolean {
  return daysBetween(a, b) === 0;
}

export function isToday(timestamp: number): boolean {
  return isSameDay(timestamp, Date.now());
}

export function isYesterday(timestamp: number): boolean {
  return daysBetween(timestamp, Date.now()) === -1;
}

export function isTomorrow(timestamp: number): boolean {
  return daysBetween(timestamp, Date.now()) === 1;
}

export function getWeekStart(timestamp: number): number {
  const d = new Date(startOfDay(timestamp));
  const day = d.getDay();
  return addDays(d.getTime(), -day);
}

export function getWeekEnd(timestamp: number): number {
  return addDays(getWeekStart(timestamp), 6);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
