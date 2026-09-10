/** Immutable exact AI-only review reports, never human approval. */
export const FOUR_LESSONS_ARTIFACT = {
  "schemaVersion": 2,
  "batchGeneration": 4,
  "artifactId": "2026-09-10-four-lessons-ai-preview-v1-audit",
  "releaseId": "2026-09-10-four-lessons-ai-preview-v1",
  "policyVersion": "ai-four-lessons-2026-09-10-v1",
  "provider": "OpenAI",
  "auditedWorkspaceBaseCommit": "c75d2af1d6023e4013a2d379256ef9439d744a2b",
  "model": "Codex agents; exact runtime model identifier not exposed",
  "modelVersion": "not exposed",
  "auditStartedAt": 1789043384000,
  "auditCompletedAt": 1789043475000,
  "summary": "Independent per-target AI source-scope and bilingual semantic reviews of four exact educational lesson successors. Not human or clinical approval.",
  "limitations": [
    "AI-only educational review; no clinician, native Myanmar-language editor, evidence specialist or other human approval.",
    "Current official CDC pages and the registered primary cohort/AAP publication records were reviewed only for the narrow claims represented; no complete clinical evidence appraisal.",
    "No child testing, clinician assessment, rights clearance or device/accessibility testing represented.",
    "Each target retains one URL-free offline placeholder row. Static lesson art is not released; no rights-cleared, revision-bound visual approval is represented.",
    "Offline copies may persist until the device reconnects after withdrawal.",
    "auditStartedAt denotes the earliest completed reviewer report, not a measured session start.",
    "All shared source rows and historical human/AI decisions are preserved. Current lesson links alone are narrowed to claim-relevant sources.",
    "The global publication config remains at generation 3 so all fourteen existing release postflights remain valid; generation 4 identifies this additive four-lesson batch only."
  ],
  "targets": [
    {
      "type": "lesson",
      "slug": "lsn_talk_more",
      "contentSnapshotHash": "860d9291725dc482b30d3413f794ae874848d58eb372cc4bfabc03e84933fa9c",
      "evidenceLinkSnapshotHash": "83a7b666323e4c8881f37a3fefc0399a9052b4c049f45c1bd521c1b876d2d006",
      "verdict": "pass",
      "mediaCount": 1,
      "mediaSnapshotHash": "976cf7f1fac120018e6393286a95062b75cbf54e2496910837f449784dd52eea",
      "sources": [
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Developmentally appropriate back-and-forth talk and responsive interaction; no promised language outcome or diagnostic claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "jr-weisleder-2013",
          "sourceSnapshotHash": "2c0aa6f0c9cb8ca1650daed20726d7e53d3e0f23c3d67b286714af661b8c5020",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/24022649/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/24022649/"
          ],
          "claimScope": "Developmentally appropriate back-and-forth talk and responsive interaction; no promised language outcome or diagnostic claim.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "PASS — Exact successor is narrowly supported by the current official CDC developmental-milestones hub (page reviewed in 2026) plus Weisleder & Fernald 2013 PubMed record 24022649. Claims are limited to everyday responsive talk, expanding short phrases and pausing; the stale NHS page and unsupported screen-comparison claim are removed. No screening, diagnosis or individualized speech-language advice is asserted."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "PASS — Exact English and Myanmar authored fields preserve the same sequence: describe a routine, notice and respond to sounds/gestures/words, slightly expand a short phrase, then pause. The disclosure and assessment limitation are present in both languages; this structural semantic audit is AI-only and is not native-language approval."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "One placeholder-only media row; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "lesson",
      "slug": "lsn_making_friends",
      "contentSnapshotHash": "bf665cc8c21ecc9c8caac73cb35086d63319009e65c4de33e4577778674b4d61",
      "evidenceLinkSnapshotHash": "262746122a82fccb03035284713295246b73e339df8ab291dd89f9dba4d21f0a",
      "verdict": "pass",
      "mediaCount": 1,
      "mediaSnapshotHash": "9b46bb9bbae127e60f022cb2e06b017b76ffaf40a4ff1931b4b86be2ee20630b",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Supported social play, turn-taking and adult guidance for preschool children; no promised friendship outcome.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-positive-parenting-preschoolers-2026",
          "sourceSnapshotHash": "906926e79902715e787a16193f114e34760af5128d4fc45e8edc1dd40187b36e",
          "sourceUrl": "https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html",
          "urlsChecked": [
            "https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html"
          ],
          "claimScope": "Supported social play, turn-taking and adult guidance for preschool children; no promised friendship outcome.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "PASS — Exact successor is narrowly supported by AAP Power of Play (2018; official publisher marks reaffirmed January 2025) and the official CDC Positive Parenting Tips: Preschoolers page dated February 20, 2026. Claims are limited to play-based practice, turn-taking, using words and peaceful caregiver-guided choices; the 2015 ELOF and mismatched mental-health citation are removed."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "PASS — Exact English and Myanmar authored fields align on gradual social-skill development, modeled turn-taking, using words, peaceful caregiver-guided choices, and the one-moment non-diagnosis limitation. Quiz, takeaway, and action remain within that scope; this AI-only comparison is not native-language or clinical approval."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "One placeholder-only media row; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "lesson",
      "slug": "lsn_creativity",
      "contentSnapshotHash": "b23b20277de5cfd6468a8e33fc381e81391612e1d5420403920cce439e08c3b2",
      "evidenceLinkSnapshotHash": "43d1c6d57055fd48cb8355505d1436066885af5f300777116f5065c69568788c",
      "verdict": "pass",
      "mediaCount": 1,
      "mediaSnapshotHash": "7256d0bd3a132efca81efc42c0b8c620a1a98d93b2f449042b29232b79163f0e",
      "sources": [
        {
          "sourceId": "aap-power-of-play-2018",
          "sourceSnapshotHash": "a6fbcca4b8318e44078219456c09b14c7bb88fec528afed74aecc770bcf7f6f3",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/30126932/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/30126932/"
          ],
          "claimScope": "Open-ended play and child-led creative exploration; no promised developmental outcome.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-positive-parenting-preschoolers-2026",
          "sourceSnapshotHash": "906926e79902715e787a16193f114e34760af5128d4fc45e8edc1dd40187b36e",
          "sourceUrl": "https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html",
          "urlsChecked": [
            "https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html"
          ],
          "claimScope": "Open-ended play and child-led creative exploration; no promised developmental outcome.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "PASS — Exact successor is narrowly supported by AAP Power of Play (2018; reaffirmed January 2025) and the official CDC Positive Parenting Tips: Preschoolers page dated February 20, 2026. Claims are limited to open-ended child-led play with simple age-appropriate materials, choice and process-oriented participation; no creativity measurement or predicted ability is claimed."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "PASS — Exact English and Myanmar authored fields align on open-ended child-led play, simple age-appropriate materials, child choice, and no measurement or prediction of ability. Quiz, takeaway, and action match the body. The preview remains text-only because the legacy static illustration lacks revision-bound rights review; this AI-only comparison is not native-language approval."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "One placeholder-only media row; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "lesson",
      "slug": "lsn_prepare_preschool",
      "contentSnapshotHash": "a21d64543b067e0603b1a111623f93395437441b6ae1ed5005a4ebff7ed754ac",
      "evidenceLinkSnapshotHash": "eb02254db02be9235f82e170bcab6b56edd456ca2be6cabed777e4d864724815",
      "verdict": "pass",
      "mediaCount": 1,
      "mediaSnapshotHash": "25f919231dbfafcddb4ae329a2297951c043be630a7af53109357d32ce0e3b79",
      "sources": [
        {
          "sourceId": "cdc-milestones-2026",
          "sourceSnapshotHash": "a3620431f463478d1b2910be4031f96d5b15c1f8aec4667f7ccc8a3d44aa6a68",
          "sourceUrl": "https://www.cdc.gov/act-early/milestones/index.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/milestones/index.html"
          ],
          "claimScope": "Familiar routines and simple preparation for preschool transitions; no guarantee of readiness or distress prevention.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        },
        {
          "sourceId": "cdc-positive-parenting-preschoolers-2026",
          "sourceSnapshotHash": "906926e79902715e787a16193f114e34760af5128d4fc45e8edc1dd40187b36e",
          "sourceUrl": "https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html",
          "urlsChecked": [
            "https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html"
          ],
          "claimScope": "Familiar routines and simple preparation for preschool transitions; no guarantee of readiness or distress prevention.",
          "evidenceFindings": [
            "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "PASS — Exact successor is narrowly supported by the current official CDC developmental-milestones hub (2026) and the official CDC Positive Parenting Tips: Preschoolers page dated February 20, 2026. Claims are limited to making a new place familiar through story/role-play and offering safe age-appropriate dressing practice; the 2015 ELOF and broad handbook citations are removed."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "PASS — Exact English and Myanmar authored fields align on familiarization through story or role-play, safe age-appropriate dressing practice, child variation, and the explicit non-test/referral boundary. Quiz, takeaway, and action match the body. The preview remains text-only because the legacy static illustration lacks revision-bound rights review; this AI-only comparison is not native-language or clinical approval."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "One placeholder-only media row; no static image asset released",
        "No rights-cleared or revision-bound visual approval represented"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    }
  ]
} as const;
export const FOUR_LESSONS_ARTIFACT_HASH = "952a1aa4dd377f3324e791e7c74f6e8ee8a8dc73a41a993327c3c4a9e713e233" as const;
