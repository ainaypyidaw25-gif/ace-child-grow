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
import type * as animationPlan from "../animationPlan.js";
import type * as appointments from "../appointments.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as children from "../children.js";
import type * as content from "../content.js";
import type * as contentEdits from "../contentEdits.js";
import type * as contentReviews from "../contentReviews.js";
import type * as crons from "../crons.js";
import type * as directory from "../directory.js";
import type * as evidence from "../evidence.js";
import type * as family from "../family.js";
import type * as favorites from "../favorites.js";
import type * as growth from "../growth.js";
import type * as healthRecords from "../healthRecords.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_classificationImport from "../lib/classificationImport.js";
import type * as lib_contentEditDiff from "../lib/contentEditDiff.js";
import type * as lib_contentRetirements from "../lib/contentRetirements.js";
import type * as lib_contentReviewRequirements from "../lib/contentReviewRequirements.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_evidenceSafetyRelease from "../lib/evidenceSafetyRelease.js";
import type * as lib_ownerPriority from "../lib/ownerPriority.js";
import type * as lib_ownerPriorityAccess from "../lib/ownerPriorityAccess.js";
import type * as lib_reviewPolicy from "../lib/reviewPolicy.js";
import type * as lib_reviewSearch from "../lib/reviewSearch.js";
import type * as lib_seedPolicy from "../lib/seedPolicy.js";
import type * as library from "../library.js";
import type * as media from "../media.js";
import type * as milestones from "../milestones.js";
import type * as mmpay from "../mmpay.js";
import type * as mmpayData from "../mmpayData.js";
import type * as notifications from "../notifications.js";
import type * as observations from "../observations.js";
import type * as ownerPriority from "../ownerPriority.js";
import type * as parent from "../parent.js";
import type * as referrals from "../referrals.js";
import type * as release from "../release.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as sleep from "../sleep.js";
import type * as subscriptions from "../subscriptions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  activities: typeof activities;
  admin: typeof admin;
  animationPlan: typeof animationPlan;
  appointments: typeof appointments;
  audit: typeof audit;
  auth: typeof auth;
  billing: typeof billing;
  children: typeof children;
  content: typeof content;
  contentEdits: typeof contentEdits;
  contentReviews: typeof contentReviews;
  crons: typeof crons;
  directory: typeof directory;
  evidence: typeof evidence;
  family: typeof family;
  favorites: typeof favorites;
  growth: typeof growth;
  healthRecords: typeof healthRecords;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/classificationImport": typeof lib_classificationImport;
  "lib/contentEditDiff": typeof lib_contentEditDiff;
  "lib/contentRetirements": typeof lib_contentRetirements;
  "lib/contentReviewRequirements": typeof lib_contentReviewRequirements;
  "lib/entitlements": typeof lib_entitlements;
  "lib/evidenceSafetyRelease": typeof lib_evidenceSafetyRelease;
  "lib/ownerPriority": typeof lib_ownerPriority;
  "lib/ownerPriorityAccess": typeof lib_ownerPriorityAccess;
  "lib/reviewPolicy": typeof lib_reviewPolicy;
  "lib/reviewSearch": typeof lib_reviewSearch;
  "lib/seedPolicy": typeof lib_seedPolicy;
  library: typeof library;
  media: typeof media;
  milestones: typeof milestones;
  mmpay: typeof mmpay;
  mmpayData: typeof mmpayData;
  notifications: typeof notifications;
  observations: typeof observations;
  ownerPriority: typeof ownerPriority;
  parent: typeof parent;
  referrals: typeof referrals;
  release: typeof release;
  reports: typeof reports;
  seed: typeof seed;
  sleep: typeof sleep;
  subscriptions: typeof subscriptions;
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
