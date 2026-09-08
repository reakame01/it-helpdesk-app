"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserDto } from "@helpdesk/types";
import {
  fetchCurrentUser,
  loginRequest,
  setApiAccessToken,
} from "@/lib/api";

export type ItStaffRole = "IT_STAFF" | "SUPERVISOR" | "GM";

export type DutyStatus = "available" | "break" | "onsite";

export type ProfileSkill = {
  id: string;
  icon: string;
  labelKey: string;
};

export type ItSessionUser = {
  id: string;
  displayName: string;
  displayNameTh: string;
  displayNameEn: string;
  email: string;
  role: ItStaffRole;
  avatarUrl: string;
  jobTitle: string;
  employeeId: string;
  levelLabelKey: string;
  extension: string;
  mobile: string;
  location: string;
  dutyStatus: DutyStatus;
  skills: ProfileSkill[];
  metrics: {
    closedCases: number;
    rating: string;
    avgTime: string;
    slaPercent: number;
    yearLabel: string;
  };
  lastSavedLabelKey: string;
};

type ProfileUpdates = Partial<
  Pick<
    ItSessionUser,
    | "displayName"
    | "displayNameTh"
    | "displayNameEn"
    | "email"
    | "avatarUrl"
    | "jobTitle"
    | "extension"
    | "mobile"
    | "location"
    | "dutyStatus"
    | "skills"
  >
>;

type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: "wrongCurrent" | "mismatch" | "tooShort" };

type ItAuthContextValue = {
  user: ItSessionUser | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: ProfileUpdates) => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => ChangePasswordResult;
};

const ACCESS_TOKEN_STORAGE_KEY = "helpdesk.it.accessToken";

const DEFAULT_AVATAR =
  "https://www.kindpng.com/picc/m/24-248253_user-profile-default-image-png-clipart-png-download.png";

const PROFILE_DEFAULTS = {
  avatarUrl: DEFAULT_AVATAR,
  jobTitle: "System & Network Specialist (ฝ่ายเทคโนโลยีสารสนเทศ)",
  employeeId: "EMP-0012",
  levelLabelKey: "level2",
  extension: "ต่อ 101, 102",
  mobile: "089-123-4567",
  location: "ห้องปฏิบัติการ IT อาคาร 2 ชั้น 3 (IT NOC Room)",
  dutyStatus: "available" as DutyStatus,
  skills: [
    { id: "network", icon: "wifi", labelKey: "network" },
    { id: "os", icon: "desktop_windows", labelKey: "os" },
    { id: "erp", icon: "database", labelKey: "erp" },
    { id: "hardware", icon: "print", labelKey: "hardware" },
    { id: "cctv", icon: "videocam", labelKey: "cctv" },
  ] satisfies ProfileSkill[],
  metrics: {
    closedCases: 142,
    rating: "4.9",
    avgTime: "18m",
    slaPercent: 96.4,
    yearLabel: "2024",
  },
  lastSavedLabelKey: "yesterday",
};

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function writeStoredAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

function mapApiUserToSession(user: UserDto): ItSessionUser | null {
  if (
    user.role !== "IT_STAFF" &&
    user.role !== "SUPERVISOR" &&
    user.role !== "GM"
  ) {
    return null;
  }

  const displayName = user.nameTh?.trim() || user.name;
  return {
    id: user.id,
    displayName,
    displayNameTh: displayName.startsWith("คุณ")
      ? displayName
      : `คุณ${displayName}`,
    displayNameEn: user.nameEn?.trim() || user.name,
    email: user.email,
    role: user.role,
    ...PROFILE_DEFAULTS,
    avatarUrl: user.avatarUrl || PROFILE_DEFAULTS.avatarUrl,
    jobTitle: user.jobTitle || PROFILE_DEFAULTS.jobTitle,
    employeeId: user.employeeId || PROFILE_DEFAULTS.employeeId,
    extension: user.extension || PROFILE_DEFAULTS.extension,
    mobile: user.mobile || PROFILE_DEFAULTS.mobile,
  };
}

const ItAuthContext = createContext<ItAuthContextValue | null>(null);

export function ItAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ItSessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [localPassword, setLocalPassword] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const clearSession = useCallback(() => {
    setApiAccessToken(null);
    writeStoredAccessToken(null);
    setAccessToken(null);
    setUser(null);
    setLocalPassword(null);
  }, []);

  const applySession = useCallback(
    (token: string, profile: UserDto, password?: string | null) => {
      const session = mapApiUserToSession(profile);
      if (!session) {
        clearSession();
        return false;
      }
      setApiAccessToken(token);
      writeStoredAccessToken(token);
      setAccessToken(token);
      setUser(session);
      if (password !== undefined) {
        setLocalPassword(password);
      }
      return true;
    },
    [clearSession],
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = readStoredAccessToken();
      if (!token) {
        if (!cancelled) setIsRestoringSession(false);
        return;
      }

      setApiAccessToken(token);
      setAccessToken(token);

      try {
        const profile = await fetchCurrentUser();
        if (cancelled) return;
        if (!applySession(token, profile, null)) {
          clearSession();
        }
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsRestoringSession(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await loginRequest(email, password);
        return applySession(result.tokens.accessToken, result.user, password);
      } catch {
        clearSession();
        return false;
      }
    },
    [applySession, clearSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback((updates: ProfileUpdates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (updates.displayNameTh) {
        next.displayName = updates.displayNameTh.replace(/^คุณ/, "").trim();
      }
      return next;
    });
  }, []);

  const changePassword = useCallback(
    (
      currentPassword: string,
      newPassword: string,
      confirmPassword: string,
    ): ChangePasswordResult => {
      if (!localPassword || currentPassword !== localPassword) {
        return { ok: false, error: "wrongCurrent" };
      }
      if (newPassword.length < 8) {
        return { ok: false, error: "tooShort" };
      }
      if (newPassword !== confirmPassword) {
        return { ok: false, error: "mismatch" };
      }
      setLocalPassword(newPassword);
      return { ok: true };
    },
    [localPassword],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null && accessToken !== null,
      isRestoringSession,
      accessToken,
      login,
      logout,
      updateProfile,
      changePassword,
    }),
    [
      user,
      accessToken,
      isRestoringSession,
      login,
      logout,
      updateProfile,
      changePassword,
    ],
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

export const PROFILE_SKILL_CATALOG: ProfileSkill[] = [
  { id: "network", icon: "wifi", labelKey: "network" },
  { id: "os", icon: "desktop_windows", labelKey: "os" },
  { id: "erp", icon: "database", labelKey: "erp" },
  { id: "hardware", icon: "print", labelKey: "hardware" },
  { id: "cctv", icon: "videocam", labelKey: "cctv" },
  { id: "access", icon: "key", labelKey: "access" },
  { id: "email", icon: "mail", labelKey: "email" },
];
