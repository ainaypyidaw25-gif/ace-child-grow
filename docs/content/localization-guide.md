# Localization Guide

## Languages
Default **Myanmar (mm)**; secondary **English (en)**. When Myanmar is selected,
all primary UI is Myanmar: navigation, headings, buttons, forms, placeholders,
validation, errors, dialogs, empty states, and reports. Medical English may
appear only as secondary text.

## System
Central dictionaries in `src/i18n/mm.ts` and `src/i18n/en.ts`, keyed by a shared
`TranslationKey` type. `translate(locale, key)` falls back mm → key. A
completeness test (`src/i18n/i18n.test.ts`) fails the build if either language
is missing a key or has an empty value.

## Typography
Font stack: `"Noto Sans Myanmar", "Pyidaungsu", "Myanmar Text", sans-serif`.
Body ≥ 16px, line-height 1.65–1.85, no clipped glyphs, correct wrapping, no
excessive bold. Tokens live in `tailwind.config.ts` / `src/index.css`.

## PDF rendering
Monthly reports must render Myanmar correctly in PDF (embedded Myanmar font, no
clipped text, correct page breaks). PDF generation is a planned module; the
font requirement is captured here so it is honoured at implementation time.

## Adding a key
1. Add to `mm.ts` (source of truth for the key set) and `en.ts`.
2. Run `npm run test` — the completeness test guards against omissions.
