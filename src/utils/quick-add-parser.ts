import { addDays, startOfDay } from "./date";
import { convertFromArabicNumerals } from "./arabic-date";

export interface ParsedTask {
  title: string;
  date: number | null;
  time: string | null;
  recurrence: {
    type: string;
    interval?: number;
    days?: number[];
  } | null;
}

const ARABIC_DAY_NAMES: Record<string, number> = {
  احد: 0,
  اثنين: 1,
  ثلاثاء: 2,
  اربعاء: 3,
  خميس: 4,
  جمعه: 5,
  سبت: 6,
};

const RELATIVE_DAYS: Record<string, number> = {
  اليوم: 0,
  امس: -1,
  بكره: 1,
  غدا: 1,
};

const MULTIPLICATIVE_NUMBERS: Record<string, number> = {
  واحد: 1,
  وحده: 1,
  اثنان: 2,
  اثنتان: 2,
  اثنين: 2,
  ثلاثه: 3,
  ثلاث: 3,
  اربعه: 4,
  خمسه: 5,
  خمس: 5,
  سته: 6,
  ست: 6,
  سبعه: 7,
  ثمانيه: 8,
  تسعه: 9,
  عشره: 10,
};

const RECURRENCE_PATTERNS: Record<string, string> = {
  يومي: "daily",
  يوم: "daily",
  اسبوعي: "weekly",
  اسبوع: "weekly",
  سنوي: "yearly",
};

const ARABIC_DAY_NAMES_INPUT: Record<string, number> = {
  احد: 0,
  "الأحد": 0,
  "الاحد": 0,
  اثنين: 1,
  "الإثنين": 1,
  "الاتنين": 1,
  "الاثنين": 1,
  ثنين: 1,
  ثلاثاء: 2,
  "الثلاثاء": 2,
  اربعاء: 3,
  "الأربعاء": 3,
  "الاربعاء": 3,
  خميس: 4,
  "الخميس": 4,
  جمعه: 5,
  "الجمعه": 5,
  "الجمعة": 5,
  سبت: 6,
  "السبت": 6,
};

const RELATIVE_DAYS_INPUT: Record<string, number> = {
  "اليوم": 0,
  امس: -1,
  "أمس": -1,
  بكره: 1,
  "بُكرة": 1,
  "بكرة": 1,
  غدا: 1,
  "غدًا": 1,
  "غداً": 1,
};

const RECURRENCE_PATTERNS_INPUT: Record<string, string> = {
  "يوميًا": "daily",
  "يومياً": "daily",
  "يومية": "daily",
  يومي: "daily",
  يوم: "daily",
  "أسبوعيًا": "weekly",
  "أسبوعياً": "weekly",
  "أسبوعية": "weekly",
  "اسبوعيًا": "weekly",
  "اسبوعياً": "weekly",
  "اسبوعية": "weekly",
  اسبوعي: "weekly",
  اسبوع: "weekly",
  "سنويًا": "yearly",
  "سنوياً": "yearly",
  "سنوية": "yearly",
  سنوي: "yearly",
};

function normalizeArabicText(input: string): string {
  let text = input;
  text = text.replace(/[ًٌٍَُِّْ]/g, "");
  text = text.replace(/ة/g, "ه");
  text = text.replace(/أ/g, "ا");
  text = text.replace(/إ/g, "ا");
  text = text.replace(/آ/g, "ا");
  text = text.replace(/ى/g, "ي");
  text = text.replace(/ؤ/g, "و");
  text = text.replace(/ئ/g, "ي");
  text = text.replace(/ـ/g, "");
  return text.trim();
}

function lookupDayName(token: string): number | null {
  const normalized = normalizeArabicText(token);
  if (normalized in ARABIC_DAY_NAMES) return ARABIC_DAY_NAMES[normalized]!;
  if (token in ARABIC_DAY_NAMES_INPUT) return ARABIC_DAY_NAMES_INPUT[token]!;
  return null;
}

function lookupRelativeDay(token: string): number | null {
  const normalized = normalizeArabicText(token);
  if (normalized in RELATIVE_DAYS) return RELATIVE_DAYS[normalized]!;
  if (token in RELATIVE_DAYS_INPUT) return RELATIVE_DAYS_INPUT[token]!;
  return null;
}

