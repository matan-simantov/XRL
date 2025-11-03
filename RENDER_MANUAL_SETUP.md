# הוראות עדכון ידני ב-Render Dashboard

## ⚠️ הבעיה
Render לא מוצא את `server.js` כי הוא מחפש אותו בתיקייה הלא נכונה.

## ✅ הפתרון - עדכון ידני (הכי בטוח)

### שלב 1: עדכן את ה-Backend Service
1. לך ל-Render Dashboard: https://dashboard.render.com
2. מצא את השירות **"xrl-backend"** (או צור אחד חדש אם אין)
3. לחץ עליו כדי לפתוח את ההגדרות

### שלב 2: עדכן את Root Directory (זה המפתח!)
1. לחץ על "Settings" (הגדרות) בצד שמאל
2. גלול למטה עד שדה **"Root Directory"**
3. הזן: `backend`
4. **שמור את השינויים** (Save Changes)

### שלב 3: עדכן את הפקודות
1. מצא את השדה **"Build Command"**
2. הזן: `npm install`
3. מצא את השדה **"Start Command"**
4. הזן: `npm start`
5. **שמור את השינויים שוב**

### שלב 4: Deploy מחדש
1. לחץ על "Manual Deploy" בתפריט העליון
2. בחר "Clear build cache & deploy"
3. חכה שה-Deploy יסתיים

## ✅ אחרי ה-Deploy

בדוק את הלוגים - אתה אמור לראות:
```
Server is running on port 10000
```

אם אתה רואה את זה, הכל עובד! ✅

## 🔧 אם עדיין לא עובד

1. בדוק שהתיקייה `backend/` קיימת ב-Git repository שלך
2. בדוק ש-`backend/server.js` קיים
3. בדוק ש-`backend/package.json` קיים
4. מחק את ה-service וצור אותו מחדש עם ההגדרות הנכונות

## 📝 סיכום ההגדרות הנכונות

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Node
- **Plan:** Free (או כל תוכנית אחרת)

---

**הערה:** Blueprints ב-Render לא תומכים טוב ב-rootDir ב-render.yaml, לכן עדכון ידני הוא הפתרון הכי בטוח!

git add .
git commit