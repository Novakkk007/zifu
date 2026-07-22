import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Order, PaymentEvent } from "@db/schema";
import { getDb } from "./connection";
import { applyTransactionTx, getOrCreateWallet } from "./wallets";

/** 生成订单号（≤32 字符）：Z + 时间戳 base36 + 8 位随机 */
function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `Z${ts}${rand}`.slice(0, 32);
}

export interface CreateOrderInput {
  userId: number;
  amountFen: number;
  lingqianAmount: number;
  channel?: string;
  idempotencyKey: string;
}

export async function findOrderByNo(orderNo: string): Promise<Order | undefined> {
  const rows = await getDb()
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.orderNo, orderNo))
    .limit(1);
  return rows.at(0);
}

async function findOrderByIdempotencyKey(
  key: string,
): Promise<Order | undefined> {
  const rows = await getDb()
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.idempotencyKey, key))
    .limit(1);
  return rows.at(0);
}

/**
 * 创建充值订单（幂等）：同一 idempotencyKey 重复调用返回既有订单。
 * 注意：订单仅落库为 created 状态，支付渠道预留，不代表支付成功。
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = getDb();
  const existing = await findOrderByIdempotencyKey(input.idempotencyKey);
  if (existing) return existing;

  const orderNo = generateOrderNo();
  try {
    await db.insert(schema.orders).values({
      userId: input.userId,
      orderNo,
      amountFen: input.amountFen,
      lingqianAmount: input.lingqianAmount,
      status: "created",
      channel: input.channel ?? null,
      idempotencyKey: input.idempotencyKey,
    });
  } catch (err) {
    // 并发撞幂等键：返回既有订单
    const again = await findOrderByIdempotencyKey(input.idempotencyKey);
    if (again) return again;
    throw err;
  }
  const created = await findOrderByNo(orderNo);
  if (!created) throw new Error("order creation failed");
  return created;
}

export interface ProcessPaymentEventInput {
  orderNo: string;
  /** 回调幂等键（支付渠道事件 ID） */
  eventId: string;
  status: "paid" | "failed" | "refunded";
  payload?: string;
  /**
   * 渠道验签标记：默认 false（fail-closed）。
   * 只有支付渠道签名验证通过（或管理员演练通道显式标记）才为 true；
   * 未验签事件只落库存档，绝不驱动状态机与入账。
   */
  verified?: boolean;
}

export interface ProcessPaymentEventResult {
  order: Order;
  event: PaymentEvent;
  /** false = 同一 eventId 已处理过，本次为重复回调 */
  applied: boolean;
}

/**
 * 处理支付回调（单事务 + 幂等 + 条件状态机）：
 * - 「查重 eventId → 落事件 → 条件更新订单状态 → 充值入账」全部在一个事务内，
 *   任一步失败整体回滚，不会出现「钱到了订单没转 paid」之类的半状态
 * - 状态迁移用条件 UPDATE（where 当前状态 = 前置状态），并发回调下只有一个能生效
 * - eventId 已存在 → 返回既有事件与订单，不重复变更状态 / 入账
 * - status=paid 且订单仍为 created → 置 paid 并按订单灵签数入账
 *   （入账幂等键 order-recharge:{orderNo}）
 * - status=failed → 置 failed；status=refunded → 置 refunded
 */
export async function processPaymentEvent(
  input: ProcessPaymentEventInput,
): Promise<ProcessPaymentEventResult> {
  const db = getDb();
  const order = await findOrderByNo(input.orderNo);
  if (!order) throw new Error(`order not found: ${input.orderNo}`);

  const dup = await db
    .select()
    .from(schema.paymentEvents)
    .where(eq(schema.paymentEvents.eventId, input.eventId))
    .limit(1);
  if (dup.at(0)) {
    return { order, event: dup[0], applied: false };
  }

  // fail-closed：未显式验签的事件一律按未验签处理
  const verified = input.verified === true;

  try {
    return await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(schema.paymentEvents)
        .values({
          orderId: order.id,
          eventId: input.eventId,
          payload: input.payload ?? null,
          verified,
          status: input.status,
        })
        .$returningId();
      const event: PaymentEvent = {
        id: inserted.at(0)?.id ?? 0,
        orderId: order.id,
        eventId: input.eventId,
        payload: input.payload ?? null,
        verified,
        status: input.status,
        createdAt: new Date(),
      };

      // 条件状态机：仅当订单处于允许的前置状态时才迁移（并发安全）
      const transition = async (
        from: Order["status"],
        to: Order["status"],
      ): Promise<boolean> => {
        const res = await tx
          .update(schema.orders)
          .set({ status: to })
          .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, from)));
        return Number(res[0]?.affectedRows ?? 0) === 1;
      };

      let nextStatus = order.status;
      // 未验签事件：只落库存档，绝不迁移状态、绝不让钱包入账
      if (!verified) {
        return { order, event, applied: true };
      }
      if (input.status === "paid" && order.status === "created") {
        if (await transition("created", "paid")) {
          nextStatus = "paid";
          // 充值入账（同事务；幂等：同一订单只入账一次）
          const wallet = await getOrCreateWallet(order.userId);
          await applyTransactionTx(tx, wallet, {
            userId: order.userId,
            changeAmount: order.lingqianAmount,
            reason: "recharge",
            refType: "order",
            refId: order.orderNo,
            idempotencyKey: `order-recharge:${order.orderNo}`,
          });
        }
      } else if (input.status === "failed" && order.status === "created") {
        if (await transition("created", "failed")) nextStatus = "failed";
      } else if (input.status === "refunded" && order.status === "paid") {
        if (await transition("paid", "refunded")) nextStatus = "refunded";
      }

      return { order: { ...order, status: nextStatus }, event, applied: true };
    });
  } catch (err) {
    // 并发撞 eventId 唯一键（事务回滚）：返回既有事件
    const again = await db
      .select()
      .from(schema.paymentEvents)
      .where(eq(schema.paymentEvents.eventId, input.eventId))
      .limit(1);
    if (again.at(0)) {
      const fresh = await findOrderByNo(input.orderNo);
      return { order: fresh ?? order, event: again[0], applied: false };
    }
    throw err;
  }
}

/** 我的订单（按时间倒序，上限 50 条） */
export async function listOrders(userId: number, limit = 50): Promise<Order[]> {
  return getDb()
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.userId, userId))
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit);
}
