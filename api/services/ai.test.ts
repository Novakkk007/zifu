import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiServiceError, generateReading } from "./ai";

const BASE_REQ = {
  chartType: "bazi",
  chartSummary: "甲子年 丙寅月 戊午日 壬子时，日主戊土。",
  persona: "scholar" as const,
  depth: "pro" as const,
};

describe("AI 参详适配器", () => {
  beforeEach(() => {
    delete process.env.AI_API_KEY;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("无 API 密钥时降级为模板引擎（source=fallback），接口不中断", async () => {
    const res = await generateReading(BASE_REQ);
    expect(res.source).toBe("fallback");
    expect(res.model).toBeNull();
    expect(res.text).toContain(BASE_REQ.chartSummary);
    expect(res.text).toContain("不构成任何决策建议");
  });

  it("降级输出确定性：同一输入两次调用结果一致", async () => {
    const a = await generateReading(BASE_REQ);
    const b = await generateReading(BASE_REQ);
    expect(a.text).toBe(b.text);
  });

  it("有密钥时调用模型端点并返回 live 结果", async () => {
    process.env.AI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "此为学者人格的专业解读。" } }],
        usage: { prompt_tokens: 120, completion_tokens: 80 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await generateReading(BASE_REQ);
    expect(res.source).toBe("live");
    expect(res.text).toBe("此为学者人格的专业解读。");
    expect(res.promptTokens).toBe(120);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-key");
  });

  it("模型端点返回非 2xx 时抛出 AiServiceError", async () => {
    process.env.AI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => "rate limited" }),
    );
    await expect(generateReading(BASE_REQ)).rejects.toThrow(AiServiceError);
    await expect(generateReading(BASE_REQ)).rejects.toThrow(/429/);
  });

  it("模型返回体缺少 content 时抛出 AiServiceError", async () => {
    process.env.AI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) }),
    );
    await expect(generateReading(BASE_REQ)).rejects.toThrow(/content/);
  });
});
