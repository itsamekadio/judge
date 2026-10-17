# منصة جادج التعليمية | JUDGE Educational Platform
### بإشراف المهندس عبد الرحمن القاضي • Eng. Abdelrahman Elkady

> **منصة تعليمية متكاملة ($0 تكلفة للأبد، استضافة سحابية دائمة بدون صيانة أو توقف، ونشر آلي مؤتمت بالكامل عبر GitHub Actions)**

---

## 🌟 نظرة عامة على النظام (System Architecture)

تم تصميم وبناء منصة **JUDGE** للمهندس **عبد الرحمن القاضي** لتوفير بيئة تعليمية سريعة، مشفرة، وعصرية بأعلى معايير الأداء وبدون أي تكاليف تشغيلية شهرية:

| المكون | التقنية المستخدمة | التكلفة | ميزات الصيانة |
| :--- | :--- | :--- | :--- |
| **الواجهة الأمامية** | React (Vite) + TypeScript + Tailwind CSS | **$0** (GitHub Pages) | نشر آلي عبر CI/CD بدون خوادم |
| **قاعدة البيانات والتخزين** | Cloud Firestore | **$0** (Firebase Free Spark Plan) | لا تتوقف تلقائياً (No sleep timeout) وتدعم المزامنة اللحظية |
| **المصادقة والأدوار** | Firebase Auth | **$0** | فحص فوري لحسابات الأدمن والطلاب |
| **بث الفيديو** | YouTube Unlisted 16:9 Embeds | **$0** | استضافة غير محدودة، جودة 1080p/4K بدون إعلانات مزعجة |

---

## 🔐 نظام الصلاحيات والأدوار (Access Control & Roles)

### 1. المشرف العام (Admin Role)
- **البريد الافتراضي:** `admin@judge.com`
- **كلمة المرور:** `00000000`
- **الصلاحيات:**
  - الدخول المباشر إلى لوحة التحكم `/admin`.
  - إضافة وتعديل وحدات المنهج (`Course Units`).
  - نشر وتعديل المحاضرات وتحديد معرّف يوتيوب.
  - تحديد أذونات الوصول المباشرة لكل مجموعة طلابية (`مجموعة 1`، `مجموعة 2`، `مجموعة 3`، أو `الكل`).
  - التعديل يظهر فوراً لجميع الطلاب المتصلين في نفس اللحظة عبر Firestore Realtime Listeners دون الحاجة لإعادة بناء الموقع.

### 2. حسابات الطلاب (Student Role)
- يسجل الطالب باسمه وبريده وكلمة المرور ويختار مجموعته الدراسية (`group`).
- يرى الطالب في لوحة تحكمه فقط الدروس المصرح لمجموعته بمشاهدتها.
- إذا حاول الطالب فتح درس مخصص لمجموعة أخرى، تظهر شاشة أمان تمنعه من الوصول مع توجيه للمشرف.

---

## 🗄️ هيكل قاعدة البيانات (Cloud Firestore Schema)

### 1. `users/{userId}`
```json
{
  "email": "student@example.com",
  "fullName": "اسم الطالب",
  "role": "student", // أو "admin"
  "group": "مجموعة 1",
  "createdAt": "TIMESTAMP"
}
```

### 2. `courses/{courseId}`
```json
{
  "id": "unit-1",
  "title": "الوحدة الأولى: النهايات والاتصال",
  "order": 1,
  "description": "دراسة شاملة لمفاهيم النهايات الجبرية واتصال الدوال",
  "createdAt": "TIMESTAMP"
}
```

### 3. `lessons/{lessonId}`
```json
{
  "courseId": "unit-1",
  "title": "الدرس 1: مفهوم النهاية",
  "youtubeId": "dQw4w9WgXcQ",
  "allowedGroups": ["مجموعة 1", "مجموعة 2"],
  "order": 1,
  "duration": "25 دقيقة",
  "description": "مقدمة تأسيسية لفهم سلوك الدالة",
  "createdAt": "TIMESTAMP"
}
```

---

## 🚀 النشر التلقائي المؤتمت (Automated CI/CD Deployment)

تم تجهيز ملف سير العمل `.github/workflows/deploy.yml` ليقوم ببناء ونشر الموقع تلقائياً على **GitHub Pages** عند كل عملية دفع (`git push`) للفرع الرئيسي:

```bash
git add .
git commit -m "feat: updates to JUDGE educational platform"
git push origin main
```
1. يتحقق GitHub Actions تلقائياً من الكود.
2. يثبت الاعتماديات عبر `npm ci`.
3. ينفذ بناء المشروع عبر `npm run build`.
4. ينشر مجلد `./dist` مباشرة إلى GitHub Pages.

### إعداد GitHub Pages في المستودع:
1. توجه إلى مستودع المشروع على GitHub: **Settings > Pages**.
2. تحت **Build and deployment > Source**، اختر **GitHub Actions**.

---

## 💻 التشغيل المحلي والتطوير (Local Development)

```bash
# 1. تثبيت الحزم
npm install

# 2. تشغيل خادم التطوير المحلي
npm run dev

# 3. بناء نسخة الإنتاج
npm run build
```

---

## 🛡️ قواعد أمان Firestore المقترحة (Firestore Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // بيانات المستخدمين
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || request.auth.token.email == 'admin@judge.com');
    }
    
    // الوحدات الدراسية
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'admin@judge.com';
    }
    
    // الدروس والمحاضرات
    match /lessons/{lessonId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'admin@judge.com';
    }
  }
}
```

---

**منصة جادج التعليمية (JUDGE)** — تم التطوير للمهندس **عبد الرحمن القاضي**.
