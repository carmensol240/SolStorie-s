

## תיקון מגדר דמויות הקאסט במסך הטעינה

### שינויים

**`src/components/wizard/GeneratingStep.tsx`:**

1. **הוספת שדה מגדר ופעולה לכל דמות** במערך `CAST_CHARACTERS` (שורה 29-35):
```typescript
const CAST_CHARACTERS = [
  { name: "סול", image: castSolAdventure, emoji: "🦸‍♀️", verb: "מכינה" },
  { name: "בן", image: castBenArt, emoji: "🎨", verb: "מכין" },
  { name: "מיה", image: castMiaNature, emoji: "🌿", verb: "מכינה" },
  { name: "ליאו", image: castLeoScience, emoji: "🔬", verb: "מכין" },
  { name: "זואי", image: castZoeSports, emoji: "⚽", verb: "מכינה" },
];
```

2. **שימוש בפעולה המגדרית** (שורה 420):
```
{currentChar.name} {currentChar.verb} את האיורים... 🎨
```

### עדכון דמות בן בזיכרון

בן הוא האח הקטן של סול — שיער שחור מתולתל מאוד, עור שחום, הדמות הקטנה ביותר בקאסט. התמונה שהועלתה מראה אותו בסגנון Pixar 3D עם תלתלים שחורים וחיוך רחב. אעדכן את הזיכרון כדי לחזק את התיאור שלו עבור איורים עתידיים.

