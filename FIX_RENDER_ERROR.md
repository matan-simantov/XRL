# תיקון שגיאת Render - Cannot find module server.js

## הבעיה
השגיאה: `Error: Cannot find module '/opt/render/project/src/server.js'`

Render מחפש את `server.js` בתיקייה הלא נכונה.

## הפתרון

### אופציה 1: עדכון render.yaml (מומלץ)
עודכנו את `render.yaml` להוסיף `rootDir: backend`:
```yaml
- type: web
  name: xrl-backend
  env: node
  rootDir: backend  # ⬅️ זה התיקון!
  buildCommand: npm install
  startCommand: npm start
```

**לאחר העדכון:**
1. Push את השינויים ל-Git
2. ב-Render Dashboard, לחץ על "Manual Deploy" → "Clear build cache & deploy"

### אופציה 2: עדכון ידני ב-Render Dashboard

אם אתה משתמש בהגדרות ידניות ב-Render:

1. לך ל-service שלך ב-Render Dashboard
2. לחץ על "Settings"
3. מצא את השדה **"Root Directory"**
4. הזן: `backend`
5. שמור
6. לחץ על "Manual Deploy" → "Clear build cache & deploy"

### אופציה 3: אם עדיין לא עובד

בדוק שהמבנה נכון:
```
/backend/
  ├── server.js      ← הקובץ צריך להיות כאן
  ├── package.json
  └── node_modules/
```

אם הקובץ לא שם, העתק אותו:
```bash
# ודא שאתה בתיקיית הפרויקט הראשית
ls -la backend/server.js  # צריך להראות שהקובץ קיים
```

### אופציה 4: אם אתה לא צריך את ה-Backend

אם אתה לא צריך את ה-backend service כרגע:
1. מחק את ה-backend service ב-Render
2. או הערה את החלק הזה ב-`render.yaml`:
```yaml
#  - type: web
#    name: xrl-backend
#    ...
```

הפרונט-אנד אמור לעבוד גם בלי ה-backend!

## בדיקה

לאחר התיקון, ה-backend אמור להתחיל בהצלחה ולהחזיר:
```
Server is running on port 10000
```

בדוק את הלוגים ב-Render Dashboard כדי לוודא שהכל עובד.

