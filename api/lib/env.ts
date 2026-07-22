import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

/** 部署环境标识：preview（外网预览）/ staging / production（缺省 development） */
export type AppEnv = "development" | "preview" | "staging" | "production";

function appEnv(): AppEnv {
  const v = (process.env.APP_ENV ?? "").trim().toLowerCase();
  if (v === "preview" || v === "staging" || v === "production") return v;
  return "development";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",

  /** 部署环境（preview/staging/production/development） */
  appEnv: appEnv(),
  /** 是否为外网预览环境 */
  isPreview: appEnv() === "preview",
  /** 当前部署的 commit SHA（部署平台注入，如 Render 的 RENDER_GIT_COMMIT） */
  commitSha:
    process.env.COMMIT_SHA ??
    process.env.RENDER_GIT_COMMIT ??
    process.env.SOURCE_VERSION ??
    "unknown",
  /**
   * 支付总闸：PAYMENT_ENABLED=false 时充值/支付回调一律拒绝。
   * 缺省关闭——支付渠道本就是预留状态，显式设为 "true" 才放开（预览环境绝不放开）。
   */
  paymentEnabled: process.env.PAYMENT_ENABLED === "true",
  /**
   * AI 计费闸：AI_BILLING_ENABLED=false 时 live 参详不扣灵签（预览环境默认免费体验）。
   * 缺省开启（向后兼容 V6/V7 行为），预览环境应显式设为 "false"。
   */
  aiBillingEnabled: process.env.AI_BILLING_ENABLED !== "false",
};
