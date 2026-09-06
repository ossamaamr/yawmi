// ══════════════════════════════════════════════════════════
// lib/quran.js — محرك الورد اليومي من القرآن الكريم
// بيانات المصحف المعتمد (المصحف المدني، ٦٠٤ صفحات — رواية حفص):
//   - أرقام صفحات بداية كل جزء (جُزْء)
//   - أرقام صفحات بداية كل سورة + عدد آياتها
// الحالة تُخزَّن في إعدادات IndexedDB تحت مفاتيح quran* محددة.
// التزامًا بالخصوصية: كل شيء محلي — لا خوادم ولا طلبات شبكة.
// ══════════════════════════════════════════════════════════

export const LAST_PAGE = 604;

// صفحات بداية الأجزاء الثلاثين (كل جزء يُكتب ببدايته في المصحف المدني)
export const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

// السور: [الاسم، صفحة البداية، عدد الآيات]
export const SURAHS = [
  ['الفاتحة', 1, 7],
  ['البقرة', 2, 286],
  ['آل عمران', 50, 200],
  ['النساء', 77, 176],
  ['المائدة', 106, 120],
  ['الأنعام', 128, 165],
  ['الأعراف', 151, 206],
  ['الأنفال', 177, 75],
  ['التوبة', 187, 129],
  ['يونس', 208, 109],
  ['هود', 221, 123],
  ['يوسف', 235, 111],
  ['الرعد', 249, 43],
  ['إبراهيم', 255, 52],
  ['الحجر', 262, 99],
  ['النحل', 267, 128],
  ['الإسراء', 282, 111],
  ['الكهف', 293, 110],
  ['مريم', 305, 98],
  ['طه', 312, 135],
  ['الأنبياء', 322, 112],
  ['الحج', 332, 78],
  ['المؤمنون', 342, 118],
  ['النور', 350, 64],
  ['الفرقان', 359, 77],
  ['الشعراء', 367, 227],
  ['النمل', 377, 93],
  ['القصص', 385, 88],
  ['العنكبوت', 396, 69],
  ['الروم', 404, 60],
  ['لقمان', 411, 34],
  ['السجدة', 415, 30],
  ['الأحزاب', 418, 73],
  ['سبأ', 428, 54],
  ['فاطر', 434, 45],
  ['يس', 440, 83],
  ['الصافات', 446, 182],
  ['ص', 453, 88],
  ['الزمر', 458, 75],
  ['غافر', 467, 85],
  ['فصلت', 477, 54],
  ['الشورى', 483, 53],
  ['الزخرف', 489, 89],
  ['الدخان', 496, 59],
  ['الجاثية', 499, 37],
  ['الأحقاف', 502, 35],
  ['محمد', 507, 38],
  ['الفتح', 511, 29],
  ['الحجرات', 515, 18],
  ['ق', 518, 45],
  ['الذاريات', 520, 60],
  ['الطور', 523, 49],
  ['النجم', 526, 62],
  ['القمر', 528, 55],
  ['الرحمن', 531, 78],
  ['الواقعة', 534, 96],
  ['الحديد', 537, 29],
  ['المجادلة', 542, 22],
  ['الحشر', 545, 24],
  ['الممتحنة', 549, 13],
  ['الصف', 551, 14],
  ['الجمعة', 553, 11],
  ['المنافقون', 554, 11],
  ['التغابن', 556, 18],
  ['الطلاق', 558, 12],
  ['التحريم', 560, 12],
  ['الملك', 562, 30],
  ['القلم', 564, 52],
  ['الحاقة', 566, 52],
  ['المعارج', 568, 44],
  ['نوح', 570, 28],
  ['الجن', 572, 28],
  ['المزمل', 574, 20],
  ['المدثر', 575, 56],
  ['القيامة', 577, 40],
  ['الإنسان', 578, 31],
  ['المرسلات', 580, 50],
  ['النبأ', 582, 40],
  ['النازعات', 583, 46],
  ['عبس', 585, 42],
  ['التكوير', 586, 29],
  ['الانفطار', 587, 19],
  ['المطففين', 587, 36],
  ['الانشقاق', 589, 25],
  ['البروج', 590, 22],
  ['الطارق', 591, 17],
  ['الأعلى', 591, 19],
  ['الغاشية', 592, 26],
  ['الفجر', 593, 30],
  ['البلد', 594, 20],
  ['الشمس', 595, 15],
  ['الليل', 595, 21],
  ['الضحى', 596, 11],
  ['الشرح', 596, 8],
  ['التين', 597, 8],
  ['العلق', 597, 19],
  ['القدر', 598, 5],
  ['البينة', 598, 8],
  ['الزلزلة', 599, 8],
  ['العاديات', 599, 11],
  ['القارعة', 600, 11],
  ['التكاثر', 600, 8],
  ['العصر', 601, 3],
  ['الهمزة', 601, 9],
  ['الفيل', 601, 5],
  ['قريش', 602, 4],
  ['الماعون', 602, 7],
  ['الكوثر', 602, 3],
  ['الكافرون', 603, 6],
  ['النصر', 603, 3],
  ['المسد', 603, 5],
  ['الإخلاص', 604, 4],
  ['الفلق', 604, 5],
  ['الناس', 604, 6],
];

