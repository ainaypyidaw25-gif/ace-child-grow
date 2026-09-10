/** Immutable exact AI-only review reports, never human approval. */
export const TWO_LESSONS_ARTIFACT = {
  "schemaVersion": 2,
  "artifactId": "2026-09-10-two-lessons-ai-preview-v1-audit",
  "releaseId": "2026-09-10-two-lessons-ai-preview-v1",
  "policyVersion": "ai-two-lessons-2026-09-10-v1",
  "provider": "OpenAI",
  "auditedWorkspaceBaseCommit": "b7a991e82e306fe6fe0b974970412caffa52bc85",
  "model": "Codex agents; exact runtime model identifier not exposed",
  "modelVersion": "not exposed",
  "auditStartedAt": 1789039781000,
  "auditCompletedAt": 1789040190000,
  "summary": "Two independent per-target AI source-scope and bilingual semantic reviews of exact educational development and feelings successors. Not human or clinical approval.",
  "limitations": [
    "AI-only educational review; no clinician, native Myanmar-language editor, evidence specialist or other human approval.",
    "CDC official current full webpage reviewed; no linked PDF, screening instrument, clinical tool or US screening-schedule validation is represented.",
    "AAP original 2021 publication bibliographic abstract and selected publisher passages reviewed; no complete clinical evidence appraisal or original-trial review.",
    "AAP publisher notes reaffirmation in May 2026 with reference/data updates; the shared historical 2021 source record is preserved, not relabeled as a new edition.",
    "No child testing, clinician assessment, rights clearance or device/accessibility testing represented. Each target has one URL-free illustration placeholder; no media is published.",
    "Offline copies may persist until the device reconnects after withdrawal.",
    "auditStartedAt denotes the earliest completed reviewer report, not a measured session start.",
    "All shared source rows and historical human/AI decisions are preserved. Current lesson links alone are narrowed to claim-relevant sources."
  ],
  "targets": [
    {
      "type": "lesson",
      "slug": "lsn_what_is_development",
      "contentSnapshotHash": "a0f8a01626152b7b90884b89cbead4bc7c67459c2ca8e005ff5378a40b1d0613",
      "evidenceLinkSnapshotHash": "9af024e69e089051d3418f40a59a15732e1ba95a2eb31fab6fc14dbd6f9318e8",
      "verdict": "pass",
      "mediaCount": 1,
      "mediaSnapshotHash": "e8ef6aa785178ab7c457c6dc9866e85425df6877177e82c6d1294f51cbd30cdc",
      "sources": [
        {
          "sourceId": "cdc-monitoring-screening-2026",
          "sourceSnapshotHash": "df0ffda9382051935623bbe701c9dcc9e226516b1fcb6b1cae6384d8c98f14ef",
          "sourceUrl": "https://www.cdc.gov/act-early/about/developmental-monitoring-and-screening.html",
          "urlsChecked": [
            "https://www.cdc.gov/act-early/about/developmental-monitoring-and-screening.html"
          ],
          "claimScope": "General developmental monitoring, checklist limits and discussing concerns promptly; not diagnosis or clinical screening.",
          "evidenceFindings": [
            "Official CDC full page dated February 16, 2026 distinguishes monitoring and screening and advises discussing concerns without waiting.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "No linked clinical instruments or PDFs reviewed; no diagnostic cutoffs or US visit schedule imported."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "/root/two_story_source_review completed 2026-09-10T11:29:41Z: blocked original r2 own-pace reassurance; exact narrow successor AI preparatory pass. Official CDC full 2026-02-16 page read. No human, clinician or native-editor approval."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "/root/publication_gate_audit completed 2026-09-10T11:36:30Z: independently read all exact EN/MM title, summary, objectives, body, quiz, takeaway and action and CDC official full page. Equivalent checklist limitations and prompt discussion of concerns, no diagnosis/treatment/dose/cutoffs. No human or native-editor approval."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "One placeholder-only illustration; no image asset released"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    },
    {
      "type": "lesson",
      "slug": "lsn_big_feelings",
      "contentSnapshotHash": "397f62faf40e47d4cc0d49e8b918f97b426506232071f9b5ca20b757a7569533",
      "evidenceLinkSnapshotHash": "bbf7cee0463eaa4192739584796fee8daa5ef85843a1559fcce09f82c89ecd12",
      "verdict": "pass",
      "mediaCount": 1,
      "mediaSnapshotHash": "e1f40eb262f2bf45f10eae1783b32cc1d5496aa3c28f7611fd72791d6ceba4ac",
      "sources": [
        {
          "sourceId": "aap-toxic-stress-2021",
          "sourceSnapshotHash": "e29832fee8c073bef005d010dc5cb3a45745f04a2e0ecaca6d2add7560c84981",
          "sourceUrl": "https://pubmed.ncbi.nlm.nih.gov/34312296/",
          "urlsChecked": [
            "https://pubmed.ncbi.nlm.nih.gov/34312296/",
            "https://publications.aap.org/pediatrics/article/148/2/e2021052582/179805/Preventing-Childhood-Toxic-Stress-Partnering-With"
          ],
          "claimScope": "Safe, stable nurturing relationships offer support for emotional learning; no immediate calming guarantee or distress diagnosis.",
          "evidenceFindings": [
            "Official AAP PubMed record and selected publisher passages support relational health and emotional learning in supportive relationships.",
            "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure."
          ],
          "limitations": [
            "Selected publisher passages and abstract only, not a full clinical appraisal. No emotion-labeling protocol or guaranteed calming result is asserted."
          ]
        }
      ],
      "independentAgentResults": [
        {
          "role": "source_research",
          "verdict": "pass",
          "report": "/root/two_story_release completed 2026-09-10T11:30:13Z: current r4 blocked for immediate calming and universal modeling claims. Narrow successor AI-preparatory pass against AAP PubMed abstract and selected publisher passages. Original 2021 metadata remains historical despite publisher 2026 reaffirmation. No clinical or human approval."
        },
        {
          "role": "semantic_audit",
          "verdict": "pass",
          "report": "/root/two_story_source_review completed 2026-09-10T11:34:04Z: independently reviewed every exact proposed EN/MM field including final curly apostrophe in child’s distress. Warm supportive relationships, no guaranteed calming or assessment of distress; explicit AI/no-clinician/no-native-editor disclosure. AI semantic review only, not independent full-text clinical review."
        }
      ],
      "contentChecks": [
        "All EN/MM authored fields reviewed",
        "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
        "Source-specific claim scope with historical metadata preserved",
        "Explicit AI-only/no-clinician/no-native-editor disclosure",
        "One placeholder-only illustration; no image asset released"
      ],
      "limitations": [
        "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval."
      ]
    }
  ]
} as const;
export const TWO_LESSONS_ARTIFACT_HASH = "f82b808fafe5746431b35d99ab30e047d41350eceeb8b2449afb5b9e253fdc36" as const;
