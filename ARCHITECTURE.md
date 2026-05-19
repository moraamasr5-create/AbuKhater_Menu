# Abu Khater Menu - Architecture Redesign (Supabase Migration)

## 1. نظرة عامة (Overview)
تم إعادة تصميم وبناء معمارية المشروع للتخلص من الاعتماد الكامل على منصة `n8n` كطبقة وسيطة (Middle Layer) وإدارة البيانات، والاعتماد بدلاً من ذلك على **Supabase** كـ **Backend Core** أساسي. يوفر Supabase كلاً من (Database, Storage, Auth, Realtime APIs) بشكل مدمج، مما يقلل من نقاط الفشل (Points of Failure) ويسرع من استجابة النظام.

## 2. معمارية النظام النظيفة (Clean Architecture)
تم تقسيم النظام إلى طبقات مفصولة ومستقلة كالتالي:

1. **UI / Components Layer (`src/components/`, `src/pages/`, `src/features/`)**:
   - مسؤولة فقط عن عرض البيانات للمستخدم والتفاعل معه.
   - لا تحتوي على أي Logic معقد للاتصال بقواعد البيانات.

2. **State Management / Hooks Layer (`src/hooks/`, `src/core/context/`)**:
   - تدير حالة التطبيق (مثل CartContext) وتربط الواجهة بالخدمات (Services).
   - توفر Custom Hooks (مثل `useCart`) لتسهيل الوصول للبيانات بدون تكرار الكود.

3. **Services Layer (`src/services/api/`)**:
   - هذه الطبقة هي البديل الكامل لملف `api.js` القديم.
   - تم تقسيمها إلى وحدات (Modules) مستقلة:
     - `menuService.js`: لجلب القائمة بدلاً من `fetchMenu` في n8n.
     - `orderService.js`: لإرسال الطلبات ورفع صور الإيصالات بدلاً من Webhooks.
     - `reservationService.js`: لإدارة الحجوزات.
     - `feedbackService.js`: لاستقبال الآراء والشكاوى.

4. **Config Layer (`src/core/config/`)**:
   - مسؤولة عن قراءة إعدادات البيئة (`Environment Variables`).
   - تمنع أي `Hardcoded URLs` أو `Keys` في الكود.

5. **Backend Abstraction (`src/services/supabase/supabaseClient.js`)**:
   - يتم تهيئة اتصال Supabase هنا ليكون هو الـ `Single Source of Truth`.

---

## 3. تحويل التدفقات من n8n إلى Supabase

### أ. تحميل القائمة (Menu Fetching)
- **السابق (n8n)**: كان يتم إرسال طلب Webhook لـ n8n (`/menu-api`)، وكان n8n يقوم بجلب البيانات من Google Sheets أو قاعدة بيانات خارجية ويعيدها كـ JSON.
- **الحالي (Supabase)**: يتم الاستعلام المباشر عبر `menuService.js` باستخدام `supabase.from('menu_items').select()`. البيانات أصبحت أسرع، ويتم فلترتها بناءً على حالة توفر المنتج (`status: 'available'`). تم الاحتفاظ بخاصية الـ Fallback المحلي للعمل أوفلاين إذا انقطع الاتصال.

### ب. إرسال الطلبات وتأكيد الدفع (Order Submission)
- **السابق (n8n)**: كان يتم جمع البيانات وإرسالها إلى `/submit-order`، وكان n8n يتعامل مع الصور بصيغة Base64 ويدخلها لشيت جوجل وربما يرسل إشعارات.
- **الحالي (Supabase)**: في `orderService.js`:
  1. يتم رفع صورة الإيصال (Payment Screenshot) إلى **Supabase Storage** أولاً للحصول على رابط عام (Public URL).
  2. يتم تخزين بيانات الطلب المدمجة مع الرابط في جدول `orders`.
  3. يتم تخزين عناصر الطلب في جدول `order_items` المرتبط بـ `order_id`، وذلك لضمان Relational Data نظيفة وفعالة.

### ج. الحجوزات (Reservations)
- **السابق (n8n)**: إرسال إلى Webhook لإنشاء صف جديد في Google Sheets.
- **الحالي (Supabase)**: في `reservationService.js`، استعلام مباشر (`insert`) لجدول `reservations` مع الاحتفاظ بوقت الإنشاء والتفاصيل الكاملة.

### د. الوقت الفعلي (Realtime / Insert / Update)
- باستخدام إمكانيات Supabase، يمكن لتطبيق الإدارة الخاص بالمطعم الاشتراك في تحديثات قاعدة البيانات لحظياً (`Realtime Subscriptions`) ليتم تنبيه الكاشير أو المطبخ عند وصول طلب جديد، وهو ما كان يتطلب Automation Flows معقدة في n8n.

---

## 4. نظام إدارة الأمان والإعدادات

تطبيقا لقواعد الأمان الصارمة:
1. **تم حظر رفع ملفات الـ Secrets**: أي ملف يحتوي على كلمات مرور أو عناوين مثل `api.js` القديم تم وضعه في `.gitignore`، وبالتالي لن يتم رفعه أبداً للنسخ المستقبلية.
2. **Environment Variables**:
   تم إنشاء ملف `.env` يحتوي على مفاتيح Supabase، ويتم قراءتها عبر `import.meta.env` (في Vite).
3. تم تصميم **Config Layer** (`src/core/config/index.js`) لتأخذ المتغيرات من البيئة وتوفرها للمشروع، مما يعني أن الكود لم يعد يحتوي على أي `const API_URL = "https://..."`.

## 5. حالة المشروع الحالي (Production-Ready)
الآن أصبح المشروع جاهزاً للإنتاج (Production):
- تم تنظيف `PaymentPage.jsx` وربطها مباشرة بـ `orderService` مع حذف ارتباطها بـ `n8nService`.
- تم تحصين الـ `.gitignore` لعدم رفع ملفات الإعدادات.
- بنية الملفات أصبحت مقسمة بشكل منطقي يسهل صيانته وتوسيعه مستقبلاً.
