"use client";

import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase-client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  refreshClaims: async () => undefined
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      const token = await nextUser.getIdTokenResult();
      setIsAdmin(token.claims.admin === true);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin,
      refreshClaims: async () => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdTokenResult(true);
        setIsAdmin(token.claims.admin === true);
      }
    }),
    [user, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
