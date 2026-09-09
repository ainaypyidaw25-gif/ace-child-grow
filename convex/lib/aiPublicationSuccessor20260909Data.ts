import type { Doc } from '../_generated/dataModel';
import {
  AI_PUBLICATION_RELEASE_SOURCES,
} from './aiPublicationReleaseData';

export const AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID =
  '2026-09-09-ai-educational-preview-source-refresh-3' as const;

export const AI_PUBLICATION_SUCCESSOR_20260909_CAPTURED_AT = 1_788_937_050_595 as const;
export const AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_STARTED_AT = 1_788_936_934_183 as const;
export const AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_COMPLETED_AT = 1_788_937_150_000 as const;
export const AI_PUBLICATION_SUCCESSOR_20260909_EXPECTED_DISABLED_GENERATION = 2 as const;

export const AI_PUBLICATION_SUCCESSOR_20260909_AUDIT_ARTIFACT_HASH =
  '2b7d9d9532e1f6a68359c85b1739787a2bd3745e1d9c17ae7c76d557c7677e16' as const;

type TargetType = 'lesson' | 'story';
type TargetSlug = 'lsn_early_math' | 'st_waiting_at_clinic' | 'st_first_day_school';

export type AiPublicationSuccessor20260909SourceSnapshot = Pick<
  Doc<'evidenceSources'>,
  | 'sourceId'
  | 'org'
  | 'orgKey'
  | 'title'
  | 'authors'
  | 'year'
  | 'edition'
  | 'country'
  | 'language'
  | 'url'
  | 'doi'
  | 'isbn'
  | 'pmid'
  | 'evidenceLevel'
  | 'reviewStatus'
  | 'reviewer'
  | 'reviewerQualification'
  | 'reviewDate'
  | 'nextReviewDate'
  | 'reviewNote'
  | 'reviewScope'
  | 'keywords'
  | 'topics'
  | 'ageMonthsMin'
  | 'ageMonthsMax'
  | 'verifiedOn'
  | 'verifiedNote'
> & { reviewerId?: string };

export type AiPublicationSuccessor20260909Target = {
  type: TargetType;
  slug: TargetSlug;
  contentId: string;
  contentCreationTime: number;
  contentUpdatedAt: number;
  reviewRevision: number;
  contentSnapshotHash: string;
  linkId: string;
  linkCreationTime: number;
  linkUpdatedAt: number;
  linkSnapshotHash: string;
  sourceDocId: string;
  sourceCreationTime: number;
  sourceUpdatedAt: number;
  sourceSnapshotHash: string;
  sourceFullSnapshotHash: string;
  sourceSnapshot: AiPublicationSuccessor20260909SourceSnapshot;
  predecessorReleaseDocId: string;
  predecessorReleaseCreationTime: number;
  predecessorReleaseId: string;
  predecessorReleaseSnapshotHash: string;
};

const legacySources = new Map(
  AI_PUBLICATION_RELEASE_SOURCES.map((source) => [source.sourceId, source]),
);

function legacySource(sourceId: string) {
  const source = legacySources.get(sourceId);
  if (!source) throw new Error(`Missing immutable predecessor source: ${sourceId}`);
  return source;
}

const reviewer = {
  reviewer: 'Phyo Ko Ko',
  reviewerId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  reviewerQualification: 'MBBS',
  reviewScope: 'education' as const,
  reviewStatus: 'approved',
};

/**
 * Exact bounded Production preimages captured read-only on 2026-09-09 at
 * 06:57:30.595Z. IDs, creation times, timestamps and canonical hashes are all
 * frozen so a replacement release can never silently bless later edits.
 */
