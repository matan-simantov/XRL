# הגדרת משתני סביבה ב-Render

## משתנה סביבה לפרונט

כדי שהפרונט יתחבר ל-backend ב-Render, יש להוסיף משתנה סביבה:

### שם המשתנה:
```
VITE_API_URL
```

### הערך:
```
https://xrl.onrender.com
```

### איך להוסיף ב-Render:

1. לך ל-Render Dashboard
2. בחר את ה-Static Site (פרונט)
3. לחץ על "Environment" בתפריט השמאלי
4. לחץ על "Add Environment Variable"
5. הוסף:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://xrl.onrender.com`
6. לחץ על "Save Changes"
7. Render יבצע rebuild אוטומטית

### הערות:

- משתנה זה נגיש בקוד דרך `import.meta.env.VITE_API_URL`
- אם המשתנה לא מוגדר, הקוד ישתמש בערך ברירת המחדל: `https://xrl.onrender.com`
- ודא שה-backend כבר רץ ב-Render לפני שאתה מגדיר את המשתנה

