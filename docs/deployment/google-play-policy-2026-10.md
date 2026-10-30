# Google Play policy audit — 30 October 2026

## Current findings

Source baseline: `ad9083075833ad760ff8c084352f647ae2bdec7b`.
This audit and its permission gate do not certify publication or change the SDK,
Android manifest, billing, audience, production data, or Console declarations.

| Item | Source finding | Remaining evidence / action |
| --- | --- | --- |
| SDK / permissions | min 24; compile and target 36; main manifest requests INTERNET only | Inspect all candidate AAB module manifests through the mandatory artifact validator |
| Native dependencies | Capacitor Android/core/CLI/iOS 8.5.3; App and Network plugins 8.0.1 in lockfile | Retain resolved Gradle release dependency tree and manifest merger report with the exact build |
| Local network | No ACCESS_LOCAL_NETWORK in main manifest; current target 36 | Do not add it. API 37+ apps carrying it need declaration; mandatory compliance 25 August 2027, declaration rollout June 2027 |
| Location | No coarse/fine/background location in main manifest | Do not add it. Precise-location declarations apply to apps requesting ACCESS_FINE_LOCATION; API 37+ one-time/infrequent requests require location button. Effective 27 January 2027 |
| Other sensitive permissions | No contacts, SMS/call-log, all-files or accessibility service declared in main manifest | Final module manifest audit blocks newly introduced permissions; inspect dependency origin rather than automatically allowing them |
| Trader | Console evidence NOT VERIFIED | Existing accounts declare by 1 February 2027; rollout starts November 2026. Verify account status, distribution and app-level confirmation. Do not infer non-trader from free pricing |
| Families | Release record and English listing describe adult parents/caregivers, age 18+, no ads; no direct Ads SDK dependency | Console audience/ads answers, screenshots and actual flows NOT VERIFIED. Child development subject matter alone does not establish child users. If children are actually targeted, apply Families requirements and truthful declarations |
| Sensitive child records | Repository privacy documentation describes parent consent, private records and deletion | Read back Data safety, privacy/deletion URLs, health declaration and tested app behavior. Documentation is not proof of production behavior |
| February 2027 quality | R8 minification, resource shrinking and optimized ProGuard configuration enabled | Memory, bitmap and DEX metrics NOT VERIFIED. Profile actual Play-processed build and review Android vitals; configuration alone is insufficient |

The October Families Ads SDK announcement opens applications for SDK providers;
it does not require this no-ads parent app to add an advertising SDK. Play Age
Signals is not treated as a universal SDK-install requirement in this audit.

## Ordered completion record

1. **Source/CI:** run permission gate tests, source audit, typecheck, lint, unit
   tests, web build, Play distribution build assertions and browser tests. A
   source-only permission PASS must never be presented as a final AAB PASS.
2. **Exact native artifact:** follow `android-release-validation.md`. Use a clean
   reviewed commit, fresh Play maximum, current version above that maximum,
   established signing identity and separately approved AAB hash. Preserve release
   dependency tree, merger report, R8 mapping/configuration, and permission report.
   Do not reuse historical code-14 artifacts as current-source evidence.
3. **Console:** retain dated read-backs of trader status, target audience, ads,
   Data safety, health declaration, app access, policy status, active countries,
   version codes and testing/production-access eligibility. Declare according to
   actual activity. Trader self-certification/terms acceptance is an owner action.
4. **Internal testing:** inspect Play processing and pre-launch warnings; install
   the processed build on supported physical devices. Exercise login, onboarding,
   offline recovery, private records, export/deletion, deep links and the free
   Play build's absence of external digital checkout. Record OS/device/version.
5. **Quality:** test image-heavy browsing and repeated screen navigation; capture
   foreground/background memory and bitmap retention across supported RAM tiers.
   Review current Android vitals thresholds. Current app DEX criterion is >10 MB
   DEX, with >=25% optimization/obfuscation/shrinking. Record measured DEX size and
   optimization evidence, not compressed AAB size. If production vitals data is
   insufficient, label it NOT VERIFIED and retain local profiling evidence;
   absence of data is not a zero-issue result.
6. **Promotion:** resolve actual blockers, review the exact candidate evidence,
   obtain the existing owner promotion approval, and verify rollout separately.

Safe remediation: remove unused permission-producing dependencies/configuration
only after checking the feature dependency; rerun native build and artifact gate.
For measured memory problems, reduce decoded image dimensions, defer off-screen
images and release retained resources. Keep R8 enabled and narrow keep rules only
after device regression testing. No blanket SDK upgrade, speculative permission,
new tracking/analytics SDK or broad ProGuard keep rule is required by this audit.

## Verified scope and limitations

The baseline Main CI run [38491401947](https://github.com/ainaypyidaw25-gif/ace-child-grow/actions/runs/38491401947)
passed web/static/unit/browser and Play web-bundle checks. Its workflow has no
native Gradle build, signed AAB upload, permission audit or memory profiling step.
Those historical CI results are not results for a future policy-gate commit.

During this audit, the connected local browser was unavailable and Cloud Play
Console required Google sign-in. No authenticated Console evidence, fresh Play
maximum, signing inputs, approved candidate AAB or physical-device measurements
were available. These gates remain **NOT VERIFIED / release HOLD**, not completed.
No store upload, rollout, trader declaration or terms acceptance was performed.

## Official references

- [29 October policy announcement](https://support.google.com/googleplay/android-developer/answer/18100766)
- [Local network timeline](https://support.google.com/googleplay/android-developer/answer/16935362)
- [Location minimum scope and declaration](https://support.google.com/googleplay/android-developer/answer/17033915)
- [Trader status](https://support.google.com/googleplay/android-developer/answer/17594752)
- [Families policy](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Android vitals thresholds](https://developer.android.com/google/play/vitals)
- [Quality enforcement announcement](https://developer.android.com/blog/posts/elevating-app-quality-reducing-memory-usage-and-improving-device-migration)
