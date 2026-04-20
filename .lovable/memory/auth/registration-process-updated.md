---
name: registration-process-updated
description: Auth.tsx signup flow - terms enforcement persisted on signup for ALL roles, /onboarding bypassed
type: feature
---
תהליך ההרשמה (Auth.tsx) כולל אימות תנאי שימוש חובה ושדה אופציונלי לקוד הפניה. משתמשים חדשים מקבלים קרדיט אחד במתנה (הורים) או 3 קרדיטים (אנשי חינוך). המערכת מבצעת התחברות אוטומטית (auto-login) ומציגה באנר ברוכים הבאים. הגישה לנתוני אימייל של משתמשים מתאפשרת דרך פונקציית RPC מאובטחת ('get_admin_user_emails'). הרשמה יכולה להתבצע גם באמצעות Google OAuth.

חשוב: עבור כל המשתמשים (הורים ואנשי חינוך כאחד) שאישרו תנאים בטופס ההרשמה, הערך terms_accepted_at נכתב מיידית לפרופיל לאחר signup (אימייל) או לאחר חזרה מ-OAuth (Google, באמצעות דגל localStorage 'pending_educator_terms_accept' - שם מקורי נשמר לתאימות לאחור). כתוצאה מכך מסך /onboarding נדלג עבור כל ההרשמות החדשות והם מנותבים ישירות ל-/adventure. המסך נשאר כ-fallback בלבד עבור חשבונות ישנים (legacy) שאין להם terms_accepted_at.
