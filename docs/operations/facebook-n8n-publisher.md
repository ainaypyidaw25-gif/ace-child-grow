# ACE Child Grow Facebook publisher

The production-ready n8n import file is:

`public/social/ace-child-grow/continuous-publisher-workflow.json`

It loads the approved public manifest, applies the kill-switch, page allowlist,
approval, expiry, media-host and duplicate-post gates, then publishes either an
image or a hosted MP4 Reel. The import remains inactive until the owner attaches
the production credential and explicitly activates it in n8n.

## Import and credential setup

1. Import the workflow JSON into the production n8n workspace.
2. Create one **HTTP Bearer Auth** credential for the ACE Child Grow Facebook
   Page access token.
3. Store only the Page access token as the credential value. n8n sends it in
   the `Authorization: Bearer ...` header.
4. Attach that credential to all four nodes ending in
   `CREDENTIAL REQUIRED`.
5. Run **Manual Trigger** once and confirm that the result is either
   `PUBLISHED` for one approved due item or `BLOCKED` with an expected reason.
6. Confirm the destination Page ID is `111009258047115` before activating the
   schedule.

Never store the Page access token in this repository, the public manifest, a
query parameter or a plain workflow field.

## Reel publishing path

The Reel branch follows Meta's hosted-video flow:

1. start a Reel upload session;
2. upload the approved public MP4 by `file_url`;
3. require a successful upload response;
4. finish with `video_state=PUBLISHED` and the approved Myanmar caption;
5. write the returned video ID to n8n workflow static data to prevent a second
   post.

Already-published items are also loaded from the public manifest into the same
duplicate-post state before a due item is selected.

## Safe stop

Set `killSwitch` to `true` in the production manifest to block all new posts.
The workflow must stay inactive whenever its Page credential is being replaced
or its destination is under review.
