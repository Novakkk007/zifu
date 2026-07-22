import { and, desc, eq, gte, sql } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Wallet, WalletTransaction } from "@db/schema";
import { getDb } from "./connection";

/** 注册赠送灵签数（仅发放一次，幂等键 signup-grant:{userId}） */
export const SIGNUP_GRANT_AMOUNT = 36;

export class InsufficientBalanceError extends Error {
  constructor(message = "灵签余额不足。") {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

async function findWalletByUserId(userId: number): Promise<Wallet | undefined> {
  const rows = await getDb()
    .select()
    .from(schema.wallets)
    .where(eq(schema.wallets.userId, userId))
    .limit(1);
  return rows.at(0);
}

/**
 * 获取或创建用户钱包。withSignupGrant 时对新钱包发放一次注册赠送
 * （幂等键 signup-grant:{userId}，重复调用不会重复赠送）。
 */
export async function getOrCreateWallet(
  userId: number,
  opts?: { withSignupGrant?: boolean },
): Promise<Wallet> {
  const db = getDb();
  const existing = await findWalletByUserId(userId);
  if (existing) return existing;

  try {
    await db.insert(schema.wallets).values({ userId, balanceLingqian: 0 });
  } catch {
    // 并发下可能撞唯一键，忽略后重查
  }
  const wallet = await findWalletByUserId(userId);
  if (!wallet) throw new Error("wallet creation failed");

  if (opts?.withSignupGrant) {
    await applyTransaction({
      userId,
      changeAmount: SIGNUP_GRANT_AMOUNT,
      reason: "grant",
      refType: "signup",
      idempotencyKey: `signup-grant:${userId}`,
    });
    return (await findWalletByUserId(userId)) ?? wallet;
  }
  return wallet;
}

export interface ApplyTransactionInput {
  userId: number;
  changeAmount: number;
  reason: "recharge" | "consume" | "refund" | "adjust" | "grant";
  refType?: string;
  refId?: string;
  idempotencyKey: string;
}

export interface ApplyTransactionResult {
  wallet: Wallet;
  transaction: WalletTransaction;
  /** false = 同一幂等键已应用过，本次未重复记账 */
  applied: boolean;
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/**
 * 事务内记账核心（供 applyTransaction 与 processPaymentEvent 复用）。
 * - 扣减用条件 UPDATE（balance >= 扣减额）保证并发下余额不为负
 * - 同一 idempotencyKey 已存在流水 → 返回既有流水，不重复记账
 * - 余额不足 → 抛 InsufficientBalanceError，外层事务回滚
 */
export async function applyTransactionTx(
  tx: Tx,
  wallet: Wallet,
  input: ApplyTransactionInput,
): Promise<ApplyTransactionResult> {
  // 快照基准余额（在条件更新之前读取，避免任何原地修改污染计算）
  const baseBalance = wallet.balanceLingqian;

  const dup = await tx
    .select()
    .from(schema.walletTransactions)
    .where(eq(schema.walletTransactions.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (dup.at(0)) {
    return { wallet, transaction: dup[0], applied: false };
  }

  // 原子条件扣减：并发下数据库保证 balance 不为负
  if (input.changeAmount < 0) {
    const res = await tx
      .update(schema.wallets)
      .set({
        balanceLingqian: sql`${schema.wallets.balanceLingqian} + ${input.changeAmount}`,
      })
      .where(
        and(
          eq(schema.wallets.id, wallet.id),
          gte(schema.wallets.balanceLingqian, -input.changeAmount),
        ),
      );
    if (Number(res[0]?.affectedRows ?? 0) !== 1) {
      throw new InsufficientBalanceError();
    }
  } else {
    await tx
      .update(schema.wallets)
      .set({
        balanceLingqian: sql`${schema.wallets.balanceLingqian} + ${input.changeAmount}`,
      })
      .where(eq(schema.wallets.id, wallet.id));
  }

  const balanceAfter = baseBalance + input.changeAmount;
  const inserted = await tx
    .insert(schema.walletTransactions)
    .values({
      userId: input.userId,
      walletId: wallet.id,
      changeAmount: input.changeAmount,
      balanceAfter,
      reason: input.reason,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
      idempotencyKey: input.idempotencyKey,
    })
    .$returningId();
  const txId = inserted.at(0)?.id ?? null;

  const transaction: WalletTransaction = {
    id: txId ?? 0,
    userId: input.userId,
    walletId: wallet.id,
    changeAmount: input.changeAmount,
    balanceAfter,
    reason: input.reason,
    refType: input.refType ?? null,
    refId: input.refId ?? null,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date(),
  };
  return {
    wallet: { ...wallet, balanceLingqian: balanceAfter },
    transaction,
    applied: true,
  };
}

/**
 * 应用一笔钱包流水（自带事务包装）。
 * 需要与订单/支付事件同事务时请改用外层事务 + applyTransactionTx。
 */
export async function applyTransaction(
  input: ApplyTransactionInput,
): Promise<ApplyTransactionResult> {
  const db = getDb();
  const wallet = await getOrCreateWallet(input.userId);

  try {
    return await db.transaction(async (tx) => applyTransactionTx(tx, wallet, input));
  } catch (err) {
    if (err instanceof InsufficientBalanceError) throw err;
    // 并发撞幂等键（唯一约束冲突导致事务回滚）：返回既有流水
    const again = await db
      .select()
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (again.at(0)) {
      return {
        wallet: (await findWalletByUserId(input.userId)) ?? wallet,
        transaction: again[0],
        applied: false,
      };
    }
    throw err;
  }
}

/** 最近流水（默认 20 条，按时间倒序） */
export async function listRecentTransactions(
  userId: number,
  limit = 20,
): Promise<WalletTransaction[]> {
  return getDb()
    .select()
    .from(schema.walletTransactions)
    .where(eq(schema.walletTransactions.userId, userId))
    .orderBy(desc(schema.walletTransactions.createdAt))
    .limit(limit);
}
