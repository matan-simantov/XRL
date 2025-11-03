# הוראות פריסה ל-Netlify

## ✅ מה כבר מוכן

1. ✅ קובץ `netlify.toml` נוצר עם ההגדרות הנכונות
2. ✅ קובץ `public/_redirects` קיים לניהול SPA routing
3. ✅ Build script קיים ב-`package.json`: `npm run build`
4. ✅ Output directory: `dist/`

## 📋 הגדרות Netlify

### אוטומטית (מומלץ - דרך netlify.toml):
Netlify יזהה את `netlify.toml` וישתמש בהגדרות הבאות:
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18
- **Redirects:** כל הנתיבים מועברים ל-`index.html` (SPA routing)

### ידנית:
אם אתה מגדיר ידנית ב-Netlify Dashboard:
1. **Build command:** `npm install && npm run build`
2. **Publish directory:** `dist`
3. **Node version:** 18 (או חדש יותר)

## 🚀 פריסה ל-Netlify

### אופציה 1: דרך Netlify Dashboard (הפשוטה)
1. לך ל-https://app.netlify.com
2. לחץ על "Add new site" → "Import an existing project"
3. חבר את ה-GitHub repository שלך
4. Netlify יזהה את `netlify.toml` וישתמש בהגדרות שלו
5. לחץ על "Deploy site"

### אופציה 2: דרך Netlify CLI
```bash
# התקן Netlify CLI (אם לא מותקן)
npm install -g netlify-cli

# התחבר לחשבון Netlify
netlify login

# פרוס
netlify deploy --prod
```

## 🔍 פתרון בעיות נפוצות

### בעיה: Build נכשל
**פתרון:**
1. בדוק שהלוג המלא ב-Netlify Dashboard
2. ודא ש-Node version הוא 18 או חדש יותר
3. ודא שכל התלויות ב-`package.json`
4. רץ `npm run build` מקומית ובדוק אם זה עובד

### בעיה: 404 על routes (SPA routing לא עובד)
**פתרון:**
1. ודא ש-`public/_redirects` קיים
2. ודא ש-`netlify.toml` כולל את ה-redirect rule
3. בדוק ש-`_redirects` נעתק ל-`dist/` אחרי build

### בעיה: Environment variables
אם אתה צריך environment variables:
1. לך ל-Netlify Dashboard → Site settings → Environment variables
2. הוסף את ה-variables הנדרשים

## ✅ בדיקה לאחר פריסה

1. בדוק שה-site נטען: `https://your-site.netlify.app`
2. בדוק ש-SPA routing עובד (נווט ל-different routes)
3. בדוק את הלוגים ב-Netlify Dashboard אם יש בעיות

## 📝 קבצים חשובים

- `netlify.toml` - הגדרות פריסה
- `public/_redirects` - SPA routing
- `package.json` - Build scripts
- `vite.config.ts` - Vite configuration

---

**הערה:** אם אתה מקבל שגיאת build ב-Netlify, שלח את הלוג המלא ואני אעזור לפתור!

