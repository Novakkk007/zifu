import { authRouter } from "./auth-router";
import { aiRouter } from "./ai-router";
import { baziRouter } from "./bazi-router";
import { liuyaoRouter } from "./liuyao-router";
import { ziweiRouter } from "./ziwei-router";
import { daliurenRouter } from "./daliuren-router";
import { qizhengRouter } from "./qizheng-router";
import { qimenRouter } from "./qimen-router";
import { hepanRouter } from "./hepan-router";
import { hecanRouter } from "./hecan-router";
import { drawsRouter } from "./draws-router";
import { feedbackRouter } from "./feedback-router";
import { billingRouter } from "./billing-router";
import { accountRouter } from "./account-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  bazi: baziRouter,
  liuyao: liuyaoRouter,
  ziwei: ziweiRouter,
  daliuren: daliurenRouter,
  qizheng: qizhengRouter,
  qimen: qimenRouter,
  hepan: hepanRouter,
  hecan: hecanRouter,
  draws: drawsRouter,
  feedback: feedbackRouter,
  ai: aiRouter,
  billing: billingRouter,
  account: accountRouter,
});

export type AppRouter = typeof appRouter;
