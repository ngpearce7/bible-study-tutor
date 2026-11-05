/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountability from "../accountability.js";
import type * as adminNotifications from "../adminNotifications.js";
import type * as auth from "../auth.js";
import type * as bibleHighlights from "../bibleHighlights.js";
import type * as community from "../community.js";
import type * as crons from "../crons.js";
import type * as emailVerification from "../emailVerification.js";
import type * as http from "../http.js";
import type * as insights from "../insights.js";
import type * as memory from "../memory.js";
import type * as passwordCrypto from "../passwordCrypto.js";
import type * as passwordReset from "../passwordReset.js";
import type * as passwordResetEmail from "../passwordResetEmail.js";
import type * as passwordVerify from "../passwordVerify.js";
import type * as profileAccess from "../profileAccess.js";
import type * as recovery from "../recovery.js";
import type * as recoveryData from "../recoveryData.js";
import type * as security from "../security.js";
import type * as statistics from "../statistics.js";
import type * as statisticsModel from "../statisticsModel.js";
import type * as study from "../study.js";
import type * as verificationEmailTemplate from "../verificationEmailTemplate.js";
import type * as verifiedPassword from "../verifiedPassword.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountability: typeof accountability;
  adminNotifications: typeof adminNotifications;
  auth: typeof auth;
  bibleHighlights: typeof bibleHighlights;
  community: typeof community;
  crons: typeof crons;
  emailVerification: typeof emailVerification;
  http: typeof http;
  insights: typeof insights;
  memory: typeof memory;
  passwordCrypto: typeof passwordCrypto;
  passwordReset: typeof passwordReset;
  passwordResetEmail: typeof passwordResetEmail;
  passwordVerify: typeof passwordVerify;
  profileAccess: typeof profileAccess;
  recovery: typeof recovery;
  recoveryData: typeof recoveryData;
  security: typeof security;
  statistics: typeof statistics;
  statisticsModel: typeof statisticsModel;
  study: typeof study;
  verificationEmailTemplate: typeof verificationEmailTemplate;
  verifiedPassword: typeof verifiedPassword;
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
