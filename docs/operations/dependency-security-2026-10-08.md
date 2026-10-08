# Dependency security repair — 2026-10-08

Base: `187b06665e4894fda2f7008139be40216381da21` (current main).
Original evidence: Actions run https://github.com/ainaypyidaw25-gif/ace-child-grow/actions/runs/37622307098, verification job `112795331609`.

## Root causes and minimal repairs

| Root cause | Repair | Compatibility boundary |
| --- | --- | --- |
| Exact Capacitor 8.5.0 Android/iOS pins expose the internal HTTP proxy origin vulnerability (GHSA-rvm3-566m-v7fv). | Pin Android, iOS, core and CLI together to 8.5.2; align the separate Swift package and resolved upstream revision. | Same Capacitor major; App/Network remain 8.0.1 with satisfied core peers. |
| Locked sharp 0.35.4 includes vulnerable librsvg (GHSA-wq5f-xc86-pv6w). | Resolve sharp 0.35.5 and its matching platform packages within the existing range. | No image API migration. |
| Locked source-map-js 1.2.1 and brace-expansion copies remain vulnerable. | Resolve source-map-js 1.2.2 and brace-expansion 1.1.21, 2.1.7 and 5.0.12 in their existing major ranges. | No blanket cross-major override. |
| fast-uri 3.1.7 has a moderate host-normalization advisory. | Resolve 3.1.8 within its existing range. | Same major. |
| TypeScript ESLint 7 pulls globby/fast-glob/micromatch/braces into the lint chain. | Align parser/plugin to 8.71.1, compatible with existing ESLint 8.57.1 and TypeScript 5.9.3. | Five test fixtures use equivalent explicit if/else statements for the newer no-unused-expressions rule; assertions and lint rules remain intact. |

The Swift tag was independently read with `git ls-remote`:
`8.5.2` → `0b6882e9a3288342aacf36348e5a94e4f1dd7b13`.
The obsolete SwiftPM origin hash is removed rather than retained from the old manifest.
The alignment regression test is reused from PR #252 and updated for this release.

## Initial security patch and subsequent Tailwind 4 migration

Baseline full audit: **22 findings — 2 critical, 14 high, 6 moderate**.
First PR #253 head full audit: **10 findings — 0 critical, 5 high, 5 moderate**.
Tailwind 4 candidate full audit: **3 findings — 0 critical, 0 high, 3 moderate**.
Updated runtime-only audit: **0 findings**. This supplemental check does not replace CI's full audit.

The five high package findings share one unpatched root, `braces@3.0.3`
(GHSA-vfj7-8cjw-p6xm): Tailwind 3 → chokidar → braces and
Tailwind 3 → fast-glob → micromatch → braces. GitHub's advisory lists no patched
release; npm still lists 3.0.3 as latest. Normal semver updates cannot remove it.
The Tailwind 4 migration removes `braces`, the Tailwind selector-parser chain,
and `autoprefixer` from the dependency tree. Three moderate package findings
remain in Capacitor CLI → xcode → uuid. Do not downgrade Capacitor CLI to
8.4.3 or force uuid across major versions merely to suppress these findings.

The existing `npm audit --audit-level=high` gate is unchanged and passes
locally on the Tailwind 4 candidate. No dependency omission, advisory
suppression, package renaming or force-fix is introduced.

The CSS entry loads the existing JS theme via `@config` and uses the official
Tailwind 4 PostCSS plugin. A frozen Tailwind 3 stylesheet generated from the
same theme and current source is loaded only when the WebView lacks
`color-mix()`. The feature gate runs from a same-origin external script allowed
by the site's CSP. Both files are in the PWA precache and native assets. The
snapshot's font declarations are removed because the main stylesheet already
provides those bundled fonts. A post-build coverage check compares every
emitted modern utility class with the legacy snapshot; two arbitrary staff
grid classes have explicit legacy media rules.

The app build clears its generated `dist/` output after TypeScript succeeds.
Previously, back-to-back web/store builds retained old hashed CSS assets even
with Vite's `emptyOutDir` option, and Workbox precached those stale files.
The post-build check now also rejects multiple app CSS assets. The separate
layout harness output remains independent.

