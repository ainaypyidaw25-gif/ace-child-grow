/** Immutable exact AI-only reviews. No human approval is asserted. */
export const POWER_OF_PLAY_ARTIFACT = {
  "schemaVersion": 2,
  "artifactId": "2026-09-10-power-of-play-ai-preview-v1-audit",
  "releaseId": "2026-09-10-power-of-play-ai-preview-v1",
  "policyVersion": "ai-power-of-play-lesson-2026-09-10-v1",
  "provider": "OpenAI",
  "model": "Codex agents; exact runtime model identifier not exposed",
  "modelVersion": "not exposed",
  "auditedWorkspaceBaseCommit": "5573b4b25170069fe27f423738943e14f8ccda30",
  "auditStartedAt": 1789036874000,
  "auditCompletedAt": 1789037675000,
  "summary": "Two independent AI source-scope and bilingual semantic reviews of the exact corrected general-education power-of-play lesson. Not human or clinical approval.",
  "limitations": [
    "AI review only; no clinician, native Myanmar-language editor, evidence specialist or other human approval is created.",
    "AAP was reviewed at official PubMed abstract level; publisher full-text retrieval failed. WHO was reviewed at its official 2020 overview only; guideline download failed.",
    "WHO recommendations concern the first three years; this lesson makes no numeric-age efficacy claim or individual outcome guarantee.",
    "No original trial appraisal, clinician assessment, rights clearance, child testing, accessibility or device testing is represented.",
    "No media is released: exactly one illustration placeholder has no URL or storage object. Stored quiz is not rendered by the current lesson UI.",
    "Existing source records and prior human/AI review history remain unchanged; two historical source links are removed only from this lesson.",
    "auditStartedAt records the first completed reviewer report, not a measured agent-session start.",
    "Downloaded offline copies can persist until a device reconnects after withdrawal."
  ],
  "targets": [
    {
      "type": "lesson",
      "slug": "lsn_power_of_play",
      "contentSnapshotHash": "c1707b59c9f53875e45da37581700b732a7d3e8e231d573c321be046c5f72895",
      "evidenceLinkSnapshotHash": "0c9f0caac344855dd39b3369b3a88495b605080ac5408134cf5c096c3c40664f",
      "verdict": "pass",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "claimScope": "Developmentally appropriate play and nurturing caregiver relationships as opportunities for language, learning and connection; no superiority, dosage or guaranteed outcome.",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "evidenceFindings": [
            "Official PubMed abstract of the 2018 AAP clinical report supports developmentally appropriate play and nurturing relationships.",
            "The exact successor copy uses modest opportunity wording, responsive interaction and pauses, and removes guaranteed development or best-learning claims."
          ],
          "limitations": [
            "Abstract-only review; publisher full-text retrieval failed. No 2026 edition or complete evidence appraisal claimed."
          ]
        },
        {
          "sourceId": "who-improving-ecd-2020",
          "sourceSnapshotHash": "6ba551132da438100224a2a13b034279f93f54d496232e98682bee44cea16519",
          "sourceUrl": "https://www.who.int/publications/i/item/97892400020986",
          "claimScope": "Responsive caregiving and opportunities for early learning; no numeric-age efficacy or clinical assessment claim.",
          "urlsChecked": [
            "https://www.who.int/publications/i/item/97892400020986"
          ],
          "evidenceFindings": [
            "Official WHO overview dated 5 March 2020 supports responsive care and early learning in the first three years.",
            "The exact successor copy uses modest opportunity wording, responsive interaction and pauses, and removes guaranteed development or best-learning claims."
          ],
          "limitations": [
            "Official overview only; underlying guideline download failed. WHO age scope must not be extrapolated as an efficacy claim for all ages."
          ]
        }
      ],
      "mediaCount": 1,
      "mediaSnapshotHash": "5c686188f6b8b2a3d3fffca1d735c56eb9d4ad27a4a759b1fd3c917153ab6a6f",
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "/root/two_story_source_review completed 2026-09-10T10:41:14Z: current r2 blocked; exact narrow successor AI-preparatory pass. AAP abstract and WHO overview support responsive learning/connection without universal best, guaranteed growth or household-object assumptions. Not human, clinical or native-editor approval."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "/root/publication_gate_audit completed 2026-09-10T10:54:35Z: independently read every EN/MM authored field of the exact c1707b59c9f53875e45da37581700b732a7d3e8e231d573c321be046c5f72895 successor and independently opened AAP abstract and WHO overview. Equivalent modest child-led responsive-play wording, no dose, comparison, guaranteed benefit, screening, treatment or urgency. Explicit AI/no-human disclosure truthful; readingMinutes is reading estimate."
        }
      ],
      "contentChecks": [
        "Full EN/MM title, summary, objective, body, quiz, takeaway and action inspected",
        "Modest general education; no clinical decision or efficacy guarantee",
        "No household-object safety assumption or best-learning claim",
        "Exact AAP 2018 and WHO 2020 source order",
        "Explicit AI-only/no-human-specialist disclosure",
        "One placeholder-only media row; no released visual asset"
      ],
      "limitations": [
        "Preparatory AI copy/source review only, not specialist approval.",
        "WHO overview concerns first three years; copy does not assert an age-specific result."
      ]
    }
  ]
} as const;
export const POWER_OF_PLAY_ARTIFACT_HASH = "c5f8ad125a378d7a89c50549068740fa3560e4126bd079865c9474419ecd9f1b" as const;
