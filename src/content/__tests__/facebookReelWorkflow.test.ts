import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

type SocialItem = {
  id: string;
  scheduledAt?: string;
  status: string;
  approvalStatus: string;
  reviewerId?: string;
  approvalTimestamp?: string;
  approvedContentHash?: string;
  mediaType: string;
  mediaUrl: string;
  coverUrl?: string;
  mediaSha256?: string;
  coverSha256?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  frameRate?: number;
  durationSeconds?: number;
  captionMyanmar: string;
  alreadyPublished: boolean;
  platformPostId: string | null;
  platformPermalink?: string | null;
  publishedAt?: string;
};

type WorkflowNode = {
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  credentials?: Record<string, unknown>;
};

type WorkflowConnection = {
  node: string;
  type: string;
  index: number;
};

const root = process.cwd();
const manifest = JSON.parse(
  readFileSync(resolve(root, 'public/social/ace-child-grow/manifest.json'), 'utf8'),
) as {
  destination: { pageId: string; graphApiVersion: string };
  items: SocialItem[];
};
const workflow = JSON.parse(
  readFileSync(
    resolve(root, 'public/social/ace-child-grow/continuous-publisher-workflow.json'),
    'utf8',
  ),
) as {
  active: boolean;
  nodes: WorkflowNode[];
  connections: Record<string, { main: WorkflowConnection[][] }>;
  meta: Record<string, unknown>;
};

const reel = manifest.items.find((item) => item.id === 'ACE-REEL-APP-TOUR-01');
const howTo = manifest.items.find((item) => item.id === 'ACE-HOWTO-01');
const health = manifest.items.find((item) => item.id === 'ACE-HEALTH-01');
const learn = manifest.items.find((item) => item.id === 'ACE-AUTO-03');
const node = (name: string) => workflow.nodes.find((candidate) => candidate.name === name);
const outputTargets = (name: string) =>
  (workflow.connections[name]?.main ?? []).map((branch) => branch.map((edge) => edge.node));

