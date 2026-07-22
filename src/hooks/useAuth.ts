import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();

  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  /**
   * access JWT（2h）过期后 auth.me 会 401——自动走 auth.refresh
   * 用未撤销的会话行换新 JWT 并重试一次；会话也失效才真正登出。
   */
  const refreshMutation = trpc.auth.refresh.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const refreshTriedRef = useRef(false);
  useEffect(() => {
    if (!isLoading && !user && error && !refreshTriedRef.current) {
      refreshTriedRef.current = true;
      refreshMutation.mutate();
    }
    if (user) {
      refreshTriedRef.current = false;
    }
  }, [isLoading, user, error, refreshMutation]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  useEffect(() => {
    if (
      redirectOnUnauthenticated &&
      !isLoading &&
      !user &&
      // refresh 尝试后仍无用户才跳转登录页
      (refreshTriedRef.current === false ? false : !refreshMutation.isPending)
    ) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [
    redirectOnUnauthenticated,
    isLoading,
    user,
    navigate,
    redirectPath,
    refreshMutation.isPending,
  ]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading:
        isLoading || logoutMutation.isPending || refreshMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [
      user,
      isLoading,
      logoutMutation.isPending,
      refreshMutation.isPending,
      error,
      logout,
      refetch,
    ],
  );
}
