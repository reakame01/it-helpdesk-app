"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ItStaffRole = "IT_STAFF" | "IT_LEAD";

export type ItSessionUser = {
  id: string;
  displayName: string;
  email: string;
  role: ItStaffRole;
  avatarUrl: string;
};

type ItAuthContextValue = {
  user: ItSessionUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const MOCK_IT_CREDENTIALS = {
  email: "it@company.com",
  password: "it1234",
} as const;

const MOCK_IT_USER: ItSessionUser = {
  id: "it-1",
  displayName: "Somporn",
  email: MOCK_IT_CREDENTIALS.email,
  role: "IT_STAFF",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA_NePHXteXZ9yx7SIbUFiB0Y_Ny-CmxDPgqTJ4X35kPBr_q7zs_4d2-ZRM25dLefYhTZEAu3w8jQKcJAPAACSo8IWJW4wGuO0jvrlOsRd14qtTrsi27hLBJTleGKCG8pt__HLkPT3loKvwnuH72YM4mJBp6qt5bu1tjmNYzbpX-Yyax0yuX63Lmqs0hr-6Nkew0Jn_59RNYBB3y-OunQPWDqAZMZFjonan5266dgGrNL89QkY8Sow",
};

const ItAuthContext = createContext<ItAuthContextValue | null>(null);

export function ItAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ItSessionUser | null>(null);

  const login = useCallback((email: string, password: string) => {
    const emailOk =
      email.trim().toLowerCase() === MOCK_IT_CREDENTIALS.email;
    const passwordOk = password === MOCK_IT_CREDENTIALS.password;
    if (!emailOk || !passwordOk) return false;
    setUser(MOCK_IT_USER);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, login, logout],
  );

  return (
    <ItAuthContext.Provider value={value}>{children}</ItAuthContext.Provider>
  );
}

export function useItAuth(): ItAuthContextValue {
  const ctx = useContext(ItAuthContext);
  if (!ctx) {
    throw new Error("useItAuth must be used within ItAuthProvider");
  }
  return ctx;
}
