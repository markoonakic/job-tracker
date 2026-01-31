# Frontend Design Guidelines

**Project:** Job Tracker
**Stack:** React 19, TypeScript 5.7, Tailwind CSS 4.1, Vite 7
**Last Updated:** 2026-01-31

---

## Overview

This file defines all frontend design patterns, component standards, and coding conventions. **All AI agents and developers must reference this file before making frontend changes.**

---

## Theme System

### CSS Custom Properties (Required)

**ALL colors must use CSS variables.** Never hardcode color values.

**Correct:**
```tsx
className="text-fg1 bg-bg1"
```

**Incorrect:**
```tsx
className="text-[#ebdbb2] bg-[#3c3836]"
style={{ color: '#ebdbb2' }}  // NEVER do this
```

**Available color variables:**
- `--bg0`, `--bg1`, `--bg2` — Background layers (darkest to lightest)
- `--fg0`, `--fg1` — Foreground/text (lightest to darker)
- `--aqua`, `--aqua-bright` — Primary accent color
- `--red`, `--red-bright` — Destructive actions
- `--green`, `--green-bright` — Success states
- `--blue`, `--blue-bright` — Informational
- `--orange`, `--orange-bright` — Warning/pending
- `--yellow`, `--yellow-bright` — Withdrew state

### Theme Switching

Themes switch by changing CSS variable values. Using `var(--color-*)` ensures all components update automatically.

---

## Button Variants

### Four Standard Button Patterns

| Variant | Base State | Hover State | Usage |
|---------|---------------|-------------|-------|
| **Primary** | `bg-aqua text-bg0` | `hover:bg-aqua-bright` | Save, Add, Create, Sign In, Submit |
| **Neutral** | `bg-transparent text-fg1` | `hover:bg-bg2 hover:text-fg0` | Cancel, Edit, Skip |
| **Danger** | `bg-transparent text-red` | `hover:bg-bg2 hover:text-red-bright` | Delete buttons |
| **Icon-only** | `p-2` transparent | `hover:bg-bg2` | Close modals, icon actions |

### Standard Button Pattern

```tsx
// Primary button
<button className="bg-aqua text-bg0 hover:bg-aqua-bright transition-all duration-200 ease-in-out px-4 py-2 rounded-md">
  Save
</button>

// Secondary button
<button className="bg-transparent text-fg1 hover:bg-bg2 hover:text-fg0 transition-all duration-200 ease-in-out px-4 py-2 rounded-md">
  Cancel
</button>

// Danger button
<button className="bg-transparent text-red hover:bg-bg2 hover:text-red-bright transition-all duration-200 ease-in-out px-4 py-2 rounded-md">
  Delete
</button>

// Icon-only button
<button className="p-2 rounded-md bg-transparent text-fg1 hover:bg-bg2 transition-all duration-200 ease-in-out">
  <X className="w-4 h-4" />
</button>
```

### Button Sizing

- Regular: `px-4 py-2`
- Small: `px-3 py-1.5`
- Icon-only: `p-2`

### Transition Standard

**ALL buttons use:** `transition-all duration-200 ease-in-out`

---

## Navigation Buttons

Navigation elements use `transition-transform` only (no background color transition):

```tsx
className="transition-transform duration-200 ease-in-out hover:scale-110"
```

---

## Form Inputs

### Standard Input Pattern

```tsx
<input
  type="text"
  className="border border-tertiary bg-bg1 text-fg1 focus:border-aqua-bright focus:outline-none transition-all duration-200 ease-in-out rounded-md px-3 py-2"
/>
```

**Key elements:**
- `border border-tertiary` — Default border color
- `bg-bg1 text-fg1` — Background and text colors
- `focus:border-aqua-bright` — Aqua-bright border on focus
- `focus:outline-none` — Remove default outline
- `transition-all duration-200 ease-in-out` — Smooth transition

---

## Badge Colors

### Status Badge Colors

