import { authRouter } from "./auth-router";
import { aiRouter } from "./ai-router";
import { baziRouter } from "./bazi-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  bazi: baziRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
