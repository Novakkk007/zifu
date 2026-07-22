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

/** 支付闸门纯函数：preview/development 强制关闭（可单测，不依赖进程环境） */
export function computePaymentEnabled(envName: AppEnv, flag?: string): boolean {
  return envName !== "preview" && envName !== "development" && flag === "true";
}

/** AI 计费闸门纯函数：preview/development 强制免费（可单测，不依赖进程环境） */
export function computeAiBillingEnabled(envName: AppEnv, flag?: string): boolean {
  return envName !== "preview" && envName !== "development" && flag !== "false";
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
   * 支付总闸（fail-closed）：
   * 仅当 APP_ENV 为 staging/production 且 PAYMENT_ENABLED 显式为 "true" 才开放；
   * preview / development 环境无论 PAYMENT_ENABLED 配什么都强制关闭，
   * 防止错误配置在预览环境打开真实支付。
   */
  paymentEnabled: computePaymentEnabled(appEnv(), process.env.PAYMENT_ENABLED),
  /**
   * AI 计费闸（fail-closed）：
   * preview / development 环境强制免费（live 参详不扣灵签）；
   * staging / production 缺省开启，可显式 AI_BILLING_ENABLED=false 关闭。
   */
  aiBillingEnabled: computeAiBillingEnabled(
    appEnv(),
    process.env.AI_BILLING_ENABLED,
  ),
};
