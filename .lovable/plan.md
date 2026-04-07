

## Plan: Real-Time Purchase Alerts + Recycle Bin for Admin Dashboard

### Single file changed: `src/pages/AdminDashboard.tsx`

### 1. Real-Time Purchase Notification

- Subscribe to Supabase Realtime on `purchases` table (`INSERT` events) when dashboard mounts
- On new purchase: play a short notification sound (using `new Audio()` with a base64-encoded chime), show a prominent `toast.success` via sonner with user name, package type, and amount
- Auto-refresh data immediately on new purchase (call `fetchAllData`)
- Requires enabling realtime on purchases table via migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;`

### 2. Recycle Bin (localStorage-based soft delete)

- Add state `trashedItems: Record<string, Set<string>>` keyed by tab name, persisted in localStorage
- Add a 🗑️ button on each row in users/stories/purchases/errors tabs
- Clicking moves the item ID to the trashed set for that tab — item disappears from main view
- Add a new tab "🗑️ סל מחזור" showing all trashed items grouped by source tab
- Each trashed item shows a "שחזור" (restore) button and "מחיקה סופית" button
- "Restore" removes from trash set → item reappears in its tab
- "Permanent delete" removes from trash set permanently (item reappears in main tab on next refresh — true DB deletion is not implemented to avoid accidental data loss; this just clears from the recycle bin view)

### Technical details

**Realtime subscription:**
```ts
const channel = supabase
  .channel('admin-purchases')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchases' }, (payload) => {
    // Play sound, show toast, refresh data
  })
  .subscribe();
```

**Migration needed:** Enable realtime for purchases table

**Sound:** Short base64-encoded notification chime played via Web Audio API

### What stays the same
- All existing tabs, design, layout, colors, filters
- All data fetching logic (just adds realtime trigger)
- No other files changed

