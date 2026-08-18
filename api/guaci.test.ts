import { describe, expect, it } from "vitest";
import {
  GUACI,
  daXiangByName,
  daXiangOf,
  HEXAGRAMS,
} from "@contracts/engines/liuyao-core";

describe("六十四卦《大象传》辞（guaci.ts）", () => {
  it("覆盖全部 64 卦，且与 hexagram-data.ts 卦序一致", () => {
    expect(GUACI).toHaveLength(64);
    expect(HEXAGRAMS).toHaveLength(64);
    // id 一一对应、卦名一一对应
    GUACI.forEach((g, i) => {
      expect(g.id).toBe(i + 1);
      expect(g.name).toBe(HEXAGRAMS[i].name);
    });
  });

  it("每卦都有非空大象辞", () => {
    for (const g of GUACI) {
      expect(g.daXiang.trim().length).toBeGreaterThan(0);
    }
  });

  it("含经典大象辞（乾 / 坤）", () => {
    expect(guaciOfId(1)?.daXiang).toContain("天行健");
    expect(guaciOfId(2)?.daXiang).toContain("厚德载物");
  });
});

describe("daXiangOf / daXiangByName 查找", () => {
  it("按卦序 id 查辞", () => {
    expect(daXiangOf(1)).toBe("天行健，君子以自强不息。");
    expect(daXiangOf(64)).toBe("火在水上，未济，君子以慎辨物居方。");
  });

  it("按卦名查辞（如「乾为天」）", () => {
    expect(daXiangByName("乾为天")).toBe("天行健，君子以自强不息。");
  });

  it("未知 id / 未知卦名返回 undefined", () => {
    expect(daXiangOf(0)).toBeUndefined();
    expect(daXiangOf(65)).toBeUndefined();
    expect(daXiangByName("不存在的卦")).toBeUndefined();
  });
});

/** 按 id 取 GUACI 项 */
function guaciOfId(id: number) {
  return GUACI.find((g) => g.id === id);
}
