# ACE Child Grow paid-parent launch

## Product boundary

The complete launch range is birth through 12 months. Later age bands remain
visible only where reviewed content exists and must not be marketed as complete.

Free includes one child, milestone checklists, core activities, safety guidance,
the verified service directory, and five approved sample animations.

Premium includes one child, personalized daily plans, activity and milestone
history, real-data reports, appointments and reminders, approved premium
animations, and offline access.

Family includes Premium plus up to three children and three caregivers including
the owner.

The no-card Premium trial lasts seven days, is available once per account, and
falls back to Free automatically.

## Pricing

- Premium monthly: 5,900 MMK
- Premium yearly: 59,000 MMK
- Family monthly: 9,900 MMK
- Family yearly: 99,000 MMK

Prices are installed into Convex by the owner and remain editable in Admin
Billing. The selected plan record and interval are copied into each payment
record so a yearly payment cannot accidentally receive a monthly entitlement.

## Animation release gate

The starter queue contains 25 original ACE animation briefs across the five
0–12-month bands. A queue item is not a delivered asset. Parent access requires:

1. A real MP4/WebM upload.
2. Myanmar and English descriptions; transcript where practical.
3. Rights owner and license metadata.
4. Free-sample or Premium access classification.
5. Qualified professional review and explicit approval.

Planned, placeholder, in-review, and retired media are never returned to parent
clients. Premium media access is also checked on the server.

## Public-source transparency

ACE charges for original Myanmar animations, personalization, records, reports,
reminders, offline access, and family workflow—not for ownership of public-health
facts.

If CDC material is referenced:

- attribute the original source;
- state that ACE is not affiliated with or endorsed by CDC;
- link to the free CDC Milestone Tracker;
- do not use CDC logos or imitate the CDC app design;
- do not reuse restricted third-party images or videos;
- review the rights statement for every individual asset.

No CDC images or videos are included in this repository.

## Production launch gates

- Typecheck, lint, tests, and production build pass.
- Convex schema and functions deploy successfully.
- Myan Myan Pay production credentials and signed webhook are verified.
- Recommended prices are installed and test payments cover monthly and yearly.
- Five free and twenty Premium animation files pass rights and review gates.
- Parent trial, payment, expiration, refund, report, appointment, and Family
  flows pass browser QA on mobile and desktop.
- Privacy, cancellation, refund, and terms text are published for Myanmar users.
