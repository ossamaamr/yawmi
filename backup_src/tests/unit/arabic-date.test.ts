import { formatArabicDate, convertToArabicNumerals, getArabicDayName, getArabicMonthName } from '../../src/utils/arabic-date';

describe('Arabic Date Utils', () => {
  test('convertToArabicNumerals converts digits', () => {
    expect(convertToArabicNumerals(0)).toBe('٠');
    expect(convertToArabicNumerals(123)).toBe('١٢٣');
    expect(convertToArabicNumerals(9999)).toBe('٩٩٩٩');
  });

  test('getArabicDayName returns Arabic day', () => {
    expect(getArabicDayName(0)).toBe('الأحد');
    expect(getArabicDayName(1)).toBe('الإثنين');
    expect(getArabicDayName(6)).toBe('السبت');
  });

  test('getArabicMonthName returns Arabic month', () => {
    expect(getArabicMonthName(0)).toBe('يناير');
    expect(getArabicMonthName(11)).toBe('ديسمبر');
  });

  test('formatArabicDate formats timestamp', () => {
    const ts = new Date(2026, 0, 1).getTime();
    const result = formatArabicDate(ts);
    expect(result).toContain('يناير');
  });
});
