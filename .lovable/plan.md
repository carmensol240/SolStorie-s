

## Plan: Add Pulsing Animation to Photo Consent Checkbox

### Change — `src/components/wizard/ChildInfoStep.tsx`

On the photo consent checkbox (line 911), add a conditional CSS class that applies a pulsing purple/pink glow when unchecked, and removes it when checked:

```
className={`border-purple-300 data-[state=checked]:bg-purple-500 ... ${
  !formData.photoConsent ? 'animate-[pulse-glow_1.5s_infinite]' : ''
}`}
```

### Change — `src/index.css`

Add a `pulse-glow` keyframe animation:
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(168, 85, 247, 0.4); }
  50% { box-shadow: 0 0 12px rgba(236, 72, 153, 0.7), 0 0 20px rgba(168, 85, 247, 0.4); }
}
```

### Files modified
1. `src/components/wizard/ChildInfoStep.tsx` — conditional animation class on checkbox
2. `src/index.css` — pulse-glow keyframe

