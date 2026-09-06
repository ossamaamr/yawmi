// ══════════════════════════════════════════════════════════
// lib/recurrence.js — محرك التكرار (يومي، أسبوعي، شهري، سنوي، أيام محددة)
// دوال صرفة، مفصولة تمامًا عن التقدم (Progression).
// ══════════════════════════════════════════════════════════
import { startOfDay, endOfDay, daysBetween } from './utils';

export const RECURRENCE_TYPES = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  yearly: 'سنوي',
  specific_days: 'أيام محددة',
  interval_days: 'كل بضعة أيام',
};

export function normalizeRule(rule) {
  const normalized = { ...rule };

  normalized.interval = Math.max(1, Math.floor(normalized.interval ?? 1));

  if (normalized.daysOfWeek === undefined || normalized.daysOfWeek === null) {
    normalized.daysOfWeek = [];
  }
  if (normalized.dayOfMonth === undefined || normalized.dayOfMonth === null) {
    normalized.dayOfMonth = null;
  }
  if (normalized.monthOfYear === undefined || normalized.monthOfYear === null) {
    normalized.monthOfYear = null;
  }
  if (normalized.endDate === undefined) normalized.endDate = null;
  if (normalized.maxOccurrences === undefined) normalized.maxOccurrences = null;

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

function clampedDayOfMonth(year, month, dayOfMonth) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(dayOfMonth, lastDay);
}

function getDayOfWeek(timestamp) {
  return new Date(timestamp).getDay();
}

function getMonthIndex(timestamp) {
  const d = new Date(timestamp);
  return d.getFullYear() * 12 + d.getMonth();
}

export function isDueOnDate(rule, date) {
  const normalized = normalizeRule(rule);
  const dateStart = startOfDay(date);
  const startDate = startOfDay(normalized.startDate);

  if (dateStart < startDate) return false;
  if (normalized.endDate !== null && dateStart > normalized.endDate) return false;

  const daysSinceStart = daysBetween(startDate, dateStart);

  if (normalized.maxOccurrences !== null) {
    const occurrenceIndex = Math.floor(daysSinceStart / Math.max(normalized.interval, 1));
    if (occurrenceIndex >= normalized.maxOccurrences) return false;
  }

  switch (normalized.type) {
    case 'daily':
      return daysSinceStart % normalized.interval === 0;

    case 'weekly': {
      if (daysSinceStart % normalized.interval !== 0) return false;
      return normalized.daysOfWeek.includes(getDayOfWeek(dateStart));
    }

    case 'monthly': {
      if (normalized.dayOfMonth === null) return false;
      const year = new Date(dateStart).getFullYear();
      const month = new Date(dateStart).getMonth();
      const expectedDay = clampedDayOfMonth(year, month, normalized.dayOfMonth);
      if (new Date(dateStart).getDate() !== expectedDay) return false;
      const monthsSinceStart = getMonthIndex(dateStart) - getMonthIndex(normalized.startDate);
      if (monthsSinceStart < 0) return false;
      return monthsSinceStart % Math.max(normalized.interval, 1) === 0;
    }

    case 'yearly': {
      if (normalized.dayOfMonth === null || normalized.monthOfYear === null) return false;
      const year = new Date(dateStart).getFullYear();
      const expectedDay = clampedDayOfMonth(year, normalized.monthOfYear, normalized.dayOfMonth);
      if (new Date(dateStart).getDate() !== expectedDay) return false;
      if (new Date(dateStart).getMonth() !== normalized.monthOfYear) return false;
      const yearsSinceStart = year - new Date(normalized.startDate).getFullYear();
      if (yearsSinceStart < 0) return false;
      return yearsSinceStart % Math.max(normalized.interval, 1) === 0;
    }

    case 'specific_days':
      return normalized.daysOfWeek.includes(getDayOfWeek(dateStart));

    case 'interval_days':
      return daysSinceStart % normalized.interval === 0;

    default:
      return false;
  }
}

export function getNextOccurrenceDate(rule, from) {
  const normalized = normalizeRule(rule);
  const msPerDay = 86_400_000;
  const fromDate = startOfDay(from);

  if (fromDate < startOfDay(normalized.startDate)) {
    return startOfDay(normalized.startDate);
  }

  const maxSearchDays = 366 * 2;
  for (let i = 1; i <= maxSearchDays; i++) {
    const candidate = fromDate + i * msPerDay;
    if (normalized.endDate !== null && candidate > endOfDay(normalized.endDate)) return -1;
    if (isDueOnDate(normalized, candidate)) return startOfDay(candidate);
  }
  return -1;
}

export function getOccurrencesInRange(rule, start, end) {
  const normalized = normalizeRule(rule);
  const msPerDay = 86_400_000;
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);
  const results = [];

  if (rangeStart > rangeEnd) return results;

  const daysInRange = Math.ceil((rangeEnd - rangeStart) / msPerDay) + 1;
  const maxIterations = Math.min(daysInRange, 366 * 5);

  let current = rangeStart < startOfDay(normalized.startDate) ? startOfDay(normalized.startDate) : rangeStart;
  let safety = 0;

  while (current <= rangeEnd && safety < maxIterations) {
    if (isDueOnDate(normalized, current)) results.push(current);
    current += msPerDay;
    safety++;
  }

  return results;
}

// المهمة المتكررة: هل تستحقّ في هذا اليوم؟
export function taskIsDueOnDate(task, rule, date) {
  if (!task || task.status !== 'active' || !task.isRecurring) return false;
  if (!rule) return false;
  return isDueOnDate(rule, date);
}