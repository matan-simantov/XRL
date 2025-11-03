# פורמט הנתונים מ-n8n

## מה ה-backend מצפה לקבל

### פורמט מומלץ (מומלץ):

```json
{
  "runId": "abc-123-def",
  "results": {
    "Energy Storage": {
      "0": 45,
      "1": 123,
      "2": 789
    },
    "Solar": {
      "0": 67,
      "1": 234
    }
  }
}
```

### פורמט שנתמך כרגע (אוטומטי):

ה-backend תומך גם בפורמט שמגיע מ-n8n:

```json
{
  "domains": {
    "Domain 1": "Energy Storage",
    "Domain 2": "Solar",
    "Domain 3": ""
  },
  "meta": {
    "runId": "abc-123",
    "flow": "XRL-Data-Platform"
  }
}
```

ה-backend ימיר אוטומטית לפורמט הנדרש.

## איך להגדיר ב-n8n

### אפשרות 1: פורמט מומלץ (עם כל הנתונים)

**Body ב-HTTP Request node:**

```json
{
  "runId": "{{ $json.runId }}",
  "results": {
    "{{ $json.domain1 }}": {
      "0": {{ $json.value1 }},
      "1": {{ $json.value2 }},
      "2": {{ $json.value3 }}
    },
    "{{ $json.domain2 }}": {
      "0": {{ $json.value4 }}
    }
  }
}
```

### אפשרות 2: פורמט פשוט (רק domain names)

אם אתה שולח רק את שמות הדומיינים, ה-backend יהמיר אוטומטית:

```json
{
  "domains": {
    "Domain 1": "{{ $json.domainName1 }}",
    "Domain 2": "{{ $json.domainName2 }}",
    "Domain 3": "{{ $json.domainName3 }}"
  },
  "meta": {
    "runId": "{{ $json.runId }}",
    "flow": "XRL-Data-Platform"
  }
}
```

**חשוב:** אם תשלח פורמט זה, ה-backend ישמור את הערכים כ-parameter 0.

## אם אתה רוצה לשלוח נתונים מספריים:

אם יש לך נתונים מספריים (כמו "1528"), צריך לשלוח אותם בפורמט הנכון:

```json
{
  "runId": "{{ $json.runId }}",
  "results": {
    "{{ $json.domain }}": {
      "0": {{ $json.numberValue }}
    }
  }
}
```

**דוגמה:**
```json
{
  "runId": "123",
  "results": {
    "Energy Storage": {
      "0": 1528
    }
  }
}
```

## מה לשנות ב-n8n

1. **בחלק "Send Body" של ה-HTTP Request node:**
   - שנה ל-"Using Fields Below"
   - או הגדר את ה-Body כפי שמופיע למעלה

2. **ודא שאתה שולח:**
   - `runId` - מזהה ייחודי
   - `results` - אובייקט עם הנתונים בפורמט `{ [domain]: { [paramIndex]: value } }`

3. **אם יש לך רק domain names:**
   - השתמש בפורמט הפשוט עם `domains` object
   - ה-backend יהמיר אוטומטית

## בדיקה

לאחר שליחה, בדוק את ה-Logs ב-Render:
- חפש "callback payload:" - זה יראה מה בדיוק הגיע
- חפש "Converted format" - זה יראה את הפורמט שהומר
- חפש "Results saved for runId" - זה יראה מה נשמר

