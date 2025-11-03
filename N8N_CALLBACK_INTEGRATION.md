# אינטגרציה של n8n Callback עם טבלת התוצאות

## איך זה עובד

### 1. Flow הנתונים

```
n8n מעבד נתונים
    ↓
שולח POST ל-https://xrl.onrender.com/api/n8n/callback
    ↓
Backend מאמת secret ומקבל:
{
  runId: "uuid-here",
  results: {
    "domain1": {
      0: 123,  // paramIndex: value
      1: 456,
      ...
    },
    "domain2": {
      0: 789,
      ...
    }
  }
}
    ↓
Backend שומר ב-cache (או database)
    ↓
Frontend קורא /api/results/:runId
    ↓
Backend מחזיר results
    ↓
Frontend מעדכן localStorage
    ↓
טבלת התוצאות מציגה את הנתונים
```

## 2. מבנה הנתונים

### מה n8n שולח ל-backend:

```json
{
  "runId": "abc-123-def",
  "results": {
    "Energy Storage": {
      "0": 45,   // Parameter 0 value for Energy Storage
      "1": 123,  // Parameter 1 value for Energy Storage
      "2": 789,
      ...
    },
    "Solar": {
      "0": 67,
      "1": 234,
      ...
    }
  }
}
```

### מה ה-backend שומר:

```javascript
resultsCache.set(runId, {
  runId: "abc-123-def",
  results: {
    "Energy Storage": { 0: 45, 1: 123, ... },
    "Solar": { 0: 67, 1: 234, ... }
  },
  receivedAt: "2024-01-01T12:00:00Z"
})
```

### מה טבלת התוצאות מצפה:

```typescript
resultData: Record<string, Record<number, number>>
// { [domain]: { [paramIndex]: value } }
```

## 3. הגדרת n8n

כשמגדירים callback ב-n8n:

**URL:** `https://xrl.onrender.com/api/n8n/callback`

**Method:** `POST`

**Headers:**
```
x-n8n-secret: <N8N_CALLBACK_SECRET>
Content-Type: application/json
```

**Body:**
```json
{
  "runId": "{{ $json.runId }}",
  "results": {
    "{{ domain }}": {
      "{{ paramIndex }}": {{ value }},
      ...
    }
  }
}
```

## 4. Environment Variables

### Backend:
```
N8N_CALLBACK_SECRET=your-secret-key-here
```

## 5. עדכון אוטומטי

המשתמש פותח את טבלת התוצאות:

1. הקוד בודק אם יש `formData?.id` (runId)
2. קורא ל-`fetchResultsFromN8n(runId)`
3. אם יש תוצאות, מעדכן את `resultData` state
4. הטבלה מציגה את הנתונים

## 6. שמירה ב-localStorage

הנתונים נשמרים אוטומטית ב-localStorage תחת:
```
xrl:{username}:runs
```

בתוך כל run:
```json
{
  "id": "runId",
  ...
  "tableState": {
    "resultData": {
      "domain": { 0: 123, 1: 456, ... }
    }
  }
}
```

## 7. הערות

- **Cache בשרת:** כרגע הנתונים נשמרים ב-Map בזיכרון. בפרודקשן, יש לשמור בדאטהבייס
- **Polling:** אין polling אוטומטי - המשתמש צריך לפתוח את הטבלה כדי לראות עדכונים
- **Format:** ודא שהנתונים מ-n8n במבנה הנכון: `{ [domain]: { [paramIndex]: number } }`

## 8. דוגמת קוד ב-n8n

```javascript
// In n8n workflow
const results = {
  "Energy Storage": {
    "0": 45,
    "1": 123,
    // ... more parameters
  },
  "Solar": {
    "0": 67,
    // ...
  }
}

return {
  json: {
    runId: $json.runId,
    results: results
  }
}
```

