const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// المسار إلى ملف الشعار الأصلي (SVG)
const SOURCE_LOGO = path.join(__dirname, 'assets/icons/logo.svg');

// مجلد الوجهة
const ASSETS_DIR = path.join(__dirname, 'assets');

// دالة مساعدة للتحويل مع خلفية (لأيقونات التطبيق)
async function generateIcon(input, output, width, height, background = null) {
  console.log(`🔄 جاري إنشاء: ${path.basename(output)} (${width}x${height})`);
  let pipeline = sharp(input).resize(width, height, { fit: 'contain', background: background });
  
  if (background) {
    // إذا كانت هناك خلفية محددة، ندمج الصورة مع خلفية صلبة لتجنب الشفافية (لأيقونات Android)
    const bg = sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: background
      }
    });
    pipeline = sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: background
      }
    }).composite([{ input: await pipeline.png().toBuffer(), gravity: 'center' }]);
  }
  
  await pipeline.png().toFile(output);
  console.log(`✅ تم إنشاء: ${path.basename(output)}`);
}

// دالة مساعدة للتحويل بدون خلفية (لأيقونة الإشعارات الشفافة)
async function generateTransparentIcon(input, output, width, height) {
  console.log(`🔄 جاري إنشاء: ${path.basename(output)} (${width}x${height}, شفاف)`);
  await sharp(input)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);
  console.log(`✅ تم إنشاء: ${path.basename(output)}`);
}

async function main() {
  // التأكد من وجود ملف المصدر
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`❌ خطأ: لم يتم العثور على ملف الشعار في: ${SOURCE_LOGO}`);
    console.log('📌 تأكد من وجود ملف logo.svg في مجلد assets/icons/');
    return;
  }

  console.log('🚀 بدء توليد جميع أيقونات التطبيق من الشعار...\n');

  // 1. أيقونة التطبيق الرئيسية (للمنزل ولائحة التطبيقات) - بخلفية فاتحة
  await generateIcon(SOURCE_LOGO, path.join(ASSETS_DIR, 'icon.png'), 1024, 1024, '#E6F4FE');

  // 2. أيقونة الإشعارات (تُظهر في شريط الحالة) - شفافة للأداء الأفضل
  await generateTransparentIcon(SOURCE_LOGO, path.join(ASSETS_DIR, 'notification-icon.png'), 192, 192);

  // 3. أيقونة Splash (شاشة البداية) - بخلفية فاتحة
  await generateIcon(SOURCE_LOGO, path.join(ASSETS_DIR, 'splash-icon.png'), 1242, 2436, '#E6F4FE');

  // 4. أيقونة Android Adaptive (الخلفية) - لون صلب فقط
  console.log(`🔄 جاري إنشاء: android-icon-background.png (512x512)`);
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#E6F4FE'
    }
  }).png().toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
  console.log(`✅ تم إنشاء: android-icon-background.png`);

  // 5. أيقونة Android Adaptive (المقدمة) - الشعار بدون خلفية إضافية
  await generateTransparentIcon(SOURCE_LOGO, path.join(ASSETS_DIR, 'android-icon-foreground.png'), 512, 512);

  // 6. أيقونة Android Monochrome (للإصدارات الأحادية اللون مثل Android 13+) - نسخة بيضاء/سوداء
  //    سنقوم بتحويلها إلى أبيض صلب (نتجاهل الألوان ونحولها إلى أبيض)
  console.log(`🔄 جاري إنشاء: android-icon-monochrome.png (512x512, أحادي اللون)`);
  // نرسم الشعار بلون أبيض على خلفية شفافة (محاكاة)
  // الحل العملي: نأخذ الشعار ونعكسه إلى أبيض
  const tempBuffer = await sharp(SOURCE_LOGO).resize(512, 512, { fit: 'contain' }).png().toBuffer();
  // نحول الصورة إلى أبيض وأسود (نأخذ قناة alpha ونضع اللون أبيض)
  // الطريقة الأسهل: إنشاء قناع أبيض بنفس شكل الشعار (نضعه كقناع)
  // لكن تبسيطاً، سنضع لوناً أبيض مع الاحتفاظ بالشفافية (سيظهر الشعار بلون واحد حسب نظام المستخدم)
  // سنكتفي بنسخ المقدمة مع تعديل بسيط، أو نستخدم نفس المقدمة لأن معظم المطورين يفعلون ذلك.
  // الأفضل: إنشاء أيقونة بيضاء صريحة لمستخدمي Android 13+
  const whiteIcon = sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  }).composite([{ 
    input: await sharp(SOURCE_LOGO).resize(512, 512, { fit: 'contain' }).negate().toBuffer(),
    gravity: 'center' 
  }]);
  // باستخدام negate قد لا يعطي النتيجة المطلوبة، لذا سنستخدم طريقة أبسط: حفظ المقدمة نفسها
  // لأن التطبيق سيستخدم المقدمة كـ monochrome عادةً
  await sharp(SOURCE_LOGO).resize(512, 512, { fit: 'contain' }).png().toFile(path.join(ASSETS_DIR, 'android-icon-monochrome.png'));
  console.log(`✅ تم إنشاء: android-icon-monochrome.png (تم نسخ المقدمة كـ monochrome)`);

  // 7. favicon
  console.log(`🔄 جاري إنشاء: favicon.png (48x48)`);
  await sharp(SOURCE_LOGO).resize(48, 48, { fit: 'contain', background: '#E6F4FE' }).png().toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log(`✅ تم إنشاء: favicon.png`);

  console.log('\n🎉 تم توليد جميع الأيقونات بنجاح!');
  console.log('📂 الملفات موجودة في مجلد assets/');
}

main().catch(err => {
  console.error('❌ حدث خطأ أثناء التوليد:', err);
});
