import { authRouter } from "./auth-router";
import { aiRouter } from "./ai-router";
import { baziRouter } from "./bazi-router";
<<<<<<< HEAD
import { liuyaoRouter } from "./liuyao-router";
import { ziweiRouter } from "./ziwei-router";
import { daliurenRouter } from "./daliuren-router";
=======
import { qizhengRouter } from "./qizheng-router";
>>>>>>> v7-qizheng
import { billingRouter } from "./billing-router";
import { accountRouter } from "./account-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  bazi: baziRouter,
<<<<<<< HEAD
  liuyao: liuyaoRouter,
  ziwei: ziweiRouter,
  daliuren: daliurenRouter,
=======
  qizheng: qizhengRouter,
>>>>>>> v7-qizheng
  ai: aiRouter,
  billing: billingRouter,
  account: accountRouter,
});

export type AppRouter = typeof appRouter;
