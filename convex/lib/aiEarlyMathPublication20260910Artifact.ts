import { AI_PUBLICATION_POLICY_VERSION } from './aiPublicationPolicy';

/** Immutable record of the two actual independent Codex reviews on 2026-09-10.
 * Neither reviewer represented a human clinician or native-language editor.
 * The exact runtime model/version was not exposed; no model version is invented.
 */
export const EARLY_MATH_AUDIT_ARTIFACT = {
  schemaVersion: 1,
  artifactId: '2026-09-10-early-math-naeyc-ai-preview-audit-v1',
  releaseId: '2026-09-10-early-math-naeyc-ai-preview-v1',
  policyVersion: AI_PUBLICATION_POLICY_VERSION,
  provider: 'OpenAI',
  model: 'Codex agents; exact runtime model identifier not exposed',
  modelVersion: 'not exposed',
  auditedWorkspaceBaseCommit: 'd6e6f459b626bb1d1c448386388c66daea8e7074',
  // First observed review completion, followed by final-copy rechecks; no
  // unobserved agent start time is asserted by this bookkeeping interval.
  auditStartedAt: Date.parse('2026-09-10T03:21:50Z'),
  auditCompletedAt: Date.parse('2026-09-10T03:23:09Z'),
  summary: 'Independent AI source/claim and bilingual educational-safety reviews passed the revised early-math lesson. Only the NAEYC 2022 source is cited; optional picture counting replaces the fixed five-object task. This does not record human approval.',
  limitations: [
    'AI semantic and educational review only, not clinician or native Myanmar-language editor approval.',
    'The exact runtime model identifier and version were not independently exposed to the review agents.',
    'The bookkeeping start is the first observed review completion; actual agent audit duration was not measured.',
    'The publisher article was checked on 2026-09-10; its underlying studies were not independently appraised and remote page bytes are not frozen.',
    'No child testing or accessibility/user-comprehension study was performed.',
    'Previously downloaded offline content may remain readable until the device reconnects after withdrawal.',
  ],
  targets: [{
    type: 'lesson',
    slug: 'lsn_early_math',
    contentSnapshotHash: '78c25d77f6f81f88910c4818d0f8cea0a364f65ba6e1d2cecb066739eb8b06c5',
    evidenceLinkSnapshotHash: '4a55ac87fd6e04ecaec6200ad1d5fe64bd83bc41382511b02063319ad2d1d652',
    sourceId: 'naeyc-nurturing-early-math-play-2022',
    sourceSnapshotHash: '5fd0c3386f24399be051c26faaca35b682894217deff3c838be4929a36097e95',
    sourceUrl: 'https://www.naeyc.org/resources/pubs/yc/fall2022/nurturing-early-math-play',
    verdict: 'pass',
    claimScope: 'Playful everyday counting, shape exploration and size comparison for general parent education; no developmental assessment, age benchmark, required dose or guaranteed learning outcome.',
    independentAgentResults: [
      { role: 'source_research', verdict: 'pass', report: 'math_source_audit completed its final-copy recheck at 2026-09-10T03:23:09Z. NAEYC metadata matches; the revised body, child-led quiz and optional picture-counting action fit the article scope. No human approval or validated dosage is asserted.' },
      { role: 'semantic_audit', verdict: 'pass', report: 'math_copy_audit completed its final-copy recheck at 2026-09-10T03:23:05Z. Myanmar and English align; participation is optional, no physical materials are instructed, and the explicit AI-only disclosure remains. No required changes; no clinician/native-editor approval.' },
    ],
    evidenceFindings: [
      'The official publisher identifies Rebecca Parlakian, Young Children, Fall 2022, Vol. 77, No. 3; Teacher audience and Infant/Toddler category.',
      'The article supports counting, shapes and size-comparison language with playful adult support and curiosity rather than pressure for correct answers.',
      'Final source/claim review completed 2026-09-10T03:23:09Z by the independent math_source_audit AI agent.',
      'Picture counting is an editorial activity example, not a validated daily dose, milestone or comparative-efficacy claim.',
    ],
    contentChecks: [
      'Final bilingual copy review completed 2026-09-10T03:23:05Z by the independent math_copy_audit AI agent.',
      'Myanmar and English meaning align; the AI-only disclosure remains in both languages.',
      'Optional picture counting is child-paced, permits watching and stops when interest ends; no physical-material manipulation is required.',
      'Quiz reinforces playful participation rather than pressuring for correct answers; fixed five-object prescription and flashcard comparison removed.',
      'No diagnosis, screening, clinical claim, age deadline, efficacy guarantee or human-approval claim.',
    ],
    limitations: [
      'The review covers only lesson:lsn_early_math revision 11 and its single exact NAEYC source/link snapshot.',
      'This verdict is not a review or approval of the clinical batch or either fictional story.',
    ],
  }],
} as const;

export const EARLY_MATH_AUDIT_ARTIFACT_HASH = 'e9a74fe65724a54ebd008b8e84c002e24c5c8698699bd0f90bf3dbdb1e1d617a';
