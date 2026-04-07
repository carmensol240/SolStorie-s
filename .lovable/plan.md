

## Plan: Improve 402/Billing Error Handling in Story Generation

### Problem
When the AI Gateway returns 402 (out of credits), the edge function correctly returns a 503 with "שגיאת מערכת זמנית" message. However, the frontend:
1. Doesn't extract the specific error message from the response
2. Auto-retries 3 times (wasting time on an error that won't resolve)
3. Shows a generic "לא הצלחנו ליצור את הסיפור" instead of the system overload message

### About Netlify / Auto Top-Up
This project runs on **Lovable Cloud**, not Netlify. The AI Gateway credits are managed by Lovable. To add funds: go to **Settings → Cloud & AI balance** in your Lovable workspace. There is no code-level auto top-up — it's a workspace billing setting.

### Fix — single file: `src/components/wizard/GeneratingStep.tsx`

**1. Detect billing/system errors and skip retries (lines 262-273)**

After checking `apiError`, also check for system/billing errors and throw with the specific message so it's not retried:

```ts
if (apiError) {
  console.error("API error:", apiError);
  // Extract error body for billing/system errors (503 from gateway quota)
  const errorBody = typeof apiError === 'object' && apiError?.context?.body 
    ? apiError.context.body 
    : apiError.message || '';
  
  if (apiError.message?.includes("401") || apiError.message?.includes("נדרשת התחברות")) {
    toast({ title: "נדרשת התחברות", description: "אנא התחברו כדי ליצור סיפורים." });
    navigate("/auth?returnTo=/create");
    return;
  }
  if (apiError.message?.includes("429")) {
    throw new Error("יותר מדי בקשות, ננסה שוב בעוד רגע...");
  }
  // Billing/quota error — don't retry, show immediately
  if (apiError.message?.includes("שגיאת מערכת זמנית") || apiError.message?.includes("503")) {
    setError("שגיאת מערכת זמנית. נסו שוב בעוד מספר דקות.");
    return;
  }
  throw apiError;
}
```

Also check `data?.error` for the same pattern (for guest flow using raw fetch):
```ts
if (!data?.storyId) {
  if (data?.error) {
    if (data.error.includes("שגיאת מערכת זמנית")) {
      setError(data.error);
      return;
    }
    throw new Error(data.error);
  }
  throw new Error("לא התקבל מזהה סיפור מהשרת");
}
```

**2. Skip auto-retry for system errors (lines 316-324)**

In the catch block, before retrying, check if the error is a system/billing error:
```ts
// Don't auto-retry billing/system errors
if (errorMessage.includes("שגיאת מערכת זמנית")) {
  setError(errorMessage);
  return;
}

if (retryCountRef.current < MAX_RETRIES) {
  // ... existing retry logic
}
```

**3. Error UI already handles it (line 634)**
The existing error screen already checks for "שגיאת מערכת" and shows "עומס זמני במערכת" with "המערכת עמוסה כרגע, נסו שוב בעוד דקה 🙏" — so no UI changes needed.

### Result
- 402 errors show immediately as "עומס זמני במערכת" without wasting 3 retry attempts
- User sees a clear message and can retry manually
- No code changes can fix the billing itself — add funds at Settings → Cloud & AI balance

### What stays the same
- All design, layout, colors, buttons
- All other error handling (429, 401, network errors)
- Edge function code (already correct)
- No other files changed

