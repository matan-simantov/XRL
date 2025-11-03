# הוראות תיקון ב-Render

## בעיות שנמצאו:
1. **CORS Error** - ה-backend לא מאפשר גישה מה-frontend
2. **500 Internal Server Error** - שגיאה בשרת

## ✅ מה שתוקן בקוד:
- שיפור הגדרת CORS לתמוך ב-preflight requests
- הוספת logging מפורט לזיהוי בעיות
- שיפור error handling

## 🔧 שינויים נדרשים ב-Render:

### 1. Backend Service (`xrl.onrender.com`)

#### Environment Variables - ודא שהן מוגדרות כך:

```
FRONTEND_ORIGIN=https://xrl-front.onrender.com
N8N_WEBHOOK_URL=https://shooky5.app.n8n.cloud/webhook/xrl
N8N_CRUNCHBASE_URL=https://shooky5.app.n8n.cloud/webhook/xrl-crunchbase-input
N8N_XRL_DATA_URL=https://shooky5.app.n8n.cloud/webhook/XRL_DataToPlatform
N8N_RESULTS_URL=https://shooky5.app.n8n.cloud/webhook-test/XRL_DataToPlatform
N8N_CALLBACK_SECRET=your-secret-key-here
PORT=10000
```

**חשוב:** 
- `FRONTEND_ORIGIN` צריך להיות בדיוק `https://xrl-front.onrender.com` (ללא slash בסוף)
- אם יש לך כמה domains, אפשר להפריד בפסיק: `https://xrl-front.onrender.com,https://other-domain.com`

#### Build & Start Commands:
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`

**או אם הגדרת Root Directory:**

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 2. Frontend Static Site (`xrl-front.onrender.com`)

#### Environment Variables:

```
VITE_API_URL=https://xrl.onrender.com
```

**חשוב:** 
- ודא שהכתובת נכונה (ללא slash בסוף)
- לאחר כל שינוי ב-Env Variables, בצע **Manual Deploy** → **Clear build cache and deploy**

### 3. פעולות לביצוע:

1. **עדכן את ה-Environment Variables** ב-Backend (בעיקר `FRONTEND_ORIGIN`)
2. **בצע Manual Deploy** ל-Backend עם Clear build cache
3. **בצע Manual Deploy** ל-Frontend עם Clear build cache
4. **בדוק את ה-Logs** ב-Render Dashboard:
   - פתח את ה-Backend service
   - לך ל-Logs
   - בדוק אם יש שגיאות או הודעות חדשות

### 4. בדיקות לאחר התיקון:

1. פתח את `https://xrl-front.onrender.com`
2. פתח DevTools → Console
3. שלח טופס
4. בדוק:
   - אין שגיאות CORS
   - אין 500 errors
   - רואה הודעות "Crunchbase webhook sent successfully"
   - רואה הודעות "XRL DataToPlatform webhook sent successfully"

## 🔍 אם עדיין יש בעיות:

### בדוק את ה-Logs ב-Render:
1. לך ל-Backend service → Logs
2. חפש שגיאות הקשורות ל:
   - `crunchbase proxy error`
   - `xrl-data-to-platform proxy error`
   - `CORS`

### בדוק את ה-Environment Variables:
- ודא ש-`FRONTEND_ORIGIN` תואם בדיוק לכתובת ה-Frontend
- ודא שכל ה-URLs של n8n נכונים

### בדוק את n8n:
- ודא שה-webhooks פעילים
- בדוק שה-URLs ב-n8n תואמים לאלו ב-Backend

