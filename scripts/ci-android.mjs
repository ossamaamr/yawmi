// ══════════════════════════════════════════════════════════
// scripts/ci-android.mjs — يُنفَّذ ضمن npm run build داخل بيئة CI فقط:
// يُنشئ مشروع أندرويد (إن لزم) ثم يولّد أيقونات التطبيق من assets/ إلى res/
// ══════════════════════════════════════════════════════════
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI === 'true') {
  const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
  try {
    if (!existsSync('android')) {
      console.log('› إنشاء مشروع أندرويد…');
      run('npx cap add android');
    }
    console.log('› توليد أيقونة التطبيق من assets/…');
    run(
      'npx capacitor-assets generate --android ' +
        "--iconBackgroundColor '#E6F4FE' --iconBackgroundColorDark '#151e2a' " +
        "--splashBackgroundColor '#E6F4FE' --splashBackgroundColorDark '#151e2a'"
    );
    console.log('✓ تم توليد الأيقونة');
  } catch (err) {
    console.error('⚠ تعذّر توليد الأيقونة:', err.message);
    process.exit(1);
  }
} else {
  console.log('(تخطّي خطوات أندرويد — ليست بيئة CI)');
}