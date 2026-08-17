import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { setPageMeta } from "@/lib/pageMeta";

/**
 * OAuth state 由服务端 /api/oauth/begin 生成（CSPRNG 随机、一次性、10 分钟有效），
 * 前端不再自构 state——登录 CSRF 防线在服务端闭合。
 */
function getOAuthUrl() {
  return "/api/oauth/begin";
}

export default function Login() {
  useEffect(() => {
    setPageMeta(
      "登录 · 紫府 — 以古人之智，照今日之心",
      "登录紫府，使用八字排盘、紫微斗数、六爻起卦等公版典籍参详工具。",
    );
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo variant="stacked" theme="ivory" size={96} />
          </div>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            Sign in with Kimi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
