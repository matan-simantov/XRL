# מדריך פריסה - Frontend → Backend → n8n

## ארכיטקטורה

הפרויקט משתמש בארכיטקטורה פשוטה:
- **Frontend** (React/Vite) → **Backend** (Express) → **n8n Webhooks**

הבקשות הן **סינכרוניות** - ה-Frontend מחכה לתשובה מה-Backend, וה-Backend מחכה לתשובה מ-n8n.

## הגדרות סביבה ב-Render

### Backend Web Service

#### Environment Variables:
```
FRONTEND_ORIGIN=https://xrl-front.onrender.com
N8N_WEBHOOK_URL=https://shooky5.app.n8n.cloud/webhook/xrl
N8N_CRUNCHBASE_URL=https://shooky5.app.n8n.cloud/webhook/xrl-crunchbase-input
N8N_XRL_DATA_URL=https://shooky5.app.n8n.cloud/webhook/XRL_DataToPlatform
N8N_RESULTS_URL=https://shooky5.app.n8n.cloud/webhook-test/XRL_DataToPlatform
N8N_CALLBACK_SECRET=your-secret-key-here
PORT=10000
```

#### Build & Start:
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Frontend Static Site

#### Environment Variables:
```
VITE_API_URL=https://xrl.onrender.com
```

#### Build & Publish:
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`

#### חשוב:
לכל שינוי ב-Env Variables ב-Frontend, יש לבצע **Manual Deploy** → **Clear build cache and deploy**.

## וידוא שהכל עובד

1. **בדיקת Backend Health:**
   - פתח את DevTools → Network
   - חפש קריאה ל-`/api/health`
   - צריך לקבל `200 OK` עם `{ ok: true, service: "api" }`

2. **בדיקת חיבור ל-n8n:**
   - שלח טופס מהפלטפורמה
   - בדוק ב-Network tab שהקריאות ל-`/api/crunchbase` ו-`/api/xrl-data-to-platform` מחזירות תשובות

3. **בדיקת Console:**
   - פתח Console
   - אמור לראות: `Backend connection successful: { ok: true, service: "api" }`

## מבנה הקוד

### Backend (`backend/server.js`)
- Express server עם ESM (ES Modules)
- פרוקסי סינכרוני לכל webhooks של n8n
- CORS מוגדר לפי `FRONTEND_ORIGIN`

### Frontend (`src/lib/api.ts`)
- כל הקריאות ל-API עוברות דרך `VITE_API_URL`
- פונקציות: `ping()`, `sendToCrunchbase()`, `sendToXRLDataToPlatformDirect()`

## פתרון בעיות

### Backend לא עונה:
- בדוק שה-PORT נכון ב-Render
- בדוק שה-Env Variables מוגדרות
- בדוק את ה-Logs ב-Render Dashboard

### Frontend לא מתחבר ל-Backend:
- ודא ש-`VITE_API_URL` מוגדר נכון
- נקה cache ועשה Manual Deploy
- בדוק ב-Console אם יש שגיאות CORS

### n8n לא מקבל נתונים:
- בדוק ש-`N8N_WEBHOOK_URL` ושאר ה-URLs נכונים
- בדוק ב-Backend logs אם יש שגיאות
- ודא שה-webhooks פעילים ב-n8n

