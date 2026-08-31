# ACE Child Grow Facebook publisher

The production-ready n8n import file is:

`public/social/ace-child-grow/continuous-publisher-workflow.json`

It remains inactive on import. It applies the kill-switch, page allowlist,
approval, expiry and host gates; downloads and hashes the approved media;
reconciles Facebook; reserves one item in a durable ledger; verifies lease
ownership; then publishes either an image or hosted MP4 Reel. It blocks items
more than 180 minutes late instead of flooding the Page with a stale backlog.

## Required durable ledger and alert setup

Create an n8n Data Table named `ACE Child Grow Facebook Publish Ledger`. Add
these **String** columns: `ledgerKey`, `postId`, `status`, `reservationToken`,
`reservationExpiresAt`, `approvedContentHash`, `mediaSha256`, `platformPostId`,
`platformPermalink`, `publishedAt`, `scheduledAt`, `lastExecutionId`,
`alertCode`, `alertMessage`, and `updatedAt`.

Replace `REPLACE_WITH_FACEBOOK_PUBLISH_LEDGER_TABLE_ID` in every Data Table
node with its actual table ID. The placeholder is a deployment blocker.

Create n8n project variables `ACE_SOCIAL_ALERT_FROM_EMAIL` and
`ACE_SOCIAL_OWNER_ALERT_EMAIL`, attach an SMTP credential to
`Send Owner Alert - CREDENTIAL REQUIRED`, and test an actual alert. Actionable
blocks are upserted to the ledger before email, so SMTP failure cannot erase the
alert evidence. Kill-switch and empty-queue stops are intentionally quiet.

## Import and credential setup

1. Import the workflow JSON into the production n8n workspace.
2. Create one **HTTP Bearer Auth** credential for the ACE Child Grow Facebook
   Page access token.
3. Store only the Page access token as the credential value. n8n sends it in
   the `Authorization: Bearer ...` header.
4. Attach that credential to all four Meta publish nodes ending in
   `CREDENTIAL REQUIRED`, plus `Fetch Recent ACE Child Grow Page Posts` and
   `Fetch Published Post Permalink`.
5. Run **Manual Trigger** once and confirm that the result is either
   `PUBLISHED` for one approved due item or `BLOCKED` with an expected reason.
6. Confirm the destination Page ID is `111009258047115` before activating the
   schedule.

Never store the Page access token in this repository, the public manifest, a
query parameter or a plain workflow field.

## Reservation, reconciliation and write-back

Before enabling this export, seed a `published` ledger row for every manifest
item that already has a real `platformPostId`. Reconcile ambiguous past items
against Facebook manually; never invent an ID or permalink.

Each run selects at most one due item, recomputes the media SHA-256 and
`SHA256(id|scheduledAt|captionMyanmar|mediaSha256)`, checks the durable ledger
and recent Page feed, then writes a ten-minute reservation. It reads that row
back immediately and reaches Meta only if the current n8n execution still owns
the unexpired lease. After Meta publishes, it fetches and stores the actual
post ID, permalink, status and publish time.

Keep the 15-minute interval and five-minute workflow timeout. Do not manually
run the active production workflow concurrently. If an execution dies after a
Meta call, inspect Facebook and reconcile the ledger before retrying.

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
