# TASKS.md

متابعة مهام مشروع توصيل الطعام (أبو خاطر).

## المهام

- [x] **Fix Google Drive image issue** — توحيد روابط Drive / `googleusercontent` إلى `thumbnail` في `src/utils/googleDrive.js` واستخدامها في `mapSingleItem` داخل `src/services/api.js`.
- [x] **Optimize n8n workflow** — في `jsonfile/Menu-api-react.json`: إزالة مسار **Schedule → Sheets → Code → Respond to Webhook** (كان ينفّذ بدون سياق webhook ويزيد التنفيذات دون فائدة للتطبيق). مسار التطبيق يبقى: **Webhook → Get row(s) → Code → Respond**.
- [x] **Improve error handling** — `fetchMenu` يعيد `{ items, usedFallback, error }` لعرض سبب أوضح عند اللجوء للقائمة المحلية؛ `describeFetchError` في `src/utils/errors.js` لرسائل شبكة/مهلة عربية في `submitOrder` و`submitReservation`.

---

*آخر تحديث: اكتمال المهام أعلاه مع الحفاظ على نفس منطق الأسعار والطلبات والقائمة الاحتياطية.*
