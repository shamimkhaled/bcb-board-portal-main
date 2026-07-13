# UI/UX Redesign — Audit & Design System

## 1. Audit summary (pre-redesign)

| Area | Finding |
| --- | --- |
| Architecture | Next.js App Router; `(platform)` routes share `AppShell` + mostly `PageShell` |
| Tokens | Three `data-theme` packs; mobile chrome hard-coded `#006A4E`; no `next/font` |
| Primitives | Only button/card/badge/input/textarea |
| Desktop nav | Dark permanent sidebar (enterprise) |
| Mobile nav | Bottom tabs + off-canvas drawer; modules buried in More |
| Pain points | Dense chrome, zoom locked, tables not cardified, secure viewer tall, theme mismatch |

## 2. Locked direction

**Light SaaS hybrid** (Stripe / Linear calm surfaces + BCB brand green actions), native mobile patterns (bottom tabs + bottom sheet — **not** hamburger-primary).

Typography: **Plus Jakarta Sans** (UI) + **Source Serif 4** (display).

Spacing: 8pt grid (`rounded-ds*`, `min-h-11` touch targets).

## 3. What shipped in this redesign pass

- Global token refresh (`globals.css`, `lib/theme.ts`, `tailwind.config.ts`)
- Light desktop sidebar + frosted header
- Mobile bottom navigation + **More bottom sheet** (no primary hamburger)
- Pull-to-refresh on platform content
- Skeleton primitive, upgraded Button/Card/Input/Textarea/MetricCard
- Login, PageShell, Search, Meetings mobile cards restyled
- Viewport pinch-zoom restored (a11y)

Remaining list/admin screens inherit tokens via PageShell/Card automatically; further per-page polish can continue iteratively.

## 4. How to preview

```bash
npm run build && npm run start
# or for faster UI iteration:
npm run dev
```

Open `http://localhost:3005` — resize below `lg` for native mobile chrome.
