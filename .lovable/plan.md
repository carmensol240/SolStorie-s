

## Plan: Add Reassurance Line Below Package Cards

### Change — `src/pages/Upgrade.tsx`

After the package cards grid (line 350, after the closing `</div>` of the grid), insert:

```tsx
<p className="text-center mb-4" style={{ fontSize: '13px', color: '#c084fc' }}>
  תשלום חד פעמי · הקרדיטים שלך לא פגים · אין מינוי
</p>
```

This goes between the package grid (line 350) and the Toolkit PayPal section (line 353). One line added, nothing else touched.

### Files modified
1. `src/pages/Upgrade.tsx` — add single text element after package cards

