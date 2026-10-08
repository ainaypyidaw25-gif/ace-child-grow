# PR #97 reconciliation and replacement handoff

Status date: 2026-10-08

## Fresh remote state

- Repository: `ainaypyidaw25-gif/ace-child-grow`
- Base: `main`
- Verified `main`: `187b06665e4894fda2f7008139be40216381da21`
- PR #97, **Prepare current iOS App Store handoff**: open draft, head
  `4948f980c0e97afc6c6280e7bb32b8b941ac904c`, merge state `DIRTY`.
- PR #251, **Restore native Saved Activities with slug-based save and unsave
  flow**: open draft, head
  `7a8121a8f700f597a7b31485b1387f1ff93ec816`; it is not merged into `main`.
- Dependency-audit repair source:
  `96690cd255a5d65200e2805106b4ec849bdbacaa` on
  `fix/dependency-audit-20261007`; no PR existed for that branch when this
  reconciliation began.

The historical local commits `be7e839` and `687549d` were not present in the
available clones or current remote refs. Their intended scope was reconstructed
from the verified PR heads and current source rather than treated as evidence.

## Why PR #97 is obsolete

PR #97 is an August 4 snapshot. Its two commits add an older generated iOS
project, old Capacitor/package state, older native route decisions, placeholder
screenshots and a checklist whose passing counts were bound to August. Its head
is now conflict-dirty against current `main`.

Since that snapshot, `main` has acquired a newer Xcode project, build 10,
privacy manifest, Sign in with Apple and Universal Links entitlements, native
OAuth/deep-link handling, current legal/support screens, parent publication
gates, newer route guards and substantial content/safety work. Wholesale merge
of #97 would risk downgrading or overwriting those controls. Its August CI and
simulator evidence cannot establish the current release state.

## Scope retained from current `main`

- Current `ios/` project, AppDelegate, Info.plist, PrivacyInfo.xcprivacy,
  entitlements, iOS 15 deployment target, version 1.5 and build 10.
- Current Capacitor native-store distribution contract and route guards.
- Sign in with Apple, Google and parent email/PIN, native OAuth callback and
  Universal Links/AASA source.
- Current support, privacy, deletion, content-policy and native Terms screens.
- Parent-audience publication gates and withdrawn/unavailable-content handling.
- No restoration of August payment/admin/offline/report/appointment routes or
  old legal copy.

## Reconstructed changes

1. Applied the exact PR #251 behaviour on top of current `main`: Saved
   Activities is available in native-store builds; Activities and Profile link
   to it; direct `/favorites` works; saves use stable slugs; the list opens
   published parent content and can unsave; unavailable or legacy keys remain
   hidden but removable. The focused flow tests accompany the code.
2. Applied the compatible native dependency repair from `96690cd`: Capacitor
   npm and Swift pins move together to 8.5.1, compatible lockfile security fixes
   are refreshed, and dependency-alignment tests are added. The unresolved
   Tailwind 3 build-tooling advisory remains visible and release-blocking.
3. Rebuilt the App Store metadata and checklist against the current source.
   August screenshots, old counts, Apple identity assumptions and old review
   evidence are not reused as current proof.

## Validation policy

- Run all checks from a clean install and bind results to an exact commit.
- Run the full suite plus focused App Store/Saved Activities contracts.
- Build with `VITE_DISTRIBUTION=app-store`, sync iOS, scan only generated bundle
  files for excluded native modules/markers, and validate native plist/privacy/
  entitlement inputs.
- Use an unsigned Release simulator build only; signing, archive upload and App
  Store actions are outside this task.
- Record any exploratory failure without weakening an assertion or changing the
  audit threshold.

See `release-checklist.md` for the actual run record and remaining gates.

## Recommendation for PR #97

**Supersede PR #97 with the replacement draft, but do not close #97 yet.** The
replacement is based on current `main`, preserves intervening safety/legal/native
work, carries the still-unmerged #251 behaviour explicitly and replaces stale
August claims with current evidence. Accept the replacement only after its
final-head checks and review findings are complete. Once maintainers accept the
replacement as the authoritative handoff, close #97 as superseded without
merging it.

