// A parent-and-child scene for the activity detail page.
//
// DomainArt (the small badge shown in lists) is deliberately abstract — at
// 48–56px an icon reads better than a busy scene. But on the detail page, the
// hero image is the one thing a parent who cannot read the instructions can
// still understand: it needs to show A PARENT AND A CHILD actually doing the
// activity, not a symbol standing in for the topic.
//
// These are AI-generated illustrations, pre-rendered to WebP and shipped as
// static assets (public/illustrations/activities/<domain>.webp) rather than
// produced at request time — there is no per-activity generation, so there is
// no per-activity cost or latency, and the set stays small enough (~10-13 KB
// each, ~170 KB total) to precache for offline use like the rest of the app
// shell. The characters are stylized cartoon figures, not renderings of any
// real child's or parent's likeness, appropriate for a children's-health app.

import { resolveArtKey } from './DomainArt';

export function ActivityScene({ domainKey, className }: { domainKey?: string | null; className?: string }) {
  const key = resolveArtKey(domainKey);
  return (
    <img
      src={`/illustrations/activities/${key}.webp`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`object-cover ${className ?? ''}`.trim()}
    />
  );
}