export const AI_PUBLICATION_SUCCESSOR_20260909_TARGETS:
readonly AiPublicationSuccessor20260909Target[] = [
  {
    type: 'lesson',
    slug: 'lsn_early_math',
    contentId: 'kx79fjkkjq7r7s23q2rcjgq5ed8b97q6',
    contentCreationTime: 1_785_024_282_947.203,
    contentUpdatedAt: 1_787_120_210_772,
    reviewRevision: 9,
    contentSnapshotHash: 'e5e5bd3383ade88d5960a1278658a19aef460ddc84717ca8eed07d11fa4145ba',
    linkId: 'k9714x2taxc2cjtq9vhc6171d18b90tr',
    linkCreationTime: 1_785_024_331_625.8242,
    linkUpdatedAt: 1_787_120_210_772,
    linkSnapshotHash: '3badde0e97557a30961739438adc85cdc20ae4545fa3f12f984a5a4bf651c7f8',
    sourceDocId: 'kd782yq6xc19gdv65gvz2z54s98crhkp',
    sourceCreationTime: 1_787_120_210_772.8093,
    sourceUpdatedAt: 1_787_544_592_518,
    sourceSnapshotHash: '061e21a65c5e7df0aa339d56ccf9f0823e17fdf9b7c4fba44ce49228923f2a5c',
    sourceFullSnapshotHash: 'cc898bfed070adefd48ecb0b4128285208327d069ae1856f6867da51d7bff0f4',
    sourceSnapshot: {
      ...legacySource('us-hhs-head-start-elof-2015'),
      ...reviewer,
      reviewDate: '2026-08-24',
      nextReviewDate: null,
      reviewNote: 'Reviewed the current UNICEF landing page and official report on 2026-08-24. I retain this source only for rights-based inclusion, strengths framing, population well-being, and the report’s early-childhood stimulation context. I do not use it as individual diagnostic or treatment guidance, nor as sole evidence for specific learning-difficulty definitions. Any numerical estimates are identified as 2021 report data.',
    },
    predecessorReleaseDocId: 'qn7ct2dpqv194sfzd3wxrfjxmn8cs9qc',
    predecessorReleaseCreationTime: 1_787_120_210_772.8108,
    predecessorReleaseId: '2026-08-19-ai-educational-preview-3:lesson:lsn_early_math',
    predecessorReleaseSnapshotHash: '606a44339a4faa22b88bf86e5555fb50bc223fb308ba21bbed4d73d43ee7562a',
  },
  {
    type: 'story',
    slug: 'st_waiting_at_clinic',
    contentId: 'kx73pc2tw0pqcrwy1bxan7scgx8b8emr',
    contentCreationTime: 1_785_024_282_947.2185,
    contentUpdatedAt: 1_787_120_210_772,
    reviewRevision: 3,
    contentSnapshotHash: '590191f08636fc7ff358c717ae1044233c6bd067170322f7ae47c6fb2e60a04c',
    linkId: 'k97bxtky15gzgvz6dt6w0sty9d8b950c',
    linkCreationTime: 1_785_024_331_625.8308,
    linkUpdatedAt: 1_787_120_210_772,
    linkSnapshotHash: '5bb37bca3a190f7c16c7caa819ab4c614e8279219cffc0a5dbf49ee3faa2ec50',
    sourceDocId: 'kd7dp27qwgnnrcwhtnq0qhgdbh8cs2yz',
    sourceCreationTime: 1_787_120_210_772.8096,
    sourceUpdatedAt: 1_787_318_683_279,
    sourceSnapshotHash: 'b1ef83b5454077bdbac05ab4813eae6522fb78a3b7ff2beffed79bb9d5080cd3',
    sourceFullSnapshotHash: '536490224fb9e5d4aa0d87e0812061abd4b47ec13e9dcc45c47f492d870a58a4',
    sourceSnapshot: {
      ...legacySource('nhs-alder-hey-outpatient-2023'),
      ...reviewer,
      reviewDate: '2026-08-21',
      nextReviewDate: null,
    },
    predecessorReleaseDocId: 'qn70jn34y3rg62xy6de1tm2k658cr5ea',
    predecessorReleaseCreationTime: 1_787_120_210_772.8118,
    predecessorReleaseId: '2026-08-19-ai-educational-preview-3:story:st_waiting_at_clinic',
    predecessorReleaseSnapshotHash: '15dde7994974f5d2981c2bcc5fff4a46d7cf15a96b7e3f7bda09ec3abfb44511',
  },
  {
    type: 'story',
    slug: 'st_first_day_school',
    contentId: 'kx77y45t16fy6y98zqyn7kwbsx8b9q7h',
    contentCreationTime: 1_785_024_282_947.2205,
    contentUpdatedAt: 1_787_120_210_772,
    reviewRevision: 2,
    contentSnapshotHash: 'cc4d31c2eb18098c24763fcd0b718c431a7f753962f6ae5a5b6c9f9f3d9f72fc',
    linkId: 'k978d0cyd9wayzhspvnmdpjsn58b975z',
    linkCreationTime: 1_785_024_331_625.8313,
    linkUpdatedAt: 1_787_120_210_772,
    linkSnapshotHash: '25eedf3d1dc97fe181b59d674ec96365e6591652acfb3f0fecd7dff0a0c05263',
    sourceDocId: 'kd78524c6z74hpsqfftz897ssd8crhm4',
    sourceCreationTime: 1_787_120_210_772.8098,
    sourceUpdatedAt: 1_787_318_705_972,
    sourceSnapshotHash: '93da0145018783682eba7e299cac56420f5561900f2145c07f36b689c8f7b9a3',
    sourceFullSnapshotHash: 'e958ae7139464236e5cd555e27561311940c36ae9c9669dbb2235d53339595a4',
    sourceSnapshot: {
      ...legacySource('us-hhs-head-start-first-day-jitters-2024'),
      ...reviewer,
      reviewDate: '2026-08-21',
      nextReviewDate: null,
    },
    predecessorReleaseDocId: 'qn7e95f62j275z311q1qqnyfw98csg42',
    predecessorReleaseCreationTime: 1_787_120_210_772.8127,
    predecessorReleaseId: '2026-08-19-ai-educational-preview-3:story:st_first_day_school',
    predecessorReleaseSnapshotHash: 'c67ed90fbb324957160579a50d1fc4b4921bf101f57695f2c90595811cd0aba1',
  },
] as const;

