

## סקירת מצב קיים

הפרויקט כבר מוגדר כ-PWA תקין עם:
- **manifest** מלא ב-`vite.config.ts` (שם, אייקונים, צבעים, orientation, RTL)
- **Service Worker** עם `registerType: "autoUpdate"` ו-Workbox caching
- **אייקונים** בגדלים 192x192 ו-512x512
- **באנר התקנה** (`PWAInstallPrompt`) שתומך ב-Android (beforeinstallprompt) וב-iOS (הנחיות ידניות)
- **meta tags** תקינים ב-`index.html` (theme-color, apple-touch-icon, apple-mobile-web-app-capable)

**לגבי חסימת Google Play Protect** — כ-PWA מהדפדפן, האפליקציה רצה בתוך הדפדפן המעודכן ואין לה `targetSdkVersion`. החסימה הזו לא אמורה לחול על PWA. אם משתמשים רואים אותה, זה כנראה קשור לאפליקציה אחרת במכשיר שלהם.

## שיפורים מומלצים

למרות שה-PWA כבר עובד, יש מספר שיפורים שיגבירו את האמינות וההתקנה:

### 1. רישום Service Worker מפורש ב-`main.tsx`
כרגע אין `registerSW` מפורש. נוסיף את הרישום מ-`vite-plugin-pwa` כדי להבטיח שה-SW נרשם ומתעדכן אוטומטית, כולל טיפול ב-offline.

### 2. הוספת `id` ל-manifest
Google ממליצה על שדה `id` ב-manifest כדי לזהות את ה-PWA באופן ייחודי. נוסיף `id: "/"` ל-manifest בקונפיגורציית Vite.

### 3. הוספת `screenshots` ל-manifest
Chrome בנייד מציג מסך התקנה משופר ("richer install UI") כשיש screenshots ב-manifest. נוסיף screenshots עם התמונות הקיימות.

### 4. הוספת `categories` ו-`prefer_related_applications: false`
כדי לציין במפורש שזו אפליקציית הווב ולא אפליקציה נייטיבית, ולסווג אותה נכון.

## קבצים שישתנו

| קובץ | שינוי |
|-------|-------|
| `vite.config.ts` | הוספת `id`, `screenshots`, `categories`, `prefer_related_applications` ל-manifest |
| `src/main.tsx` | הוספת רישום SW מפורש עם `registerSW` מ-`virtual:pwa-register` |

## פירוט טכני

**`src/main.tsx`** — הוספת:
```typescript
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
```

**`vite.config.ts`** — הוספה ל-manifest:
```typescript
id: "/",
categories: ["education", "kids"],
prefer_related_applications: false,
screenshots: [
  {
    src: "/splash-screen.png",
    sizes: "1200x630",
    type: "image/png",
    form_factor: "wide"
  }
]
```

