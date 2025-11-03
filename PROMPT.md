# עדכון טבלת המשקלים - חלוקה לקטגוריות ומשקלים היררכיים

## מטרת העדכון
לשדרג את טבלת המשקלים כך שתכלול חלוקה ברורה לקטגוריות, עם משקלים היררכיים ברמת קטגוריה ופרמטר, כולל הצגת משקלים מכל LLM (לעת עתה נתוני דמה).

## דרישות עיקריות

### 1. חלוקה לקטגוריות בטבלה
- הטבלה תתחלק לקטגוריות שונות (Groups) כפי שיוגדרו בהמשך
- כל קטגוריה תכלול מספר פרמטרים
- יש להציג את הקטגוריות באופן ברור וויזואלי (למשל עם כותרות קבוצות, רקע שונה, או separators)

### 2. משקלי ברירת מחדל של IIA

#### משקלי קטגוריות (ברירת מחדל):
- **Companies / Firms**: 24.444444%
- **Israeli Funding / Financing**: 23.703704%
- **Competition**: 17.777778%
- **Global Funding / Financing**: 11.111111%
- **Knowledge and Infrastructure**: 8.888889%
- **Human Capital**: 8.148148%
- **Academia**: 5.925926%
- **Total**: 100.000000%

#### חלוקת משקלים בתוך קטגוריה:
- כל פרמטר בתוך קטגוריה יקבל משקל שווה (משקל הקטגוריה ÷ מספר הפרמטרים בקטגוריה)
- משקלים אלה יהיו ברירת המחדל בעמודת "YOU" בהתחלה
- לחיצה על "IIA" תחזיר למשקלים האלה

### 3. שינוי משקלי קטגוריות

#### תכונות:
- אפשרות לשנות ידנית את משקל הקטגוריה (למשל עם slider או input)
- שינוי משקל קטגוריה ישפיע ישירות על כל הפרמטרים בקבוצה
- כל הפרמטרים בקבוצה יתעדכנו אוטומטית כך שיסכמו למשקל הקטגוריה החדש
- יש להציג את ערך הקטגוריה בכל לחיצה/שינוי

#### דוגמה:
אם משנה את "Competition" מ-17.78% ל-20%, ובתוך הקטגוריה יש 11 פרמטרים:
- כל פרמטר ישתנה מ-1.62% (17.78/11) ל-1.82% (20/11)
- המשקלים יתעדכנו אוטומטית בעמודת YOU

### 4. הצגת משקלים מ-LLMs (נתוני דמה)

#### דרישת:
- בשלב זה לא ננסה לעדכן משקלים בזמן אמת
- כל LLM יציג משקלים אקראיים שקרובים למשקלי ברירת המחדל אך עם מגוון

#### אלגוריתם ליצירת משקלים:
- לכל קטגוריה, LLM ימליץ על משקל שקרוב לברירת המחדל (בטווח של ±10-15%)
- המשקלים יכולים להיות מעט שונים בין LLMs שונים כדי ליצור מגוון
- בתוך כל קטגוריה, הפרמטרים יתחלקו שווה שווה
- הסכום הכולל של כל LLM חייב להיות 100%

#### דוגמה:
ברירת מחדל ל-"Competition": 17.78%
- LLM 1 יכול להמליץ: 16.5% (±7%)
- LLM 2 יכול להמליץ: 19.2% (±8%)
- LLM 3 יכול להמליץ: 18.0% (±1%)

### 5. כפתור הסבר (Tooltip) לכל LLM ואדם

#### מיקום:
- כפתור עם סימן שאלה (?) מעל כל עמודת LLM
- כפתור עם סימן שאלה (?) מעל כל עמודת משתמש (Participant)

#### תוכן:
- פסקה קצרה בנקודות שמסבירה את השיקול לבחירה במשקלים האלה
- כל LLM/משתמש יוכל להציג הסבר שונה

