# عام الأعمال للاستثمار

موقع عربي متجاوب، مع رحلة Three.js تفاعلية وطلب خدمات عبر واتساب.

15 منصة حكومية وتنظيمية تضم 87 خدمة فرعية، و8 مجموعات للتسويق والاتصالات التسويقية.

## تحديث الموقع

عدّل source/services-data.json أو source/business-stats.json ثم شغّل من مجلد source:

```sh
node build.mjs
node verify-build.mjs
node verify-catalog.mjs
node verify-audit.mjs
node verify-pdf.mjs
```

لا يحتاج البناء إلى تنزيل حزم. أصول الرحلة وخط Cairo محلية. ارفع الملفات الناتجة مع المصدر.

النشر: GitHub Pages من main والجذر. الطلبات تُراجع وتُرسل من العميل داخل واتساب. لا يوجد دفع إلكتروني أو قاعدة بيانات للعملاء في هذا الإصدار.
