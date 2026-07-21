import { randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Order, PaymentEvent } from "@db/schema";
import { getDb } from "./connection";
import { applyTransaction } from "./wallets";

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
  verified?: boolean;
}

export interface ProcessPaymentEventResult {
  order: Order;
  event: PaymentEvent;
  /** false = 同一 eventId 已处理过，本次为重复回调 */
  applied: boolean;
}

/**
 * 处理支付回调（幂等）：
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

  const inserted = await db
    .insert(schema.paymentEvents)
    .values({
      orderId: order.id,
      eventId: input.eventId,
      payload: input.payload ?? null,
      verified: input.verified ?? true,
      status: input.status,
    })
    .$returningId();
  const event: PaymentEvent = {
    id: inserted.at(0)?.id ?? 0,
    orderId: order.id,
    eventId: input.eventId,
    payload: input.payload ?? null,
    verified: input.verified ?? true,
    status: input.status,
    createdAt: new Date(),
  };

  let nextStatus = order.status;
  if (input.status === "paid" && order.status === "created") {
    nextStatus = "paid";
    await db
      .update(schema.orders)
      .set({ status: "paid" })
      .where(eq(schema.orders.id, order.id));
    // 充值入账（幂等：同一订单只入账一次）
    await applyTransaction({
      userId: order.userId,
      changeAmount: order.lingqianAmount,
      reason: "recharge",
      refType: "order",
      refId: order.orderNo,
      idempotencyKey: `order-recharge:${order.orderNo}`,
    });
  } else if (input.status === "failed" && order.status === "created") {
    nextStatus = "failed";
    await db
      .update(schema.orders)
      .set({ status: "failed" })
      .where(eq(schema.orders.id, order.id));
  } else if (input.status === "refunded" && order.status === "paid") {
    nextStatus = "refunded";
    await db
      .update(schema.orders)
      .set({ status: "refunded" })
      .where(eq(schema.orders.id, order.id));
  }

  return { order: { ...order, status: nextStatus }, event, applied: true };
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
