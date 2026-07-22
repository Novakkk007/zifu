import * as cookie from "cookie";
import { eq, inArray } from "drizzle-orm";
import { Session } from "@contracts/constants";
import * as schema from "@db/schema";
import { getDb } from "./queries/connection";
import { getSessionCookieOptions } from "./lib/cookies";
import { writeAuditLog } from "./queries/audit";
import { createRouter, authedQuery } from "./middleware";

export const accountRouter = createRouter({
  /**
   * 注销账户：删除当前登录用户的全部自有数据
   * （命盘、命盘版本、AI 参详日志、钱包与流水、订单与支付事件），
   * 最后删除用户行、写审计日志并清除会话 Cookie。
   * 仅能删除本人数据（以 ctx.user 为准）。
   */
  deleteAccount: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // 整个删除链路在一个事务内：任一步失败整体回滚，不留半删除状态。
    // 反馈不物理删除——按 Codex 审计口径匿名化（断开用户关联，保留内容供产品改进）。
    const { chartCount, orderCount } = await db.transaction(async (tx) => {
      // 先取关联主键，再按依赖顺序删除
      const chartRows = await tx
        .select({ id: schema.charts.id })
        .from(schema.charts)
        .where(eq(schema.charts.userId, userId));
      const chartIds = chartRows.map((r) => r.id);

      const orderRows = await tx
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(eq(schema.orders.userId, userId));
      const orderIds = orderRows.map((r) => r.id);

      if (chartIds.length > 0) {
        await tx
          .delete(schema.chartVersions)
          .where(inArray(schema.chartVersions.chartId, chartIds));
      }
      if (orderIds.length > 0) {
        await tx
          .delete(schema.paymentEvents)
          .where(inArray(schema.paymentEvents.orderId, orderIds));
      }
      await tx.delete(schema.aiReadings).where(eq(schema.aiReadings.userId, userId));
      await tx
        .delete(schema.walletTransactions)
        .where(eq(schema.walletTransactions.userId, userId));
      await tx.delete(schema.wallets).where(eq(schema.wallets.userId, userId));
      await tx.delete(schema.orders).where(eq(schema.orders.userId, userId));
      await tx.delete(schema.charts).where(eq(schema.charts.userId, userId));
      // 会话全部撤销（强制下线）
      await tx
        .delete(schema.sessions)
        .where(eq(schema.sessions.userId, userId));
      // 反馈匿名化：断开 userId 关联
      await tx
        .update(schema.feedback)
        .set({ userId: null })
        .where(eq(schema.feedback.userId, userId));
      await tx.delete(schema.users).where(eq(schema.users.id, userId));

      return { chartCount: chartIds.length, orderCount: orderIds.length };
    });

    await writeAuditLog({
      userId,
      action: "account.delete",
      targetType: "user",
      targetId: String(userId),
      meta: { charts: chartCount, orders: orderCount },
    });

    // 清除会话 Cookie
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );

    return { success: true };
  }),
});
