

## Plan: Add "משובים" (Feedback) Tab to Admin Dashboard

### Summary
Add a new tab to the admin dashboard showing all user feedback from `user_feedback` table, with story details resolved from the `page_url` field (which contains `story/{storyId}`).

### Technical Details — `src/pages/AdminDashboard.tsx` only

**1. Add interface:**
```typescript
interface FeedbackRow {
  id: string;
  user_id: string | null;
  rating: number | null;
  message: string | null;
  display_name: string | null;
  page_url: string | null;
  created_at: string;
  is_approved: boolean | null;
}
```

**2. Add state:**
```typescript
const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
const [feedbackStories, setFeedbackStories] = useState<Record<string, { child_name: string; topic: string }>>({});
const [feedbackEmails, setFeedbackEmails] = useState<Record<string, string>>({});
```

**3. Fetch feedback in the existing `fetchData` function:**
- Query `user_feedback` ordered by `created_at desc`, limit 200
- Extract story IDs from `page_url` (format: `story/{uuid}`)
- Batch-fetch those stories for `child_name` and `topic`
- Use `get_admin_user_emails()` to resolve user emails by `user_id`

**4. Add tab trigger (expand grid from 6 to 7 columns):**
```tsx
<TabsTrigger value="feedback">משובים</TabsTrigger>
```

**5. Add TabsContent with table:**
Columns: תאריך | שם הילד | נושא | דירוג (star icons) | הודעה | מייל | שם משתמש

Display stars as ⭐ repeated `rating` times. Show "—" for missing data. Most recent first (already sorted by query).

### What stays the same
All other tabs, logic, data fetching, and components remain untouched.

