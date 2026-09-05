import { RecurrenceRule } from './recurrence.types';

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function endOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function daysBetween(a: number, b: number): number {
  const msPerDay = 86400000;
  const dayA = Math.floor(startOfDay(a) / msPerDay);
  const dayB = Math.floor(startOfDay(b) / msPerDay);
  return Math.abs(dayB - dayA);
}

function getDayOfWeek(timestamp: number): number {
  return new Date(timestamp).getDay();
}

function getDayOfMonth(timestamp: number): number {
  return new Date(timestamp).getDate();
}

function getMonth(timestamp: number): number {
  return new Date(timestamp).getMonth();
}

function monthIndex(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getFullYear() * 12 + d.getMonth();
}

function clampedDayOfMonth(year: number, month: number, dayOfMonth: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(dayOfMonth, lastDay);
}

function isBeforeDate(a: number, b: number): boolean {
  return startOfDay(a) < startOfDay(b);
}

function isAfterDate(a: number, b: number): boolean {
  return startOfDay(a) > startOfDay(b);
}

export function isDueOnDate(rule: RecurrenceRule, date: number): boolean {
  const dateStart = startOfDay(date);

  if (isBeforeDate(dateStart, rule.startDate)) return false;
  if (rule.endDate !== null && isAfterDate(dateStart, rule.endDate)) return false;

  const daysSinceStart = daysBetween(rule.startDate, dateStart);
  if (rule.maxOccurrences !== null) {
    const occurrenceIndex = Math.floor(daysSinceStart / Math.max(rule.interval, 1));
    if (occurrenceIndex >= rule.maxOccurrences) return false;
  }

  switch (rule.type) {
    case 'daily':
      return daysSinceStart % rule.interval === 0;

    case 'weekly': {
      if (daysSinceStart % rule.interval !== 0) return false;
      return rule.daysOfWeek.includes(getDayOfWeek(dateStart));
    }

    case 'monthly': {
      if (rule.dayOfMonth === null) return false;
      const year = new Date(dateStart).getFullYear();
      const month = getMonth(dateStart);
      const expectedDay = clampedDayOfMonth(year, month, rule.dayOfMonth);
      if (getDayOfMonth(dateStart) !== expectedDay) return false;
      const monthsSinceStart = monthIndex(dateStart) - monthIndex(rule.startDate);
      if (monthsSinceStart < 0) return false;
      return monthsSinceStart % Math.max(rule.interval, 1) === 0;
    }

    case 'yearly': {
      if (rule.dayOfMonth === null || rule.monthOfYear === null) return false;
      const year = new Date(dateStart).getFullYear();
      const expectedDay = clampedDayOfMonth(year, rule.monthOfYear, rule.dayOfMonth);
      if (getDayOfMonth(dateStart) !== expectedDay) return false;
      if (getMonth(dateStart) !== rule.monthOfYear) return false;
      const yearsSinceStart = year - new Date(rule.startDate).getFullYear();
      if (yearsSinceStart < 0) return false;
      return yearsSinceStart % Math.max(rule.interval, 1) === 0;
    }

    case 'specific_days':
      return rule.daysOfWeek.includes(getDayOfWeek(dateStart));

    case 'interval_days':
      return daysSinceStart % rule.interval === 0;

    default:
      return false;
  }
}

export function getNextOccurrenceDate(rule: RecurrenceRule, from: number): number {
  const msPerDay = 86400000;
  const fromDate = startOfDay(from);

  if (isBeforeDate(fromDate, rule.startDate)) {
    return rule.startDate;
  }

  const maxSearchDays = 366 * 2;

  for (let i = 1; i <= maxSearchDays; i++) {
    const candidate = fromDate + i * msPerDay;

    if (rule.endDate !== null && isAfterDate(candidate, rule.endDate)) {
      return -1;
    }

    if (isDueOnDate(rule, candidate)) {
      return candidate;
    }
  }

  return -1;
}

export function getOccurrencesInRange(
  rule: RecurrenceRule,
  start: number,
  end: number,
): number[] {
  const msPerDay = 86400000;
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);
  const results: number[] = [];

  if (isAfterDate(rangeStart, rangeEnd)) return results;

  const daysInRange = Math.ceil((rangeEnd - rangeStart) / msPerDay) + 1;
  const maxIterations = Math.min(daysInRange, 366 * 5);

  let searchStart = isBeforeDate(rangeStart, rule.startDate)
    ? rule.startDate
    : rangeStart;

  let current = searchStart;
  let safety = 0;

  while (!isAfterDate(current, rangeEnd) && safety < maxIterations) {
    if (isDueOnDate(rule, current)) {
      results.push(current);
    }
    current += msPerDay;
    safety++;
  }

  return results;
}

export function normalizeRecurrence(rule: RecurrenceRule): RecurrenceRule {
  const normalized = { ...rule };

  normalized.interval = Math.max(1, Math.floor(normalized.interval));

  if (normalized.type === 'weekly' || normalized.type === 'specific_days') {
    normalized.daysOfWeek = [
      ...new Set(normalized.daysOfWeek.filter((d) => d >= 0 && d <= 6)),
    ].sort((a, b) => a - b);
  }

  if (normalized.type === 'monthly' || normalized.type === 'yearly') {
    if (normalized.dayOfMonth !== null) {
      normalized.dayOfMonth = Math.max(1, Math.min(31, Math.floor(normalized.dayOfMonth)));
    }
  }

  if (normalized.type === 'yearly' && normalized.monthOfYear !== null) {
    normalized.monthOfYear = Math.max(0, Math.min(11, Math.floor(normalized.monthOfYear)));
  }

  if (normalized.maxOccurrences !== null) {
    normalized.maxOccurrences = Math.max(1, Math.floor(normalized.maxOccurrences));
  }

  if (normalized.endDate !== null && normalized.startDate > normalized.endDate) {
    normalized.endDate = normalized.startDate;
  }

  return normalized;
}
