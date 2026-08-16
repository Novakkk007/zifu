import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import { LoadingState } from "@/components/LoadingState";

// 路由级懒加载：非首页引擎页面按需分包，首屏不再同步加载全部引擎
const Hecan = lazy(() => import("@/pages/Hecan"));
const Bazi = lazy(() => import("@/pages/Bazi"));
const Hepan = lazy(() => import("@/pages/bazi/Hepan"));
const Liuyao = lazy(() => import("@/pages/Liuyao"));
const Ziwei = lazy(() => import("@/pages/Ziwei"));
const Qizheng = lazy(() => import("@/pages/Qizheng"));
const Qimen = lazy(() => import("@/pages/Qimen"));
const Daliuren = lazy(() => import("@/pages/Daliuren"));
const Daily = lazy(() => import("@/pages/Daily"));
const Toolkit = lazy(() => import("@/pages/Toolkit"));
const Wiki = lazy(() => import("@/pages/Wiki"));
const Talks = lazy(() => import("@/pages/Talks"));
const Terms = lazy(() => import("@/pages/Terms"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Account = lazy(() => import("@/pages/Account"));
const Profile = lazy(() => import("@/pages/Profile"));
const Login = lazy(() => import("@/pages/Login"));
const ScenarioPlaceholder = lazy(() => import("@/pages/ScenarioPlaceholder"));
const FengshuiScenario = lazy(() => import("@/pages/scenario/FengshuiScenario"));
const WealthScenario = lazy(() => import("@/pages/scenario/WealthScenario"));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingState className="mx-auto my-16 max-w-xl" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hecan" element={<Hecan />} />
          <Route path="/bazi" element={<Bazi />} />
          <Route path="/bazi/hepan" element={<Hepan />} />
          <Route path="/liuyao" element={<Liuyao />} />
          <Route path="/ziwei" element={<Ziwei />} />
          <Route path="/qizheng" element={<Qizheng />} />
          <Route path="/qimen" element={<Qimen />} />
          <Route path="/daliuren" element={<Daliuren />} />
          <Route path="/daily" element={<Daily />} />
          <Route
            path="/scenario/wealth"
            element={<WealthScenario />}
          />
          <Route
            path="/scenario/love"
            element={<ScenarioPlaceholder scenario="love" />}
          />
          <Route
            path="/scenario/health"
            element={<ScenarioPlaceholder scenario="health" />}
          />
          <Route
            path="/scenario/fengshui"
            element={<FengshuiScenario />}
          />
          <Route path="/toolkit" element={<Toolkit />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/talks" element={<Talks />} />
          <Route path="/terms" element={<Terms />} />
          {/* 旧 mock 登录页路由 → 统一进入真实 OAuth 登录 */}
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
