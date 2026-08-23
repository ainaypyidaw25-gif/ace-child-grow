/**
 * Who may record which review decision, decided in ONE place.
 *
 * This module exists because the rule was previously written twice — once in
 * convex/contentReviews.ts and once in the review workspace screen. Two copies
 * of a permission rule drift, and when they drift the UI offers an action the
 * server then refuses. The screen and the mutation now consult this file, so
 * they cannot disagree.
 *
 * `reviewRefusal` is a pure function returning a refusal code or null, mirroring
 * the evidence module's approval gate: the mutation performs the refusal and the
 * UI can predict it, from the same source.
 *
 * Pure by design — no Convex imports — so both the server bundle and the browser
 * bundle can use it.
 */

export type ReviewDimension =
  | 'english'
  | 'native_myanmar'
  | 'child_development'
  | 'evidence'
  | 'safety'
  | 'clinical';
export type ReviewDecision = 'in_review' | 'approved' | 'changes_requested' | 'not_applicable';
export type ReviewerRole =
  | 'owner'
  | 'content_editor'
  | 'language_reviewer'
  | 'evidence_reviewer'
  | 'clinical_reviewer'
  | 'review_manager'
  | 'support';

export function roleMayReview(role: string | null | undefined, dimension: ReviewDimension): boolean {
  if (!role || role === 'support') return false;
  // A review manager runs the queue: triages, confirms what a record needs,
  // and requests reviews. It signs off on NOTHING. Separating "decides what
  // must be reviewed" from "declares it reviewed" is the whole point of the
  // role — otherwise the person under pressure to clear a backlog is also the
  // person who can clear it by approving. Someone who is both a manager and a
  // qualified reviewer holds the reviewer role as well, and signs under that.
  if (role === 'review_manager') return false;
  if (dimension === 'clinical') return role === 'clinical_reviewer';
  // Child-development sign-off is a professional decision. Until a dedicated
  // child-development reviewer role exists, keep this least-privilege and use
  // the already qualification-gated clinical reviewer role only.
  if (dimension === 'child_development') return role === 'clinical_reviewer';
  if (dimension === 'safety') {
    return ['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer'].includes(role);
  }
  if (dimension === 'evidence') {
    return ['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer'].includes(role);
  }
  return ['owner', 'content_editor', 'language_reviewer'].includes(role);
}

/**
 * Clinical, child-safety and evidence decisions record the reviewer's stated
 * qualification. A safety decision is never represented as a personal endorsement.
 */
export function approvalNeedsQualification(dimension: ReviewDimension): boolean {
  return dimension === 'clinical'
    || dimension === 'safety'
    || dimension === 'evidence'
    || dimension === 'child_development';
}

export type ReviewRefusalCode =
  | 'not_staff'
  | 'role_may_not_review_area'
  | 'display_name_required'
  | 'qualification_required'
  | 'note_required'
  | 'content_not_found'
  | 'retired_content'
  | 'assignment_required'
  | 'stale_revision';

export type ReviewRefusal = { code: ReviewRefusalCode; message: string };

/**
 * Every reason a decision can be refused, as data.
 *
 * The messages are the reviewer-facing explanation. They are returned in-band
 * rather than thrown: Convex redacts thrown error messages on a production
 * deployment, so a throw reaches the reviewer as an opaque "Server Error" with
 * only a request ID — and a mutation that throws also discards its own writes,
 * erasing the audit record of the refusal.
 */
