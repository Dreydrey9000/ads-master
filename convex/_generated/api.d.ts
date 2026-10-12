/* eslint-disable */
  /**
   * Generated `api` utility.
   *
   * THIS CODE IS AUTOMATICALLY GENERATED.
   *
   * To regenerate, run `npx convex dev`.
   * @module
   */
  
  import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
  import type * as accounts from "../accounts.js";
import type * as businesses from "../businesses.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as insights from "../insights.js";
import type * as lib from "../lib.js";
import type * as platforms_index from "../platforms/index.js";
import type * as platforms_meta from "../platforms/meta.js";
import type * as platforms_openai from "../platforms/openai.js";
import type * as platforms_types from "../platforms/types.js";
import type * as sales from "../sales.js";
import type * as sync from "../sync.js";

  /**
   * A utility for referencing Convex functions in your app's API.
   *
   * Usage:
   * ```js
   * const myFunctionReference = api.myModule.myFunction;
   * ```
   */
  declare const fullApi: ApiFromModules<{
    "accounts": typeof accounts,
"businesses": typeof businesses,
"crons": typeof crons,
"dashboard": typeof dashboard,
"http": typeof http,
"insights": typeof insights,
"lib": typeof lib,
"platforms/index": typeof platforms_index,
"platforms/meta": typeof platforms_meta,
"platforms/openai": typeof platforms_openai,
"platforms/types": typeof platforms_types,
"sales": typeof sales,
"sync": typeof sync,
  }>;
  export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
  export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
  