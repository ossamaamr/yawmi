import { isDueOnDate } from '../../src/features/recurrence/domain/recurrence.entity';
import { RecurrenceRule } from '../../src/features/recurrence/domain/recurrence.types';

function makeDate(y: number, m: number, d: number): number {
  return new Date(y, m, d).getTime();
}

function makeRule(overrides: Partial<RecurrenceRule> & Pick<RecurrenceRule, 'type' | 'startDate'>): RecurrenceRule {
  return {
    id: 'test',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endDate: null,
    maxOccurrences: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('Recurrence Entity - isDueOnDate', () => {
  test('daily recurrence - every day', () => {
    const startDate = makeDate(2026, 0, 1);
    const rule = makeRule({ type: 'daily', interval: 1, startDate });
    expect(isDueOnDate(rule, makeDate(2026, 0, 1))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 0, 2))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 0, 15))).toBe(true);
  });

  test('daily recurrence - every 3 days', () => {
    const startDate = makeDate(2026, 0, 1);
    const rule = makeRule({ type: 'daily', interval: 3, startDate });
    expect(isDueOnDate(rule, makeDate(2026, 0, 1))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 0, 2))).toBe(false);
    expect(isDueOnDate(rule, makeDate(2026, 0, 3))).toBe(false);
    expect(isDueOnDate(rule, makeDate(2026, 0, 4))).toBe(true);
  });

  test('specific_days - Sunday and Tuesday', () => {
    const startDate = makeDate(2026, 7, 30);
    const rule = makeRule({ type: 'specific_days', daysOfWeek: [0, 2], startDate });
    expect(isDueOnDate(rule, makeDate(2026, 7, 30))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 7, 31))).toBe(false);
    expect(isDueOnDate(rule, makeDate(2026, 8, 1))).toBe(true);
  });

  test('before start date returns false', () => {
    const startDate = makeDate(2026, 0, 10);
    const rule = makeRule({ type: 'daily', interval: 1, startDate });
    expect(isDueOnDate(rule, makeDate(2026, 0, 5))).toBe(false);
  });

  test('after end date returns false', () => {
    const startDate = makeDate(2026, 0, 1);
    const endDate = makeDate(2026, 0, 5);
    const rule = makeRule({ type: 'daily', interval: 1, startDate, endDate });
    expect(isDueOnDate(rule, makeDate(2026, 0, 1))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 0, 5))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 0, 6))).toBe(false);
  });

  test('interval_days - every 7 days', () => {
    const startDate = makeDate(2026, 0, 1);
    const rule = makeRule({ type: 'interval_days', interval: 7, startDate });
    expect(isDueOnDate(rule, makeDate(2026, 0, 1))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 0, 8))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 0, 5))).toBe(false);
  });

  test('monthly - day 31 clamps to last day of short months', () => {
    const startDate = makeDate(2026, 0, 31);
    const rule = makeRule({ type: 'monthly', interval: 1, dayOfMonth: 31, startDate });
    expect(isDueOnDate(rule, makeDate(2026, 0, 31))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 1, 28))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 1, 27))).toBe(false);
    expect(isDueOnDate(rule, makeDate(2026, 2, 31))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 3, 30))).toBe(true);
  });

  test('monthly - respects interval', () => {
    const startDate = makeDate(2026, 0, 31);
    const rule = makeRule({ type: 'monthly', interval: 2, dayOfMonth: 31, startDate });
    expect(isDueOnDate(rule, makeDate(2026, 0, 31))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 1, 28))).toBe(false);
    expect(isDueOnDate(rule, makeDate(2026, 2, 31))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2026, 3, 30))).toBe(false);
  });

  test('yearly - day 31 clamps in February (leap year 2028)', () => {
    const startDate = makeDate(2026, 0, 31);
    const rule = makeRule({
      type: 'yearly',
      interval: 1,
      dayOfMonth: 31,
      monthOfYear: 1,
      startDate,
    });
    expect(isDueOnDate(rule, makeDate(2026, 1, 28))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2027, 1, 28))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2028, 1, 29))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2028, 1, 28))).toBe(false);
  });

  test('yearly - respects interval', () => {
    const startDate = makeDate(2026, 0, 31);
    const rule = makeRule({
      type: 'yearly',
      interval: 2,
      dayOfMonth: 31,
      monthOfYear: 0,
      startDate,
    });
    expect(isDueOnDate(rule, makeDate(2026, 0, 31))).toBe(true);
    expect(isDueOnDate(rule, makeDate(2027, 0, 31))).toBe(false);
    expect(isDueOnDate(rule, makeDate(2028, 0, 31))).toBe(true);
  });
});
