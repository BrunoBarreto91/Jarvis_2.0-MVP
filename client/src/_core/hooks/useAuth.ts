import { useCallback, useEffect, useState, useMemo } from "react";

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
  
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("jarvis_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    localStorage.removeItem("jarvis_access_token");
    localStorage.removeItem("jarvis_id_token");
    localStorage.removeItem("jarvis_refresh_token");
    localStorage.removeItem("jarvis_user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !loading && !isAuthenticated) {
      if (window.location.pathname !== redirectPath) {
        window.location.href = redirectPath;
      }
    }
  }, [redirectOnUnauthenticated, redirectPath, loading, isAuthenticated]);

  return {
    user,
    loading,
    error: null,
    isAuthenticated,
    logout,
    refresh: () => {}, // No-op para o MVP
  };
}
