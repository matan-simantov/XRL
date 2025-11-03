# הוראות הגדרה ב-n8n

## אין צורך בשינויים ב-n8n

הכל אמור לעבוד עם ההגדרות הקיימות שלך.

## מה שכבר מוגדר:

### Webhooks קיימים:
1. **Crunchbase Input:**
   - URL: `https://shooky5.app.n8n.cloud/webhook/xrl-crunchbase-input`
   - נשלח מה-Backend: `POST /api/crunchbase`

2. **XRL DataToPlatform:**
   - URL: `https://shooky5.app.n8n.cloud/webhook/XRL_DataToPlatform`
   - נשלח מה-Backend: `POST /api/xrl-data-to-platform`

### Callback Endpoint (אופציונלי - רק אם תרצה לשלוח תוצאות חזרה):

אם תרצה ש-n8n ישלח תוצאות חזרה ל-Backend, הגדר:

**HTTP Request Node:**
- **Method:** POST
- **URL:** `https://xrl.onrender.com/api/n8n/callback`
- **Headers:**
  - `Content-Type: application/json`
  - `x-n8n-secret: <הערך של N8N_CALLBACK_SECRET מ-Render>`
- **Body:**
```json
{
  "runId": "{{ $json.runId }}",
  "results": {
    "{{ domain }}": {
      "{{ paramIndex }}": {{ value }}
    }
  }
}
```

## בדיקה:

1. ודא שה-webhooks פעילים ב-n8n
2. שלח טופס מהפלטפורמה
3. בדוק ב-n8n Execution History שהנתונים הגיעו

## הערות:

- אין צורך לשנות כלום ב-n8n עבור התיקון הנוכחי
- הבעיה הייתה ב-Backend (CORS), לא ב-n8n
- אם תרצה להפעיל את ה-callback feature, תצטרך להוסיף את ה-HTTP Request node כפי שמוסבר למעלה