export function reviewRefusal(input: {
  role: string | null | undefined;
  dimension: ReviewDimension;
  decision: ReviewDecision;
  displayName: string | null | undefined;
  qualification: string | null | undefined;
  note: string | null | undefined;
  contentExists: boolean;
}): ReviewRefusal | null {
  if (!input.role || input.role === 'support') {
    return {
      code: 'not_staff',
      message: 'Your account does not have permission to record review decisions.',
    };
  }
  if (!roleMayReview(input.role, input.dimension)) {
    return {
      code: 'role_may_not_review_area',
      message: 'Your reviewer role cannot decide this review area.',
    };
  }
  if (!input.displayName?.trim()) {
    return {
      code: 'display_name_required',
      message: 'Add your display name in your admin profile before recording a decision.',
    };
  }
  if (
    input.decision === 'approved' &&
    approvalNeedsQualification(input.dimension) &&
    !input.qualification?.trim()
  ) {
    return {
      code: 'qualification_required',
      message: 'Add your professional qualification in your admin profile before approving this area.',
    };
  }
  if (input.decision === 'changes_requested' && !input.note?.trim()) {
    return {
      code: 'note_required',
      message: 'Write a note explaining what needs to change.',
    };
  }
  if (!input.contentExists) {
    return { code: 'content_not_found', message: 'This content item no longer exists.' };
  }
  return null;
}

/** Reviewer-facing refusal text, bilingual. Keyed by the codes above. */
export const REVIEW_REFUSAL_LABELS: Record<ReviewRefusalCode, { mm: string; en: string }> = {
  not_staff: {
    mm: 'သင့်အကောင့်တွင် သုံးသပ်ဆုံးဖြတ်ချက် မှတ်တမ်းတင်ခွင့် မရှိပါ။',
    en: 'Your account does not have permission to record review decisions.',
  },
  role_may_not_review_area: {
    mm: 'သင့်သုံးသပ်သူ အခန်းကဏ္ဍအရ ဤအပိုင်းကို ဆုံးဖြတ်ခွင့် မရှိပါ။',
    en: 'Your reviewer role cannot decide this review area.',
  },
  display_name_required: {
    mm: 'ဆုံးဖြတ်ချက် မှတ်တမ်းမတင်မီ သင့်အကောင့်တွင် ပြသမည့်အမည် ထည့်ပါ။',
    en: 'Add your display name in your admin profile before recording a decision.',
  },
  qualification_required: {
    mm: 'ဤအပိုင်းကို အတည်မပြုမီ သင့်အကောင့်တွင် သက်ဆိုင်ရာ ပညာရပ်ဆိုင်ရာ အရည်အချင်းကို ထည့်ပါ။',
    en: 'Add your professional qualification in your admin profile before approving this area.',
  },
  note_required: {
    mm: 'ပြင်ဆင်ရန် တောင်းဆိုပါက မည်သည့်အချက်ကို ပြင်ဆင်ရမည်ဖြစ်ကြောင်း မှတ်ချက်တွင် ရေးပါ။',
    en: 'Write a note explaining what needs to change.',
  },
  content_not_found: {
    mm: 'ဤအကြောင်းအရာကို ရှာမတွေ့ပါ။',
    en: 'This content item no longer exists.',
  },
  retired_content: {
    mm: 'မပြောင်းလဲနိုင်သော ထုတ်ဝေမှုမှတ်တမ်းဖြင့် ရပ်ဆိုင်းထားသော ဤအကြောင်းအရာတွင် သုံးသပ်ဆုံးဖြတ်ချက်အသစ် မထည့်နိုင်ပါ။',
    en: 'This content was retired by an immutable release and cannot receive new review decisions.',
  },
  assignment_required: {
    mm: 'Clinical reviewer ဆုံးဖြတ်ချက်ကို သတ်မှတ်ထားသော frozen batch ထဲမှသာ မှတ်တမ်းတင်နိုင်ပါသည်။',
    en: 'Clinical reviewer decisions must be recorded through the assigned frozen batch.',
  },
  stale_revision: {
    mm: 'သင်ဖတ်ရှုပြီးနောက် ဤအကြောင်းအရာ ပြောင်းလဲသွားပါပြီ။ မူကွဲအသစ်ကို ပြန်လည်စစ်ဆေးပြီးမှ ဆုံးဖြတ်ပါ။',
    en: 'This content changed after you loaded it. Review the new revision before deciding.',
  },
};
