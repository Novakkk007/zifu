# 紫府设计系统（v6 · 鎏金靛蓝）

## 品牌
- 母标：金色气脉葫芦（手绘矢量 SVG，`public/assets/logo-*.svg`）
- 变体：mark / wordmark / horizontal / stacked / reverse / favicon
- 字标：「紫府」衬线矢量
- 口号：古籍数字化 · AI 参详

## 主题（data-theme）
默认 `gold-indigo`（鎏金靛蓝），另保留 墨青 / 紫檀 / 玄墨。

### gold-indigo 色板（design tokens）
```
indigo-950 #100A24  indigo-900 #18103A  indigo-800 #24116F
indigo-700 #31208C  indigo-600 #4B39A6
gold-900  #8B5C1A   gold-800  #9A6A21   gold-700   #B98228
gold-600  #D2A33D   gold-500  #E5B957   gold-300   #F0CB69   gold-100 #F7E7AA
paper-100 #F7F0E4   paper-200 #EDE0CA   paper-300  #DCC9A8
ink #211B2D  muted #817568
red #A44B4D  green #65806E  blue #455B9D
```

## 字体
- 标题：Noto Serif SC（600/700）
- 正文：Noto Sans SC（300-600）
- 西文/数字：Cormorant Garamond / Noto Sans SC

## 按钮
5 变体：Primary / Foil / Secondary / Ghost / Danger
8 状态：default · hover · active(scale≤0.98) · focus(金环) · disabled · loading(spinner+禁重复) · success · error（图标+文字双编码）
触控目标 ≥44px

## 状态徽章（StatusBadge）
live(金) / fallback(灰·演示引擎) / demo(纸·演示模式) / approx(蓝·近似排算) / success(绿) / error(红) — 全部图标+文字双编码，不单独依赖颜色。

## 纹理
gold-foil.webp / paper-grain.webp / ink-noise.webp，透明度 8–18%，仅作氛围层。

## 动效
入场 stagger 40–90ms、页面淡入 260ms、滚动触发 reveal；循环动画全部尊重 prefers-reduced-motion。

## 可访问性
- 对比度：正文 ≥4.5:1，大字 ≥3:1（纸底墨字 / 靛底纸字均达标）
- 颜色从不单独表意（徽章/五行均双编码）
- 键盘：导航/下拉/Tabs/弹层全可达，focus 可见