function lookupRecurrence(token: string): string | null {
  const normalized = normalizeArabicText(token);
  if (normalized in RECURRENCE_PATTERNS) return RECURRENCE_PATTERNS[normalized]!;
  if (token in RECURRENCE_PATTERNS_INPUT) return RECURRENCE_PATTERNS_INPUT[token]!;
  return null;
}

function extractArabicNumerals(text: string): number | null {
  const converted = convertFromArabicNumerals(text);
  const match = converted.match(/\d+/);
  if (match) return parseInt(match[0]!, 10);
  return null;
}

function parseRelativeDate(
  tokens: string[],
  referenceDate: number
): { date: number; index: number; consumedTokens: number } | null {
  for (let i = 0; i < tokens.length; i++) {
    const relDay = lookupRelativeDay(tokens[i]!);
    if (relDay !== null) {
      return {
        date: addDays(startOfDay(referenceDate), relDay),
        index: i,
        consumedTokens: 1,
      };
    }
  }

  const afterPattern = /^(بعد|بعدين)$/;
  for (let i = 0; i < tokens.length; i++) {
    if (afterPattern.test(normalizeArabicText(tokens[i]!))) {
      for (let j = i + 1; j < tokens.length; j++) {
        const norm = normalizeArabicText(tokens[j]!);
        const num = extractArabicNumerals(norm);
        if (num !== null) {
          return {
            date: addDays(startOfDay(referenceDate), num),
            index: i,
            consumedTokens: j - i + 1,
          };
        }
        if (norm in MULTIPLICATIVE_NUMBERS) {
          return {
            date: addDays(
              startOfDay(referenceDate),
              MULTIPLICATIVE_NUMBERS[norm]!
            ),
            index: i,
            consumedTokens: j - i + 1,
          };
        }
      }
    }
  }

  return null;
}

function parseDayName(
  tokens: string[]
): { dayIndex: number; consumedTokens: number } | null {
  for (let i = 0; i < tokens.length; i++) {
    const dayIdx = lookupDayName(tokens[i]!);
    if (dayIdx !== null) {
      return { dayIndex: dayIdx, consumedTokens: 1 };
    }
  }
  return null;
}

function findNextDayOfWeek(
  referenceDate: number,
  targetDay: number
): number {
  const ref = startOfDay(referenceDate);
  const refDay = new Date(ref).getDay();
  let diff = targetDay - refDay;
  if (diff <= 0) diff += 7;
  return addDays(ref, diff);
}

function parseTime(tokens: string[]): {
  time: string;
  consumedTokens: number;
} | null {
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizeArabicText(tokens[i]!);
    if (normalized === "الساعه" || normalized === "ساعه") {
      for (let j = i + 1; j < tokens.length; j++) {
        const timeToken = convertFromArabicNumerals(tokens[j]!);
        const timeMatch = timeToken.match(/^(\d{1,2})$/);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]!, 10);
          let period = "";
          for (let k = j + 1; k < tokens.length; k++) {
            const pn = normalizeArabicText(tokens[k]!);
            if (
              pn === "صباحا" ||
              pn === "صباح" ||
              pn === "ق"
            ) {
              period = "am";
              break;
            }
            if (
              pn === "مساء" ||
              pn === "مساءا" ||
              pn === "م"
            ) {
              period = "pm";
              break;
            }
          }
          if (period === "pm" && hours < 12) hours += 12;
          if (period === "am" && hours === 12) hours = 0;
          if (period === "" && hours >= 1 && hours <= 11) {
            period = "am";
          }
          if (period === "" && hours >= 13 && hours <= 23) {
            period = "pm";
            hours -= 12;
          }
          const timeStr = `${String(hours).padStart(2, "0")}:00`;
          return { time: timeStr, consumedTokens: j - i + 1 + (period !== "" ? 1 : 0) };
        }
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const raw = convertFromArabicNumerals(tokens[i]!);
    const colonMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (colonMatch) {
      return { time: raw, consumedTokens: 1 };
    }
  }

  return null;
}

