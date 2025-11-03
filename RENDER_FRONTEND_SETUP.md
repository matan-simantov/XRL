# הוראות פריסת Frontend ב-Render

## ✅ מה מוכן

1. ✅ קובץ `render.yaml` מוגדר עם Frontend Static Site
2. ✅ Build script קיים: `npm run build`
3. ✅ Output directory: `dist/`
4. ✅ SPA routing מוגדר (כל הנתיבים מועברים ל-`/index.html`)
5. ✅ Security headers מוגדרים

## 📋 הגדרות ב-render.yaml

```yaml
- type: web
  name: xrl-frontend
  env: static
  plan: free
  buildCommand: npm ci && npm run build
  staticPublishPath: dist
  routes:
    - type: rewrite
      source: /*
      destination: /index.html
```

## 🚀 פריסה ב-Render

### אופציה 1: Blueprint (אוטומטי - מומלץ)
1. לך ל-Render Dashboard: https://dashboard.render.com
2. לחץ על "New" → "Blueprint"
3. חבר את ה-GitHub repository שלך
4. Render יזהה את `render.yaml` ויצור את ה-Frontend service אוטומטית
5. לחץ על "Apply"

### אופציה 2: Static Site ידני
1. לך ל-Render Dashboard
2. לחץ על "New" → "Static Site"
3. חבר את ה-GitHub repository
4. הגדר:
   - **Name:** `xrl-frontend`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
   - **Environment:** Static Site
5. שמור ופרוס

## ⚙️ Environment Variables (אם נדרש)

אם יש environment variables שצריכים להיות זמינים בפרונט:
1. לך ל-Settings → Environment
2. הוסף variables עם תחילית `VITE_`:
   ```
   VITE_API_URL=https://your-api.com
   VITE_N8N_URL=https://shooky5.app.n8n.cloud/webhook/XXX
   ```

**חשוב:** רק variables שמתחילים ב-`VITE_` יהיו זמינים בקוד ה-frontend!

## 📝 SPA Routing

Render משתמש ב-`routes` ב-`render.yaml` לניהול SPA routing. כל הנתיבים מועברים ל-`/index.html` כך ש-React Router יעבוד.

## 🔍 בדיקה לאחר פריסה

1. בדוק שה-site נטען: `https://xrl-frontend.onrender.com`
2. בדוק ש-routing עובד - נסה לנווט ל-`/dashboard`, `/auth` וכו'
3. בדוק את הלוגים ב-Render Dashboard אם יש בעיות

## ⚠️ הערות חשובות

- **Build Command:** משתמש ב-`npm ci` במקום `npm install` (מהיר יותר ויותר בטוח ב-CI/CD)
- **Publish Directory:** חייב להיות `dist` (ללא `./`)
- **Node Version:** Render משתמש ב-Node 20 אוטומטית
- **_redirects:** הקובץ `public/_redirects` לא נדרש כי Render משתמש ב-`routes` ב-YAML

## 🔧 פתרון בעיות

### Build נכשל
1. בדוק את הלוגים המלאים ב-Render Dashboard
2. ודא ש-`package.json` כולל `build` script
3. ודא שכל התלויות ב-`package.json`

### Routing לא עובד (404 על routes)
1. ודא שה-`routes` מוגדר נכון ב-`render.yaml`
2. בדוק שה-`staticPublishPath` הוא `dist`

### Environment variables לא עובדים
1. ודא שהם מתחילים ב-`VITE_`
2. בדוק שהם מוגדרים ב-Render Dashboard → Environment
3. Rebuild את ה-site אחרי הוספת variables

---

**Ready to deploy! 🚀**

