# NestSync Design System

## Brand Identity

**Product:** NestSync — shared household management app for roommates and families.
**Personality:** Warm, approachable, cozy, organized.

---

## Color Palette

Based on ColorHunt Palette 2 (`#D97D55`, `#F4E9D7`, `#B8C4A9`, `#6FA4AF`) with Palette 1's gold (`#E9B63B`) as a secondary accent.

### Core Colors

| Name       | Hex       | Role                                          |
| ---------- | --------- | --------------------------------------------- |
| Teal       | `#6FA4AF` | Primary — buttons, links, active states       |
| Cream      | `#F4E9D7` | Background — page backgrounds                 |
| Sage       | `#B8C4A9` | Secondary surface — cards, subtle backgrounds  |
| Terracotta | `#D97D55` | Warm highlight — accents, emphasis             |
| Gold       | `#E9B63B` | Secondary accent — points, stars, gamification |

### Semantic Tokens

| Token                | Value       | Usage                                |
| -------------------- | ----------- | ------------------------------------ |
| `--color-primary`    | `#6FA4AF`   | Primary actions, buttons, focus      |
| `--color-primary-hover` | `#5B8F9A` | Hover state for primary elements     |
| `--color-primary-light` | `#6FA4AF1A` | Primary tinted backgrounds (10%)   |
| `--color-primary-medium` | `#6FA4AF33` | Primary medium backgrounds (20%) |
| `--color-accent`     | `#E9B63B`   | Points, stars, trophies              |
| `--color-accent-light` | `#E9B63B1A` | Accent tinted backgrounds (10%)   |
| `--color-highlight`  | `#D97D55`   | Warm emphasis, terracotta accents    |
| `--color-highlight-light` | `#D97D551A` | Highlight tinted backgrounds     |
| `--color-background` | `#F4E9D7`   | Page background                      |
| `--color-surface`    | `#FFFFFF`   | Cards, modals, sidebar               |
| `--color-surface-secondary` | `#B8C4A926` | Subtle card-like areas (15%)  |
| `--color-text-primary` | `#1E293B` | Headings, primary body text          |
| `--color-text-secondary` | `#64748B` | Secondary labels, descriptions     |
| `--color-text-muted` | `#94A3B8`   | Timestamps, hints, placeholders      |
| `--color-text-on-primary` | `#FFFFFF` | Text on primary-colored buttons   |
| `--color-border`     | `#D1D5DB`   | Standard borders                     |
| `--color-border-light` | `#E5E7EB` | Subtle borders, dividers             |
| `--color-error`      | `#DC2626`   | Error states, overdue items          |
| `--color-error-light` | `#FEF2F2`  | Error background                     |
| `--color-error-text` | `#B91C1C`   | Error message text                   |
| `--color-success`    | `#16A34A`   | Success states, completion           |
| `--color-success-light` | `#F0FDF4` | Success background                  |
| `--color-success-text` | `#15803D`  | Success message text                 |

### Status Colors

Standard red/green are retained for error/success to ensure accessibility for color-blind users. Terracotta is used for warm highlights, **not** as an error replacement.

---

## Typography

All fonts loaded via `next/font/google` for optimal performance.

### Font Stack

| Role     | Font Family | Weights        | Usage                           |
| -------- | ----------- | -------------- | ------------------------------- |
| Headings | **Nunito**  | 600, 700, 800  | Page titles, section headings   |
| Body     | **Inter**   | 400, 500, 600  | Body text, labels, UI elements  |
| Logo     | **Satisfy** | 400            | Logo wordmark only              |

### Type Scale

| Element        | Font    | Size   | Weight | Line Height |
| -------------- | ------- | ------ | ------ | ----------- |
| Page title     | Nunito  | 24–28px | 800   | 1.2         |
| Section heading | Nunito | 20px   | 700    | 1.3         |
| Card title     | Nunito  | 16px   | 700    | 1.4         |
| Body           | Inter   | 14–15px | 400   | 1.6         |
| Label          | Inter   | 13px   | 500    | 1.4         |
| Caption/Small  | Inter   | 12px   | 400    | 1.5         |
| Badge          | Inter   | 11–12px | 600   | 1.0         |

### Why These Fonts

- **Nunito** — rounded terminals give warmth that matches the pastel palette; friendly and approachable for a household app.
- **Inter** — industry-standard UI readability; clean contrast against Nunito's softness.
- **Satisfy** — flowing cursive that reads as personal and handwritten; used exclusively for the logo wordmark.

