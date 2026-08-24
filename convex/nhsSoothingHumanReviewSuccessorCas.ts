import { v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';
import {
  establishEvidenceHumanReviewSuccessor,
  evidenceHumanReviewSuccessorPreflight,
  evidenceHumanReviewSuccessorResultValidator,
} from './lib/evidenceHumanReviewSuccessorCas';
import {
  NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID,
  NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC,
} from './lib/evidenceHumanReviewSuccessorCasData';

export const preflight = internalQuery({
  args: {
    releaseId: v.literal(NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID),
    todayIso: v.string(),
  },
  returns: evidenceHumanReviewSuccessorResultValidator,
  handler: async (ctx, args) => evidenceHumanReviewSuccessorPreflight(
    ctx,
    NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC,
    args.todayIso,
  ),
});

export const apply = internalMutation({
  args: {
    releaseId: v.literal(NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID),
  },
  returns: v.object({
    releaseId: v.literal(NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    dataRowsChanged: v.literal(0),
    establishedAt: v.number(),
  }),
  handler: async (ctx) => establishEvidenceHumanReviewSuccessor(
    ctx,
    NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC,
  ),
});
