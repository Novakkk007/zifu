import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

/**
 * OAuth state 由服务端 /api/oauth/begin 生成（CSPRNG 随机、一次性、10 分钟有效），
 * 前端不再自构 state——登录 CSRF 防线在服务端闭合。
 */
function getOAuthUrl() {
  return "/api/oauth/begin";
}

export default function Login() {
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