function parseRecurrence(
  tokens: string[]
): { recurrence: ParsedTask["recurrence"]; index: number; consumedTokens: number } | null {
  for (let i = 0; i < tokens.length; i++) {
    const norm = normalizeArabicText(tokens[i]!);
    if (norm === "كل") {
      const next = i + 1 < tokens.length ? normalizeArabicText(tokens[i + 1]!) : "";
      const unit = next === "يومين" ? "yomayn" : next === "اسبوعين" || next === "أسبوعين" ? "usbuayn" : next;
      if (unit === "يوم" || unit === "yomayn") {
        return {
          recurrence: unit === "yomayn" ? { type: "daily", interval: 2 } : { type: "daily" },
          index: i,
          consumedTokens: 2,
        };
      }
      if (unit === "اسبوع" || unit === "أسبوع" || unit === "usbuayn") {
        const third =
          i + 2 < tokens.length ? normalizeArabicText(tokens[i + 2]!) : "";
        if (third === "ين") {
          return {
            recurrence: { type: "weekly", interval: 2 },
            index: i,
            consumedTokens: 3,
          };
        }
        return {
          recurrence: unit === "usbuayn" ? { type: "weekly", interval: 2 } : { type: "weekly" },
          index: i,
          consumedTokens: 2,
        };
      }

      const num = extractArabicNumerals(tokens[i + 1] ?? "");
      if (num !== null && num > 0) {
        const nextUnit = i + 2 < tokens.length ? normalizeArabicText(tokens[i + 2]!) : "";
        if (nextUnit.includes("يوم")) {
          return {
            recurrence: { type: "daily", interval: num },
            index: i,
            consumedTokens: 3,
          };
        }
        if (nextUnit.includes("اسبوع") || nextUnit.includes("أسبوع")) {
          return {
            recurrence: { type: "weekly", interval: num },
            index: i,
            consumedTokens: 3,
          };
        }
        if (nextUnit === "شهر" || nextUnit === "شهور") {
          return {
            recurrence: { type: "monthly", interval: num },
            index: i,
            consumedTokens: 3,
          };
        }
        if (nextUnit === "سنه" || nextUnit === "سنة" || nextUnit === "سنوات") {
          return {
            recurrence: { type: "yearly", interval: num },
            index: i,
            consumedTokens: 3,
          };
        }
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const recType = lookupRecurrence(tokens[i]!);
    if (recType !== null) {
      return {
        recurrence: { type: recType },
        index: i,
        consumedTokens: 1,
      };
    }
  }

  return null;
}

function extractTitle(
  originalTokens: string[],
  consumedIndices: Set<number>
): string {
  const titleTokens: string[] = [];
  for (let i = 0; i < originalTokens.length; i++) {
    if (!consumedIndices.has(i)) {
      titleTokens.push(originalTokens[i]!);
    }
  }
  return titleTokens.join(" ").trim();
}

function isDayName(token: string): boolean {
  return lookupDayName(token) !== null;
}

function isTimeWord(token: string): boolean {
  const n = normalizeArabicText(token);
  return n === "الساعه" || n === "ساعه";
}

export function parseQuickAdd(
  input: string,
  referenceDate?: number
): ParsedTask {
  const ref = referenceDate ?? Date.now();
  const tokens = input.split(/\s+/).filter((t) => t.length > 0);
  const consumedIndices = new Set<number>();

  let date: number | null = null;
  let time: string | null = null;
  let recurrence: ParsedTask["recurrence"] = null;

  const relResult = parseRelativeDate(tokens, ref);
  if (relResult) {
    date = relResult.date;
    for (let i = relResult.index; i < relResult.index + relResult.consumedTokens && i < tokens.length; i++) {
      consumedIndices.add(i);
    }
  }

  const dayResult = parseDayName(tokens);
  if (dayResult) {
    if (date === null) {
      date = findNextDayOfWeek(ref, dayResult.dayIndex);
    }
    for (let i = 0; i < tokens.length; i++) {
      if (isDayName(tokens[i]!) && !consumedIndices.has(i)) {
        consumedIndices.add(i);
        break;
      }
    }
  }

  const timeResult = parseTime(tokens);
  if (timeResult) {
    time = timeResult.time;
    let startSearch = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (isTimeWord(tokens[i]!)) {
        startSearch = i;
        break;
      }
    }
    for (let j = startSearch; j < startSearch + timeResult.consumedTokens && j < tokens.length; j++) {
      consumedIndices.add(j);
    }
  }

  const recResult = parseRecurrence(tokens);
  if (recResult) {
    recurrence = recResult.recurrence;
    for (let j = recResult.index; j < recResult.index + recResult.consumedTokens && j < tokens.length; j++) {
      consumedIndices.add(j);
    }
  }

  if (date === null) {
    date = startOfDay(ref);
  }

  const title = extractTitle(tokens, consumedIndices);

  return {
    title: title || input,
    date,
    time,
    recurrence,
  };
}