// أنواع الورد اليومي وإجمالي الأيام لكل نوع
export const WIRD_TYPES = [
  { key: 'juz', label: 'جزء يومياً', totalDays: 30 },
  { key: 'hizb', label: 'حزب يومياً', totalDays: 60 },
  { key: 'rub', label: 'ربع يومياً', totalDays: 240 },
  { key: 'page', label: 'صفحة واحدة يومياً', totalDays: 604 },
  { key: 'five_pages', label: '٥ صفحات يومياً', totalDays: 121 },
  { key: 'khatmah', label: 'ختمة في ٣٠ يوماً', totalDays: 30 },
];

// مفاتيح التخزين في IndexedDB (settings)
export const QURAN_KEYS = {
  type: 'quranWirdType',
  day: 'quranDay',
  daysDone: 'quranDaysDone',
  totalDays: 'quranTotalDays',
  streak: 'quranStreak',
  lastCompleted: 'quranLastCompleted',
};

export const DEFAULT_QURAN_STATE = {
  type: 'juz',
  day: 1,
  daysDone: 0,
  totalDays: 30,
  streak: 0,
  lastCompleted: null,
};

// ── دوال مساعدة داخلية ──
function juzStartPage(juz) {
  if (juz < 1) return 1;
  if (juz > 30) return LAST_PAGE + 1;
  return JUZ_START_PAGES[juz - 1];
}

function juzEndPage(juz) {
  return juzStartPage(juz + 1) - 1;
}

function splitRange(start, end, slices) {
  const total = end - start + 1;
  const parts = [];
  for (let i = 0; i < slices; i++) {
    const from = start + Math.floor((total * i) / slices);
    const to = start + Math.floor((total * (i + 1)) / slices) - 1;
    parts.push([from, Math.min(to, end)]);
  }
  return parts;
}

// نطاق صفحات يومٍ ما حسب نوع الورد
export function dayPageRange(type, day) {
  const d = Math.max(1, Math.floor(day));
  switch (type) {
    case 'juz':
    case 'khatmah': {
      const juz = Math.min(30, Math.max(1, ((d - 1) % 30) + 1));
      return [juzStartPage(juz), juzEndPage(juz)];
    }
    case 'hizb': {
      const idx = Math.min(59, Math.max(0, ((d - 1) % 60)));
      const juz = Math.floor(idx / 2) + 1;
      const halves = splitRange(juzStartPage(juz), juzEndPage(juz), 2);
      return halves[idx % 2];
    }
    case 'rub': {
      const idx = Math.min(239, Math.max(0, ((d - 1) % 240)));
      const juz = Math.floor(idx / 8) + 1;
      const quarters = splitRange(juzStartPage(juz), juzEndPage(juz), 8);
      return quarters[idx % 8];
    }
    case 'five_pages': {
      const idx = Math.min(120, Math.max(0, ((d - 1) % 121)));
      const from = idx * 5 + 1;
      return [from, Math.min(LAST_PAGE, from + 4)];
    }
    case 'page':
    default: {
      const page = Math.min(LAST_PAGE, Math.max(1, ((d - 1) % LAST_PAGE) + 1));
      return [page, page];
    }
  }
}

// السورة الحالية عند صفحة معينة
export function surahAtPage(page) {
  const p = Math.min(LAST_PAGE, Math.max(1, page));
  let found = SURAHS[0];
  for (const s of SURAHS) {
    if (s[1] <= p) found = s;
    else break;
  }
  return found;
}

