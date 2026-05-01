## Plan: Update "Need to log in" card in Settings page

Modify the unauthenticated card in `src/pages/Settings.tsx` (lines 83–95) only. No other changes.

### Changes

1. **Button navigation**: change `navigate('/auth?returnTo=/settings')` → `navigate('/create')`.
2. **Button text**: change `התחברות` → `צרו סיפור ראשון ✨`.
3. **Remove** the "חזרה לדף הבית" link (lines 90–95) entirely.

### Resulting block

```tsx
<Button
  onClick={() => navigate('/create')}
  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold"
>
  <LogIn className="w-4 h-4 ml-1" />
  צרו סיפור ראשון ✨
</Button>
```

The `LogIn` icon is left in place (it's still imported and used elsewhere in the same card header at line 77). Nothing else in the file is touched.