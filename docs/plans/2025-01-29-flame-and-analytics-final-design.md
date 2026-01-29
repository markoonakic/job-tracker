# Flame of Focus & Analytics Final Improvements - Design

> **Created:** 2025-01-29
> **Status:** Design validated, implementation pending

## Overview

This design covers all remaining work to complete the Flame of Focus streak system and analytics improvements. Key areas: weekly bar chart fix, history seeding for testing, custom SVG emblems, tooltip color consistency, and extinguishment tracking.

## Requirements

1. **Weekly Bar Chart** - Fix broken hover behavior using proper Recharts Cell architecture
2. **History Seeding** - Add realistic journey data to existing applications for testing
3. **Custom SVG Emblems** - Replace emoji with Elden Ring-inspired icons
4. **Color Consistency** - Remove all hardcoded colors, use theme.ts constants
5. **Extinguishment Tracking** - Track when streaks are lost for display differentiation

---

## Section 1: Weekly Bar Chart Fix

### Problem
Current implementation uses `flatMap` to create multiple `<Bar>` components per week, which is invalid Recharts API and results in broken/invisible chart.

### Solution
Use exactly 2 `<Bar>` components (applications, interviews) with `<Cell>` children mapped inside for per-segment control.

### Architecture
- State: `hoveredSegment` stores index of week being hovered (or `null`)
- Each `<Bar>` contains exactly `data.length` `<Cell>` children
- Each `<Cell>` handles its own hover events and fill color
- Hovering any bar in week N brightens BOTH bars in that week

### Component Structure
```tsx
<Bar dataKey="applications" name="Applications">
  {data.map((entry, index) => (
    <Cell
      key={`app-${index}`}
      fill={hoveredSegment === index ? colors.blueBright : colors.blue}
      onMouseEnter={() => setHoveredSegment(index)}
      onMouseLeave={() => setHoveredSegment(null)}
    />
  ))}
</Bar>
<Bar dataKey="interviews" name="Interviews">
  {data.map((entry, index) => (
    <Cell
      key={`int-${index}`}
      fill={hoveredSegment === index ? colors.purpleBright : colors.purple}
      onMouseEnter={() => setHoveredSegment(index)}
      onMouseLeave={() => setHoveredSegment(null)}
    />
  ))}
</Bar>
```

### Additional Improvements
- Add `maxBarSize={50}` to prevent bar squeezing with more data
- Add `wrapperStyle={{ zIndex: 1000 }}` to Tooltip for z-index fix
- Remove `getSegmentData` helper (no longer needed)

### Files
- Modify: `frontend/src/components/analytics/WeeklyBarChart.tsx`

---

## Section 2: History Seeding for Existing Applications

### Problem
All existing applications lack status history, limiting testing of Sankey diagram and streak system.

### Solution
Create one-time Alembic migration that generates realistic status transition histories.

### Logic
- Read each application's `created_at` and current `status_id`
- Generate plausible journey from "Applied" → current status
- Distribute transitions over time between `created_at` and now
- Initial transition has `from_status_id = NULL`

### Example Journeys
- Applied → Applied (no history)
- Applied → No Reply
- Applied → Interviewing → Applied → Interviewing → Offer
- Applied → Interviewing → Rejected

### Files
- Create: `backend/alembic/versions/YYYYMMDD_seed_history_for_existing_applications.py`

---

## Section 3: Custom SVG Emblems

### Problem
Emoji (🔥, ⚠, 💀, ❄️) don't match Elden Ring aesthetic.

### Solution
Replace with custom SVG icons from `frontend/src/assets/icons/`:

| State | SVG File | Description |
|-------|----------|-------------|
| COLD/NEVER LIT | `frozen-block.svg` | Icy crystal block |
| EXTINGUISHED | `smoking-orb.svg` | Smoking orb with trails |
| EMBER | `burning-embers.svg` | Dim ember with particles |
| BURNING | `celebration-fire.svg` | Bright celebration flame |

### Implementation
Create React components wrapping SVGs with:
- Background paths removed (`<path d="M0 0h512v512H0z" fill="#000" ... />`)
- Darkreader attributes stripped
- `fill="currentColor"` for theme color support via CSS
- Size controlled via className, not inline styles

### Files
- Create: `frontend/src/components/icons/FrozenBlockIcon.tsx`
- Create: `frontend/src/components/icons/SmokingOrbIcon.tsx`
- Create: `frontend/src/components/icons/BurningEmbersIcon.tsx`
- Create: `frontend/src/components/icons/CelebrationFireIcon.tsx`
- Modify: `frontend/src/components/dashboard/FlameEmblem.tsx`

---

## Section 4: Tooltip Consistency & Color Constants

### Problem
Sankey chart uses hardcoded colors instead of theme.ts constants.

### Issues
- `SankeyChart.tsx`: Tooltip uses `'#665c54'`, `'#8ec07c'`, `'#fbf1c7'`
- SankeyNode uses `var(--accent-*)` instead of `colors.*`

### Solution
1. Import `colors` from `@/lib/theme`
2. Replace all hardcoded values with theme constants
3. Match WeeklyBarChart tooltip to Sankey styling

### Mapping
```tsx
// Current (wrong):
backgroundColor: '#665c54',
border: '1px solid #8ec07c',
color: '#fbf1c7',

// Correct:
backgroundColor: colors.bg3,
border: `1px solid ${colors.aquaBright}`,
color: colors.fg0,
```

### Files
- Modify: `frontend/src/components/SankeyChart.tsx`
- Modify: `frontend/src/components/analytics/WeeklyBarChart.tsx`

---

## Section 5: Extinguishment Tracking

### Problem
Need to differentiate "recently lost streak" from "long lost streak" for display purposes.

### Solution
Add `streak_exhausted_at` field to users table, track when streak transitions from active to exhausted.

### State Logic

| current_streak | ember_active | longest_streak | streak_exhausted_at | Display |
|----------------|--------------|----------------|---------------------|---------|
| > 0 | false | any | NULL | BURNING |
| > 0 | true | any | NULL | EMBER |
| 0 | false | == 0 | NULL or > 7d ago | COLD (never had streak) |
| 0 | false | > 0 | ≤ 7 days ago | EXTINGUISHED - Still warm |
| 0 | false | > 0 | > 7 days ago | EXTINGUISHED - Gone cold |

### Backend Changes
- Add `streak_exhausted_at: Date | None` to User model
- Set when streak goes from active to exhausted (after grace period)
- Clear when streak becomes active again
- Return in API response

### Files
- Create migration: `backend/alembic/versions/YYYYMMDD_add_streak_exhausted_at.py`
- Modify: `backend/app/models/user.py`
- Modify: `backend/app/api/streak.py`
- Modify: `backend/app/schemas/streak.py`
- Modify: `frontend/src/components/dashboard/FlameEmblem.tsx`

---

## Testing Checklist

- [ ] Weekly chart segment hover works (both bars brighten)
- [ ] Weekly chart tooltip matches Sankey styling
- [ ] Sankey diagram shows journeys for existing apps
- [ ] SVG icons display correctly in all 4 states
- [ ] All colors use theme.ts (no hardcoded values)
- [ ] Extinguished state shows correct message based on 7-day window
- [ ] Streak recording still works after backend changes
