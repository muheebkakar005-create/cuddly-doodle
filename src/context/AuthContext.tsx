"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "owner";
  name: string;
  salonId?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  role: "admin" | "owner" | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; role?: string; redirect?: string; error?: string }>;
  logout: (redirectTo?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "qsc_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Refresh / Sync session with backend (/api/auth/me)
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          const authUser: AuthUser = {
            id: data.user.userId || data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: data.user.name || (data.user.role === "admin" ? "Muheeb Kakar" : "Shop Owner"),
            salonId: data.user.salonId,
          };
          setUser(authUser);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authUser));
          return;
        }
      }
      // If server returned 401, clear client state
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // In case of network error, keep current local cache if present
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Initial Session Load (Checks local cache first for instant 0ms hydration)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.email && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch {
      // Ignore cache parse error
    }
    // Verify with server in background
    refreshSession();
  }, [refreshSession]);

  // 3. Unified Login Function
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data?.error || "Invalid email or password." };
      }

      const role = data.role as "admin" | "owner";
      const authUser: AuthUser = {
        id: data.userId || "usr_" + Date.now(),
        email: data.email,
        role: role,
        name: role === "admin" ? "Muheeb Kakar" : (data.name || "Shop Owner"),
        salonId: data.salonId,
      };

      setUser(authUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authUser));

      // Determine redirect URL
      const redirectUrl = role === "admin" ? "/super-admin/dashboard" : "/shop-owner/dashboard";

      return {
        ok: true,
        role,
        redirect: redirectUrl,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again.";
      return { ok: false, error: msg };
    }
  };

  // 4. Sign-Out Function
  const logout = async (redirectTo = "/login") => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network failures on logout
    } finally {
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // Hard navigation ensures clean browser cookie & cache wipe
      window.location.href = redirectTo;
    }
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
