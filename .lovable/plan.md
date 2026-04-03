

## Plan: Fix React forwardRef Warnings

### Overview
Wrap `MobileNavigation`, `LoadingSkeleton` (inside Library.tsx), and the `Library` page component with `React.forwardRef` to eliminate the console warnings about function components receiving refs.

### Changes

#### 1. `src/components/MobileNavigation.tsx`
- Wrap the component with `React.forwardRef<HTMLElement>`, forwarding the ref to the outer `<nav>` element.

#### 2. `src/pages/Library.tsx`
- The `LoadingSkeleton` is defined inline inside the Library component. Wrap it with `React.forwardRef<HTMLDivElement>` forwarding to its outer `<div>`.
- Also wrap the `Library` page export with `React.forwardRef<HTMLDivElement>` if it's receiving a ref from React Router.

### Files modified
1. `src/components/MobileNavigation.tsx`
2. `src/pages/Library.tsx`

