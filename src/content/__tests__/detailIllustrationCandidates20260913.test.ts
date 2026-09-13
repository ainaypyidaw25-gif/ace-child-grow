import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { activityIllustration } from '../activityIllustrations';
import { guideIllustration } from '../guideIllustrations';
import { lessonIllustration } from '../lessonIllustrations';
import { storyIllustration } from '../storyIllustrations';

const AI_LANE_CANDIDATES = [
  ['activity', 'act_picture_story_2_5y', 'docs/image-generation/candidates/2026-09-13/activities/act_picture_story_2_5y.e12a8d8f05.webp'],
  ['activity', 'act_picture_story_3y', 'docs/image-generation/candidates/2026-09-13/activities/act_picture_story_3y.a49dcf95b8.webp'],
  ['activity', 'act_picture_story_3_5y', 'docs/image-generation/candidates/2026-09-13/activities/act_picture_story_3_5y.5db180fe30.webp'],
  ['activity', 'act_picture_story_4y', 'docs/image-generation/candidates/2026-09-13/activities/act_picture_story_4y.06e23ab395.webp'],
  ['activity', 'act_picture_story_4_5y', 'docs/image-generation/candidates/2026-09-13/activities/act_picture_story_4_5y.8375c98d12.webp'],
  ['activity', 'act_picture_story_5y', 'docs/image-generation/candidates/2026-09-13/activities/act_picture_story_5y.e5ae82b7da.webp'],
  ['lesson', 'lsn_big_feelings', 'docs/image-generation/candidates/2026-09-13/lessons/lsn_big_feelings.bc16f1bff1.webp'],
  ['lesson', 'lsn_early_math', 'docs/image-generation/candidates/2026-09-13/lessons/lsn_early_math.5d079e41dd.webp'],
  ['lesson', 'lsn_making_friends', 'docs/image-generation/candidates/2026-09-13/lessons/lsn_making_friends.5342357f4c.webp'],
  ['lesson', 'lsn_power_of_play', 'docs/image-generation/candidates/2026-09-13/lessons/lsn_power_of_play.b298071ab2.webp'],
  ['lesson', 'lsn_reading_together', 'docs/image-generation/candidates/2026-09-13/lessons/lsn_reading_together.d4ade1d3a7.webp'],
  ['lesson', 'lsn_talk_more', 'docs/image-generation/candidates/2026-09-13/lessons/lsn_talk_more.fdb1ea691e.webp'],
  ['lesson', 'lsn_what_is_development', 'docs/image-generation/candidates/2026-09-13/lessons/lsn_what_is_development.3dcf39368f.webp'],
  ['story', 'st_ba_ba_sounds', 'docs/image-generation/candidates/2026-09-13/stories/st_ba_ba_sounds.5248d497b0.webp'],
  ['story', 'st_goodnight_moon_friend', 'docs/image-generation/candidates/2026-09-13/stories/st_goodnight_moon_friend.3277dec574.webp'],
  ['story', 'st_sharing_mango', 'docs/image-generation/candidates/2026-09-13/stories/st_sharing_mango.2dd66b6393.webp'],
  ['story', 'st_taking_turns', 'docs/image-generation/candidates/2026-09-13/stories/st_taking_turns.ece7af8fbf.webp'],
  ['story', 'st_visit_to_doctor', 'docs/image-generation/candidates/2026-09-13/stories/st_visit_to_doctor.510f7446cc.webp'],
  ['story', 'st_waiting_at_clinic', 'docs/image-generation/candidates/2026-09-13/stories/st_waiting_at_clinic.3d58cc8c4c.webp'],
] as const;

const REVIEWED_GUIDE_ASSETS = [
  ['gd_2_5y_nutrition', '/guides/gd_2_5y_nutrition.dd2148478f.webp'],
  ['gd_2_5y_safety', '/guides/gd_2_5y_safety.09db279d76.webp'],
] as const;

const allCandidateFiles = [
  ...AI_LANE_CANDIDATES.map(([, , path]) => path),
  ...REVIEWED_GUIDE_ASSETS.map(([, path]) => `public${path}`),
];

describe('2026-09-13 detail illustration candidates', () => {
  it('pins 21 unique content-hashed assets with the production image contract', async () => {
    expect(allCandidateFiles).toHaveLength(21);
    expect(new Set(allCandidateFiles).size).toBe(21);

    for (const assetFile of allCandidateFiles) {
      const filePath = resolve(process.cwd(), assetFile);
      expect(existsSync(filePath), assetFile).toBe(true);
      expect(statSync(filePath).size, assetFile).toBeLessThan(500 * 1024);

      const digest = createHash('sha256')
        .update(readFileSync(filePath))
        .digest('hex')
        .slice(0, 10);
      expect(basename(filePath), assetFile).toContain(`.${digest}.webp`);

      const metadata = await sharp(filePath).metadata();
      expect(metadata.format, assetFile).toBe('webp');
      expect(metadata.width, assetFile).toBe(1200);
      expect(metadata.height, assetFile).toBe(900);
    }
  });

  it('keeps the 19 AI-lane candidates fail-closed until media review release', () => {
    for (const [type, slug] of AI_LANE_CANDIDATES) {
      const resolved = type === 'activity'
        ? activityIllustration(slug)
        : type === 'lesson'
          ? lessonIllustration(slug)
          : storyIllustration(slug);
      expect(resolved, `${type}:${slug}`).toBeUndefined();
    }
  });

  it('releases only the two reviewed guide assets through exact-slug maps', () => {
    for (const [slug, assetPath] of REVIEWED_GUIDE_ASSETS) {
      expect(guideIllustration(slug), slug).toBe(assetPath);
    }
  });
});
