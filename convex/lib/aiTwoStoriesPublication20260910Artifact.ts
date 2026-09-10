import { AI_PUBLICATION_POLICY_VERSION } from './aiPublicationPolicy';

/** Actual independent AI reports; never represents a human review decision. */
export const TWO_STORIES_ARTIFACT = {
  schemaVersion: 1,
  artifactId: '2026-09-10-two-stories-ai-preview-audit-v1',
  releaseId: '2026-09-10-two-stories-ai-preview-v1',
  policyVersion: AI_PUBLICATION_POLICY_VERSION,
  provider: 'OpenAI',
  model: 'Codex agents; exact runtime model identifier not exposed',
  modelVersion: 'not exposed',
  auditedWorkspaceBaseCommit: '7e143a063a28198bd709aa6d85797470ab3d3a79',
  auditStartedAt: Date.parse('2026-09-10T03:55:16Z'),
  auditCompletedAt: Date.parse('2026-09-10T03:58:28Z'),
  summary: 'Two independent AI agents checked the exact bilingual fictional stories and their bounded source context. School metadata uses a new corrected source with unknown numeric ages and an explicitly historical update date. No human approval is asserted.',
  limitations: [
    'AI-only source and bilingual educational-safety review, not clinician or native Myanmar-language editor approval.',
    'Exact runtime model identifier/version was not independently exposed to the review agents.',
    'The bookkeeping start is the first observed review completion; actual review duration was not measured.',
    'Stories are original fiction; sources support contextual education, not a prediction of any child response or treatment efficacy.',
    'No child testing, comprehension study or real media review was performed; exact production media rows contain placeholders only.',
    'Already downloaded offline content may remain readable until a device reconnects after withdrawal.',
  ],
  targets: [
    {
      type: 'story', slug: 'st_waiting_at_clinic',
      contentSnapshotHash: '590191f08636fc7ff358c717ae1044233c6bd067170322f7ae47c6fb2e60a04c',
      evidenceLinkSnapshotHash: '5bb37bca3a190f7c16c7caa819ab4c614e8279219cffc0a5dbf49ee3faa2ec50',
      sourceSnapshotHash: 'b1ef83b5454077bdbac05ab4813eae6522fb78a3b7ff2beffed79bb9d5080cd3',
      sourceId: 'nhs-alder-hey-outpatient-2023',
      sourceUrl: 'https://www.alderhey.nhs.uk/visiting/outpatient-appointments/expect/',
      verdict: 'pass',
      claimScope: 'Waiting-area context and possible activities for one fictional child at a clinic; not a promise about an appointment, a required counting practice, or a clinical calming intervention.',
      independentAgentResults: [
        { role: 'source_research', verdict: 'pass', report: 'two_story_source_review completed clinic source review at 2026-09-10T03:57:19Z. Official Alder Hey title and 04/07/2023 review date match; waiting-area/toy/activity context supports the bounded fictional story, not counting efficacy.' },
        { role: 'semantic_audit', verdict: 'pass', report: 'publication_gate_audit completed bilingual copy/safety review at 2026-09-10T03:55:16Z on exact production revision 3. Myanmar/English align, fiction and AI notices are explicit, and no dose, clinical decision or guaranteed child outcome is asserted. No copy changes required.' },
      ],
      evidenceFindings: [
        'Official Alder Hey page title and Page last reviewed: 04/07/2023 were verified on 2026-09-10.',
        'The publisher says appointments may involve waiting and some waiting areas have toys or activities; the source does not validate counting as treatment.',
        'The existing historically human-reviewed source and its reviewer fields remain unchanged; this is a separate fresh AI context review.',
      ],
      contentChecks: ['Exact production revision 3 bilingual copy reviewed 2026-09-10T03:55:16Z.', 'Myanmar and English meaning align.', 'Explicit original-fiction framing and separate AI-only notice retained.', 'No diagnosis, treatment, dosage, developmental screening, guaranteed outcome or claimed new human approval.'],
      limitations: ['Only story:st_waiting_at_clinic revision 3 and its exact linked source snapshot were reviewed.', 'The 3y category is an editorial selection, not a publisher-validated recommendation or milestone.'],
    },
    {
      type: 'story', slug: 'st_first_day_school',
      contentSnapshotHash: '4e97f5e2df501b2805ae0907419b18003d7f17b613729e7f2b0334f8de307d3f',
      evidenceLinkSnapshotHash: '78e97e444b905613c2bf283a7e3f650853df81f80111dd506ed11c71042d5cea',
      sourceSnapshotHash: '7e1bd6abe238b5a7b26e406f61c9c3e9f87ea12382e8b99a049c71386d9862e6',
      sourceId: 'us-hhs-head-start-first-day-jitters-metadata-2026',
      sourceUrl: 'https://www.headstart.gov/video/first-day-jitters',
      verdict: 'pass',
      claimScope: 'General school-transition and first-day nervousness context for an original fictional story; no age threshold, diagnostic interpretation or promise about when any child will settle.',
      independentAgentResults: [
        { role: 'source_research', verdict: 'pass', report: 'two_story_source_review inspected the exact corrected TWO_STORIES_SCHOOL_SOURCE object and passed it at 2026-09-10T03:58:28Z (metadata hash 9fb042c2c6f67e16355c2bf9836efc9c2f8f5d37b2aaed5601c922be27e78671). Current title/reader/transcript verified; numeric ages null; 2024 is explicitly historical search-index update metadata, not a new or current edition. Old source approval is not copied.' },
        { role: 'semantic_audit', verdict: 'pass', report: 'publication_gate_audit completed bilingual copy/safety review at 2026-09-10T03:55:16Z on exact production revision 2 copy. No text edits: revision 3 changes only the source link, so prior human approvals are not reused. Myanmar/English align and fictional one-child response is not a guarantee.' },
      ],
      evidenceFindings: ['Current official HeadStart.gov page confirms First Day Jitters, reader Amanda Bryans and school-transition transcript context.', 'Current retrieved page does not show an update date, Preschoolers label or numeric age range.', 'The corrected source records numeric age bounds as unknown; 2024 is qualified historical update metadata corroborated by official-page search indexing.', 'New source remains awaiting human review with null reviewer/date fields; original approved source and human history are unchanged.'],
      contentChecks: ['Exact production bilingual story copy reviewed 2026-09-10T03:55:16Z, preserved unchanged in successor revision 3.', 'Explicit fiction framing prevents the by-noon fictional response from becoming a universal child-outcome promise.', 'Myanmar and English meanings align; parent activity invites feelings without promising a response.', 'AI notice remains separate from human approval; no clinical/dose/diagnostic or required-age claim.'],
      limitations: ['Only story:st_first_day_school successor revision 3 with the corrected source/link is covered.', 'The 4y category is editorial, not a publisher-stated numeric age recommendation.', 'Historical 2024 update metadata is not independently visible on the current page and is qualified as search-index evidence.'],
    },
  ],
} as const;

export const TWO_STORIES_ARTIFACT_HASH = '3bda7deb70b9e7637cfbe9696a031e679380590340ab696a8ae9514d3772ecaa';