#### דוגמה לתוכן:
```
Why these weights?
• Emphasized Competition (18%) due to market saturation signals
• Reduced Global Funding (10%) based on current economic trends
• Balanced Israeli vs Global funding ratio for local focus
```

## רשימת קטגוריות ופרמטרים

### Competition (11 פרמטרים)
1. Number of IPOs in the sector worldwide in the past 5 years (2020–2025)
2. Number of companies worldwide that were acquired or merged in the past 5 years (2020–2025)
3. Number of active companies in the sector worldwide
4. Number of new companies in the past 5 years (2020–2025)
5. Number of companies in the sector worldwide that raised Pre-Seed & Seed rounds (2020–2025)
6. Number of companies in the sector worldwide that raised a Series A round (2020–2025)
7. Number of companies in the sector worldwide that raised Series B–C rounds (2020–2025)
8. Number of companies in the sector worldwide that raised late-stage rounds (2020–2025)
9. Ratio of companies that raised a Series A round out of those that raised a Seed round in the past 5 years (2020–2025)
10. "New blood" flow in the sector worldwide (new activities/active activities) (2020–2025)
11. Average age of an active company worldwide

### Global Funding / Financing (6 פרמטרים)
1. Total capital raised ($) (2020–2025)
2. Total capital raised in Pre-Seed & Seed rounds ($) (2020–2025)
3. Total capital raised in Series A rounds ($) (2020–2025)
4. Total capital raised in Series B–C rounds ($) (2020–2025)
5. Total capital raised in Series D–J rounds ($) (2020–2025)
6. Average IPO amount ($) for companies that went public between 2020–2025

### Human Capital (5 פרמטרים)
1. Number of incubators in the sector
2. Number of private accelerators in the sector
3. Number of communities in the sector
4. Number of employees in the sector
5. Number of professional non-academic training programs and entrepreneurship support frameworks

### Companies / Firms (14 פרמטרים)
1. Number of active companies in the sector in Israel
2. Number of new companies in the past 5 years (2019–2025)
3. Number of companies in the sector in Israel that raised Seed rounds (2020–2025)
4. Number of companies in the sector in Israel that raised a Series A round (2019–2025)
5. Number of companies in the sector in Israel that raised Series B–C rounds (2020–2025)
6. Number of companies in the sector in Israel that raised late-stage rounds (2020–2025)
7. % change in the number of companies that raised funding in the sector in the past 5 years (2019–2025 compared to 2014–2018)
8. Average age of an active company (years)
9. Number of active companies in Israel that reached the revenue growth stage (sales stage)
10. Number of companies acquired or merged in the past 5 years (2020–2025)
11. Number of IPOs in the past 5 years (2020–2025)
12. Number of acquiring companies in the past 5 years (2020–2025)
13. Ratio of companies that raised a Series A round out of those that raised a Seed or Pre-Seed round in the past 5 years (2020–2025)
14. "New blood" flow into the sector (new active companies ÷ active companies) (2020–2025)
15. Number of multinationals in the sector in Israel

### Israeli Funding / Financing
*לא סופקו פרמטרים - יש ליצור פרמטרים רלוונטיים*

### Knowledge and Infrastructure
*לא סופקו פרמטרים - יש ליצור פרמטרים רלוונטיים*

### Academia
*לא סופקו פרמטרים - יש ליצור פרמטרים רלוונטיים*

## פרמטרים שצריך ליצור לקטגוריות חסרות

### Israeli Funding / Financing (מוצע: 6-8 פרמטרים)
דוגמאות לפרמטרים אפשריים:
- Total capital raised in Israel ($) (2020–2025)
- Number of Israeli companies that raised funding in the sector (2020–2025)
- Average funding round size in Israel ($) (2020–2025)
- Total capital raised in Israeli Pre-Seed & Seed rounds ($) (2020–2025)
- Total capital raised in Israeli Series A rounds ($) (2020–2025)
- Total capital raised in Israeli Series B–C rounds ($) (2020–2025)
- Total capital raised in Israeli late-stage rounds ($) (2020–2025)
- Israeli funding growth rate (%) (2020–2025 compared to 2015–2019)

