# Myan Myan Pay integration

ACE Child Grow uses a server-only Myan Myan Pay integration. The Vite client
talks to authenticated Convex actions; it never receives the merchant key or
secret. Payment success is accepted only after a signed callback or a
server-to-server status check validates the order ID, amount, and currency.

## Required merchant details

- Merchant KYC status: the `Child-grow-1` console profile is `APPROVED`.
- Application: `ACE Child Grow`, App ID `MM53855007`, currently
  `DEVELOPMENT`, using `Server to Server (SDK)`.
- Choose the legal merchant type before submitting. A company profile requires
  the registered company name, registration number, tax ID (when applicable),
  DICA registration, and company extract in addition to the identity files.
- Business category, service description, website, and full physical address.
- Authorized person's NRC/ID front and back, selfie with ID, bank book or bank
  statement, and e-commerce/business licence. Each upload must be 3 MB or less.
- Settlement bank details. The console currently offers KBZ Bank, AYA Bank, and
  CB Bank, with account name and account number.
- Production publishable key and secret key
- Production API base URL assigned by Myan Myan Pay
- Production merchant/key activation confirmation
- Myan Myan Pay instructions for server IP allowlisting, if enabled
- Access to register the callback URL in the merchant dashboard

The production callback URL is:

`https://graceful-possum-566.convex.site/mmpay/webhook`

The sandbox callback URL is:

`https://uncommon-orca-603.convex.site/mmpay/webhook`

Use `Server to Server (SDK)` for the application, `ACE Child Grow` as the app
name, and `https://child.acegroup.com.mm` as the website under review. The
provider requires the sandbox flow to be completed before requesting LIVE
approval through its Discord support channel.

## Sandbox verification — 2026-08-20

- Development credentials are stored only in the Convex development
  deployment (`uncommon-orca-603`); they are not committed and are not exposed
  to the Vite client.
- The configured sandbox API base URL is `https://ezapi.myanmyanpay.com`.
- End-to-end order `ACE-E2E-1787202149758` completed at 5,900 MMK.
- Myan Myan Pay sent the signed callback to the sandbox callback URL and
  received HTTP 200 with `received: true` and `duplicate: false`.
- Convex persisted the payment and webhook event as `SUCCESS` and activated
  the test parent's fixed-term Premium access.
- Production remains disabled. LIVE approval, production credentials, and a
  controlled small-value production payment are still required.

## Display compliance

- Show the official MMQR logo beside the generated QR without altering,
  stretching, or overlaying it.
- Show `PAYMENT POWERED BY MYANMYANPAY` in uppercase directly beneath the QR.

## Convex environment variables

Set these on the Convex deployment, never as `VITE_*` or Vercel frontend
variables:

```text
MMPAY_ENV=sandbox|production
MMPAY_WEBHOOK_URL=https://<deployment>.convex.site/mmpay/webhook
MMPAY_SANDBOX_APP_ID=...
MMPAY_SANDBOX_PUBLISHABLE_KEY=...
MMPAY_SANDBOX_SECRET_KEY=...
MMPAY_SANDBOX_API_BASE_URL=...
MMPAY_PRODUCTION_APP_ID=...
MMPAY_PRODUCTION_PUBLISHABLE_KEY=...
MMPAY_PRODUCTION_SECRET_KEY=...
MMPAY_PRODUCTION_API_BASE_URL=...
```

The sandbox create → signed callback → paid-access activation flow
has passed. After Myan Myan Pay grants LIVE approval, set the production
variables on the production deployment, deploy Convex, switch `MMPAY_ENV` to
`production`, and perform a controlled small-value live payment before
promoting the verified Vercel preview.

## Non-charging production readiness probe

After deploying the readiness functions dark, an operator may select the
Convex document ID of one **pre-existing terminal production**
`mmpayTransactions` row and run the internal
`mmpayReadiness:probeTerminalProductionPayment` action. The action calls only
the SDK `get` status operation. It cannot create, reserve, cancel, update or log
a payment, and its result omits the order ID, amount, customer, QR, checkout
URL, vendor and provider references.

The probe validates the stored production/MMK/terminal invariants and the
provider response's order ID, amount and status. SDK 1.1.4 does not document a
currency field on `get`; when it is absent the result explicitly reports
`stored_only_provider_omits_currency` rather than claiming provider-side
currency proof. If the provider supplies a currency, it must be `MMK`.

SDK 1.1.4 catches handshake/status HTTP failures and returns the response value
instead of throwing it. A value without the documented success `orderId` is
therefore classified into a fixed safe category and returned with
`providerReached: false`; the raw code, message and response are never returned
or logged. The categories are `live_access_not_enabled`, `ip_not_allowlisted`,
`authentication_rejected`, `rate_limited`, `provider_unavailable`,
`provider_rejected`, `transport_or_sdk_failure`, and `malformed_response`.
Only `live_access_not_enabled` produces `developmentStateSignal: consistent`.
All other failures report `not_observed`, which means the result did not prove
or disprove the merchant console's DEVELOPMENT state.
If the SDK or transport rejects instead of returning a value, the action catches
it at the provider-call boundary and substitutes a fixed local sentinel before
classification. The rejected value is never logged, returned or interpolated
into an error message.

An authenticated owner can pass the same transaction document ID to
`mmpayReadinessData:productionWebhookEvidence`. That query reads at most 51
indexed webhook rows, returns at most 50 as aggregate evidence, and exposes
only payment/webhook statuses and timestamps. It never returns the provider
order ID, nonce digest, user/customer ID, QR, checkout URL or transaction
reference. A fresh probe and a fresh signed callback read-back are separate
evidence; neither one creates a payment or substitutes for the other.

## Security and reconciliation behavior

- The pinned `mmpay-node-sdk` 1.1.4 source documents
  `X-Mmpay-Signature` / `X-Mmpay-Nonce` and verifies
  HMAC-SHA256 over `<nonce>.<exact raw body>`. ACE mirrors that contract and
  keeps an automated regression test for invalid signatures. Merchant sandbox
  callback verification remains required before LIVE approval.
- Provider calls run only in Convex Node actions.
- The production readiness probe is internal-only, accepts only an existing
  terminal production transaction, calls only provider `get`, and performs no
  database write.
- Provider/SDK failures are reduced to a fixed classification; raw responses,
  error text, codes, credentials and identifiers are discarded.
- Webhook readiness evidence is owner-only, indexed and bounded, with sensitive
  identifiers removed from its response.
- The webhook verifies HMAC-SHA256 over the exact raw body and nonce using a
  timing-safe comparison.
- Callback nonces are hashed and persisted so retries are idempotent.
- Order ownership is checked on every parent query/action.
- Amount and currency must match the server-created order.
- Terminal statuses cannot regress to pending; a successful transaction can
  only advance to refunded.
- Success activates the selected fixed-term plan atomically with the payment
  record. Monthly and yearly durations are snapshotted when the
  order is created, so later price-plan edits cannot change a purchase.
- Refund downgrades only the subscription activated by that same order.
- Owner/admin records show provider references, vendor, method, environment,
  status, and update time without exposing secrets.
