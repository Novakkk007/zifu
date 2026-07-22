import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./queries/connection";
import { env } from "./lib/env";
import { getOrCreateWallet, listRecentTransactions } from "./queries/wallets";
import { createOrder, listOrders, processPaymentEvent } from "./queries/orders";
import { createRouter, authedQuery, adminQuery } from "./middleware";

/** 灵签兑换比例：1 元 = 10 灵签 */
const LINGQIAN_PER_YUAN = 10;

export const billingRouter = createRouter({
  /** 我的钱包：余额 + 最近 20 条流水 */
  wallet: authedQuery.query(async ({ ctx }) => {
    const wallet = await getOrCreateWallet(ctx.user.id);
    const transactions = await listRecentTransactions(ctx.user.id, 20);
    return { balanceLingqian: wallet.balanceLingqian, transactions };
  }),

  /**
   * 充值下单：创建 created（待支付）订单。
   * ⚠️ 支付渠道预留：当前不接入任何真实支付渠道，本接口只落单，
   * 绝不会在此伪造支付成功；支付结果只能由支付回调
   * （payment_events，eventId 幂等）驱动状态机。
   */
  recharge: authedQuery
    .input(
      z.object({
        amountFen: z.number().int().min(1).max(1_000_000),
        idempotencyKey: z.string().trim().min(8).max(64),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // 支付总闸：PAYMENT_ENABLED 未显式开启（如预览环境）时禁止落单
      if (!env.paymentEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "当前环境未开放充值（支付渠道未接入 / 预览环境已禁用支付）。",
        });
      }
      const order = await createOrder({
        userId: ctx.user.id,
        amountFen: input.amountFen,
        lingqianAmount: Math.floor(input.amountFen / 100) * LINGQIAN_PER_YUAN,
        channel: "reserved",
        idempotencyKey: input.idempotencyKey,
      });
      return {
        order,
        paymentChannelReserved: true,
        notice:
          "支付渠道预留：订单已创建（待支付），真实支付渠道尚未接入，不会自动入账。",
      };
    }),

  /**
   * 模拟支付回调（仅管理员）：用于测试 payment_events 幂等链路。
   * 生产环境应由真实支付渠道回调（验签后）替代。
   * 约束：
   * - 输入不接受 verified 字段——演练事件由服务端显式标记 verified:true，
   *   调用方无法伪造「已验签」语义；
   * - payload 强制附带 [SIMULATED] 来源标记，审计可区分演练与真实渠道事件；
   * - 预览环境整体禁用（支付 fail-closed 的一部分）。
   */
  simulateCallback: adminQuery
    .input(
      z.object({
        orderNo: z.string().trim().min(1).max(32),
        eventId: z.string().trim().min(1).max(64),
        status: z.enum(["paid", "failed", "refunded"]),
        payload: z.string().max(4000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // 预览环境禁止任何支付状态演练（即使管理员）
      if (env.isPreview) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "预览环境已禁用支付回调演练。",
        });
      }
      try {
        return await processPaymentEvent({
          orderNo: input.orderNo,
          eventId: input.eventId,
          status: input.status,
          payload: `[SIMULATED] ${input.payload ?? "admin drill"}`,
          verified: true,
        });
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("order not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在。" });
        }
        throw err;
      }
    }),

  /** 我的订单（按时间倒序） */
  orders: authedQuery.query(async ({ ctx }) => {
    return listOrders(ctx.user.id);
  }),

  /** 审计日志（仅管理员，最近 100 条） */
  adminAuditLogs: adminQuery.query(async () => {
    return getDb()
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(100);
  }),
});
