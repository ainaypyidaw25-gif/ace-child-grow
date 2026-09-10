/** Exact private production snapshots captured 2026-09-10; hashes contain no reviewer PII. */
export const TWO_STORIES_RELEASE_ROOT = '2026-09-10-two-stories-ai-preview-v1';
export const TWO_STORIES_RELEASE_DAYS = 30;
export const TWO_STORIES_PREIMAGE = {
  "configFullHash": "787503515ab51ebf900d488e52650f3c7a288b441c3721ea1ce31b18b350c385",
  "mathFullHash": "99c0d17dd123dfe5954a97cef57046bafa5ae13b5c51cc37f0f7c44223e11ec0",
  "mathReleaseFullHash": "f53aab699bc74bde531736842633130118a5d6a0768cb91b6b1f8061ca1fb138",
  "mathReleaseId": "2026-09-10-early-math-naeyc-ai-preview-v1:lesson:lsn_early_math",
  "targets": [
    {
      "slug": "st_waiting_at_clinic",
      "linkPreservedHash": "d685337f4ed4e9772553f48091f07322b49c0aaf49aecc093f44b08e9a9bf2b4",
      "contentId": "kx73pc2tw0pqcrwy1bxan7scgx8b8emr",
      "contentFullHash": "a5a401ffa89fea72ee55ac2436c0ec8d4cd0b7c7a883a7433997e0f9bdcfe550",
      "preservedContentHash": "4f9a27c68d73a96f2ea2cf91d5ff9f1be2c3e3c16c0feb9d4bc37c2d0eccc602",
      "linkFullHash": "603eb5e138540bb04755fbb94424428d128aa777b068274b7e186185cae35ed6",
      "sourceFullHash": "7b131e81711a8eb84af2b3e7e9b9dcb74abf5527510c2d497428044abe4a07dc",
      "sourceId": "nhs-alder-hey-outpatient-2023",
      "reviewRevision": 3,
      "desiredRevision": 3,
      "reviewsFullHash": "d9517512840271d448cada2cb37eb7a7ca877fae21528e500f05dd6c5eaca868",
      "predecessorsFullHash": "988dbde5200a9a5b8fd04fae7bd1bbe42bd7a7e81d5d3db159c990a7b855734b",
      "mediaFullHash": "ba5c57c39cadac47fac3a8e0b1e454436cbc7c4206e32947f19e2b466e61e8b0"
    },
    {
      "slug": "st_first_day_school",
      "linkPreservedHash": "85ba8a8724807ba574ab711735ed4b10b03d1ad1c18d1b22ebea248457215119",
      "contentId": "kx77y45t16fy6y98zqyn7kwbsx8b9q7h",
      "contentFullHash": "60cdc8f3d4bdc4a5087a253482e17ba2b1ed3b76194fe992c1e65e260d5036d2",
      "preservedContentHash": "ef2dd356826301ea11cbe3123421ec856830d9297a5c8d82294b4e93e40ac951",
      "linkFullHash": "7cd31dd2c3d8c6595b5f5dff60abb8f6477ad89e307be8667c25e561f30c3dee",
      "sourceFullHash": "3f47f830846e905d03aaa76eae5c2424118e0982d90b7cde11d4662a41ea6350",
      "sourceId": "us-hhs-head-start-first-day-jitters-2024",
      "reviewRevision": 2,
      "desiredRevision": 3,
      "reviewsFullHash": "96ad3d49ca6e01dc22ffeb1d112bd3b1de90c319ade8d11f3c1659e2dec89bf5",
      "predecessorsFullHash": "f5bb48202088aa70f3fd11ec77cbe2763ac03d7541f3a94c42c6d31eebe598bf",
      "mediaFullHash": "c1786f4625021655ee7381734f95420ac86cc8eb9847c777760d124b05336115"
    }
  ]
} as const;
/** New metadata record; historical human-reviewed source is never modified. */
export const TWO_STORIES_SCHOOL_SOURCE = {
  "ageMonthsMax": null,
  "ageMonthsMin": null,
  "authors": null,
  "country": "United States",
  "doi": null,
  "edition": "Historical page update: September 26, 2024 (official-page search index); no update date displayed on the page retrieved 2026-09-10",
  "evidenceLevel": "parent_education",
  "isbn": null,
  "keywords": [
    "first day of school",
    "kindergarten transition",
    "nervous feelings",
    "school readiness"
  ],
  "language": "en",
  "nextReviewDate": null,
  "org": "U.S. Department of Health and Human Services, Administration for Children and Families, Office of Head Start",
  "orgKey": "GOV",
  "pmid": null,
  "reviewDate": null,
  "reviewStatus": "awaiting_review",
  "reviewer": null,
  "searchText": "u.s. department of health and human services, administration for children and families, office of head start first day jitters  https://www.headstart.gov/video/first-day-jitters   first day of school kindergarten transition nervous feelings school readiness social_emotional school_readiness parenting",
  "sourceId": "us-hhs-head-start-first-day-jitters-metadata-2026",
  "title": "First Day Jitters",
  "topics": [
    "social_emotional",
    "school_readiness",
    "parenting"
  ],
  "url": "https://www.headstart.gov/video/first-day-jitters",
  "verifiedNote": "On 2026-09-10 the official HeadStart.gov page confirmed the title First Day Jitters, reader Amanda Bryans and a transcript discussing first-day nervousness, a welcoming adult and classmates. The current retrieved page did not display an update date, a Preschoolers label or a numeric age range. A search-index copy of the same official URL retained Last Updated: September 26, 2024; year 2024 records that historical page-update metadata, not a currently verified edition or original publication date. Numeric source age bounds are unknown and remain null. The story's 4y category is an ACE Child Grow editorial selection, not a publisher-stated age recommendation. The source supports general school-transition context only; the ACE story is original fiction and does not promise how or when an individual child will settle.",
  "verifiedOn": "2026-09-10",
  "year": 2024
};
export const twoStoriesReleaseId = (slug: string) => `${TWO_STORIES_RELEASE_ROOT}:story:${slug}`;
export const twoStoriesRunId = (slug: string) => `${TWO_STORIES_RELEASE_ROOT}:audit:story:${slug}`;
