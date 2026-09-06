// ══════════════════════════════════════════════════════════
// scripts/configure-release-build.mjs — يهيئ build.gradle لبناء Release مُحسَّن:
//   • ProGuard/R8 (minifyEnabled + shrinkResources)
//   • توقيع apk بمفتاح debug ليصبح قابلًا للتثبيت مباشرة (بناء اختباري)
// ══════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const gradlePath = 'android/app/build.gradle';

if (!existsSync(gradlePath)) {
  console.error('لم يُعثر على android/app/build.gradle');
  process.exit(1);
}

let gradle = readFileSync(gradlePath, 'utf8');

// ضغط الموارد + تصغير الكود في بناء Release
gradle = gradle.replace('minifyEnabled false', 'minifyEnabled true\n            shrinkResources true');
// توقيع بمفتاح debug لبناء اختباري قابل للتثبيت
gradle = gradle.replace(
  'signingConfig signingConfigs.debug',
  'signingConfig signingConfigs.debug'
);
if (!gradle.includes('signingConfig signingConfigs.debug')) {
  gradle = gradle.replace(
    /release\s*\{([^}]*)\}/s,
    (m, body) => `release {${body}\n            signingConfig signingConfigs.debug\n        }`
  );
}

writeFileSync(gradlePath, gradle);
console.log('✓ تم تفعيل ProGuard + ShrinkResources + التوقيع لمستوى Release');
console.log('─ block:');
console.log(gradle.slice(gradle.indexOf('buildTypes')));

// ── قواعد ProGuard لأكواد Capacitor ──
const proguardPath = 'android/app/proguard-rules.pro';
const rules = `# Capacitor core
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# إضافات Capacitor
-keep class com.capacitorjs.** { *; }

# لا تزيل رموز الأسماء في السجلات
-keepattributes SourceFile,LineNumberTable
`;
writeFileSync(proguardPath, rules, 'utf8');
console.log('✓ تم إنشاء ' + proguardPath);