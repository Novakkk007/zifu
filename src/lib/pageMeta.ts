/**
 * 每路由页面 Meta 登记工具（SEO）。无第三方依赖，沿用既有 document.title 机制。
 * 每个路由调用 setPageMeta(title, description)，同步更新 <title> 与 <meta name="description">。
 */
export function setPageMeta(title: string, description: string): void {
  if (typeof document === "undefined") return;
  document.title = title;

  const descMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  if (descMeta) {
    descMeta.setAttribute("content", description);
  } else {
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = description;
    document.head.appendChild(meta);
  }
}
