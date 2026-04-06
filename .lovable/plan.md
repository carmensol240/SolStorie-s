

## Plan: Remember Credentials + Clarify Password Field

### Problem
1. The "זכור אותי" (Remember Me) checkbox exists in the login form but does nothing — email/password are not saved or restored.
2. The login password placeholder is just `••••••••` — no hint that it's a password the user created for this app.

### Changes — single file: `src/pages/Auth.tsx`

### 1. Save credentials on successful login (line ~330)
After `signInWithEmail` succeeds (no error), if `rememberMe` is checked, save email to `localStorage`. If unchecked, clear it.

```ts
if (!error) {
  if (rememberMe) {
    localStorage.setItem('saved_login_email', email);
  } else {
    localStorage.removeItem('saved_login_email');
  }
}
```

Note: We save only the email (not the password) for security. The browser's built-in password manager handles password autofill natively.

### 2. Restore saved email on mount (line ~33)
Initialize email state from localStorage:
```ts
const [email, setEmail] = useState(() => localStorage.getItem('saved_login_email') || "");
const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('saved_login_email'));
```

### 3. Update login password placeholder (line 1190)
Change from `"••••••••"` to `"הסיסמה שיצרת"` so users understand this is a password they created for the app.

### What stays the same
- All design, colors, layout, buttons
- Signup form unchanged (already has clear hint text)
- No other files modified

