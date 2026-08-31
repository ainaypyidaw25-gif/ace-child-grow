# ACE Child Grow Facebook publisher

The production-ready n8n import file is:

`public/social/ace-child-grow/continuous-publisher-workflow.json`

It remains inactive on import. It applies the kill-switch, page allowlist,
approval, expiry and host gates; downloads and hashes the approved media;
reconciles Facebook; reserves one item in a durable ledger; verifies lease
ownership; then publishes either an image or hosted MP4 Reel. It blocks items
more than 180 minutes late instead of flooding the Page with a stale backlog.

The reservation is not a read/upsert/read-back lease. The exported
`Claim Publish Slot Atomically` node performs one server-side Data Table
**Update rows** operation filtered by `ledgerKey`, `status=ready`,
`approvedContentHash`, and `mediaSha256`. Only a returned row owned by the
current execution reaches Meta. Zero updated rows fail closed.

## Required durable ledger and alert setup

Create an n8n Data Table named `ACE Child Grow Facebook Publish Ledger`. Add
these **String** columns: `ledgerKey`, `postId`, `status`, `reservationToken`,
`reservationExpiresAt`, `approvedContentHash`, `mediaSha256`, `platformPostId`,
`platformPermalink`, `publishedAt`, `scheduledAt`, `lastExecutionId`,
`alertCode`, and `alertMessage`.

n8n automatically provides the built-in `id`, `createdAt`, and `updatedAt`
columns. Do not create or map a custom `updatedAt` field: Data Table write nodes
must leave the built-in timestamp to n8n.

Replace `REPLACE_WITH_FACEBOOK_PUBLISH_LEDGER_TABLE_ID` in every Data Table
node with its actual table ID. The placeholder is a deployment blocker.

Before activation, pre-seed exactly one row per approved manifest item. A new
item's row must contain `ledgerKey`, `postId`, `status=ready`,
`approvedContentHash`, `mediaSha256`, and `scheduledAt` copied from the reviewed
manifest; leave platform and reservation fields empty. Missing rows, non-ready
rows, or hash drift block publishing. Never change a row from `reserved` back
to `ready` until Facebook has been inspected and the item reconciled. An
expired claim is deliberately not reclaimed automatically because the prior
execution may have reached Meta before it failed to write back.

The current n8n workspace plan does not provide project Variables. In
`Send Owner Alert - CREDENTIAL REQUIRED`, replace
`REPLACE_WITH_SOCIAL_ALERT_FROM_EMAIL` and
`REPLACE_WITH_SOCIAL_OWNER_ALERT_EMAIL` directly in n8n, attach an SMTP
credential, and test an actual alert. Do not commit real email addresses to this
repository. Actionable blocks are upserted to the ledger before email, so SMTP
failure cannot erase the alert evidence. A global kill switch forces a quiet
stop even when the selected item also has another blocker; empty-queue stops
are also intentionally quiet.

## Import and credential setup

1. Import the workflow JSON into the production n8n workspace.
2. Create one **HTTP Bearer Auth** credential for the ACE Child Grow Facebook
   Page access token.
3. Store only the Page access token as the credential value. n8n sends it in
   the `Authorization: Bearer ...` header.
4. Attach that credential to all four Meta publish nodes ending in
   `CREDENTIAL REQUIRED`, plus `Fetch Recent ACE Child Grow Page Posts` and
   `Fetch Published Post Permalink`.
5. Confirm the imported `Claim Publish Slot Atomically` node is still an
   **Update rows** operation with all four filters documented above. Do not
   replace it with Upsert.
6. With the workflow still inactive and the public manifest kill switch on,
   run **Manual Trigger** once. Confirm it is quiet and that no email is sent.
7. In a non-production test table, start two manual executions against one
   `ready` row and confirm exactly one execution updates it and only that
   execution reaches the mock publish branch. This is an activation gate, not
   an optional smoke test.
8. Confirm the destination Page ID is `111009258047115` before activating the
   schedule.

Never store the Page access token in this repository, the public manifest, a
query parameter or a plain workflow field.

## Reservation, reconciliation and write-back

Before enabling this export, seed a `published` ledger row for every manifest
item that already has a real `platformPostId`. Reconcile ambiguous past items
against Facebook manually; never invent an ID or permalink.

Each run selects at most one due item, recomputes the media SHA-256 and
`SHA256(id|scheduledAt|captionMyanmar|mediaSha256)`, checks the durable ledger
and recent Page feed, then conditionally changes the matching pre-seeded row
from `ready` to `reserved`. n8n's Data Table backend executes this filtered
update as one database `UPDATE ... WHERE ...` statement; concurrent executions
cannot both change the same ready row. The export also verifies the returned
row's execution token and both hashes before reaching Meta. After Meta
publishes, it fetches and stores the actual post ID, permalink, status and
publish time.

This guarantee depends on the Data Table **Update rows** operation retaining
its server-side all-conditions behavior. The checked export was reviewed
against n8n 2.36.9, whose Postgres implementation uses one transactional
filtered update with `RETURNING`. If the production n8n version/backend cannot
demonstrate that behavior in the concurrent staging test, keep the workflow
inactive. Do not fall back to Data Table Upsert plus read-back.

Keep the 15-minute interval and five-minute workflow timeout. If an execution
dies after a Meta call, inspect Facebook and reconcile the ledger before any
retry. Active claims caused by a concurrent schedule tick are intentionally
quiet; expired claims and ledger/hash problems create a durable alert and owner
email. Kill-switch and empty-queue decisions also remain quiet.

## Reel publishing path

The Reel branch follows Meta's hosted-video flow:

1. start a Reel upload session;
2. upload the approved public MP4 by `file_url`;
3. require a successful upload response;
4. finish with `video_state=PUBLISHED` and the approved Myanmar caption;
5. fetch the returned video's permalink and write it to the durable ledger.

## Safe stop

Set `killSwitch` to `true` in the production manifest to block all new posts.
The workflow must stay inactive whenever its Page credential is being replaced
or its destination is under review.

Run `npm run social:publisher:harden` to regenerate the checked-in workflow
export, then run the targeted publisher tests. This command does not import,
activate or deploy the workflow.
