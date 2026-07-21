/**
 * AI 参详适配器
 * - 通过环境变量驱动（OpenAI 兼容协议）：
 *     AI_API_KEY   — 模型服务密钥（未配置时自动降级为模板引擎，接口照常可用）
 *     AI_BASE_URL  — 默认为 https://api.openai.com/v1
 *     AI_MODEL     — 默认 gpt-4o-mini
 *     AI_TIMEOUT_MS— 默认 30000
 * - 错误处理：超时 / 非 2xx / 返回体异常 → 抛出 AiServiceError，由路由层转为 TRPCError
 * - 降级：无密钥时返回 deterministic 模板解读，source = "fallback"，保证前端流程不断
 */

export type Persona = "scholar" | "hermit";
export type Depth = "pro" | "plain";

export interface ReadingRequest {
  chartType: string;
  /** 排盘结果摘要（由路由层从排盘结果提炼，不含敏感原始输入） */
  chartSummary: string;
  persona: Persona;
  depth: Depth;
}

export interface ReadingResult {
  text: string;
  source: "live" | "fallback";
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latencyMs: number;
}

export class AiServiceError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AiServiceError";
    this.cause = cause;
  }
}

interface AiEnv {
  apiKey?: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

function readEnv(): AiEnv {
  return {
    apiKey: process.env.AI_API_KEY || undefined,
    baseUrl: (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.AI_MODEL || "gpt-4o-mini",
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 30_000),
  };
}

const PERSONA_STYLE: Record<Persona, string> = {
  scholar: "严谨克制，逐句引经据典，标注典籍出处",
  hermit: "通达幽默，以生活化譬喻讲解，不失分寸",
};

const DEPTH_STYLE: Record<Depth, string> = {
  pro: "使用专业术语（十神、格局、用神、岁运），面向有基础的读者",
  plain: "使用通俗语言，避免术语堆叠，面向初次接触的读者",
};

function buildPrompt(req: ReadingRequest): string {
  return [
    `你是一位术数参详助手，请以${req.persona === "scholar" ? "学者" : "隐士"}人格输出解读。`,
    `文风要求：${PERSONA_STYLE[req.persona]}；深度要求：${DEPTH_STYLE[req.depth]}。`,
    `解读对象类型：${req.chartType}。`,
    `排盘信息：${req.chartSummary}`,
    "请输出 3-5 段解读，末尾附一句免责说明：仅供文化研究与体验，不构成任何决策建议。",
  ].join("\n");
}

/** 降级模板：无 API 密钥时的确定性输出（同一输入必得同一输出） */
function fallbackReading(req: ReadingRequest): string {
  const personaLine =
    req.persona === "scholar"
      ? "谨按典籍体例，就此盘作一概览。"
      : "且坐下来，听我慢慢与你拆解这张盘。";
  const depthLine =
    req.depth === "pro"
      ? "先观日主之旺衰，次察格局之成败，再审岁运之流转。"
      : "简单来说，这张盘讲的是你的底色、长处与节奏。";
  return [
    personaLine,
    depthLine,
    `【${req.chartType}】${req.chartSummary}`,
    "当前为演示引擎输出：配置 AI_API_KEY 后，此处将由真实大模型逐句参详。",
    "古籍数字化 · AI 参详 — 仅供文化研究与体验，不构成任何决策建议。",
  ].join("\n\n");
}

export async function generateReading(req: ReadingRequest): Promise<ReadingResult> {
  const env = readEnv();
  const started = Date.now();

  if (!env.apiKey) {
    return {
      text: fallbackReading(req),
      source: "fallback",
      model: null,
      promptTokens: null,
      completionTokens: null,
      latencyMs: Date.now() - started,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.timeoutMs);
  try {
    const resp = await fetch(`${env.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.apiKey}`,
      },
      body: JSON.stringify({
        model: env.model,
        messages: [
          { role: "system", content: "你是紫府平台的术数参详助手，输出克制、专业、可溯源。" },
          { role: "user", content: buildPrompt(req) },
        ],
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new AiServiceError(`AI 服务返回 ${resp.status}: ${body.slice(0, 200)}`);
    }

    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new AiServiceError("AI 服务返回体缺少 choices[0].message.content");

    return {
      text,
      source: "live",
      model: env.model,
      promptTokens: data.usage?.prompt_tokens ?? null,
      completionTokens: data.usage?.completion_tokens ?? null,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiServiceError(`AI 服务超时（${env.timeoutMs}ms）`, err);
    }
    throw new AiServiceError("AI 服务调用失败", err);
  } finally {
    clearTimeout(timer);
  }
}
