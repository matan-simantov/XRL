# תיקון בעיית SPA Routing ב-Render

## הבעיה:
כשרועננים את הדף ב-`/dashboard/new-form`, מקבלים 404.
זו בעיה נפוצה ב-Single Page Applications (SPA) - השרת מחפש קובץ בשם `new-form` ולא מוצא אותו.

## הפתרון - הגדרת Redirect/Rewrite ב-Render Dashboard:

Render Static Sites לא תומכים אוטומטית ב-SPA routing. **חובה להגדיר ידנית:**

### צעדים:
1. לך ל-[Render Dashboard](https://dashboard.render.com)
2. בחר את ה-Static Site שלך (`xrl-frontend`)
3. לחץ על **"Settings"** בתפריט השמאלי
4. גלול למטה ל-**"Redirects/Rewrites"** section
5. לחץ על **"Add Redirect/Rewrite"**
6. מלא את הפרטים:
   - **Source Path:** `/*` (כל הנתיבים)
   - **Destination Path:** `/index.html`
   - **Status Code:** `200` (חשוב! זה Rewrite, לא Redirect)
   - **Type:** `Rewrite` (אם יש אופציה)
7. לחץ על **"Save"**

### למה זה חשוב?
- ללא הגדרה זו, כל רענון בדף יגרום ל-404
- עם הגדרה זו, כל בקשה תחזיר את `index.html` ו-React Router יקח שליטה

### בדיקה:
לאחר ההגדרה:
1. בדוק שהאתר עדיין עובד
2. נסה לרענן את הדף ב-`/dashboard/new-form` - זה אמור לעבוד
3. נסה לגשת ישירות ל-`/dashboard/history` - גם זה אמור לעבוד

## הערה טכנית:
ה-`_redirects` file ב-`public/` לא עובד ב-Render Static Sites כמו ב-Netlify.
צריך להגדיר את זה ידנית ב-Dashboard.
