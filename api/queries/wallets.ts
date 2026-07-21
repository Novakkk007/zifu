import { desc, eq } from "drizzle-orm";
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

/**
 * 应用一笔钱包流水（幂等）：
 * - 同一 idempotencyKey 已存在流水 → 直接返回既有流水，不重复增减余额
 * - 余额不足（出账后 < 0）→ 抛 InsufficientBalanceError，不落流水
 */
export async function applyTransaction(
  input: ApplyTransactionInput,
): Promise<ApplyTransactionResult> {
  const db = getDb();

  const dup = await db
    .select()
    .from(schema.walletTransactions)
    .where(eq(schema.walletTransactions.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (dup.at(0)) {
    const wallet = await getOrCreateWallet(input.userId);
    return { wallet, transaction: dup[0], applied: false };
  }

  const wallet = await getOrCreateWallet(input.userId);
  const balanceAfter = wallet.balanceLingqian + input.changeAmount;
  if (balanceAfter < 0) throw new InsufficientBalanceError();

  let txId: number | null = null;
  try {
    const inserted = await db
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
    txId = inserted.at(0)?.id ?? null;
  } catch (err) {
    // 并发撞幂等键：返回既有流水
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

  await db
    .update(schema.wallets)
    .set({ balanceLingqian: balanceAfter })
    .where(eq(schema.wallets.id, wallet.id));

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