```tsx
const statusColors = {
  applied: 'bg-[var(--color-green)]/20 text-[var(--color-green)]',
  interview: 'bg-[var(--color-blue)]/20 text-[var(--color-blue)]',
  offer: 'bg-[var(--color-aqua)]/20 text-[var(--color-aqua)]',
  rejected: 'bg-[var(--color-red)]/20 text-[var(--color-red)]',
  withdrew: 'bg-[var(--color-yellow)]/20 text-[var(--color-yellow)]',
  pending: 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]',
};
```

**Use CSS custom properties** so badges update with theme switching.

---

## Spacing & Typography

### Spacing Scale (CSS Variables)

- `--spacing-xs: 0.25rem` (4px)
- `--spacing-sm: 0.5rem` (8px)
- `--spacing-md: 0.75rem` (12px)
- `--spacing-lg: 1rem` (16px)
- `--spacing-xl: 1.5rem` (24px)
- `--spacing-2xl: 2rem` (32px)

### Typography Scale (CSS Variables)

- `--font-h1: 2rem`
- `--font-h2: 1.5rem`
- `--font-h3: 1.25rem`
- `--font-base: 0.875rem`
- `--font-small: 0.75rem`
- `--font-tiny: 0.6875rem`

### Icon Sizing

- Dashboard icons: `text-lg` or `text-xl`
- Status icons: `text-base` or `text-sm`
- Button icons: `w-4 h-4` or `w-5 h-5`

---

## Layer 1 Components (Visual Hierarchy)

Components with `bg-secondary` (which maps to `bg-bg1`) must have `border border-tertiary`:

```tsx
<div className="bg-secondary border border-tertiary rounded-lg p-6">
  {/* Content */}
</div>
```

This creates visual separation for cards, modals, panels, etc.

---

## Action Verbs (Button Text)

Use consistent terminology:

| Action | Verb | Example |
|--------|------|---------|
| Open form | **New** | "New Application" |
| Add to existing | **Add** | "Add Round" |
| Create standalone | **Create** | "Create User" |
| Modify existing | **Edit** | "Edit Application" |
| Persist changes | **Save** | Form save button |
| Abort action | **Cancel** | Form cancel button |
| Destroy permanently | **Delete** | Delete buttons (NEVER "Remove") |
| Bring data in | **Import** | "Import Data" |
| Send data out | **Export** | "Export JSON" |

**Critical Rule:** Always use "Delete" never "Remove" for destructive actions.

---

## Hover Transitions (All Interactive Elements)

**Standard across entire application:**
- Property: `transition-all`
- Duration: `200ms`
- Timing: `ease-in-out`

Applies to: buttons, badges, navigation, focus states, all hover effects.

---

## Component Patterns

### Modals

Modal content containers use:
```tsx
<div className="bg-bg0 border border-tertiary rounded-lg p-6 max-w-md">
  {/* Modal content */}
</div>
```

### Cards

Application cards and similar use:
```tsx
<div className="bg-secondary border border-tertiary rounded-lg p-4">
  {/* Card content */}
</div>
```

---

## TypeScript Patterns

### Component Props

Use TypeScript interfaces for component props:

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

### Data Types

Import types from the lib directory:
```tsx
import type { Application, Status, Round } from '@/lib/types';
```

---

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `ApplicationCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `apiClient.ts`)
- Types: `types.ts` or `*.types.ts`
- Styles: `*.css` or `*.module.css`

---

## Import Order

```tsx
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party imports
import { clsx } from 'clsx';

// 3. Local imports
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
import type { Application } from '@/lib/types';
```

---

## When to Update This File

Update this file when:
- New component patterns are established
- Theme variables change
- New button variants or UI patterns are added
- Coding conventions evolve

**This file is the single source of truth.** If code contradicts this file, the code is wrong.

---

**Quick Reference for AI Agents:**
- Colors: Always use `--color-*` CSS variables
- Buttons: 4 variants (Primary, Neutral, Danger, Icon-only)
- Transitions: `transition-all duration-200 ease-in-out`
- Inputs: `focus:border-aqua-bright`
- Badges: Use `bg-[var(--color-*)]/20 text-[var(--color-*)]`
- Actions: "Delete" not "Remove"
