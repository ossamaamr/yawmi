import { parseQuickAdd } from '../../src/utils/quick-add-parser';
import { startOfDay } from '../../src/utils/date';

describe('Quick Add Parser', () => {
  test('simple title', () => {
    const result = parseQuickAdd('مذاكرة الفيزياء');
    expect(result.title).toBe('مذاكرة الفيزياء');
    expect(result.date).toBeTruthy();
    expect(result.time).toBeNull();
    expect(result.recurrence).toBeNull();
  });

  test('title with time', () => {
    const result = parseQuickAdd('تسليم التقرير ساعه 3 مساء');
    expect(result.title).toContain('تسليم التقرير');
    expect(result.time).toBeTruthy();
  });

  test('title with recurrence', () => {
    const result = parseQuickAdd('مذاكرة فيزياء يوميًا');
    expect(result.title).toContain('مذاكرة فيزياء');
    expect(result.recurrence).toBeTruthy();
    expect(result.recurrence?.type).toBe('daily');
  });

  test('empty input', () => {
    const result = parseQuickAdd('');
    expect(result.title).toBe('');
  });

  test('recurrence only', () => {
    const result = parseQuickAdd('اوزاع');
    expect(result.title).toBe('اوزاع');
  });

  test('tomorrow (غداً)', () => {
    const ref = new Date(2026, 8, 4).getTime();
    const result = parseQuickAdd('مذاكرة رياضيات غداً', ref);
    expect(result.date).toBe(startOfDay(ref + 86400000));
  });

  test('after 3 days (بعد 3)', () => {
    const ref = new Date(2026, 8, 4).getTime();
    const result = parseQuickAdd(' بعد 3 أيام', ref);
    expect(result.date).toBe(startOfDay(ref + 3 * 86400000));
  });

  test('after five days (بعد خمسه)', () => {
    const ref = new Date(2026, 8, 4).getTime();
    const result = parseQuickAdd('بعد خمسه يوم', ref);
    expect(result.date).toBe(startOfDay(ref + 5 * 86400000));
  });

  test('every day (كل يوم)', () => {
    const result = parseQuickAdd('مذاكرة كل يوم');
    expect(result.recurrence).toEqual({ type: 'daily' });
    expect(result.title).toBe('مذاكرة');
  });

  test('every other day (كل يومين)', () => {
    const result = parseQuickAdd('مذاكرة كل يومين');
    expect(result.recurrence).toEqual({ type: 'daily', interval: 2 });
    expect(result.title).toBe('مذاكرة');
  });

  test('every other week (كل اسبوعين)', () => {
    const result = parseQuickAdd('مذاكرة كل اسبوعين');
    expect(result.recurrence).toEqual({ type: 'weekly', interval: 2 });
    expect(result.title).toBe('مذاكرة');
  });

  test('كل اسبوع ين (split form)', () => {
    const result = parseQuickAdd('مذاكرة كل اسبوع ين');
    expect(result.recurrence).toEqual({ type: 'weekly', interval: 2 });
    expect(result.title).toBe('مذاكرة');
  });

  test('daily (يومياً)', () => {
    const result = parseQuickAdd('تمارين يومياً');
    expect(result.recurrence?.type).toBe('daily');
  });

  test('weekly (اسبوعي)', () => {
    const result = parseQuickAdd('قراءة كتاب اسبوعي');
    expect(result.recurrence?.type).toBe('weekly');
  });

  test('yearly (سنوي)', () => {
    const result = parseQuickAdd('عيد ميلاد سنوي');
    expect(result.recurrence?.type).toBe('yearly');
  });

  test('every 2 days (كل 2 يوم)', () => {
    const result = parseQuickAdd('مذاكرة كل 2 يوم');
    expect(result.recurrence?.type).toBe('daily');
  });

  test('every 2 weeks (كل 2 اسبوع)', () => {
    const result = parseQuickAdd('مذاكرة كل 2 اسبوع');
    expect(result.recurrence?.type).toBe('weekly');
  });

  test('time with AM (صباحا)', () => {
    const result = parseQuickAdd('مذاكرة ساعه 7 صباحا');
    expect(result.time).toBe('07:00');
  });

  test('time with PM (مساء)', () => {
    const result = parseQuickAdd('مذاكرة ساعه 3 مساء');
    expect(result.time).toBe('15:00');
  });

  test('day name (الثلاثاء)', () => {
    const ref = new Date(2026, 8, 4).getTime(); // Thursday
    const result = parseQuickAdd('مذاكرة الثلاثاء', ref);
    expect(result.date).toBeTruthy();
    expect(result.title).toContain('مذاكرة');
  });
});
