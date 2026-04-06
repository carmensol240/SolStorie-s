
## Plan: Update Sale Label and Countdown Timer

### 1. Sale label text (line 332)
Replace `מחיר השקה מיוחד 🔥` with `🌸 מבצע פסח 🌸`

### 2. Countdown timer logic (lines 49-57)
Replace the 15-minute countdown with a countdown to April 22, 2026 at 00:00 Israel time (UTC+3 = April 21, 2026 21:00 UTC).

**Replace state + effect:**
```ts
const TARGET_DATE = new Date('2026-04-21T21:00:00Z'); // April 22, 2026 00:00 Israel time

const [timeLeft, setTimeLeft] = useState(() => {
  const diff = TARGET_DATE.getTime() - Date.now();
  return diff > 0 ? diff : 0;
});

useEffect(() => {
  if (timeLeft <= 0) return;
  const timer = setInterval(() => {
    const diff = TARGET_DATE.getTime() - Date.now();
    setTimeLeft(diff > 0 ? diff : 0);
  }, 1000);
  return () => clearInterval(timer);
}, [timeLeft > 0]);

const days = Math.floor(timeLeft / 86400000);
const hours = Math.floor((timeLeft % 86400000) / 3600000);
const minutes = Math.floor((timeLeft % 3600000) / 60000);
const seconds = Math.floor((timeLeft % 60000) / 1000);
```

### 3. Update countdown display (line 333-334)
Replace the `MM:SS` display with `DD : HH : MM : SS` format:
```tsx
<span className="bg-white/20 rounded-md px-2 py-0.5 font-mono text-xs tracking-wider">
  {String(days).padStart(2,'0')} : {String(hours).padStart(2,'0')} : {String(minutes).padStart(2,'0')} : {String(seconds).padStart(2,'0')}
</span>
```

### 4. Update visibility condition (line 329)
Change `countdown > 0` to `timeLeft > 0` — this condition is used on line 329 (sale badge) and line 339 (the "לזמן מוגבל" text). When countdown reaches zero, both the timer and sale label hide automatically.

### 5. Remove old variables
Remove `countdownMin` and `countdownSec` (lines 56-57) since they're replaced.

### Single file changed
`src/pages/Upgrade.tsx` — no other files modified.
