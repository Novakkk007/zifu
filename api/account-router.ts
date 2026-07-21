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

    // 先取关联主键，再按依赖顺序删除
    const chartRows = await db
      .select({ id: schema.charts.id })
      .from(schema.charts)
      .where(eq(schema.charts.userId, userId));
    const chartIds = chartRows.map((r) => r.id);

    const orderRows = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId));
    const orderIds = orderRows.map((r) => r.id);

    if (chartIds.length > 0) {
      await db
        .delete(schema.chartVersions)
        .where(inArray(schema.chartVersions.chartId, chartIds));
    }
    if (orderIds.length > 0) {
      await db
        .delete(schema.paymentEvents)
        .where(inArray(schema.paymentEvents.orderId, orderIds));
    }
    await db.delete(schema.aiReadings).where(eq(schema.aiReadings.userId, userId));
    await db
      .delete(schema.walletTransactions)
      .where(eq(schema.walletTransactions.userId, userId));
    await db.delete(schema.wallets).where(eq(schema.wallets.userId, userId));
    await db.delete(schema.orders).where(eq(schema.orders.userId, userId));
    await db.delete(schema.charts).where(eq(schema.charts.userId, userId));
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    await writeAuditLog({
      userId,
      action: "account.delete",
      targetType: "user",
      targetId: String(userId),
      meta: { charts: chartIds.length, orders: orderIds.length },
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