This addresses the existing iOS 15 minimum and older Android WebViews without
raising either native minimum. It is an automated compatibility strategy, not
evidence of iOS 15 device rendering. Check a physical iOS 15 device or simulator
and an older Android WebView before native release. Update the legacy snapshot
when new utility classes are introduced; CI's coverage check fails if forgotten.

## Reconciliation and CI cost

PR #252 already carries a partial security repair at Capacitor 8.5.1 plus iOS
handoff/Saved Activities work. This patch isolates security on current main and
uses 8.5.2. Reconcile #252 onto the accepted security result before merging it;
do not independently combine conflicting npm/Swift pins.

Leave existing `cancel-in-progress: true` unchanged. Publish one tested head and
inspect the naturally triggered CI run. Do not rerun an unchanged failing audit
job, rerun #249–#251 before they incorporate the security repair, or weaken the
gate to save minutes. No merge, production deployment or store release is included.

## First PR #253 head verification

Linux, Node 24.19.0, npm 11.9.0. Hosted CI uses Node 22; its evidence is separate.

- `npm ci` — pass; manifest/lockfile resolve without peer errors.
- `npm ls --all` — pass.
- `npm run typecheck` — pass.
- `npm run lint` — pass; no rule or assertion disabled.
- `npm test` — pass, 289 files / 3,029 tests (includes two alignment regressions).
- `npm run build` and `npm run build:harness` — pass.
- `npm run build:play-store:verify` — pass; `ready: true`, no forbidden chunks/copy.
- App Store readiness contract + Capacitor alignment — pass, 2 files / 6 tests.
- `VITE_DISTRIBUTION=app-store npm run build` and `npx cap sync ios` — pass.
- `npm run android:sync` — pass, including the actual Play Store distribution build
  and App/Network plugin sync. Tracked native configuration has no unintended changes.
- Sharp SVG-to-PNG rasterization — pass.
- Full audit — **FAIL**, 5 high / 5 moderate / 0 critical, expected unresolved blocker.
- Runtime-only audit — pass, 0 findings (supplemental evidence only).
- Local Playwright browser installation failed because downloaded Chromium archives
  were truncated/invalid. The browser suite was not executed locally; inspect hosted CI.
- Xcode/Swift tooling and Android SDK are unavailable here. Native compilation,
  signing, device behavior and store readiness are not proven by sync/source checks.

The Android release-source preflight also requires an authorized target SHA and
current Play Console version-code evidence. Do not invent those inputs or infer
release readiness from a passing source test.

## Tailwind 4 candidate verification

- `npm ci --offline` — pass on a clean install; npm install scripts and platform
  binaries validated successfully.
- `npm ls --all` — pass after the clean install.
- `npm audit --audit-level=high` — pass, 0 high, 0 critical, 3 moderate.
- Typecheck and lint — pass.
- Full `npm test` — pass, 289 files / 3,029 tests.
- App Store and Play Store distribution builds + Capacitor sync — pass.
- App Store readiness + Capacitor alignment — pass, 2 files / 6 tests.
- Built-bundle no-dev-route test — pass, 1 file / 5 tests.
- Play Store parent-only verification and separate layout harness build — pass.
- Web production build — pass; no tracked source mutations.
- Repeat build from a directory containing three old hashed stylesheets — pass:
  the resulting bundle contains exactly one app CSS file, and PWA precache
  drops from 501 stale entries to 344 current entries.
- Generated CSS utility comparison — 546/546 classes covered by the legacy
  snapshot or the two explicit old-WebView grid rules.
- App PWA precache includes both fallback assets.
- One existing Myanmar-font test expected the removed v3 `@tailwind` directive.
  It now checks the v4 import ordering; its targeted suite passes, 6/6.
- Hosted Playwright on this final head is required before declaring CI green.
  Physical iOS 15/older Android device QA is still needed to verify the
  fallback's actual rendering.
