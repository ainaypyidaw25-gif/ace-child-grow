/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as children from "../children.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as directory from "../directory.js";
import type * as evidence from "../evidence.js";
import type * as favorites from "../favorites.js";
import type * as growth from "../growth.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as library from "../library.js";
import type * as milestones from "../milestones.js";
import type * as notifications from "../notifications.js";
import type * as parent from "../parent.js";
import type * as release from "../release.js";
import type * as seed from "../seed.js";
import type * as sleep from "../sleep.js";
import type * as subscriptions from "../subscriptions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  audit: typeof audit;
  auth: typeof auth;
  billing: typeof billing;
  children: typeof children;
  content: typeof content;
  crons: typeof crons;
  directory: typeof directory;
  evidence: typeof evidence;
  favorites: typeof favorites;
  growth: typeof growth;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  library: typeof library;
  milestones: typeof milestones;
  notifications: typeof notifications;
  parent: typeof parent;
  release: typeof release;
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