describe('Facebook Reel publishing workflow', () => {
  it('preserves known Facebook publication history to prevent duplicate posts', () => {
    expect(howTo).toEqual(
      expect.objectContaining({
        status: 'published',
        alreadyPublished: true,
        platformPostId: '1067829045767876',
        publishedAt: '2026-08-02T06:57:12.000Z',
      }),
    );

    expect(manifest.items.filter((item) => item.id === 'ACE-REEL-APP-TOUR-01')).toHaveLength(1);
    expect(reel).toEqual(
      expect.objectContaining({
        status: 'published',
        approvalStatus: 'approved',
        reviewerId: 'OWNER_REEL_APPROVAL_2026_08_02',
        mediaType: 'reel',
        alreadyPublished: true,
        platformPostId: '1067960552421392',
        publishedAt: '2026-08-02T07:18:33.000Z',
      }),
    );

    expect(health).toEqual(
      expect.objectContaining({
        status: 'published',
        alreadyPublished: true,
        platformPostId: '111009258047115_1069775308906583',
        publishedAt: '2026-08-04T09:45:43.520Z',
        platformPermalink: 'https://www.facebook.com/photo/?fbid=1069775275573253',
      }),
    );
    expect(learn).toEqual(
      expect.objectContaining({
        status: 'published',
        alreadyPublished: true,
        platformPostId: '111009258047115_1069784295572351',
        publishedAt: '2026-08-04T10:00:44.871Z',
        platformPermalink: 'https://www.facebook.com/photo/?fbid=1069784258905688',
      }),
    );
  });

  it('ships the approved portrait MP4 and cover with matching integrity hashes', async () => {
    expect(reel).toBeTruthy();
    expect(reel!.mediaUrl).toMatch(/\/ACE-REEL-APP-TOUR-01\.mp4$/);
    expect(reel!.coverUrl).toMatch(/\/ACE-REEL-APP-TOUR-01-cover\.png$/);
    expect(reel).toEqual(
      expect.objectContaining({
        mediaWidth: 1080,
        mediaHeight: 1920,
        frameRate: 30,
        durationSeconds: 15,
      }),
    );

    const mediaPath = resolve(root, 'public', new URL(reel!.mediaUrl).pathname.slice(1));
    const coverPath = resolve(root, 'public', new URL(reel!.coverUrl!).pathname.slice(1));
    expect(existsSync(mediaPath)).toBe(true);
    expect(existsSync(coverPath)).toBe(true);
    expect(statSync(mediaPath).size).toBeLessThan(25 * 1024 * 1024);

    const media = readFileSync(mediaPath);
    const cover = readFileSync(coverPath);
    expect(media.subarray(4, 8).toString('ascii')).toBe('ftyp');
    expect(createHash('sha256').update(media).digest('hex')).toBe(reel!.mediaSha256);
    expect(createHash('sha256').update(cover).digest('hex')).toBe(reel!.coverSha256);

    const coverMetadata = await sharp(cover).metadata();
    expect(coverMetadata.format).toBe('png');
    expect(coverMetadata.width).toBe(1080);
    expect(coverMetadata.height).toBe(1920);

    expect(reel!.approvedContentHash).toBe(
      createHash('sha256')
        .update(
          [reel!.id, reel!.scheduledAt, reel!.captionMyanmar, reel!.mediaSha256].join('|'),
        )
        .digest('hex'),
    );
  });

  it('keeps the template inactive and gates the exact page, API version, host and media types', () => {
    expect(workflow.active).toBe(false);
    expect(workflow.meta).toEqual(
      expect.objectContaining({
        credentialAttachmentRequired: true,
        credentialTypeRequired: 'HTTP Bearer Auth',
        credentialValueFormat: '<PAGE_ACCESS_TOKEN>',
        supportedMediaTypes: ['image', 'reel'],
      }),
    );

    const validationCode = String(
      node('Validate Kill Switch Approval and Duplicate Gates')?.parameters.jsCode,
    );
    expect(validationCode).toContain("pageId !== '111009258047115'");
    expect(validationCode).toContain("['image', 'reel']");
    expect(validationCode).toContain('INVALID_GRAPH_API_VERSION');
    expect(validationCode).toContain('MEDIA_NOT_ON_APPROVED_HOST');
    expect(validationCode).toContain('REEL_MUST_BE_HOSTED_MP4');
    expect(validationCode).toContain('APPROVAL_EXPIRED');
  });

  it('uses Meta hosted-Reel start, upload and finish phases with credential references only', () => {
    const credentialNodes = [
      'Publish Photo to ACE Child Grow - CREDENTIAL REQUIRED',
      'Start Facebook Reel Upload - CREDENTIAL REQUIRED',
      'Upload Hosted Reel to Meta - CREDENTIAL REQUIRED',
      'Publish Facebook Reel - CREDENTIAL REQUIRED',
    ].map((name) => node(name));

    for (const current of credentialNodes) {
      expect(current).toBeTruthy();
      expect(current!.parameters.authentication).toBe('genericCredentialType');
      expect(current!.parameters.genericAuthType).toBe('httpBearerAuth');
      expect(current!.credentials).toBeUndefined();
    }

    const start = node('Start Facebook Reel Upload - CREDENTIAL REQUIRED')!;
    expect(String(start.parameters.url)).toContain("$json.graphApiVersion");
    expect(start.parameters.queryParameters).toEqual({
      parameters: [{ name: 'upload_phase', value: 'start' }],
    });

    const upload = node('Upload Hosted Reel to Meta - CREDENTIAL REQUIRED')!;
    expect(upload.parameters.url).toBe('={{ $json.upload_url }}');
    expect(upload.parameters.headerParameters).toEqual({
      parameters: [
        {
          name: 'file_url',
          value:
            "={{ $('Validate Kill Switch Approval and Duplicate Gates').item.json.mediaUrl }}",
        },
      ],
    });

    const finish = node('Publish Facebook Reel - CREDENTIAL REQUIRED')!;
    const finishQuery = finish.parameters.queryParameters as {
      parameters: Array<{ name: string; value: string }>;
    };
    expect(Object.fromEntries(finishQuery.parameters.map(({ name, value }) => [name, value]))).toEqual(
      expect.objectContaining({
        upload_phase: 'finish',
        video_state: 'PUBLISHED',
      }),
    );
    expect(finishQuery.parameters.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['video_id', 'description']),
    );

    const serialized = JSON.stringify(workflow);
    expect(serialized).not.toMatch(/EA[A-Za-z0-9]{20,}/);
    expect(serialized).not.toContain('access_token=');
    expect(serialized).not.toContain('graph.facebook.com/v25.0');
    expect(serialized).not.toContain('graph.facebook.com/v26.0');
  });

  it('routes images and Reels through separate paths and records only successful posts', () => {
    expect(outputTargets('Eligible for Facebook Publish?')).toEqual([
      ['Is Approved Item a Reel?'],
      ['Block and Flag Owner'],
    ]);
    expect(outputTargets('Is Approved Item a Reel?')).toEqual([
      ['Start Facebook Reel Upload - CREDENTIAL REQUIRED'],
      ['Publish Photo to ACE Child Grow - CREDENTIAL REQUIRED'],
    ]);
    expect(outputTargets('Start Facebook Reel Upload - CREDENTIAL REQUIRED')).toEqual([
      ['Confirm Facebook Reel Upload Session'],
    ]);
    expect(outputTargets('Confirm Facebook Reel Upload Session')).toEqual([
      ['Upload Hosted Reel to Meta - CREDENTIAL REQUIRED'],
    ]);
    expect(outputTargets('Upload Hosted Reel to Meta - CREDENTIAL REQUIRED')).toEqual([
      ['Confirm Facebook Reel Upload'],
    ]);
    expect(outputTargets('Confirm Facebook Reel Upload')).toEqual([
      ['Publish Facebook Reel - CREDENTIAL REQUIRED'],
    ]);
    expect(outputTargets('Publish Facebook Reel - CREDENTIAL REQUIRED')).toEqual([
      ['Remember Published Post'],
    ]);
    expect(String(node('Remember Published Post')?.parameters.jsCode)).toContain(
      'META_REEL_PUBLISH_FAILED',
    );
  });
});
