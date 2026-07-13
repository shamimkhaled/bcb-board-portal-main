# BCB Theme Implementation Review Package

## Changed Files Included

- `app/globals.css`
- `app/layout.tsx`
- `app/login/page.tsx`
- `app/api/admin/appearance/route.ts`
- `app/api/profile/appearance/route.ts`
- `app/(platform)/admin/config/page.tsx`
- `app/(platform)/profile/appearance/page.tsx`
- `components/app-shell.tsx`
- `components/dashboard/dashboard-hero.tsx`
- `components/metric-card.tsx`
- `components/secure-viewer.tsx`
- `components/ui/badge.tsx`
- `components/theme/admin-appearance-form.tsx`
- `components/theme/theme-preview-card.tsx`
- `components/theme/theme-provider.tsx`
- `components/theme/theme-selector.tsx`
- `lib/theme.ts`
- `package.json`
- `prisma/schema.prisma`
- `prisma/migrations/20260710030000_appearance_themes/migration.sql`
- `scripts/seed-appearance.ts`
- `scripts/test-appearance.ts`
- `tailwind.config.ts`

## Schema Changes

Added enum:

- `AppearanceTheme`
  - `EXECUTIVE_NAVY`
  - `BCB_EMERALD`
  - `HERITAGE_BURGUNDY`

Added models:

- `PortalAppearanceSetting`
- `RoleAppearanceSetting`
- `UserAppearancePreference`

Added relations on `User`:

- `appearancePreference`
- `appearanceSettingsUpdated`

Added migration:

- `prisma/migrations/20260710030000_appearance_themes/migration.sql`

## Theme Tokens Created

Semantic CSS variables were added for:

- `background`
- `backgroundSecondary`
- `surface`
- `surfaceElevated`
- `glassSurface`
- `foreground`
- `foregroundSecondary`
- `foregroundMuted`
- `primary`
- `primaryHover`
- `primaryForeground`
- `secondary`
- `border`
- `focusRing`
- `success`
- `warning`
- `danger`
- `information`
- `navigationBackground`
- `navigationActive`
- `dashboardOverlay`
- `viewerBackground`
- `watermarkColour`

The implementation maps these to CSS variables such as `--theme-background`, `--theme-primary`, `--theme-navigation-background`, and `--theme-watermark-colour`.

## Database Fields Added

`PortalAppearanceSetting`:

- `id`
- `systemDefaultTheme`
- `allowUserThemeSelection`
- `updatedById`
- `updatedAt`

`RoleAppearanceSetting`:

- `role`
- `defaultTheme`
- `updatedAt`

`UserAppearancePreference`:

- `userId`
- `selectedTheme`
- `updatedAt`

Only theme keys are stored. No user-specific colour palettes are stored.

## Validation Results

Prisma validation:

- `npx.cmd prisma validate` passed.

Lint:

- `npm.cmd run lint` passed with no warnings or errors.

TypeScript:

- `npm.cmd run typecheck` passed.

Tests:

- `npm.cmd test` passed.
- Included tests:
  - auth security
  - permission resolution
  - secure viewer
  - appearance/theme resolution

Production build:

- `npm.cmd run build` passed.

## Remaining Hard-Coded Colours

Remaining hexadecimal values are intentionally limited to:

- canonical theme token definitions in `app/globals.css`
- matching theme preview palette data in `lib/theme.ts`
- neutral document page colours in `app/globals.css`
- small preview text colour in `components/theme/theme-preview-card.tsx`
- white foreground constants in `tailwind.config.ts`

Some older feature pages still use Tailwind colour utility families such as `slate`, `amber`, `emerald`, and `red` for neutral cards, status backgrounds, and table text. Shared shell, navigation, login overlay, dashboard overlay, buttons, badges, metric cards, secure viewer shell, and watermark colour now use semantic theme tokens.

## Unresolved Issues

- `npx.cmd prisma generate` still reports a local Windows Prisma query-engine DLL lock, although the generated client metadata updated, migration applied, appearance seed passed, tests passed, and production build passed.
- Not every legacy component has been fully refactored away from Tailwind colour utilities. The core theme surfaces are complete, but deeper per-page cleanup remains possible.
- Visual QA across all three themes on real browsers was not captured into this package.
- Accessibility was addressed through high-contrast token choices and visible focus states, but automated WCAG contrast tooling was not run.

## Package Exclusions

The package intentionally excludes:

- `node_modules`
- `.next`
- database files
- environment files
- secrets
- uploaded documents
- storage files
