

## Update Privacy Policy and Terms of Use Content

Replace the lengthy legal text in both existing pages with the concise, user-friendly versions provided, while keeping the current page structure, styling, and RTL layout intact.

---

### 1. Privacy Policy (`src/pages/PrivacyPolicy.tsx`)

**What changes:**
- Remove the `ScrollArea` wrapper (no longer needed -- the content is short)
- Replace all 10 numbered sections with 5 simple paragraphs/bullet points:
  - Opening statement (header subtitle already has it)
  - "המידע שאנו אוספים" -- name, age, email
  - "אבטחה" -- secured servers, no third-party sharing
  - "בינה מלאכותית" -- data used only for story creation
  - "זכות המחיקה" -- delete account anytime via Settings
- Keep the header (Shield icon, title), the card wrapper, RTL direction, and the back button unchanged

### 2. Terms of Use (`src/pages/TermsOfService.tsx`)

**What changes:**
- Remove the `ScrollArea` wrapper (content is now short)
- Replace all 14 numbered sections with 5 simple items:
  - Opening statement: "השימוש ב-StoryTime מהווה הסכמה לתנאים הבאים"
  - "אחריות" -- AI content, parent responsibility
  - "קרדיטים" -- credit deduction, non-refundable
  - "תשלום" -- credit card payment without PayPal account
  - "שימוש הוגן" -- no offensive content
- Keep the header (FileText icon, title), the card wrapper, RTL direction, and the back button unchanged

### Technical Details

- Both files: remove the `ScrollArea` import and component since the content fits without scrolling
- Keep the existing `bg-card rounded-2xl border shadow-sm p-6` card styling
- Present each topic as a bold label followed by its description, using the same `text-muted-foreground` styling
- No new routes, components, or dependencies needed
