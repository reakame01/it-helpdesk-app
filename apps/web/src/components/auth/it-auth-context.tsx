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
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: ProfileUpdates) => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => ChangePasswordResult;
};

const MOCK_IT_CREDENTIALS = {
  email: "it@company.com",
  password: "it1234",
} as const;

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA_NePHXteXZ9yx7SIbUFiB0Y_Ny-CmxDPgqTJ4X35kPBr_q7zs_4d2-ZRM25dLefYhTZEAu3w8jQKcJAPAACSo8IWJW4wGuO0jvrlOsRd14qtTrsi27hLBJTleGKCG8pt__HLkPT3loKvwnuH72YM4mJBp6qt5bu1tjmNYzbpX-Yyax0yuX63Lmqs0hr-6Nkew0Jn_59RNYBB3y-OunQPWDqAZMZFjonan5266dgGrNL89QkY8Sow";

const MOCK_IT_USER: ItSessionUser = {
  id: "it-1",
  displayName: "อนุชา ปัญญาไว",
  displayNameTh: "คุณอนุชา ปัญญาไว",
  displayNameEn: "Anucha Panyawai",
  email: MOCK_IT_CREDENTIALS.email,
  role: "IT_STAFF",
  avatarUrl: DEFAULT_AVATAR,
  jobTitle: "System & Network Specialist (ฝ่ายเทคโนโลยีสารสนเทศ)",
  employeeId: "EMP-0012",
  levelLabelKey: "level2",
  extension: "ต่อ 101, 102",
  mobile: "089-123-4567",
  location: "ห้องปฏิบัติการ IT อาคาร 2 ชั้น 3 (IT NOC Room)",
  dutyStatus: "available",
  skills: [
    { id: "network", icon: "wifi", labelKey: "network" },
    { id: "os", icon: "desktop_windows", labelKey: "os" },
    { id: "erp", icon: "database", labelKey: "erp" },
    { id: "hardware", icon: "print", labelKey: "hardware" },
    { id: "cctv", icon: "videocam", labelKey: "cctv" },
  ],
  metrics: {
    closedCases: 142,
    rating: "4.9",
    avgTime: "18m",
    slaPercent: 96.4,
    yearLabel: "2024",
  },
  lastSavedLabelKey: "yesterday",
};

const ItAuthContext = createContext<ItAuthContextValue | null>(null);

export function ItAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ItSessionUser | null>(null);
  const [mockPassword, setMockPassword] = useState<string>(
    MOCK_IT_CREDENTIALS.password,
  );

  const login = useCallback(
    (email: string, password: string) => {
      const emailOk =
        email.trim().toLowerCase() === MOCK_IT_CREDENTIALS.email;
      const passwordOk = password === mockPassword;
      if (!emailOk || !passwordOk) return false;
      setUser({ ...MOCK_IT_USER, email: MOCK_IT_CREDENTIALS.email });
      return true;
    },
    [mockPassword],
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

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
      if (currentPassword !== mockPassword) {
        return { ok: false, error: "wrongCurrent" };
      }
      if (newPassword.length < 8) {
        return { ok: false, error: "tooShort" };
      }
      if (newPassword !== confirmPassword) {
        return { ok: false, error: "mismatch" };
      }
      setMockPassword(newPassword);
      return { ok: true };
    },
    [mockPassword],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, login, logout, updateProfile, changePassword],
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