### Knowledge and Infrastructure (מוצע: 6-8 פרמטרים)
דוגמאות לפרמטרים אפשריים:
- Number of research institutions in the sector
- Number of patents filed in the sector (2020–2025)
- Number of scientific publications related to the sector (2020–2025)
- Number of R&D centers in the sector
- Infrastructure investment in the sector ($) (2020–2025)
- Number of technology transfer agreements (2020–2025)
- Number of innovation hubs in the sector
- Quality of sector infrastructure (index 0-100)

### Academia (מוצע: 6-8 פרמטרים)
דוגמאות לפרמטרים אפשריים:
- Number of academic programs related to the sector
- Number of students enrolled in sector-related programs
- Number of researchers in the sector
- Number of university-industry collaborations (2020–2025)
- Number of academic spin-offs in the sector (2020–2025)
- Research funding in the sector ($) (2020–2025)
- Number of PhD graduates in sector-related fields (2020–2025)
- Number of academic institutions with sector programs

## מבנה הנתונים המוצע

```typescript
interface Parameter {
  id: number;
  short: string;
  full: string;
  category: string;
}

interface Category {
  name: string;
  defaultWeight: number;
  parameters: Parameter[];
}

interface LLMWeightRecommendation {
  llmName: string;
  categoryWeights: Record<string, number>; // קטגוריה -> משקל
  explanation: string; // ההסבר לשיקול
}

interface UserWeight {
  categoryWeights: Record<string, number>;
  parameterWeights: Record<number, number>; // פרמטר ID -> משקל
}
```

## הוראות יישום

### שלב 1: ארגון הנתונים
1. ליצור מבנה נתונים שמארגן פרמטרים לפי קטגוריות
2. לכל קטגוריה יש משקל ברירת מחדל
3. לכל פרמטר יש קישור לקטגוריה שלו

### שלב 2: הצגת הטבלה
1. הטבלה תתחלק לקבוצות ויזואליות לפי קטגוריות
2. כל קטגוריה תהיה עם כותרת ורקע מובחן
3. הפרמטרים יוצגו תחת הקטגוריה שלהם

### שלב 3: משקלי IIA
1. בעת טעינה ראשונית, לחשב משקלים לפי:
   - משקל קטגוריה ÷ מספר פרמטרים בקטגוריה
2. כל פרמטר יקבל את המשקל המחושב
3. לחיצה על IIA תחזיר למשקלים האלה

### שלב 4: שינוי משקל קטגוריה
1. להוסיף slider או input ליד כל כותרת קטגוריה
2. שינוי המשקל יעדכן אוטומטית את כל הפרמטרים בקטגוריה
3. המשקלים יתעדכנו כך שיסכמו למשקל הקטגוריה החדש

### שלב 5: יצירת משקלי LLMs
1. לכל LLM, ליצור משקלי קטגוריות אקראיים קרובים לברירת מחדל (±10-15%)
2. לנרמל את המשקלים כך שיסכמו ל-100%
3. לחשב משקלי פרמטרים לפי: משקל קטגוריה ÷ מספר פרמטרים

### שלב 6: הוספת כפתורי הסבר
1. להוסיף כפתור (?) ליד כל LLM
2. להוסיף כפתור (?) ליד כל משתמש
3. על hover/click להציג tooltip עם הסבר קצר בנקודות

## הערות חשובות
- כל השינויים חייבים לשמור על סכום כולל של 100%
- יש לוודא שהמשקלים תמיד חיוביים
- יש לשמור על עקביות בין משקלי קטגוריות למשקלי פרמטרים
- יש להציג הודעות ברורות כשמשנים משקלים

