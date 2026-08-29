/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as activities from "../activities.js";
import type * as admin from "../admin.js";
import type * as aiPublication from "../aiPublication.js";
import type * as animationPlan from "../animationPlan.js";
import type * as appointments from "../appointments.js";
import type * as asqDoctorVisitsLinkCas from "../asqDoctorVisitsLinkCas.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as birth2mGrossMotorCas from "../birth2mGrossMotorCas.js";
import type * as birth2mNutritionCas from "../birth2mNutritionCas.js";
import type * as children from "../children.js";
import type * as clinicalRefreezeRegistryMigration from "../clinicalRefreezeRegistryMigration.js";
import type * as clinicalRefreezeRegistryMigrationActions from "../clinicalRefreezeRegistryMigrationActions.js";
import type * as clinicalReviewBatch from "../clinicalReviewBatch.js";
import type * as clinicalReviewBatchActions from "../clinicalReviewBatchActions.js";
import type * as clinicalReviewRegistry from "../clinicalReviewRegistry.js";
import type * as clinicalTwoSmallCas from "../clinicalTwoSmallCas.js";
import type * as content from "../content.js";
import type * as contentEdits from "../contentEdits.js";
import type * as contentReviews from "../contentReviews.js";
import type * as crons from "../crons.js";
import type * as directory from "../directory.js";
import type * as englishRefreezeCorrection from "../englishRefreezeCorrection.js";
import type * as englishRefreezeCorrectionActions from "../englishRefreezeCorrectionActions.js";
import type * as evidence from "../evidence.js";
import type * as family from "../family.js";
import type * as favorites from "../favorites.js";
import type * as gd10_12mPlayV5Cas from "../gd10_12mPlayV5Cas.js";
import type * as gdBirth2mEmotionalCas from "../gdBirth2mEmotionalCas.js";
import type * as growth from "../growth.js";
import type * as healthRecords from "../healthRecords.js";
import type * as http from "../http.js";
import type * as inherentPublicLinkCas from "../inherentPublicLinkCas.js";
import type * as legacyCompletedPriorityCorrection from "../legacyCompletedPriorityCorrection.js";
import type * as lib_aiAuditHash from "../lib/aiAuditHash.js";
import type * as lib_aiPublicationAuditArtifact from "../lib/aiPublicationAuditArtifact.js";
import type * as lib_aiPublicationPolicy from "../lib/aiPublicationPolicy.js";
import type * as lib_aiPublicationReleaseData from "../lib/aiPublicationReleaseData.js";
import type * as lib_aiPublicationVisibility from "../lib/aiPublicationVisibility.js";
import type * as lib_asqDoctorVisitsLinkCasData from "../lib/asqDoctorVisitsLinkCasData.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_billingPeriods from "../lib/billingPeriods.js";
import type * as lib_birth2mGrossMotorCasData from "../lib/birth2mGrossMotorCasData.js";
import type * as lib_birth2mGrossMotorCorrection from "../lib/birth2mGrossMotorCorrection.js";
import type * as lib_birth2mNutritionCasData from "../lib/birth2mNutritionCasData.js";
import type * as lib_burmeseCopyAuditRelease from "../lib/burmeseCopyAuditRelease.js";
import type * as lib_classificationImport from "../lib/classificationImport.js";
import type * as lib_clinicalBlockerCasData from "../lib/clinicalBlockerCasData.js";
import type * as lib_clinicalEnglishBatchData from "../lib/clinicalEnglishBatchData.js";
import type * as lib_clinicalEnglishRefreezeBatchData from "../lib/clinicalEnglishRefreezeBatchData.js";
import type * as lib_clinicalNativeMyanmarRefreezeBatchData from "../lib/clinicalNativeMyanmarRefreezeBatchData.js";
import type * as lib_clinicalRefreezeRegistryMigrationData from "../lib/clinicalRefreezeRegistryMigrationData.js";
import type * as lib_clinicalReviewBatchContract from "../lib/clinicalReviewBatchContract.js";
import type * as lib_clinicalReviewBatchData from "../lib/clinicalReviewBatchData.js";
import type * as lib_clinicalReviewBatchProvenance from "../lib/clinicalReviewBatchProvenance.js";
import type * as lib_clinicalReviewCopyRelease from "../lib/clinicalReviewCopyRelease.js";
import type * as lib_clinicalReviewRegistryContract from "../lib/clinicalReviewRegistryContract.js";
import type * as lib_clinicalTwoSmallCasData from "../lib/clinicalTwoSmallCasData.js";
import type * as lib_clinicalTwoSmallCasGuard from "../lib/clinicalTwoSmallCasGuard.js";
import type * as lib_contentEditDiff from "../lib/contentEditDiff.js";
import type * as lib_contentRetirements from "../lib/contentRetirements.js";
import type * as lib_contentReviewRequirements from "../lib/contentReviewRequirements.js";
import type * as lib_englishRefreezeCorrectionData from "../lib/englishRefreezeCorrectionData.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_evidenceFreshness from "../lib/evidenceFreshness.js";
import type * as lib_evidenceHumanReviewSuccessorCas from "../lib/evidenceHumanReviewSuccessorCas.js";
import type * as lib_evidenceHumanReviewSuccessorCasData from "../lib/evidenceHumanReviewSuccessorCasData.js";
import type * as lib_evidenceImportPolicy from "../lib/evidenceImportPolicy.js";
import type * as lib_evidenceImportSafety from "../lib/evidenceImportSafety.js";
import type * as lib_evidencePublicationGate from "../lib/evidencePublicationGate.js";
import type * as lib_evidenceSafetyRelease from "../lib/evidenceSafetyRelease.js";
import type * as lib_gd10_12mPlayV5CasData from "../lib/gd10_12mPlayV5CasData.js";
import type * as lib_gd10_12mPlayV5ImportPolicy from "../lib/gd10_12mPlayV5ImportPolicy.js";
import type * as lib_inherentPublicLinkCasData from "../lib/inherentPublicLinkCasData.js";
import type * as lib_legacyCompletedPriorityCorrectionData from "../lib/legacyCompletedPriorityCorrectionData.js";
import type * as lib_manualReviewContentCasData from "../lib/manualReviewContentCasData.js";
import type * as lib_manualReviewEvidenceLinkCasData from "../lib/manualReviewEvidenceLinkCasData.js";
import type * as lib_nativeMyanmarRefreezeCorrectionData from "../lib/nativeMyanmarRefreezeCorrectionData.js";
import type * as lib_nutritionGuidesCasData from "../lib/nutritionGuidesCasData.js";
import type * as lib_olderSafety2026CasData from "../lib/olderSafety2026CasData.js";
import type * as lib_olderSafety2026CasV2Data from "../lib/olderSafety2026CasV2Data.js";
import type * as lib_ownerPriority from "../lib/ownerPriority.js";
import type * as lib_ownerPriorityAccess from "../lib/ownerPriorityAccess.js";
import type * as lib_printablePayloadRelease from "../lib/printablePayloadRelease.js";
import type * as lib_publicationVisibility from "../lib/publicationVisibility.js";
import type * as lib_remainingPseudoMilestoneRetirementData from "../lib/remainingPseudoMilestoneRetirementData.js";
import type * as lib_reviewPolicy from "../lib/reviewPolicy.js";
import type * as lib_reviewSearch from "../lib/reviewSearch.js";
import type * as lib_seedPolicy from "../lib/seedPolicy.js";
import type * as lib_skinToSkinRefreezeCorrectionData from "../lib/skinToSkinRefreezeCorrectionData.js";
import type * as lib_swaimanCerebralPalsyLinkCasData from "../lib/swaimanCerebralPalsyLinkCasData.js";
import type * as lib_swaimanSeizureLinkCasData from "../lib/swaimanSeizureLinkCasData.js";
import type * as lib_swaimanSuddenWeaknessCasData from "../lib/swaimanSuddenWeaknessCasData.js";
import type * as library from "../library.js";
import type * as manualReviewContentCas from "../manualReviewContentCas.js";
import type * as manualReviewEvidenceLinkCas from "../manualReviewEvidenceLinkCas.js";
import type * as media from "../media.js";
import type * as milestones from "../milestones.js";
import type * as mmpay from "../mmpay.js";
import type * as mmpayData from "../mmpayData.js";
import type * as nativeMyanmarRefreezeCorrection from "../nativeMyanmarRefreezeCorrection.js";
import type * as nativeMyanmarRefreezeCorrectionActions from "../nativeMyanmarRefreezeCorrectionActions.js";
import type * as nhsSoothingHumanReviewSuccessorCas from "../nhsSoothingHumanReviewSuccessorCas.js";
import type * as notifications from "../notifications.js";
import type * as nutritionGuidesCas from "../nutritionGuidesCas.js";
import type * as observations from "../observations.js";
import type * as olderSafety2026Cas from "../olderSafety2026Cas.js";
import type * as olderSafety2026CasV2 from "../olderSafety2026CasV2.js";
import type * as ownerPriority from "../ownerPriority.js";
import type * as parent from "../parent.js";
import type * as referrals from "../referrals.js";
import type * as release from "../release.js";
import type * as remainingPseudoMilestoneRetirement from "../remainingPseudoMilestoneRetirement.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as skinToSkinRefreezeCorrection from "../skinToSkinRefreezeCorrection.js";
import type * as skinToSkinRefreezeCorrectionActions from "../skinToSkinRefreezeCorrectionActions.js";
import type * as sleep from "../sleep.js";
import type * as subscriptions from "../subscriptions.js";
import type * as swaimanCerebralPalsyLinkCas from "../swaimanCerebralPalsyLinkCas.js";
import type * as swaimanSeizureLinkCas from "../swaimanSeizureLinkCas.js";
import type * as swaimanSuddenWeaknessCas from "../swaimanSuddenWeaknessCas.js";
import type * as unicefSeenCountedHumanReviewSuccessorCas from "../unicefSeenCountedHumanReviewSuccessorCas.js";
import type * as unicefSeenCountedMetadataCas from "../unicefSeenCountedMetadataCas.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  activities: typeof activities;
  admin: typeof admin;
  aiPublication: typeof aiPublication;
  animationPlan: typeof animationPlan;
  appointments: typeof appointments;
  asqDoctorVisitsLinkCas: typeof asqDoctorVisitsLinkCas;
  audit: typeof audit;
  auth: typeof auth;
  billing: typeof billing;
  birth2mGrossMotorCas: typeof birth2mGrossMotorCas;
  birth2mNutritionCas: typeof birth2mNutritionCas;
  children: typeof children;
  clinicalRefreezeRegistryMigration: typeof clinicalRefreezeRegistryMigration;
  clinicalRefreezeRegistryMigrationActions: typeof clinicalRefreezeRegistryMigrationActions;
  clinicalReviewBatch: typeof clinicalReviewBatch;
  clinicalReviewBatchActions: typeof clinicalReviewBatchActions;
  clinicalReviewRegistry: typeof clinicalReviewRegistry;
  clinicalTwoSmallCas: typeof clinicalTwoSmallCas;
  content: typeof content;
  contentEdits: typeof contentEdits;
  contentReviews: typeof contentReviews;
  crons: typeof crons;
  directory: typeof directory;
  englishRefreezeCorrection: typeof englishRefreezeCorrection;
  englishRefreezeCorrectionActions: typeof englishRefreezeCorrectionActions;
  evidence: typeof evidence;
  family: typeof family;
  favorites: typeof favorites;
  gd10_12mPlayV5Cas: typeof gd10_12mPlayV5Cas;
  gdBirth2mEmotionalCas: typeof gdBirth2mEmotionalCas;
  growth: typeof growth;
  healthRecords: typeof healthRecords;
  http: typeof http;
  inherentPublicLinkCas: typeof inherentPublicLinkCas;
  legacyCompletedPriorityCorrection: typeof legacyCompletedPriorityCorrection;
  "lib/aiAuditHash": typeof lib_aiAuditHash;
  "lib/aiPublicationAuditArtifact": typeof lib_aiPublicationAuditArtifact;
  "lib/aiPublicationPolicy": typeof lib_aiPublicationPolicy;
  "lib/aiPublicationReleaseData": typeof lib_aiPublicationReleaseData;
  "lib/aiPublicationVisibility": typeof lib_aiPublicationVisibility;
  "lib/asqDoctorVisitsLinkCasData": typeof lib_asqDoctorVisitsLinkCasData;
  "lib/auth": typeof lib_auth;
  "lib/billingPeriods": typeof lib_billingPeriods;
  "lib/birth2mGrossMotorCasData": typeof lib_birth2mGrossMotorCasData;
  "lib/birth2mGrossMotorCorrection": typeof lib_birth2mGrossMotorCorrection;
  "lib/birth2mNutritionCasData": typeof lib_birth2mNutritionCasData;
  "lib/burmeseCopyAuditRelease": typeof lib_burmeseCopyAuditRelease;
  "lib/classificationImport": typeof lib_classificationImport;
  "lib/clinicalBlockerCasData": typeof lib_clinicalBlockerCasData;
  "lib/clinicalEnglishBatchData": typeof lib_clinicalEnglishBatchData;
  "lib/clinicalEnglishRefreezeBatchData": typeof lib_clinicalEnglishRefreezeBatchData;
  "lib/clinicalNativeMyanmarRefreezeBatchData": typeof lib_clinicalNativeMyanmarRefreezeBatchData;
  "lib/clinicalRefreezeRegistryMigrationData": typeof lib_clinicalRefreezeRegistryMigrationData;
  "lib/clinicalReviewBatchContract": typeof lib_clinicalReviewBatchContract;
  "lib/clinicalReviewBatchData": typeof lib_clinicalReviewBatchData;
  "lib/clinicalReviewBatchProvenance": typeof lib_clinicalReviewBatchProvenance;
  "lib/clinicalReviewCopyRelease": typeof lib_clinicalReviewCopyRelease;
  "lib/clinicalReviewRegistryContract": typeof lib_clinicalReviewRegistryContract;
  "lib/clinicalTwoSmallCasData": typeof lib_clinicalTwoSmallCasData;
  "lib/clinicalTwoSmallCasGuard": typeof lib_clinicalTwoSmallCasGuard;
  "lib/contentEditDiff": typeof lib_contentEditDiff;
  "lib/contentRetirements": typeof lib_contentRetirements;
  "lib/contentReviewRequirements": typeof lib_contentReviewRequirements;
  "lib/englishRefreezeCorrectionData": typeof lib_englishRefreezeCorrectionData;
  "lib/entitlements": typeof lib_entitlements;
  "lib/evidenceFreshness": typeof lib_evidenceFreshness;
  "lib/evidenceHumanReviewSuccessorCas": typeof lib_evidenceHumanReviewSuccessorCas;
  "lib/evidenceHumanReviewSuccessorCasData": typeof lib_evidenceHumanReviewSuccessorCasData;
  "lib/evidenceImportPolicy": typeof lib_evidenceImportPolicy;
  "lib/evidenceImportSafety": typeof lib_evidenceImportSafety;
  "lib/evidencePublicationGate": typeof lib_evidencePublicationGate;
  "lib/evidenceSafetyRelease": typeof lib_evidenceSafetyRelease;
  "lib/gd10_12mPlayV5CasData": typeof lib_gd10_12mPlayV5CasData;
  "lib/gd10_12mPlayV5ImportPolicy": typeof lib_gd10_12mPlayV5ImportPolicy;
  "lib/inherentPublicLinkCasData": typeof lib_inherentPublicLinkCasData;
  "lib/legacyCompletedPriorityCorrectionData": typeof lib_legacyCompletedPriorityCorrectionData;
  "lib/manualReviewContentCasData": typeof lib_manualReviewContentCasData;
  "lib/manualReviewEvidenceLinkCasData": typeof lib_manualReviewEvidenceLinkCasData;
  "lib/nativeMyanmarRefreezeCorrectionData": typeof lib_nativeMyanmarRefreezeCorrectionData;
  "lib/nutritionGuidesCasData": typeof lib_nutritionGuidesCasData;
  "lib/olderSafety2026CasData": typeof lib_olderSafety2026CasData;
  "lib/olderSafety2026CasV2Data": typeof lib_olderSafety2026CasV2Data;
  "lib/ownerPriority": typeof lib_ownerPriority;
  "lib/ownerPriorityAccess": typeof lib_ownerPriorityAccess;
  "lib/printablePayloadRelease": typeof lib_printablePayloadRelease;
  "lib/publicationVisibility": typeof lib_publicationVisibility;
  "lib/remainingPseudoMilestoneRetirementData": typeof lib_remainingPseudoMilestoneRetirementData;
  "lib/reviewPolicy": typeof lib_reviewPolicy;
  "lib/reviewSearch": typeof lib_reviewSearch;
  "lib/seedPolicy": typeof lib_seedPolicy;
  "lib/skinToSkinRefreezeCorrectionData": typeof lib_skinToSkinRefreezeCorrectionData;
  "lib/swaimanCerebralPalsyLinkCasData": typeof lib_swaimanCerebralPalsyLinkCasData;
  "lib/swaimanSeizureLinkCasData": typeof lib_swaimanSeizureLinkCasData;
  "lib/swaimanSuddenWeaknessCasData": typeof lib_swaimanSuddenWeaknessCasData;
  library: typeof library;
  manualReviewContentCas: typeof manualReviewContentCas;
  manualReviewEvidenceLinkCas: typeof manualReviewEvidenceLinkCas;
  media: typeof media;
  milestones: typeof milestones;
  mmpay: typeof mmpay;
  mmpayData: typeof mmpayData;
  nativeMyanmarRefreezeCorrection: typeof nativeMyanmarRefreezeCorrection;
  nativeMyanmarRefreezeCorrectionActions: typeof nativeMyanmarRefreezeCorrectionActions;
  nhsSoothingHumanReviewSuccessorCas: typeof nhsSoothingHumanReviewSuccessorCas;
  notifications: typeof notifications;
  nutritionGuidesCas: typeof nutritionGuidesCas;
  observations: typeof observations;
  olderSafety2026Cas: typeof olderSafety2026Cas;
  olderSafety2026CasV2: typeof olderSafety2026CasV2;
  ownerPriority: typeof ownerPriority;
  parent: typeof parent;
  referrals: typeof referrals;
  release: typeof release;
  remainingPseudoMilestoneRetirement: typeof remainingPseudoMilestoneRetirement;
  reports: typeof reports;
  seed: typeof seed;
  skinToSkinRefreezeCorrection: typeof skinToSkinRefreezeCorrection;
  skinToSkinRefreezeCorrectionActions: typeof skinToSkinRefreezeCorrectionActions;
  sleep: typeof sleep;
  subscriptions: typeof subscriptions;
  swaimanCerebralPalsyLinkCas: typeof swaimanCerebralPalsyLinkCas;
  swaimanSeizureLinkCas: typeof swaimanSeizureLinkCas;
  swaimanSuddenWeaknessCas: typeof swaimanSuddenWeaknessCas;
  unicefSeenCountedHumanReviewSuccessorCas: typeof unicefSeenCountedHumanReviewSuccessorCas;
  unicefSeenCountedMetadataCas: typeof unicefSeenCountedMetadataCas;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
