import { authRouter } from "./auth-router";
import { aiRouter } from "./ai-router";
import { baziRouter } from "./bazi-router";
import { hepanRouter } from "./hepan-router";
import { hecanRouter } from "./hecan-router";
import { drawsRouter } from "./draws-router";
import { billingRouter } from "./billing-router";
import { accountRouter } from "./account-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  bazi: baziRouter,
  hepan: hepanRouter,
  hecan: hecanRouter,
  draws: drawsRouter,
  ai: aiRouter,
  billing: billingRouter,
  account: accountRouter,
});

export type AppRouter = typeof appRouter;
