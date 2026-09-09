import {
  AI_PUBLICATION_POLICY_VERSION,
} from './aiPublicationPolicy';
import { AI_PUBLICATION_RELEASE_ID } from './aiPublicationReleaseData';

export type AiPublicationAuditTargetArtifact = {
  type: 'lesson' | 'story';
  slug: 'lsn_early_math' | 'st_waiting_at_clinic' | 'st_first_day_school';
  contentSnapshotHash: string;
  evidenceLinkSnapshotHash: string;
  sourceId: string;
  sourceSnapshotHash: string;
  sourceUrl: string;
  verdict: 'pass';
  claimScope: string;
  independentAgentResults: readonly {
    role: 'source_research' | 'semantic_audit';
    verdict: 'pass';
    report: string;
  }[];
  evidenceFindings: readonly string[];
  contentChecks: readonly string[];
  limitations: readonly string[];
};

/**
 * Immutable, bounded consolidation of the actual independent agent reports
 * completed for this exact three-item release. The release mutation verifies
 * this whole object against a separately pinned SHA-256 before it can archive
 * the audit rows. It never refreshes these timestamps or findings at apply
 * time.
 */
export const AI_PUBLICATION_AUDIT_ARTIFACT = {
  schemaVersion: 1,
  artifactId: '2026-08-19-ai-educational-preview-3-multi-agent-audit-v1',
  releaseId: AI_PUBLICATION_RELEASE_ID,
  policyVersion: AI_PUBLICATION_POLICY_VERSION,
  provider: 'OpenAI',
  model: 'Codex multi-agent audit',
  modelVersion: '2026-08-19 session',
  auditedWorkspaceBaseCommit: 'e26160cb52d8dda91969817538f5e1d658248587',
  auditStartedAt: 1_787_117_400_000,
  auditCompletedAt: 1_787_119_168_000,
  summary: 'Independent source/provenance and bilingual semantic agents audited the exact content, link and source snapshots for three low-risk educational previews.',
  limitations: [
    'No clinician or qualified human evidence reviewer approval.',
    'No native Myanmar-language editor approval.',
    'General educational preview only; not medical advice, developmental screening or diagnosis.',
    'Already-downloaded offline content can remain readable until the device reconnects after a kill-switch withdrawal.',
  ],
  targets: [
    {
      type: 'lesson',
      slug: 'lsn_early_math',
      contentSnapshotHash: 'e5e5bd3383ade88d5960a1278658a19aef460ddc84717ca8eed07d11fa4145ba',
      evidenceLinkSnapshotHash: '3badde0e97557a30961739438adc85cdc20ae4545fa3f12f984a5a4bf651c7f8',
      sourceId: 'us-hhs-head-start-elof-2015',
      sourceSnapshotHash: '061e21a65c5e7df0aa339d56ccf9f0823e17fdf9b7c4fba44ce49228923f2a5c',
      sourceUrl: 'https://headstart.gov/sites/default/files/pdf/elof-ohs-framework.pdf',
      verdict: 'pass',
      claimScope: 'Playful early mathematics concepts and learning opportunities for the allowlisted educational lesson; no developmental assessment or readiness decision.',
      independentAgentResults: [
        {
          role: 'source_research',
          verdict: 'pass',
          report: 'The official Head Start ELOF PDF is current on HeadStart.gov; its title, year, corporate author, birth-to-60-month scope and early-mathematics domains match the exact registry snapshot and claim mapping.',
        },
        {
          role: 'semantic_audit',
          verdict: 'pass',
          report: 'The lesson is low-risk educational content; Myanmar and English meaning is aligned and it contains no clinical, diagnostic, treatment, urgency, threshold or safety claim.',
        },
      ],
      evidenceFindings: [
        'Publisher metadata matches the exact release source snapshot.',
        'The source directly supports playful early mathematics concepts and is age-compatible with the lesson.',
        'The source is awaiting human review; this artifact asserts only the separately disclosed AI source audit.',
      ],
      contentChecks: [
        'Myanmar/English semantic parity',
        'Low-risk educational scope',
        'Claim-direct source mapping',
        'No clinical or safety claim',
        'AI disclosure present in list, detail and offline payloads',
      ],
      limitations: [
        'Not a developmental assessment or readiness decision.',
        'No qualified human review is represented.',
      ],
    },
    {
      type: 'story',
      slug: 'st_waiting_at_clinic',
      contentSnapshotHash: '590191f08636fc7ff358c717ae1044233c6bd067170322f7ae47c6fb2e60a04c',
      evidenceLinkSnapshotHash: '5bb37bca3a190f7c16c7caa819ab4c614e8279219cffc0a5dbf49ee3faa2ec50',
      sourceId: 'nhs-alder-hey-outpatient-2023',
      sourceSnapshotHash: 'b1ef83b5454077bdbac05ab4813eae6522fb78a3b7ff2beffed79bb9d5080cd3',
      sourceUrl: 'https://www.alderhey.nhs.uk/visiting/outpatient-appointments/expect/',
      verdict: 'pass',
      claimScope: 'Waiting-area context and possible activities for a fictional child-at-clinic story; no promise about a particular appointment or child response.',
      independentAgentResults: [
        {
          role: 'source_research',
          verdict: 'pass',
          report: 'The official Alder Hey NHS page prints the exact title and review date and directly supports that a child may wait and that younger-child waiting areas may provide toys or activities.',
        },
        {
          role: 'semantic_audit',
          verdict: 'pass',
          report: 'Myanmar and English story meaning is aligned, the story is clearly disclosed as fiction and it makes no clinical, diagnostic, treatment, urgency, threshold or safety claim.',
        },
      ],
      evidenceFindings: [
        'Publisher metadata matches the exact release source snapshot.',
        'The page is claim-direct for the waiting-setting context and child activities; the story remains independently written fiction.',
        'The source is awaiting human review; this artifact asserts only the separately disclosed AI source audit.',
      ],
      contentChecks: [
        'Myanmar/English semantic parity',
        'Low-risk fictional educational scope',
        'Claim-direct setting source',
        'No clinical or safety claim',
        'AI and fictional-story disclosures present in list, detail and offline payloads',
      ],
      limitations: [
        'The story does not promise a particular clinic experience or child response.',
        'No qualified human review is represented.',
      ],
    },
    {
      type: 'story',
      slug: 'st_first_day_school',
      contentSnapshotHash: 'cc4d31c2eb18098c24763fcd0b718c431a7f753962f6ae5a5b6c9f9f3d9f72fc',
      evidenceLinkSnapshotHash: '25eedf3d1dc97fe181b59d674ec96365e6591652acfb3f0fecd7dff0a0c05263',
      sourceId: 'us-hhs-head-start-first-day-jitters-2024',
      sourceSnapshotHash: '93da0145018783682eba7e299cac56420f5561900f2145c07f36b689c8f7b9a3',
      sourceUrl: 'https://www.headstart.gov/video/first-day-jitters',
      verdict: 'pass',
      claimScope: 'Preschool first-day nervousness, welcoming adults and classmates for a fictional transition story; no promise about an individual child response.',
      independentAgentResults: [
        {
          role: 'source_research',
          verdict: 'pass',
          report: 'The official Head Start page prints the exact title, preschool age label and update date and directly supports first-day nervousness, welcoming adults, new classmates and settling after starting.',
        },
        {
          role: 'semantic_audit',
          verdict: 'pass',
          report: 'Myanmar and English story meaning is aligned, the story is clearly disclosed as fiction and it makes no clinical, diagnostic, treatment, urgency, threshold or safety claim.',
        },
      ],
      evidenceFindings: [
        'Publisher metadata matches the exact release source snapshot.',
        'The page is age- and claim-compatible with the fictional first-day transition story.',
        'The source is awaiting human review; this artifact asserts only the separately disclosed AI source audit.',
      ],
      contentChecks: [
        'Myanmar/English semantic parity',
        'Low-risk fictional educational scope',
        'Claim-direct transition source',
        'No clinical or safety claim',
        'AI and fictional-story disclosures present in list, detail and offline payloads',
      ],
      limitations: [
        'The story does not imply every child will feel or respond in the same way.',
        'No qualified human review is represented.',
      ],
    },
  ] satisfies readonly AiPublicationAuditTargetArtifact[],
} as const;
