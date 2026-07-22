import { authRouter } from "./auth-router";
import { aiRouter } from "./ai-router";
import { baziRouter } from "./bazi-router";
import { ziweiRouter } from "./ziwei-router";
import { billingRouter } from "./billing-router";
import { accountRouter } from "./account-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  bazi: baziRouter,
  ziwei: ziweiRouter,
  ai: aiRouter,
  billing: billingRouter,
  account: accountRouter,
});

export type AppRouter = typeof appRouter;