// نهاية صفحات سورة (الصفحة الأخيرة التي تحتلها)
function surahEndPage(startPage) {
  let end = LAST_PAGE;
  for (const s of SURAHS) {
    if (s[1] > startPage) {
      end = s[1] - 1;
      break;
    }
  }
  return end;
}

// توزيع عدد الآيات على نطاق الصفحات داخل السورة (تقديري مبسّط)
function ayahAtPage(surah, surahPageStart, surahPageEnd, page) {
  const count = surah[2];
  const span = surahPageEnd - surahPageStart + 1;
  const offset = Math.max(0, Math.min(span - 1, page - surahPageStart));
  return Math.max(1, Math.min(count, Math.round(1 + ((count - 1) * offset) / Math.max(1, span - 1))));
}

// مقاطع اليوم: أسماء السور + نطاقات الآيات + الصفحات
export function segmentsForRange(pageStart, pageEnd) {
  const from = Math.max(1, pageStart);
  const to = Math.min(LAST_PAGE, pageEnd);
  const segments = [];

  for (let i = 0; i < SURAHS.length; i++) {
    const surah = SURAHS[i];
    const sp = surah[1];
    const ep = surahEndPage(sp);
    if (ep < from || sp > to) continue;
    const segStartPage = Math.max(sp, from);
    const segEndPage = Math.min(ep, to);
    segments.push({
      index: i + 1,
      name: surah[0],
      ayahCount: surah[2],
      startPage: segStartPage,
      endPage: segEndPage,
      startAyah: segStartPage === sp ? 1 : ayahAtPage(surah, sp, ep, segStartPage),
      endAyah: segEndPage === ep ? surah[2] : ayahAtPage(surah, sp, ep, segEndPage),
    });
  }

  return segments;
}

// معلومات اليوم الحالي
export function progressForDay(type, day) {
  const typeInfo = WIRD_TYPES.find((t) => t.key === type) || WIRD_TYPES[0];
  const totalDays = typeInfo.totalDays;
  const safeDay = Math.min(totalDays, Math.max(1, Math.floor(day || 1)));
  const [pageStart, pageEnd] = dayPageRange(type, safeDay);
  const segments = segmentsForRange(pageStart, pageEnd);

  let juzLabel = '';
  if (type === 'juz' || type === 'khatmah') {
    juzLabel = `الجزء ${arNum(((safeDay - 1) % 30) + 1)}`;
  } else if (pageStart === pageEnd) {
    juzLabel = 'الصفحة المفردة';
  }

  return {
    type,
    typeLabel: typeInfo.label,
    totalDays,
    day: safeDay,
    juzLabel,
    pageStart,
    pageEnd,
    segments,
    percent: Math.min(100, Math.round((safeDay / totalDays) * 100)),
  };
}

// ── أرقام عربية ──
const AR_DIGITS = { 0: '٠', 1: '١', 2: '٢', 3: '٣', 4: '٤', 5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩' };
export function arNum(n) {
  return String(n).replace(/[0-9]/g, (ch) => AR_DIGITS[ch] ?? ch);
}

// ── إدارة الحالة (القراءة/الكتابة في settings عبر قابس خارجي) ──
// يُمرَّر قارئ وكاتب (مثل getSetting/setSetting من db.js) ليبقى المحرك نقيًا.

// حساب الحماسة الجديدة عند إكمال ورد اليوم
export function nextStreak(prevStreak, lastCompletedDayStart, todayStart, msPerDay) {
  if (!lastCompletedDayStart) return 1;
  const diff = Math.round((todayStart - lastCompletedDayStart) / msPerDay);
  if (diff === 0) return prevStreak || 1;
  if (diff === 1) return (prevStreak || 0) + 1;
  return 1;
}

// المستوى التالي بعد الإكمال (يعيد الالتفاف بعد آخر يوم في الختمة)
export function nextDayState(state) {
  const totalDays = (WIRD_TYPES.find((t) => t.key === state.type) || WIRD_TYPES[0]).totalDays;
  const nextDay = state.day + 1;
  if (nextDay > totalDays) {
    return {
      ...state,
      day: 1,
      daysDone: (state.daysDone || 0) + 1,
    };
  }
  return {
    ...state,
    day: nextDay,
    daysDone: state.daysDone || 0,
  };
}