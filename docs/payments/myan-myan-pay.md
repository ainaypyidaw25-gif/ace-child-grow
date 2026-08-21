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
  the test parent's monthly Premium subscription.
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
MMPAY_PRODUCTION_API_BASE_URL=https://ezapi.myanmyanpay.com
```

The production host above matches the payment API origin currently shown in
the authenticated Myan Myan Pay developer documentation. The SDK selects
sandbox or LIVE behavior from the credential type. Do not substitute either
the retired `api.myanmyanpay.com` hostname (no DNS record) or the developer
dashboard's `xxapi.myanmyanpay.com` origin (no `/payments/create` route).

The sandbox create → signed callback → automatic subscription activation flow
has passed. After Myan Myan Pay grants LIVE approval, set the production
variables on the production deployment, deploy Convex, switch `MMPAY_ENV` to
`production`, and perform a controlled small-value live payment before
promoting the verified Vercel preview.

## Security and reconciliation behavior

- The pinned `mmpay-node-sdk` 1.1.4 source documents
  `X-Mmpay-Signature` / `X-Mmpay-Nonce` and verifies
  HMAC-SHA256 over `<nonce>.<exact raw body>`. ACE mirrors that contract and
  keeps an automated regression test for invalid signatures. Merchant sandbox
  callback verification remains required before LIVE approval.
- Provider calls run only in Convex Node actions.
- The webhook verifies HMAC-SHA256 over the exact raw body and nonce using a
  timing-safe comparison.
- Callback nonces are hashed and persisted so retries are idempotent.
- Order ownership is checked on every parent query/action.
- Amount and currency must match the server-created order.
- Terminal statuses cannot regress to pending; a successful transaction can
  only advance to refunded.
- Success activates the selected plan atomically with the payment record.
- Refund downgrades only the subscription activated by that same order.
- Owner/admin records show provider references, vendor, method, environment,
  status, and update time without exposing secrets.
