const ARABIC_DAYS: string[] = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const ARABIC_MONTHS: string[] = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const ARABIC_DIGITS: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

const LATIN_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export function convertToArabicNumerals(num: number): string {
  return String(num).replace(/[0-9]/g, (ch) => ARABIC_DIGITS[ch]!);
}

export function convertFromArabicNumerals(str: string): string {
  return str.replace(/[٠-٩]/g, (ch) => LATIN_DIGITS[ch] ?? ch);
}

export function getArabicDayName(dayIndex: number): string {
  return ARABIC_DAYS[dayIndex % 7]!;
}

export function getArabicMonthName(monthIndex: number): string {
  return ARABIC_MONTHS[monthIndex % 12]!;
}

export function formatArabicDate(timestamp: number): string {
  const d = new Date(timestamp);
  const dayName = ARABIC_DAYS[d.getDay()]!;
  const dayNum = convertToArabicNumerals(d.getDate());
  const monthName = ARABIC_MONTHS[d.getMonth()]!;
  const year = convertToArabicNumerals(d.getFullYear());
  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

export function formatArabicTime(timeString: string): string {
  const time = convertFromArabicNumerals(timeString);
  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return convertToArabicNumerals(parseInt(timeString, 10));

  let hours = parseInt(match[1]!, 10);
  const minutes = match[2]!;
  const isPM = hours >= 12;
  const period = isPM ? "مساءً" : "صباحًا";

  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  const arHours = convertToArabicNumerals(hours);
  const arMinutes = convertToArabicNumerals(parseInt(minutes, 10));
  return `${arHours}:${arMinutes} ${period}`;
}
