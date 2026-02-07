import { useCallback, useMemo } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";

type User = {
  id: string;
  name: string;
  email: string;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } = options ?? {};
  const auth = useOidcAuth();

  const user = useMemo(() => {
    if (!auth.isAuthenticated || !auth.user) return null;
    return {
      id: auth.user.profile.sub || "",
      name: auth.user.profile.name || auth.user.profile.preferred_username || auth.user.profile.email || "Usuário",
      email: auth.user.profile.email || "",
    } as User;
  }, [auth.isAuthenticated, auth.user]);

  const logout = useCallback(async () => {
    // Limpa o cookie de sessão do servidor via chamada tRPC ou manualmente
    // Para simplificar no MVP, apenas removemos o estado local e redirecionamos
    auth.removeUser();
    window.location.href = redirectPath;
  }, [auth, redirectPath]);

  const isAuthenticated = auth.isAuthenticated;
  const loading = auth.isLoading;

  return {
    user,
    loading,
    error: auth.error,
    isAuthenticated,
    logout,
    refresh: () => auth.signinSilent(),
  };
}
