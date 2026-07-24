# Test Results

**Run date:** 2026-07-24 · **Command:** `npm run test` (Vitest 2.1.9)

## Summary
| Check | Result |
|-------|--------|
| TypeScript typecheck (`tsc -b --noEmit`) | ✅ PASS (0 errors) |
| Unit + component tests | ✅ **51 / 51 passing** |
| Production build (`vite build`) | ✅ PASS |
| PWA service worker generated | ✅ 8 precache entries (public content only) |
| Dependency audit | ⚠️ 8 (dev-toolchain only) — see limitations |

## Test files (8)
```
✓ src/domain/__tests__/age.test.ts          (15)
✓ src/domain/__tests__/resultEngine.test.ts  (9)
✓ src/domain/__tests__/sleep.test.ts         (7)
✓ src/domain/__tests__/safety.test.ts        (5)
✓ src/domain/__tests__/units.test.ts         (4)
✓ src/i18n/i18n.test.ts                       (5)
✓ src/data/seed/content.test.ts              (3)
✓ src/components/__tests__/MilestoneDemo.test.tsx (3)
```

## What is verified
The safety-critical core is proven by real, passing tests: age & corrected-age
math, the rule-based Green/Yellow/Orange/Red engine, the deterministic urgent-
safety engine (including skill-loss → RED and "no fabricated phone number"),
sleep-across-midnight, validated unit conversion, translation completeness, and
the clinical-review content guard.

## Not yet run (requires live backend / later phases)
Integration (Supabase auth + RLS cross-account denial), full E2E (Playwright),
PDF generation, visual regression, and offline runtime tests. See test-plan.md.

## Known audit note
Remaining `npm audit` findings are in the **dev toolchain** (vite/vitest/esbuild)
and do not ship in the production bundle. Resolve via a scheduled toolchain
upgrade (vite 7 / vitest 3), tracked as a follow-up. `react-router-dom` was
already updated to a patched 6.30.x.
