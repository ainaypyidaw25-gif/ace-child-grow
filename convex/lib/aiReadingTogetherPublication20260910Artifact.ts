import { READING_TOGETHER_POLICY_VERSION, READING_TOGETHER_RELEASE_ROOT } from './aiReadingTogetherPublication20260910Data';

/** Exact AI-only source and bilingual review record. No human approval is asserted. */
export const READING_TOGETHER_ARTIFACT = {
  schemaVersion: 2,
  artifactId: '2026-09-10-reading-together-ai-preview-v1-audit',
  releaseId: READING_TOGETHER_RELEASE_ROOT,
  policyVersion: READING_TOGETHER_POLICY_VERSION,
  provider: 'OpenAI',
  model: 'Codex agents; exact runtime model identifier not exposed',
  modelVersion: 'not exposed',
  auditedWorkspaceBaseCommit: '544386c85f0e30f7a1811568081e4b0df93b19cd',
  auditStartedAt: 1_789_033_496_000,
  auditCompletedAt: 1_789_033_703_000,
  summary: 'Independent AI source-scope and bilingual semantic/safety review of one corrected general-education shared-reading lesson. Not human or clinical approval.',
  limitations: [
    'AI review only; no clinician, native Myanmar-language editor, evidence specialist or other human approval is created.',
    'General parent education only; not medical advice, developmental screening, diagnosis or validated intervention dosage.',
    'Dowdall was checked at abstract level; the AAP policy page was inspected but a later refetch failed.',
    'No visual asset is released: the single database media row is a placeholder without URL or storage object.',
    'The lesson UI currently does not render the stored quiz, so this audit does not claim an interactive quiz experience.',
    'No user/device/accessibility test or original-rights clearance is represented by this content audit.',
    'Existing human review records and source decisions remain unchanged.',
    'The start timestamp records the first completed agent report, not a measured agent-session start.',
    'Downloaded offline copies can persist until a device reconnects after withdrawal.',
  ],
  targets: [
    {
      type: 'lesson',
      slug: 'lsn_reading_together',
      contentSnapshotHash: 'a425e6924cec46d9c9329915b05c892df68db4de3d7c1d467a61959c820d44b1',
      evidenceLinkSnapshotHash: '1406223ededcf86eeea8ff142fb9c6025e6cc9dc5dfef3a180c033936679bfe4',
      verdict: 'pass',
      sources: [
        {
          sourceId: 'jr-dowdall-bookreading-2020',
          sourceSnapshotHash: '162a6db3c5d8d63d65a26befe9a84fb102b84a283a079580009a65889841218d',
          sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/30737957/',
          claimScope: 'Shared picture-book reading can support child language and caregiver-child interaction; no guaranteed effect, required daily dose or superiority claim.',
          urlsChecked: ['https://pubmed.ncbi.nlm.nih.gov/30737957/'],
          evidenceFindings: [
            'The systematic-review abstract supports language outcomes from shared picture-book reading interventions.',
            'The corrected lesson avoids claiming that rereading is superior or that daily reading guarantees development.',
          ],
          limitations: ['Abstract-level source review only; no claim about an individual child or exact reading dose.'],
        },
        {
          sourceId: 'aap-literacy-2024',
          sourceSnapshotHash: '12d4b64084df28e9e3581f3bb6f8e08c76f74a389ecd6b8179bf29ed2d0a6bfd',
          sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39342414/',
          claimScope: 'Enjoyable, interactive shared reading and responsive conversation as general literacy promotion; not treatment or developmental assessment.',
          urlsChecked: [
            'https://pubmed.ncbi.nlm.nih.gov/39342414/',
            'https://publications.aap.org/pediatrics/article/154/6/e2024069090/199467/Literacy-Promotion-An-Essential-Component-of',
          ],
          evidenceFindings: [
            'The AAP policy supports language-rich shared reading and responsive caregiver-child interaction.',
            'The corrected copy uses optional, non-guaranteed educational wording and includes explicit AI disclosure.',
          ],
          limitations: ['AAP policy HTML was inspected, but a later re-fetch failed; no clinician approval is inferred.'],
        },
        {
          sourceId: 'hc-early-literacy-2023',
          sourceSnapshotHash: '92e62efbc9689b7c427aa64489b352a912926fef0a5a0be5220735bb24b2b21e',
          sourceUrl: 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-of-Early-Literacy.aspx',
          claimScope: 'Familiar books, shared attention and talking about pictures as general early-literacy activities; not a milestone test.',
          urlsChecked: ['https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-of-Early-Literacy.aspx'],
          evidenceFindings: [
            'The parent-education page supports shared reading, familiar books and conversation around pictures.',
            'The corrected lesson does not turn the activity into a pass/fail developmental milestone.',
          ],
          limitations: ['General parent-education context only; not screening, diagnosis or an individual outcome promise.'],
        },
      ],
      mediaSnapshotHash: '6b4e6bd861eda017472da79d3b1a9a3734c8b2e17717841f710e510974549220',
      mediaCount: 1,
      independentAgentResults: [
        {
          role: 'source_research',
          verdict: 'pass',
          report: 'After removing unsupported imagination and daily-dose language, the exact r4 claims remain within the three sources: language, responsive interaction, connection and enjoyable shared reading. Completed 2026-09-10T09:44:56Z.',
        },
        {
          role: 'semantic_audit',
          verdict: 'pass',
          report: 'Exact current EN/MM copy is aligned, non-guaranteed, child-led and accurately discloses that no clinician or native Myanmar editor approved it. Completed 2026-09-10T09:48:23Z.',
        },
      ],
      contentChecks: [
        'Exact Myanmar and English semantic alignment',
        'Optional non-guaranteed educational wording',
        'No required daily dose or rereading-superiority claim',
        'No clinical, diagnostic, treatment, urgency or screening claim',
        'Explicit AI-only and no-human-specialist disclosure',
        'Exact three-source order and claim scope',
        'One placeholder-only media row and no released visual asset',
      ],
      limitations: [
        'Copy and source scope only; no human specialist decision is represented.',
        'The quiz is stored but not rendered by the current lesson detail UI.',
      ],
    },
  ],
} as const;

export const READING_TOGETHER_ARTIFACT_HASH = 'ff1d9e72fdce8c650f1ea3abc0c8ea599230e47b67d448876e09752072691e88' as const;