---

## Logo

### Primary Logo (Wordmark)

The NestSync logo is a **text-only wordmark** using the Satisfy font in teal (`#6FA4AF`).

```
NestSync    (Satisfy, cursive, #6FA4AF)
```

### Variants

| Variant       | Text Color | Background   | Usage                        |
| ------------- | ---------- | ------------ | ---------------------------- |
| Teal on white | `#6FA4AF`  | White        | Primary — headers, cards     |
| Teal on cream | `#6FA4AF`  | `#F4E9D7`   | On brand background          |
| Cream on dark | `#F4E9D7`  | `#1E293B`   | Dark backgrounds, footer     |
| Dark on white | `#1E293B`  | White        | Monochrome/print usage       |

### Favicon / App Icon

The favicon is an **"N" lettermark** — the letter "N" in Satisfy font, white on a teal rounded square.

- Background: `#6FA4AF` with `border-radius: ~22%`
- Letter: White, Satisfy font, centered
- Sizes: 16px, 32px, 48px, 180px (apple-touch-icon), 512px (PWA)

### Logo Clear Space

Maintain minimum clear space equal to the cap-height of the "N" on all sides.

### Logo Don'ts

- Do not stretch or distort
- Do not change the font
- Do not add effects (shadows, outlines, gradients)
- Do not use colors outside the approved palette
- Do not place on busy/patterned backgrounds without sufficient contrast

---

## Icon Library

**Library:** [Phosphor Icons](https://phosphoricons.com/) via `@phosphor-icons/react`
**Default weight:** Regular (matches stroke-based aesthetic)
**Replaces:** lucide-react

### Icon Mapping

| Purpose         | Icon Name         | Context                    |
| --------------- | ----------------- | -------------------------- |
| Home/Dashboard  | `House`           | Navigation, landing        |
| Chores          | `ClipboardText`   | Chore lists, boards        |
| Calendar/Date   | `CalendarBlank`   | Due dates                  |
| Points/Star     | `Star`            | Gamification, ratings      |
| Trophy          | `Trophy`          | Weekly stats, leaderboard  |
| User            | `User`            | Assigned member            |
| Add user        | `UserPlus`        | Onboarding                 |
| Add/Create      | `Plus`            | Create buttons             |
| Check           | `Check`           | Confirmation               |
| Complete        | `CheckCircle`     | Task completion            |
| Loading         | `SpinnerGap`      | Loading states             |
| Copy            | `Copy`            | Clipboard copy             |
| Delete          | `Trash`           | Remove items               |
| Repeat/Recur    | `ArrowsClockwise` | Recurring chores           |
| Sign out        | `SignOut`          | Logout                     |
| Menu            | `List`            | Mobile hamburger           |
| Close           | `X`               | Close/dismiss              |
| Arrow right     | `ArrowRight`      | Navigation, CTAs           |
| Money           | `CurrencyDollar`  | Expenses (future)          |
| Announce        | `Megaphone`       | Announcements              |
| Vote            | `Scales`          | Democratic governance       |

---

## Component Patterns

### Cards

```
Background:  bg-surface (white)
Border:      border-border-light (#E5E7EB)
Radius:      rounded-xl (12px)
Padding:     p-4 or p-5
Shadow:      none by default, hover:shadow-sm
```

### Buttons

**Primary:**
```
Background:  bg-primary (#6FA4AF)
Hover:       bg-primary-hover (#5B8F9A)
Text:        text-text-on-primary (white)
Radius:      rounded-xl
Font:        Inter 600
```

**Secondary/Outline:**
```
Background:  transparent
Border:      border-primary
Text:        text-primary
Hover:       bg-primary-light
```

### Badges

```
Points:      bg-accent-light, text-accent
Status:      bg-primary-light, text-primary
Error:       bg-error-light, text-error-text
Success:     bg-success-light, text-success-text
```

### Active Navigation

```
Active:      bg-primary-light, text-primary-hover
Inactive:    text-text-secondary, hover:bg-surface-secondary
```

---

## Spacing & Layout

- Page padding: `px-4 lg:px-6`
- Card gap: `gap-4`
- Section gap: `space-y-6`
- Max content width: Fluid within sidebar layout

---

## Accessibility

- All interactive elements meet WCAA AA contrast ratios
- Error/success states use red/green (standard semantic colors)
- Icons always paired with text labels or `aria-label`
- Focus rings use `ring-primary`
- No color-only indicators — always paired with text or icons
