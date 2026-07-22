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

import { ENGINE_FRAMEWORKS, type EngineFramework } from "./ai-frameworks";

const PERSONA_STYLE: Record<Persona, string> = {
  scholar:
    "严谨克制，条分缕析。凡有论断必归因典籍或盘象，句式如「按《滴天髓》之法」「由此盘象可见」；不作主观渲染，不用惊叹语。",
  hermit:
    "通达幽默，以生活化譬喻讲解术数之理，如围炉夜话；譬喻须贴切不油滑，分寸感在先，涉及断语处与学者人格同守克制。",
};

const DEPTH_STYLE: Record<Depth, string> = {
  pro: "使用专业术语（十神、格局、用神、岁运、庙旺、纳甲等），按框架逐节展开，面向有基础的读者。",
  plain: "保留框架顺序，但每节先用一句白话说清结论，再简释术语；避免术语堆叠，面向初次接触的读者。",
};

/** 全局表述红线（叠加各引擎特有 caution） */
const GLOBAL_CAUTIONS = [
  "不作生死、疾病、灾祸之确定性断语；不言「必死」「必败」「必离」之类。",
  "不给医疗、法律、投资之直接指令；相关话题仅以传统命理视角作文化性陈述。",
  "不恐吓、不渲染厄运；凶象以「传统命理认为此处需留意」的归因句式表述。",
  "引典只限给定书目，且须为真实原文或通行表述；不确定出处者宁可不引，严禁杜撰引文。",
];

function frameworkFor(chartType: string): EngineFramework {
  return (
    ENGINE_FRAMEWORKS[chartType] ?? {
      name: chartType,
      books: [],
      steps: ["盘象概览", "要点分析", "综合参详"],
    }
  );
}

/** 术数类别：ming 命术（禀赋命格）/ zhan 占术（具体事项）/ qian 签术（灵签寓意） */
function chartTypeGroup(chartType: string): "ming" | "zhan" | "qian" {
  if (chartType === "liuyao" || chartType === "qimen" || chartType === "daliuren") {
    return "zhan";
  }
  if (chartType === "draw") return "qian";
  return "ming";
}

function buildPrompt(req: ReadingRequest): string {
  const fw = frameworkFor(req.chartType);
  const lines: string[] = [
    `请以「${req.persona === "scholar" ? "严谨学者" : "幽默隐士"}」人格，为一则${fw.name}排盘结果作参详解读。`,
    "",
    `【人格文风】${PERSONA_STYLE[req.persona]}`,
    `【深度要求】${DEPTH_STYLE[req.depth]}`,
    "",
    `【解读框架】按下列次第分节展开，每节冠以四字至八字小标题：`,
    ...fw.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `【排盘摘要】（解读的一切依据，不可超出此范围虚增盘象）`,
    req.chartSummary,
    "",
    `【引典范围】仅可引用：${fw.books.length > 0 ? fw.books.join("、") : "（本术不强制引典）"}；格式如《书名》：「原文」。`,
    `【红线】`,
    ...GLOBAL_CAUTIONS.map((c) => `· ${c}`),
    ...(fw.caution ? [`· ${fw.caution}`] : []),
    "",
    `【篇幅】${req.depth === "pro" ? "按框架 5-7 节" : "按框架 3-4 节"}，每节 2-4 句。`,
    `【结尾】另起一行，附：古籍数字化 · AI 参详 — 仅供文化研究与体验，不构成任何决策建议。`,
  ];
  return lines.join("\n");
}

/** 降级模板：无 API 密钥时的确定性输出（同一输入必得同一输出） */
function fallbackReading(req: ReadingRequest): string {
  const fw = frameworkFor(req.chartType);
  const personaLine =
    req.persona === "scholar"
      ? "谨按典籍体例，就此盘作一概览。"
      : "且坐下来，听我慢慢与你拆解这张盘。";
  const depthLine = (() => {
    if (req.depth === "pro") {
      return "先观日主之旺衰，次察格局之成败，再审岁运之流转。";
    }
    // plain 深度的开场白按术数类别区分：命术言禀赋，占术言事态，签术言寓意
    if (chartTypeGroup(req.chartType) === "zhan") {
      return "简单来说，这一局讲的是此事的来龙去脉、关键所在与时机节奏。";
    }
    if (chartTypeGroup(req.chartType) === "qian") {
      return "简单来说，这一签讲的是寓意所指、当下宜守与行持方向。";
    }
    return "简单来说，这张盘讲的是你的底色、长处与节奏。";
  })();
  // 演示纲要：取解读框架前三节作示例（确定性，随引擎而变）
  const outline = fw.steps
    .slice(0, 3)
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");
  return [
    personaLine,
    depthLine,
    `【${fw.name} · 排盘摘要】\n${req.chartSummary}`,
    `【参详纲要】真实模型将按下列次第逐节引经参详：\n${outline}`,
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
          {
            role: "system",
            content:
              "你是紫府平台的术数参详助手。知识根基为《周易》《滴天髓》《三命通会》《紫微斗数全书》《果老星宗》《增删卜易》等公版典籍。输出准则：克制、专业、可溯源——凡论断必归因典籍或盘象；不作生死疾病灾祸之确定性断语；不给医疗、法律、投资之直接指令；严禁杜撰典籍引文；摘要之外不得虚增盘象。",
          },
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
