import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

type QueueItem = {
  id: string;
  campaign?: string;
  sourceSlug?: string;
  sourceAgeGroupKey?: string;
  sourceClinicalStatus?: string;
  titleMm?: string;
  titleEn?: string;
  scheduledAt: string;
  status: string;
  approvalStatus: string;
  reviewerId?: string;
  approvalTimestamp?: string;
  approvedContentHash?: string;
  riskLevel?: string;
  mediaType: string;
  mediaUrl: string;
  mediaSha256?: string;
  captionMyanmar: string;
  alreadyPublished: boolean;
  platformPostId: string | null;
  platformPermalink: string | null;
};

const root = process.cwd();
const manifest = JSON.parse(
  readFileSync(resolve(root, 'public/social/ace-child-grow/manifest.json'), 'utf8'),
) as {
  automationMode: string;
  killSwitch: boolean;
  destination: { platform: string; pageId: string };
  items: QueueItem[];
};
const campaign = manifest.items.filter((item) => item.campaign === 'activity_5_6m');

const expected = [
  ['ACE-ACT-5M-01', 'act_babble_back_and_forth', '2026-09-09T13:30:00.000Z'],
  ['ACE-ACT-5M-02', 'act_roll_and_reach', '2026-09-12T03:30:00.000Z'],
  ['ACE-ACT-5M-03', 'act_mirror_hello', '2026-09-14T13:30:00.000Z'],
  ['ACE-ACT-5M-04', 'act_board_book_point', '2026-09-16T13:30:00.000Z'],
  ['ACE-ACT-5M-05', 'act_clap_and_sing_5_6m', '2026-09-19T03:30:00.000Z'],
  ['ACE-ACT-5M-06', 'act_safe_touch_basket', '2026-09-21T13:30:00.000Z'],
] as const;

describe('Facebook 5–6 month activity queue', () => {
  it('targets only the allowlisted ACE Child Grow Facebook page', () => {
    expect(manifest.automationMode).toBe('production');
    expect(manifest.killSwitch).toBe(false);
    expect(manifest.destination).toEqual(
      expect.objectContaining({
        platform: 'facebook',
        pageId: '111009258047115',
      }),
    );
  });

  it('queues every approved production activity exactly once on the existing cadence', () => {
    expect(campaign.map(({ id, sourceSlug, scheduledAt }) => [id, sourceSlug, scheduledAt])).toEqual(
      expected,
    );
    expect(new Set(campaign.map((item) => item.id)).size).toBe(expected.length);
    expect(new Set(campaign.map((item) => item.sourceSlug)).size).toBe(expected.length);
    expect(new Set(campaign.map((item) => item.mediaUrl)).size).toBe(expected.length);

    for (const item of campaign) {
      expect(item.sourceAgeGroupKey).toBe('5_6m');
      expect(item.sourceClinicalStatus).toBe('published');
      expect(item.status).toBe('scheduled');
      expect(item.approvalStatus).toBe('approved');
      expect(item.reviewerId).toBe('OWNER_FACEBOOK_ACTIVITY_APPROVAL_2026_08_04');
      expect(item.approvalTimestamp).toBeTruthy();
      expect(item.captionMyanmar.trim().length).toBeGreaterThan(100);
      expect(item.mediaType).toBe('image');
      expect(item.alreadyPublished).toBe(false);
      expect(item.platformPostId).toBeNull();
      expect(item.platformPermalink).toBeNull();
    }
  });

  it('uses unique optimized JPEGs with matching integrity hashes', async () => {
    for (const item of campaign) {
      const publicPath = new URL(item.mediaUrl).pathname;
      expect(publicPath).toMatch(
        /^\/social\/ace-child-grow\/posts\/activity-5-6m-v1\/ACE-ACT-5M-\d{2}\.jpg$/,
      );

      const filePath = resolve(root, 'public', publicPath.slice(1));
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeLessThan(500 * 1024);

      const file = readFileSync(filePath);
      expect([...file.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
      expect(createHash('sha256').update(file).digest('hex')).toBe(item.mediaSha256);

      const metadata = await sharp(file).metadata();
      expect(metadata.format).toBe('jpeg');
      expect(metadata.width).toBe(1448);
      expect(metadata.height).toBe(1086);
      expect(metadata.width! / metadata.height!).toBeCloseTo(4 / 3, 5);

      expect(item.approvedContentHash).toBe(
        createHash('sha256')
          .update([item.id, item.scheduledAt, item.captionMyanmar, item.mediaSha256].join('|'))
          .digest('hex'),
      );
    }
  });
});
