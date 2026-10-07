# Dependency security repair, 2026-10-07

This is a partial remediation shared by draft PRs #249 and #250. It is not a release approval. The existing `npm audit --audit-level=high` gate remains unchanged and must still fail while the remaining high-severity advisory applies.

## Changes

- Pin Capacitor Android, iOS, core and CLI to **8.5.1**, the minimal patched 8.5 release for [GHSA-rvm3-566m-v7fv](https://github.com/advisories/GHSA-rvm3-566m-v7fv). The internal proxy navigation issue affects native apps even when CapacitorHttp is not enabled. A web deployment alone cannot patch an installed native binary.
- Regenerate `CapApp-SPM/Package.swift` with the patched CLI. Update the separate Swift lock pin to the official 8.5.1 tag, revision `6afa7424fd2fcd8ca1e577478e8a00af284b7e82`, verified against the upstream Git tag. Remove the stale optional `originHash` rather than inventing a new resolution hash. SwiftPM's version-3 format allows it to be absent; Xcode must resolve and regenerate it during native validation.
- Refresh compatible lockfile patches: brace-expansion 1.1.21 / 2.1.7 / 5.0.12, fast-uri 3.1.8, sharp 0.35.5 (and matching platform libraries), source-map-js 1.2.2.
- Upgrade the paired TypeScript ESLint packages to 8.71.1, which supports the existing ESLint 8.57.1 and TypeScript 5.x. This removes their old globby/fast-glob/braces path. Five test-double assignment expressions are rewritten as equivalent if/else statements to satisfy the current recommended rule; no lint rule is disabled. Its eslint-visitor-keys dependency requires Node 22.13+ on the Node 22 line; verification uses Node 22.23.3 / npm 10.9.9, matching hosted CI.
- Add regression checks keeping the npm bridge/platform/CLI versions and the separate Swift pin aligned.

No feature implementation, production schema, provider configuration, deployed data, minimum iOS version, audit policy or release configuration is changed.

## Remaining audit result and exposure

After these changes the full installed dependency audit reports **10 findings: 5 high, 5 moderate, 0 critical**, down from 22 (14 high, 6 moderate, 2 critical). Counts include affected parent packages, not ten distinct vulnerabilities.

### High: braces and its Tailwind 3 dependency chain

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects all published braces versions through 3.0.3; no patched version is published. The remaining five high entries are braces, chokidar, micromatch, fast-glob and tailwindcss. The relevant entry path is **build/development tooling**, not a browser or Convex runtime import: Tailwind 3 reads content-file glob patterns, uses fast-glob/micromatch for matching, and its CLI watcher uses chokidar. A deeply nested, attacker-controlled brace pattern can exhaust recursive AST walkers and terminate the Node process. The [upstream report](https://github.com/micromatch/braces/issues/70) documents this input shape.

The current app has fixed repository-controlled content patterns in `tailwind.config.ts`: `./index.html` and `./src/**/*.{ts,tsx}`. Neither is deeply nested. No app request, child record, payment field or other runtime user input is passed to those glob APIs in this checkout. That bounds the observed exposure, but does not eliminate the vulnerable installed dependency or justify exempting CI: builds and tooling process repository-controlled inputs, including changes supplied in a pull request. CI's existing policy explicitly includes development dependencies.

A [Tailwind v3 dependency-removal change](https://github.com/tailwindlabs/tailwindcss/pull/20541) is open upstream and not released as of this review. The braces advisory dispute and closed unmerged patch proposals are not a withdrawal or a supported remediation. No unpublished fork, package-name alias, audit exclusion, forced upgrade or advisory suppression is used here.

### Moderate: tooling dependencies

- postcss-selector-parser and postcss-nested remain through Tailwind 3. The current patched selector parser is on major 7; Tailwind 3 requires major 6. No untested cross-major override is applied.
- uuid and xcode remain through the Capacitor CLI. This is a native project-generation dependency chain. No cross-major uuid override or Capacitor downgrade is applied.

These moderate findings do not cross the current high-severity CI threshold, but remain visible and unresolved.

## Compatibility decision

Keep the existing iOS 15 support contract. A Tailwind 4 upgrade would require Safari/iOS **16.4+**, Chrome **111+**, Firefox **128+**, and visual regression work for changed utility and preflight behavior ([official upgrade guide](https://tailwindcss.com/docs/upgrade-guide)). That is a product compatibility change, not a safe automatic lockfile update.

Viable next paths are a vetted, released Tailwind 3 dependency removal that preserves the support floor, or an explicitly approved Tailwind 4 migration with its support-floor change and browser/native visual validation. Until then the high-severity gate correctly blocks both draft PRs.

## Native and release limits

Capacitor sync can validate generation and package discovery on Linux, but it does not compile the native apps. This environment has no Xcode/Swift or configured Android SDK, so native compilation and installed-device behavior remain unverified. Before a separately authorized mobile release, run Xcode dependency resolution and an unsigned simulator build, Android debug build, and device smoke checks for navigation, links, network state and app lifecycle events. Only rebuilding and redistributing the native applications can remediate already-installed binaries.

PR #250's existing production schema/deployment and historical refund reconciliation holds remain in effect independently of this dependency work.
