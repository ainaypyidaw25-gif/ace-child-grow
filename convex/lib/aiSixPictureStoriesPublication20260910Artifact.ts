/** Immutable exact AI-only review reports, never human approval. */
export const SIX_PICTURE_STORIES_ARTIFACT = {
  "schemaVersion": 2,
  "batchGeneration": 5,
  "artifactId": "2026-09-10-six-picture-stories-ai-preview-v1-audit",
  "releaseId": "2026-09-10-six-picture-stories-ai-preview-v1",
  "policyVersion": "ai-six-picture-stories-2026-09-10-v1",
  "provider": "OpenAI",
  "auditedWorkspaceBaseCommit": "cd587e97099a472c47de5a07636ddf18e0329e7f",
  "model": "Codex agents; exact runtime model identifier not exposed",
  "modelVersion": "not exposed",
  "auditStartedAt": 1789046800000,
  "auditCompletedAt": 1789046863000,
  "summary": "Independent per-target AI source-scope and bilingual semantic reviews of six exact educational picture-story activity successors. Not human or clinical approval.",
  "limitations": [
    "AI-only educational review; no clinician, native Myanmar-language editor, evidence specialist or other human approval.",
    "Current official CDC pages and the registered primary cohort/AAP publication records were reviewed only for the narrow claims represented; no complete clinical evidence appraisal.",
    "No child testing, clinician assessment, rights clearance or device/accessibility testing represented.",
    "Each target retains exactly two URL-free placeholder rows: an offline illustration placeholder and a video placeholder. Static picture-story art and video are not released; no rights-cleared, revision-bound visual approval is represented.",
    "Offline copies may persist until the device reconnects after withdrawal.",
    "auditStartedAt denotes the earliest completed reviewer report, not a measured session start.",
    "All shared source rows and historical human/AI decisions are preserved. Current activity links alone are narrowed to claim-relevant sources.",
    "The global publication config remains at generation 3 so all eighteen existing release postflights remain valid; generation 5 identifies this additive six-picture-story batch only."
  ],
  "targets": [
    {
      "type": "activity",
      "slug": "act_picture_story_2_5y",
      "contentSnapshotHash": "0af19edb69ba9d37f85748063a1de41cbdd479d5f6ee06b36854846eb92d6146",
      "evidenceLinkSnapshotHash": "829eb986ad71bfdc2f7a19288f83269fcf28066a56f7d089dab4809416407a12",
      "verdict": "pass",
      "mediaCount": 2,
      "mediaSnapshotHash": "24c456c16a1b727277fd88d9ce0e3cc97dd243b8632ddb07470e379747018c08",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "Reviewed all six exact picture-story successor copies — act_picture_story_2_5y r6, act_picture_story_3y r6, act_picture_story_3_5y r7, act_picture_story_4y r6, act_picture_story_4_5y r6 and act_picture_story_5y r6 — across every English and Myanmar title, summary/outcome, materials, setup, instruction, safety and variation field. The copy is limited to optional caregiver-child picture play, accepts multiple ways to participate or tell a story, and avoids pass/fail, diagnosis, screening and guaranteed-development language. Evidence is narrowed to the two approved education-scope source registrations aap-power-of-play-2018 and cdc-milestones-2026; the older who-care-for-child-development-2012 attribution is removed from every successor and exact import/seed guards prevent generic restoration. Each successor retains only one URL-less illustration placeholder and one URL-less video placeholder, with no target-specific static illustration mapping and no media-rights or provenance claim. Limitations: CDC provides exact milestone pages for 30 months, 3 years, 4 years and 5 years, not the intermediate 3.5- or 4.5-year bands, so those two activities are optional play variants rather than age norms; no human specialist, clinician or native Myanmar-language editor review or approval is claimed; real media remains blocked pending separate rights/provenance review."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "semantic_audit PASS — Independently read every exact EN/MM successor field (title, summary/outcome, materials, setup, instruction, safety, and variation) for activity:act_picture_story_2_5y r6, activity:act_picture_story_3y r6, activity:act_picture_story_3_5y r7, activity:act_picture_story_4y r6, activity:act_picture_story_4_5y r6, and activity:act_picture_story_5y r6. The wording frames optional caregiver-child play, accepts gestures/words/multiple tellings, follows the child's interest, and does not present performance as an assessment. The 3.5y and 4.5y copy contains no age-norm, ability-by-age, or pass/fail claim. Evidence scope is bounded to AAP Power of Play (2018; reaffirmed January 2025; verified 2026-08-19) for play/caregiver interaction and CDC Developmental Milestones (page last reviewed in 2026) for general milestone context; the copy does not claim these sources validate efficacy or establish a 3.5y/4.5y norm, and removed WHO 2012 attribution is absent. The governed canonical AI disclosure remains presentation-layer behavior for publicationLane ai_audited and truthfully says AI-reviewed with no clinician or native Myanmar-language editor approval; seed copy does not duplicate it. Each target has exactly two URL/storage-free placeholders—one offline illustration and one video—and no target-specific asset mapping. No human, clinical, or native-language approval is claimed. Limitations: semantic/editorial review only; no clinician review, native Myanmar-language review, human specialist approval, rendered-device/browser validation, real media, production publication, or efficacy validation."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "Two placeholder-only media rows; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "activity",
      "slug": "act_picture_story_3y",
      "contentSnapshotHash": "a4c2b74bc8c765e63337e2ed0ba70862d3829bc0cf85c86fb74ed76f2070419c",
      "evidenceLinkSnapshotHash": "2593a17d54c1911a27d5c1dfa5e0b2a414336e9c6c6f99bddc17728ba5845fd7",
      "verdict": "pass",
      "mediaCount": 2,
      "mediaSnapshotHash": "5cab7b2797763007429fc4f331e100ea1255b3110f2e65b2a06f472990e2164b",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "Reviewed all six exact picture-story successor copies — act_picture_story_2_5y r6, act_picture_story_3y r6, act_picture_story_3_5y r7, act_picture_story_4y r6, act_picture_story_4_5y r6 and act_picture_story_5y r6 — across every English and Myanmar title, summary/outcome, materials, setup, instruction, safety and variation field. The copy is limited to optional caregiver-child picture play, accepts multiple ways to participate or tell a story, and avoids pass/fail, diagnosis, screening and guaranteed-development language. Evidence is narrowed to the two approved education-scope source registrations aap-power-of-play-2018 and cdc-milestones-2026; the older who-care-for-child-development-2012 attribution is removed from every successor and exact import/seed guards prevent generic restoration. Each successor retains only one URL-less illustration placeholder and one URL-less video placeholder, with no target-specific static illustration mapping and no media-rights or provenance claim. Limitations: CDC provides exact milestone pages for 30 months, 3 years, 4 years and 5 years, not the intermediate 3.5- or 4.5-year bands, so those two activities are optional play variants rather than age norms; no human specialist, clinician or native Myanmar-language editor review or approval is claimed; real media remains blocked pending separate rights/provenance review."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "semantic_audit PASS — Independently read every exact EN/MM successor field (title, summary/outcome, materials, setup, instruction, safety, and variation) for activity:act_picture_story_2_5y r6, activity:act_picture_story_3y r6, activity:act_picture_story_3_5y r7, activity:act_picture_story_4y r6, activity:act_picture_story_4_5y r6, and activity:act_picture_story_5y r6. The wording frames optional caregiver-child play, accepts gestures/words/multiple tellings, follows the child's interest, and does not present performance as an assessment. The 3.5y and 4.5y copy contains no age-norm, ability-by-age, or pass/fail claim. Evidence scope is bounded to AAP Power of Play (2018; reaffirmed January 2025; verified 2026-08-19) for play/caregiver interaction and CDC Developmental Milestones (page last reviewed in 2026) for general milestone context; the copy does not claim these sources validate efficacy or establish a 3.5y/4.5y norm, and removed WHO 2012 attribution is absent. The governed canonical AI disclosure remains presentation-layer behavior for publicationLane ai_audited and truthfully says AI-reviewed with no clinician or native Myanmar-language editor approval; seed copy does not duplicate it. Each target has exactly two URL/storage-free placeholders—one offline illustration and one video—and no target-specific asset mapping. No human, clinical, or native-language approval is claimed. Limitations: semantic/editorial review only; no clinician review, native Myanmar-language review, human specialist approval, rendered-device/browser validation, real media, production publication, or efficacy validation."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "Two placeholder-only media rows; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "activity",
      "slug": "act_picture_story_3_5y",
      "contentSnapshotHash": "5f0048399dba96956c1558c122cee0e980de46cf0481c4beeecd009c9bbc87f9",
      "evidenceLinkSnapshotHash": "e6922c4ccfaad0b20cf912c8973aebfa0797028d726fc0e1e8c21172a88a5d32",
      "verdict": "pass",
      "mediaCount": 2,
      "mediaSnapshotHash": "0721877bce31ff664ba3f4a5c22775b4082753701cc9f1087e8e121cb65a2d23",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "Reviewed all six exact picture-story successor copies — act_picture_story_2_5y r6, act_picture_story_3y r6, act_picture_story_3_5y r7, act_picture_story_4y r6, act_picture_story_4_5y r6 and act_picture_story_5y r6 — across every English and Myanmar title, summary/outcome, materials, setup, instruction, safety and variation field. The copy is limited to optional caregiver-child picture play, accepts multiple ways to participate or tell a story, and avoids pass/fail, diagnosis, screening and guaranteed-development language. Evidence is narrowed to the two approved education-scope source registrations aap-power-of-play-2018 and cdc-milestones-2026; the older who-care-for-child-development-2012 attribution is removed from every successor and exact import/seed guards prevent generic restoration. Each successor retains only one URL-less illustration placeholder and one URL-less video placeholder, with no target-specific static illustration mapping and no media-rights or provenance claim. Limitations: CDC provides exact milestone pages for 30 months, 3 years, 4 years and 5 years, not the intermediate 3.5- or 4.5-year bands, so those two activities are optional play variants rather than age norms; no human specialist, clinician or native Myanmar-language editor review or approval is claimed; real media remains blocked pending separate rights/provenance review."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "semantic_audit PASS — Independently read every exact EN/MM successor field (title, summary/outcome, materials, setup, instruction, safety, and variation) for activity:act_picture_story_2_5y r6, activity:act_picture_story_3y r6, activity:act_picture_story_3_5y r7, activity:act_picture_story_4y r6, activity:act_picture_story_4_5y r6, and activity:act_picture_story_5y r6. The wording frames optional caregiver-child play, accepts gestures/words/multiple tellings, follows the child's interest, and does not present performance as an assessment. The 3.5y and 4.5y copy contains no age-norm, ability-by-age, or pass/fail claim. Evidence scope is bounded to AAP Power of Play (2018; reaffirmed January 2025; verified 2026-08-19) for play/caregiver interaction and CDC Developmental Milestones (page last reviewed in 2026) for general milestone context; the copy does not claim these sources validate efficacy or establish a 3.5y/4.5y norm, and removed WHO 2012 attribution is absent. The governed canonical AI disclosure remains presentation-layer behavior for publicationLane ai_audited and truthfully says AI-reviewed with no clinician or native Myanmar-language editor approval; seed copy does not duplicate it. Each target has exactly two URL/storage-free placeholders—one offline illustration and one video—and no target-specific asset mapping. No human, clinical, or native-language approval is claimed. Limitations: semantic/editorial review only; no clinician review, native Myanmar-language review, human specialist approval, rendered-device/browser validation, real media, production publication, or efficacy validation."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "Two placeholder-only media rows; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "activity",
      "slug": "act_picture_story_4y",
      "contentSnapshotHash": "c914ab5155b52bfa0e4d9aceeaa21d7b01ade444feb7325dde3859b112aea896",
      "evidenceLinkSnapshotHash": "f6c684f72397bfb5100f05a09d9703d9b06ca2d1c5ee4f4df91b95f238c7324c",
      "verdict": "pass",
      "mediaCount": 2,
      "mediaSnapshotHash": "744b1c2b72b081470d0fca8a6cfa16b8238fd146b0c447d42713f0daab11b2fb",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "Reviewed all six exact picture-story successor copies — act_picture_story_2_5y r6, act_picture_story_3y r6, act_picture_story_3_5y r7, act_picture_story_4y r6, act_picture_story_4_5y r6 and act_picture_story_5y r6 — across every English and Myanmar title, summary/outcome, materials, setup, instruction, safety and variation field. The copy is limited to optional caregiver-child picture play, accepts multiple ways to participate or tell a story, and avoids pass/fail, diagnosis, screening and guaranteed-development language. Evidence is narrowed to the two approved education-scope source registrations aap-power-of-play-2018 and cdc-milestones-2026; the older who-care-for-child-development-2012 attribution is removed from every successor and exact import/seed guards prevent generic restoration. Each successor retains only one URL-less illustration placeholder and one URL-less video placeholder, with no target-specific static illustration mapping and no media-rights or provenance claim. Limitations: CDC provides exact milestone pages for 30 months, 3 years, 4 years and 5 years, not the intermediate 3.5- or 4.5-year bands, so those two activities are optional play variants rather than age norms; no human specialist, clinician or native Myanmar-language editor review or approval is claimed; real media remains blocked pending separate rights/provenance review."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "semantic_audit PASS — Independently read every exact EN/MM successor field (title, summary/outcome, materials, setup, instruction, safety, and variation) for activity:act_picture_story_2_5y r6, activity:act_picture_story_3y r6, activity:act_picture_story_3_5y r7, activity:act_picture_story_4y r6, activity:act_picture_story_4_5y r6, and activity:act_picture_story_5y r6. The wording frames optional caregiver-child play, accepts gestures/words/multiple tellings, follows the child's interest, and does not present performance as an assessment. The 3.5y and 4.5y copy contains no age-norm, ability-by-age, or pass/fail claim. Evidence scope is bounded to AAP Power of Play (2018; reaffirmed January 2025; verified 2026-08-19) for play/caregiver interaction and CDC Developmental Milestones (page last reviewed in 2026) for general milestone context; the copy does not claim these sources validate efficacy or establish a 3.5y/4.5y norm, and removed WHO 2012 attribution is absent. The governed canonical AI disclosure remains presentation-layer behavior for publicationLane ai_audited and truthfully says AI-reviewed with no clinician or native Myanmar-language editor approval; seed copy does not duplicate it. Each target has exactly two URL/storage-free placeholders—one offline illustration and one video—and no target-specific asset mapping. No human, clinical, or native-language approval is claimed. Limitations: semantic/editorial review only; no clinician review, native Myanmar-language review, human specialist approval, rendered-device/browser validation, real media, production publication, or efficacy validation."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "Two placeholder-only media rows; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "activity",
      "slug": "act_picture_story_4_5y",
      "contentSnapshotHash": "cd3214a4bb407fe7ae3e688c99ce3b5ee8fbb648c81fc66a3506890e74253b02",
      "evidenceLinkSnapshotHash": "c9606f8457b5c6c6fc4930617dfe035da8bc13872dc9bd10828f31e75b1851b5",
      "verdict": "pass",
      "mediaCount": 2,
      "mediaSnapshotHash": "59f9c0891ea2345b48782f0475cad490ab94568ec06623eba1a756b3f16ceba9",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "Reviewed all six exact picture-story successor copies — act_picture_story_2_5y r6, act_picture_story_3y r6, act_picture_story_3_5y r7, act_picture_story_4y r6, act_picture_story_4_5y r6 and act_picture_story_5y r6 — across every English and Myanmar title, summary/outcome, materials, setup, instruction, safety and variation field. The copy is limited to optional caregiver-child picture play, accepts multiple ways to participate or tell a story, and avoids pass/fail, diagnosis, screening and guaranteed-development language. Evidence is narrowed to the two approved education-scope source registrations aap-power-of-play-2018 and cdc-milestones-2026; the older who-care-for-child-development-2012 attribution is removed from every successor and exact import/seed guards prevent generic restoration. Each successor retains only one URL-less illustration placeholder and one URL-less video placeholder, with no target-specific static illustration mapping and no media-rights or provenance claim. Limitations: CDC provides exact milestone pages for 30 months, 3 years, 4 years and 5 years, not the intermediate 3.5- or 4.5-year bands, so those two activities are optional play variants rather than age norms; no human specialist, clinician or native Myanmar-language editor review or approval is claimed; real media remains blocked pending separate rights/provenance review."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "semantic_audit PASS — Independently read every exact EN/MM successor field (title, summary/outcome, materials, setup, instruction, safety, and variation) for activity:act_picture_story_2_5y r6, activity:act_picture_story_3y r6, activity:act_picture_story_3_5y r7, activity:act_picture_story_4y r6, activity:act_picture_story_4_5y r6, and activity:act_picture_story_5y r6. The wording frames optional caregiver-child play, accepts gestures/words/multiple tellings, follows the child's interest, and does not present performance as an assessment. The 3.5y and 4.5y copy contains no age-norm, ability-by-age, or pass/fail claim. Evidence scope is bounded to AAP Power of Play (2018; reaffirmed January 2025; verified 2026-08-19) for play/caregiver interaction and CDC Developmental Milestones (page last reviewed in 2026) for general milestone context; the copy does not claim these sources validate efficacy or establish a 3.5y/4.5y norm, and removed WHO 2012 attribution is absent. The governed canonical AI disclosure remains presentation-layer behavior for publicationLane ai_audited and truthfully says AI-reviewed with no clinician or native Myanmar-language editor approval; seed copy does not duplicate it. Each target has exactly two URL/storage-free placeholders—one offline illustration and one video—and no target-specific asset mapping. No human, clinical, or native-language approval is claimed. Limitations: semantic/editorial review only; no clinician review, native Myanmar-language review, human specialist approval, rendered-device/browser validation, real media, production publication, or efficacy validation."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "Two placeholder-only media rows; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "activity",
      "slug": "act_picture_story_5y",
      "contentSnapshotHash": "76c3f96c1b5a46c3683b26148f85ee790e840bdc0d9829ce4a86d9862b14ec73",
      "evidenceLinkSnapshotHash": "ccd7292f5be26a3f497c76e37b9de3a7d697dffab83bae3da0d794b865391bdb",
      "verdict": "pass",
      "mediaCount": 2,
      "mediaSnapshotHash": "4e65928584d232c4e4e0ec169d9d95129a3f8d63d4e02f1b42de34efe199e0fc",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "Reviewed all six exact picture-story successor copies — act_picture_story_2_5y r6, act_picture_story_3y r6, act_picture_story_3_5y r7, act_picture_story_4y r6, act_picture_story_4_5y r6 and act_picture_story_5y r6 — across every English and Myanmar title, summary/outcome, materials, setup, instruction, safety and variation field. The copy is limited to optional caregiver-child picture play, accepts multiple ways to participate or tell a story, and avoids pass/fail, diagnosis, screening and guaranteed-development language. Evidence is narrowed to the two approved education-scope source registrations aap-power-of-play-2018 and cdc-milestones-2026; the older who-care-for-child-development-2012 attribution is removed from every successor and exact import/seed guards prevent generic restoration. Each successor retains only one URL-less illustration placeholder and one URL-less video placeholder, with no target-specific static illustration mapping and no media-rights or provenance claim. Limitations: CDC provides exact milestone pages for 30 months, 3 years, 4 years and 5 years, not the intermediate 3.5- or 4.5-year bands, so those two activities are optional play variants rather than age norms; no human specialist, clinician or native Myanmar-language editor review or approval is claimed; real media remains blocked pending separate rights/provenance review."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "semantic_audit PASS — Independently read every exact EN/MM successor field (title, summary/outcome, materials, setup, instruction, safety, and variation) for activity:act_picture_story_2_5y r6, activity:act_picture_story_3y r6, activity:act_picture_story_3_5y r7, activity:act_picture_story_4y r6, activity:act_picture_story_4_5y r6, and activity:act_picture_story_5y r6. The wording frames optional caregiver-child play, accepts gestures/words/multiple tellings, follows the child's interest, and does not present performance as an assessment. The 3.5y and 4.5y copy contains no age-norm, ability-by-age, or pass/fail claim. Evidence scope is bounded to AAP Power of Play (2018; reaffirmed January 2025; verified 2026-08-19) for play/caregiver interaction and CDC Developmental Milestones (page last reviewed in 2026) for general milestone context; the copy does not claim these sources validate efficacy or establish a 3.5y/4.5y norm, and removed WHO 2012 attribution is absent. The governed canonical AI disclosure remains presentation-layer behavior for publicationLane ai_audited and truthfully says AI-reviewed with no clinician or native Myanmar-language editor approval; seed copy does not duplicate it. Each target has exactly two URL/storage-free placeholders—one offline illustration and one video—and no target-specific asset mapping. No human, clinical, or native-language approval is claimed. Limitations: semantic/editorial review only; no clinician review, native Myanmar-language review, human specialist approval, rendered-device/browser validation, real media, production publication, or efficacy validation."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "Two placeholder-only media rows; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    }
  ]
} as const;
export const SIX_PICTURE_STORIES_ARTIFACT_HASH = "1a5e1c441e33ba26199d1a879a9b4c145e5e2c0ab37c6e7f23809dc746df2bc7" as const;