export function aiPublicationSuccessor20260909ReleaseId(
  target: Pick<AiPublicationSuccessor20260909Target, 'type' | 'slug'>,
): string {
  return `${AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID}:${target.type}:${target.slug}`;
}

export function aiPublicationSuccessor20260909RunId(
  target: Pick<AiPublicationSuccessor20260909Target, 'type' | 'slug'>,
): string {
  return `${AI_PUBLICATION_SUCCESSOR_20260909_RELEASE_ID}:audit:${target.type}:${target.slug}`;
}

export function aiPublicationSuccessor20260909SourceFullSnapshot(
  source: AiPublicationSuccessor20260909SourceSnapshot,
): Record<string, unknown> {
  return {
    sourceId: source.sourceId,
    org: source.org,
    orgKey: source.orgKey,
    title: source.title,
    authors: source.authors,
    year: source.year,
    edition: source.edition,
    country: source.country,
    language: source.language,
    url: source.url,
    doi: source.doi,
    isbn: source.isbn,
    pmid: source.pmid,
    evidenceLevel: source.evidenceLevel,
    reviewStatus: source.reviewStatus,
    reviewer: source.reviewer,
    reviewerQualification: source.reviewerQualification,
    reviewDate: source.reviewDate,
    nextReviewDate: source.nextReviewDate,
    reviewNote: source.reviewNote,
    reviewerId: source.reviewerId,
    reviewScope: source.reviewScope,
    keywords: source.keywords,
    topics: source.topics,
    ageMonthsMin: source.ageMonthsMin,
    ageMonthsMax: source.ageMonthsMax,
    verifiedOn: source.verifiedOn,
    verifiedNote: source.verifiedNote,
  };
}

export function aiPublicationSuccessor20260909PredecessorSnapshot(
  release: Doc<'aiPublicationReleases'>,
): Record<string, unknown> {
  return {
    releaseId: release.releaseId,
    targetKey: release.targetKey,
    contentId: release.contentId,
    contentType: release.contentType,
    contentSlug: release.contentSlug,
    status: release.status,
    reviewRevision: release.reviewRevision,
    contentUpdatedAt: release.contentUpdatedAt,
    contentSnapshotHash: release.contentSnapshotHash,
    evidenceLinkUpdatedAt: release.evidenceLinkUpdatedAt,
    evidenceLinkSnapshotHash: release.evidenceLinkSnapshotHash,
    sourceSnapshots: release.sourceSnapshots,
    contentAuditRunId: release.contentAuditRunId,
    auditArtifactHash: release.auditArtifactHash,
    policyVersion: release.policyVersion,
    gitCommit: release.gitCommit,
    operator: release.operator,
    createdAt: release.createdAt,
    expiresAt: release.expiresAt,
    revokedAt: release.revokedAt,
    revokeReason: release.revokeReason,
  };
}
