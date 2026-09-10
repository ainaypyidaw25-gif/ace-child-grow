export const READING_TOGETHER_RELEASE_ROOT = '2026-09-10-reading-together-ai-preview-v1' as const;
export const READING_TOGETHER_POLICY_VERSION = 'ai-reading-lesson-2026-09-10-v1' as const;
export const READING_TOGETHER_RELEASE_DAYS = 30 as const;
export const READING_TOGETHER_SLUG = 'lsn_reading_together' as const;
export function isReadingTogetherAiPublicationSlug(value: string): boolean {
  return value === READING_TOGETHER_SLUG;
}

/** Read-only production capture. Stage and activation fail closed on any drift. */
export const READING_TOGETHER_PREIMAGE = {
  snapshotSha256: '9d49072db32b44e79685f1e05f58c8e1ac27f7450286bea2e3b9e9ada06c29b9',
  capturedAt: 1_789_033_987_689,
  contentId: 'kx77y1548gs9wkv6w3gwzzen8s8b929e',
  contentUpdatedAt: 1_786_432_330_925,
  contentFullHash: 'eadcc9ad7aec4ab7e7c97f613369602b624d28a717dd0f858050ddb71fcd9916',
  preservedContentHash: 'aadfd168ad0324f8052b64fcf3daa3701b7732ef45be5df6c77686df68b1b385',
  currentContentSnapshotHash: '6b47d82681548a06d56b75c1d5301bfc83dce8f336fa7683c0b87b7b5a15bb5b',
  desiredContentSnapshotHash: 'a425e6924cec46d9c9329915b05c892df68db4de3d7c1d467a61959c820d44b1',
  desiredRevision: 4,
  linkId: 'k974bgdjyf15amh2ww1xz2797h8b965m',
  linkUpdatedAt: 1_785_024_331_625,
  linkFullHash: '9a5f26302613de064f8e7a5607469d798fd963da37818d183a60d70308a49ebe',
  linkSnapshotHash: '1406223ededcf86eeea8ff142fb9c6025e6cc9dc5dfef3a180c033936679bfe4',
  sourceIds: ['jr-dowdall-bookreading-2020', 'aap-literacy-2024', 'hc-early-literacy-2023'],
  sourcesFullHash: '290455282219929feb8cdbbe1b5b2412dbb1c8b2e906fbe253deb2a3346dd3a6',
  sourceRows: [
    {
      sourceId: 'jr-dowdall-bookreading-2020',
      sourceUpdatedAt: 1_785_043_814_882,
      fullHash: '80380d7b4c2aeb11b825757cce482220c2fad04cf6cf0439f155d9c1a1e54566',
      snapshotHash: '162a6db3c5d8d63d65a26befe9a84fb102b84a283a079580009a65889841218d',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30737957/',
    },
    {
      sourceId: 'aap-literacy-2024',
      sourceUpdatedAt: 1_785_043_814_882,
      fullHash: 'bd36d4fd2264412f62d8abd266aedd6626282f494c5ccdcea3c2f782bfb1f1cf',
      snapshotHash: '12d4b64084df28e9e3581f3bb6f8e08c76f74a389ecd6b8179bf29ed2d0a6bfd',
      url: 'https://pubmed.ncbi.nlm.nih.gov/39342414/',
    },
    {
      sourceId: 'hc-early-literacy-2023',
      sourceUpdatedAt: 1_785_043_814_882,
      fullHash: 'e78e1097dc4adc41373832c1e087d58be09ec618043ab50d13a94224c1f89d63',
      snapshotHash: '92e62efbc9689b7c427aa64489b352a912926fef0a5a0be5220735bb24b2b21e',
      url: 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-of-Early-Literacy.aspx',
    },
  ],
  reviewsCount: 0,
  reviewsFullHash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
  mediaCount: 1,
  mediaFullHash: '6b4e6bd861eda017472da79d3b1a9a3734c8b2e17717841f710e510974549220',
  assignmentsCount: 0,
  releasesCount: 0,
  configFullHash: 'f97ed9199fc06957ebc65ce7c96fd68562820f457671a953be42ea21bf6665cc',
  expectedGeneration: 3,
} as const;

export const READING_TOGETHER_RELEASE_ID = `${READING_TOGETHER_RELEASE_ROOT}:lesson:${READING_TOGETHER_SLUG}` as const;
export const READING_TOGETHER_CONTENT_RUN_ID = `${READING_TOGETHER_RELEASE_ROOT}:content:${READING_TOGETHER_SLUG}` as const;
export const readingTogetherSourceRunId = (sourceId: string): string =>
  `${READING_TOGETHER_RELEASE_ROOT}:evidence:${READING_TOGETHER_SLUG}:${sourceId}`;
