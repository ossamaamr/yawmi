# تقرير التحويل من Expo إلى تطبيق ويب + Capacitor (يومي)

> **التاريخ:** سبتمبر 2026 — **الإصدار:** 2.0.0 — **الحالة:** مكتمل

## 1) لماذا هذا التحويل؟

التطبيق القديم كان مبنيًا بـ **Expo (Socket) / React Native 0.86 مع SQLite (drizzle-orm)**، ويتطلب:

- سيرفر Socket / طبقة مزامنة OTA.
- أدوارًا ومستخدمين ومصادقة — وهو ما يخالف الفكرة الأساسية لتطبيق **يومي**: تطبيق **مهام شخصي يعمل على جهاز المستخدم فقط**.

قرار إعادة البناء:
| القديم | الجديد |
|---|---|
| Expo / React Native | **React 18 + Vite 5 (SPA)** |
| SQLite + drizzle-orm | **IndexedDB (`idb`)** — تخزين محلي 100% |
| أدوار/مستخدمون/خادم | **بدون خادم، بدون أدوار** |
| إشعارات Expo (تتطلب خدمة خارجية) | **Capacitor Local Notifications** (محلية بالكامل) |
| بناء عبر Expo/EAS | **Capacitor + Gradle + GitHub Actions** |

## 2) المعمارية الجديدة

```text
yawmi/
├─ index.html                     ← RTL عربي, خط Cairo, viewport-fit=cover
├─ package.json                   ← Scripts: build = vite build + ci-android
├─ vite.config.js                 ← base './' (يعمل داخل WebView)
├─ capacitor.config.json          ← appId com.ossamaamr.yawmi, androidScheme https
├─ .github/workflows/build.yml    ← CI: بناء Release مشفّر ومُقلَّص الحجم
├─ scripts/
│  ├─ ci-android.mjs              ← (في CI فقط) إنشاء مشروع أندرويد + توليد الأيقونة
│  └─ configure-release-build.mjs ← تفعيل ProGuard/R8 + ShrinkResources + توقيع Debug
├─ assets/                        ← icon.png (1024), notification-icon.png (192), splash-icon.png
└─ src/
   ├─ main.jsx, App.jsx, index.css
   ├─ lib/        db.js · recurrence.js · progression.js · notifications.js · utils.js
   ├─ hooks/      useTasks.js · useOnline.js
   ├─ context/    TaskContext.jsx · SettingsContext.jsx (ثيم + لوحة ألوان + حجم خط)
   ├─ components/ TaskCard · TaskList · QuickAddBar · Layout · Footer
   └─ pages/      Today · Week · Progress · TaskDetail · NewTask · Settings
```

**قاعدة ذهبية:** لا يوجد أي اتصال بشبكة خارجية للتخزين أو المزامنة. كل البيانات داخل
IndexedDB على جهاز المستخدم. الإشعارات مجدولة محليًا وتُلغى عند حذف المهمة.

## 3) مخازن IndexedDB (`db.js`)

| المخزن | المحتوى |
|---|---|
| `tasks` | المهمة (عنوان، وصف، تصنيف، أولوية، تاريخ/وقت، علامات، حالة) |
| `recurrence_rules` | قواعد التكرار المرتبطة بالمهام |
| `progression_state` | عداد المهام التدريجية (مقدار إنجاز من أصل هدف) |
| `progression_events` | سجل تقدم التدريجي |
| `completion_events` | سجل إكمال كل مهمة لكل يوم |
| `settings` | الثيم، لوحة الألوان، حجم الخط، تفعيل الإشعارات |

التصدير/الاستيراد/التصفية الكاملة متاحة من صفحة الإعدادات (JSON).

## 4) المحرك الوظيفي المُعاد استخدامه (منشف من الكود القديم)

- **التكرار:** `isDueOnDate`, `getNextOccurrenceDate`, `getOccurrencesInRange` — يدعم يوميًا/أسبوعيًا/شهريًا/سنويًا/أيام محددة/كل N يوم.
- **التقدم:** `advanceProgression` (العنصر `currentCursor`), `getPreviousCursor` (للتراجع عن إكمال). التقدم يُحرَّك **فقط** عند إكمال المهمة، ولا يتقدم بالزمن.
- **الأدوات العربية:** أرقام عربية، أسماء الأيام/الأشهر، صيغ التاريخ، ومحلل «الإضافة السريعة» بالنص العربي.
- **الإشعارات:** `scheduleNotification`/`cancelNotification` في `notifications.js` — عبر Capacitor محليًا، مع بديل ويب (Web Notification) يعمل في المتصفح عند السماح.

## 5) خطوات بناء APK

يعتمد البناء النهائي على **GitHub Actions** (لا حاجة لأندرويد استوديو محليًا):

1. `npm ci`
2. `npm run build` → `vite build` ثم (في CI) `scripts/ci-android.mjs`:
   - `npx cap add android` (إن لم يكن موجودًا)
   - `npx capacitor-assets generate --android` (توليد أيقونات/splash بكل المقاسات)
3. `npx cap sync android` — نسخ الـ dist إلى المشروع الأصلي
4. `node scripts/configure-release-build.mjs`:
   - `minifyEnabled true` + `shrinkResources true` (R8/ProGuard بحفظ حجم APK)
   - توقيع بـ `signingConfigs.debug` ليكون APK قابلاً للتثبيت مباشرة
   - قواعد `proguard-rules.pro` تحفظ كود Capacitor
5. `./gradlew assembleRelease` → رفع المخرَج كـ release artifact

أهداف تقليل الحجم: JS ~72KB gzip · إجمالي APK المتوقع أدنى من 30MB.

## 6) التحقق المحلي

- ✅ `npm run lint` — لا أخطاء
- ✅ `npx vite build` — يبني بنجاح (60 وحدة، JS 225KB)
- ✅ `npx cap add android` + `npx cap sync android` — نجح
- ✅ `npx capacitor-assets generate --android` — 135 أصلًا مُولَّدًا
- ✅ `node scripts/configure-release-build.mjs` — عدّل build.gradle وproguard

## 7) صلاحيات وأمان

- `INTERNET` مطلوبة فقط لتحميل الخط من Google Fonts (يقع بلطف على الخطوط النظامية دون اتصال).
- `POST_NOTIFICATIONS` تُضاف تلقائيًا من إضافة Local Notifications، وتُطلب في اجراءة التشغيل.
- `androidScheme: https` يحمي WebView ويخفي أي محتوى مختلط (`allowMixedContent: false`).

## 8) هيكل صفحة التطبيق

- **اليوم:** قائمة مهام اليوم مع إضافة سريعة (نص عربي) وزر "+" عائم.
- **الأسبوع:** شريط 7 أيام مع عدّادات، والنقر على يوم يعرض مهامه.
- **التقدم:** إحصائيات يومية، مخطط آخر 7 أيام (CSS خالص)، وقائمة المهام التدريجية.
- **التفاصيل:** تحرير، إكمال/تراجع، حذف (مع تأكيد).
- **الإعدادات:** ثيم فاتح/داكن/تلقائي، لوحات ألوان، حجم خط، إشعارات، تصدير/استيراد JSON.

التذييل دائمًا: **«تطوير: أسامة بن عمرو السَّروجيّ»**.