"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { UserDto } from "@helpdesk/types";
import { ItLoginDialog } from "@/components/auth/it-login-dialog";
import { useItAuth } from "@/components/auth/it-auth-context";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  createManagedUser,
  deleteManagedUser,
  fetchManagedUsers,
  getApiErrorMessage,
  resetManagedUserPassword,
  updateManagedUser,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ManagedUserRole = "IT_STAFF" | "SUPERVISOR" | "GM";
type ToastState = { title: string; body: string } | null;
type EditorMode = "create" | "edit";

const managedUserRoles: ManagedUserRole[] = ["IT_STAFF", "SUPERVISOR", "GM"];

const DEFAULT_AVATAR_URL =
  "https://www.kindpng.com/picc/m/24-248253_user-profile-default-image-png-clipart-png-download.png";

type EditorForm = {
  employeeId: string;
  nameTh: string;
  nameEn: string;
  email: string;
  role: ManagedUserRole;
  extension: string;
  mobile: string;
  jobTitle: string;
  isActive: boolean;
  avatarUrl: string;
};

function createEmptyEditorForm(): EditorForm {
  return {
    employeeId: "",
    nameTh: "",
    nameEn: "",
    email: "",
    role: "IT_STAFF",
    extension: "",
    mobile: "",
    jobTitle: "",
    isActive: true,
    avatarUrl: DEFAULT_AVATAR_URL,
  };
}

function isManagedUserRole(role: string): role is ManagedUserRole {
  return managedUserRoles.includes(role as ManagedUserRole);
}

function displayName(user: UserDto): string {
  return user.nameTh?.trim() || user.name || user.email;
}

function avatarSrc(user: UserDto): string {
  return user.avatarUrl?.trim() || DEFAULT_AVATAR_URL;
}

function formatLastSignIn(
  iso: string | null | undefined,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  if (!iso) return t("never");
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t("never");
  const diffMs = Date.now() - then;
  if (diffMs < 60_000) return t("justNow");
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return t("minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hours", { count: hours });
  const days = Math.floor(hours / 24);
  return t("days", { count: days });
}

export function UserManagementWorkspace() {
  const t = useTranslations("userManagement");
  const { isAuthenticated, user: sessionUser } = useItAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | ManagedUserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [resetUser, setResetUser] = useState<UserDto | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserDto | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadUsers = useCallback(async () => {
    const rows = await fetchManagedUsers();
    setUsers(rows);
    return rows;
  }, []);

  const refreshUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setLoadError(null);
    try {
      await loadUsers();
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadUsers]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUsers([]);
      setLoadError(null);
      return;
    }
    void refreshUsers();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps -- load once when signed in

  const stats = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    return {
      total: users.length,
      active,
      inactive: users.length - active,
      staff: users.filter((u) => u.role === "IT_STAFF" && u.isActive).length,
      supervisor: users.filter((u) => u.role === "SUPERVISOR" && u.isActive).length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;
      if (!q) return true;
      const hay = [
        user.nameTh,
        user.nameEn,
        user.name,
        user.email,
        user.employeeId,
        user.extension,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [users, query, roleFilter, statusFilter]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-start gap-space-md rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {t("title")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("loginRequired")}
        </p>
        <button
          className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary"
          type="button"
          onClick={() => setLoginOpen(true)}
        >
          <MaterialIcon className="text-[20px]" name="login" />
          {t("signInToManage")}
        </button>
        <ItLoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  function openCreate() {
    setEditorMode("create");
    setEditingUser(null);
    setActionError(null);
    setEditorOpen(true);
  }

  function openEdit(user: UserDto) {
    setEditorMode("edit");
    setEditingUser(user);
    setActionError(null);
    setEditorOpen(true);
  }

  async function saveUser(
    payload: EditorForm & { id?: string; password?: string },
  ) {
    setBusy(true);
    setActionError(null);
    try {
      if (editorMode === "create") {
        await createManagedUser({
          email: payload.email,
          password: payload.password ?? "",
          nameTh: payload.nameTh,
          nameEn: payload.nameEn,
          role: payload.role,
          employeeId: payload.employeeId,
          jobTitle: payload.jobTitle || null,
          extension: payload.extension || null,
          mobile: payload.mobile || null,
          avatarUrl: payload.avatarUrl || DEFAULT_AVATAR_URL,
          isActive: true,
        });
        setToast({
          title: t("toast.createdTitle"),
          body: t("toast.createdBody"),
        });
      } else if (payload.id) {
        await updateManagedUser(payload.id, {
          email: payload.email,
          nameTh: payload.nameTh,
          nameEn: payload.nameEn,
          role: payload.role,
          employeeId: payload.employeeId,
          jobTitle: payload.jobTitle || null,
          extension: payload.extension || null,
          mobile: payload.mobile || null,
          avatarUrl: payload.avatarUrl || DEFAULT_AVATAR_URL,
          isActive: payload.isActive,
        });
        setToast({
          title: t("toast.updatedTitle"),
          body: t("toast.updatedBody"),
        });
      }
      setEditorOpen(false);
      await loadUsers();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: UserDto) {
    setBusy(true);
    setActionError(null);
    try {
      await updateManagedUser(user.id, { isActive: !user.isActive });
      setToast({
        title: user.isActive
          ? t("toast.deactivatedTitle")
          : t("toast.activatedTitle"),
        body: t("toast.statusBody", { name: displayName(user) }),
      });
      await loadUsers();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(user: UserDto): Promise<string> {
    setBusy(true);
    setActionError(null);
    try {
      const result = await resetManagedUserPassword(user.id);
      setToast({
        title: t("toast.resetTitle"),
        body: t("toast.resetBody", { name: displayName(user) }),
      });
      await loadUsers();
      return result.temporaryPassword;
    } catch (error) {
      setActionError(getApiErrorMessage(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete(user: UserDto) {
    setBusy(true);
    setActionError(null);
    try {
      await deleteManagedUser(user.id);
      setToast({
        title: t("toast.deletedTitle"),
        body: t("toast.deletedBody", { name: displayName(user) }),
      });
      setDeleteUser(null);
      await loadUsers();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-space-xl">
      <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-space-md lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-space-xs">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary/10 px-space-md py-1 font-label-sm text-label-sm font-semibold text-secondary">
              <MaterialIcon className="text-[16px]" name="admin_panel_settings" />
              {t("badge")}
            </span>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              {t("title")}
            </h1>
            <p className="max-w-3xl font-body-md text-body-md text-on-surface-variant">
              {t("subtitle")}
            </p>
          </div>
          <button
            className="flex h-11 shrink-0 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-lg font-label-md text-label-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-60"
            disabled={busy || loading}
            type="button"
            onClick={openCreate}
          >
            <MaterialIcon className="text-[20px]" name="person_add" />
            {t("addUser")}
          </button>
        </div>
      </section>

      {loadError ? (
        <div className="flex flex-col items-start gap-space-sm rounded-xl bg-error-container/40 p-space-lg text-error">
          <p className="font-body-md text-body-md">
            {t("loadError")} {loadError}
          </p>
          <button
            className="rounded-lg bg-primary px-space-md py-2 font-label-md text-label-md font-bold text-on-primary"
            type="button"
            onClick={() => void refreshUsers()}
          >
            {t("retry")}
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl bg-error-container/40 px-space-md py-space-sm font-body-sm text-body-sm text-error">
          {t("actionError", { message: actionError })}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-space-sm lg:grid-cols-4">
        <StatCard
          icon="groups"
          label={t("stats.total")}
          value={String(stats.total)}
        />
        <StatCard
          icon="check_circle"
          label={t("stats.active")}
          value={String(stats.active)}
          valueClassName="text-secondary"
        />
        <StatCard
          icon="engineering"
          label={t("stats.staff")}
          value={String(stats.staff)}
        />
        <StatCard
          icon="supervisor_account"
          label={t("stats.supervisor")}
          value={String(stats.supervisor)}
        />
      </section>

      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:p-space-lg">
        <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <MaterialIcon
              className="pointer-events-none absolute left-3 top-3 text-[20px] text-outline"
              name="search"
            />
            <input
              className="h-11 w-full rounded-lg bg-surface-container-low pl-10 pr-space-md font-body-sm text-body-sm text-on-surface outline-none ring-2 ring-transparent placeholder:text-outline focus:bg-surface-container-lowest focus:ring-primary"
              placeholder={t("searchPlaceholder")}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="h-11 rounded-lg bg-surface-container-low px-space-md font-label-md text-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "all" | ManagedUserRole)
            }
          >
            <option value="all">{t("filters.roleAll")}</option>
            {managedUserRoles.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-lg bg-surface-container-low px-space-md font-label-md text-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
          >
            <option value="all">{t("filters.statusAll")}</option>
            <option value="active">{t("filters.active")}</option>
            <option value="inactive">{t("filters.inactive")}</option>
          </select>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {loading && users.length === 0
            ? t("loading")
            : t("resultCount", { count: filtered.length })}
        </p>

        <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr className="font-label-md text-label-md text-on-surface-variant">
                <th className="px-space-md py-3 font-semibold">{t("table.user")}</th>
                <th className="px-space-md py-3 font-semibold">{t("table.employeeId")}</th>
                <th className="px-space-md py-3 font-semibold">{t("table.role")}</th>
                <th className="px-space-md py-3 font-semibold">{t("table.status")}</th>
                <th className="hidden px-space-md py-3 font-semibold lg:table-cell">
                  {t("table.lastSignIn")}
                </th>
                <th className="px-space-md py-3 text-right font-semibold">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td
                    className="px-space-md py-space-xl text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={6}
                  >
                    {t("loading")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    className="px-space-md py-space-xl text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={6}
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-outline-variant/20 hover:bg-surface-container-low/60"
                  >
                    <td className="px-space-md py-space-sm">
                      <div className="flex items-center gap-space-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                          src={avatarSrc(user)}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                            {displayName(user)}
                          </p>
                          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm font-mono text-[13px] text-on-surface-variant">
                      {user.employeeId ?? "—"}
                    </td>
                    <td className="px-space-md py-space-sm">
                      <RoleChip role={user.role} />
                    </td>
                    <td className="px-space-md py-space-sm">
                      <StatusChip active={user.isActive} />
                    </td>
                    <td className="hidden px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant lg:table-cell">
                      {formatLastSignIn(user.lastSignInAt, (key, values) =>
                        t(`lastSignIn.${key}`, values),
                      )}
                    </td>
                    <td className="px-space-md py-space-sm">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction
                          disabled={busy}
                          label={t("actions.edit")}
                          name="edit"
                          onClick={() => openEdit(user)}
                        />
                        <IconAction
                          disabled={busy}
                          label={t("actions.resetPassword")}
                          name="lock_reset"
                          onClick={() => {
                            setActionError(null);
                            setResetUser(user);
                          }}
                        />
                        <IconAction
                          danger={user.isActive}
                          disabled={busy}
                          label={
                            user.isActive
                              ? t("actions.deactivate")
                              : t("actions.activate")
                          }
                          name={user.isActive ? "person_off" : "how_to_reg"}
                          onClick={() => void toggleActive(user)}
                        />
                        <IconAction
                          danger
                          disabled={busy || sessionUser?.id === user.id}
                          label={t("actions.delete")}
                          name="delete"
                          onClick={() => {
                            setActionError(null);
                            setDeleteUser(user);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <UserEditorDialog
        key={`${editorMode}-${editingUser?.id ?? "new"}-${editorOpen}`}
        busy={busy}
        mode={editorMode}
        open={editorOpen}
        user={editingUser}
        onClose={() => {
          if (!busy) setEditorOpen(false);
        }}
        onSave={(payload) => void saveUser(payload)}
      />

      <ResetPasswordDialog
        busy={busy}
        open={Boolean(resetUser)}
        user={resetUser}
        onClose={() => {
          if (!busy) setResetUser(null);
        }}
        onConfirm={confirmReset}
      />

      <DeleteUserDialog
        busy={busy}
        open={Boolean(deleteUser)}
        user={deleteUser}
        onClose={() => {
          if (!busy) setDeleteUser(null);
        }}
        onConfirm={(user) => void confirmDelete(user)}
      />

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-space-sm rounded-xl bg-inverse-surface px-space-lg py-space-md text-inverse-on-surface shadow-xl">
          <MaterialIcon
            className="text-[24px] text-secondary-fixed"
            name="check_circle"
          />
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-semibold">
              {toast.title}
            </span>
            <span className="font-body-sm text-body-sm text-inverse-on-surface/80">
              {toast.body}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center gap-space-xs text-on-surface-variant">
        <MaterialIcon className="text-[18px]" name={icon} />
        <span className="font-label-sm text-label-sm font-semibold">{label}</span>
      </div>
      <span
        className={cn(
          "font-headline-md text-headline-md font-bold text-primary",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function RoleChip({ role }: { role: string }) {
  const t = useTranslations("userManagement");
  if (!isManagedUserRole(role)) {
    return (
      <span className="inline-flex rounded-lg bg-surface-container px-space-sm py-1 font-label-sm text-label-sm font-semibold text-on-surface">
        {role}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-space-sm py-1 font-label-sm text-label-sm font-semibold",
        role === "SUPERVISOR" && "bg-primary/10 text-primary",
        role === "IT_STAFF" && "bg-surface-container text-on-surface",
        role === "GM" && "bg-secondary/10 text-secondary",
      )}
    >
      {t(`roles.${role}`)}
    </span>
  );
}

function StatusChip({ active }: { active: boolean }) {
  const t = useTranslations("userManagement");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-space-sm py-1 font-label-sm text-label-sm font-semibold",
        active
          ? "bg-secondary-container/40 text-on-secondary-container"
          : "bg-error-container/50 text-error",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-secondary" : "bg-error",
        )}
      />
      {active ? t("filters.active") : t("filters.inactive")}
    </span>
  );
}

function IconAction({
  name,
  label,
  onClick,
  danger,
  disabled,
}: {
  name: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50",
        danger && "hover:bg-error-container/50 hover:text-error",
      )}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      <MaterialIcon className="text-[18px]" name={name} />
    </button>
  );
}

function UserEditorDialog({
  open,
  mode,
  user,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: EditorMode;
  user: UserDto | null;
  busy: boolean;
  onClose: () => void;
  onSave: (payload: EditorForm & { id?: string; password?: string }) => void;
}) {
  const t = useTranslations("userManagement");
  const titleId = useId();
  const [form, setForm] = useState<EditorForm>(() => {
    if (!user) return createEmptyEditorForm();
    return {
      employeeId: user.employeeId ?? "",
      nameTh: user.nameTh ?? user.name ?? "",
      nameEn: user.nameEn ?? "",
      email: user.email,
      role: isManagedUserRole(user.role) ? user.role : "IT_STAFF",
      extension: user.extension ?? "",
      mobile: user.mobile ?? "",
      jobTitle: user.jobTitle ?? "",
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? DEFAULT_AVATAR_URL,
    };
  });
  const [password, setPassword] = useState(() =>
    mode === "create" ? generateTempPassword() : "",
  );
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, busy]);

  if (!open || typeof document === "undefined") return null;

  function update<K extends keyof EditorForm>(key: K, value: EditorForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (mode === "create" && password.trim().length < 8) return;
    onSave({
      employeeId: form.employeeId.trim(),
      nameTh: form.nameTh.trim(),
      nameEn: form.nameEn.trim(),
      email: form.email.trim(),
      role: form.role,
      extension: form.extension.trim(),
      mobile: form.mobile.trim(),
      jobTitle: form.jobTitle.trim(),
      isActive: form.isActive,
      avatarUrl: form.avatarUrl || DEFAULT_AVATAR_URL,
      password: mode === "create" ? password.trim() : undefined,
      id: mode === "edit" ? user?.id : undefined,
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="relative w-full max-w-2xl rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          <button
            aria-label={t("dialog.close")}
            className="absolute right-space-md top-space-md flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
            disabled={busy}
            type="button"
            onClick={onClose}
          >
            <MaterialIcon className="text-[22px]" name="close" />
          </button>

          <div className="mb-space-lg pr-10">
            <h2
              className="font-headline-sm text-headline-sm font-semibold text-primary"
              id={titleId}
            >
              {mode === "create" ? t("dialog.createTitle") : t("dialog.editTitle")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {mode === "create"
                ? t("dialog.createSubtitle")
                : t("dialog.editSubtitle")}
            </p>
          </div>

          <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <Field
                id="um-name-th"
                label={t("fields.nameTh")}
                required
                value={form.nameTh}
                onChange={(v) => update("nameTh", v)}
              />
              <Field
                id="um-name-en"
                label={t("fields.nameEn")}
                required
                value={form.nameEn}
                onChange={(v) => update("nameEn", v)}
              />
              <Field
                id="um-email"
                label={t("fields.email")}
                required
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
              />
              <Field
                id="um-emp"
                label={t("fields.employeeId")}
                required
                value={form.employeeId}
                onChange={(v) => update("employeeId", v)}
              />
              <div className="flex flex-col gap-space-2xs">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="um-role"
                >
                  {t("fields.role")} <span className="text-error">*</span>
                </label>
                <select
                  className="h-12 rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  id="um-role"
                  required
                  value={form.role}
                  onChange={(e) =>
                    update("role", e.target.value as ManagedUserRole)
                  }
                >
                  {managedUserRoles.map((role) => (
                    <option key={role} value={role}>
                      {t(`roles.${role}`)}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                id="um-job"
                label={t("fields.jobTitle")}
                value={form.jobTitle}
                onChange={(v) => update("jobTitle", v)}
              />
              <Field
                id="um-ext"
                label={t("fields.extension")}
                value={form.extension}
                onChange={(v) => update("extension", v)}
              />
              <Field
                id="um-mobile"
                label={t("fields.mobile")}
                value={form.mobile}
                onChange={(v) => update("mobile", v)}
              />
              {mode === "create" ? (
                <div className="flex flex-col gap-space-2xs md:col-span-2">
                  <label
                    className="font-label-md text-label-md text-on-surface"
                    htmlFor="um-password"
                  >
                    {t("fields.password")} <span className="text-error">*</span>
                  </label>
                  <div className="flex flex-col gap-space-xs sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <input
                        className="h-12 w-full rounded-lg bg-surface-container-low px-space-md pr-11 font-mono text-body-md text-on-surface outline-none ring-2 ring-transparent focus:bg-surface-container-lowest focus:ring-primary"
                        id="um-password"
                        minLength={8}
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        aria-label={
                          showPassword
                            ? t("fields.hidePassword")
                            : t("fields.showPassword")
                        }
                        className="absolute right-3 top-3 text-outline hover:text-on-surface"
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        <MaterialIcon
                          className="text-[22px]"
                          name={showPassword ? "visibility_off" : "visibility"}
                        />
                      </button>
                    </div>
                    <button
                      className="flex h-12 shrink-0 items-center justify-center gap-space-2xs rounded-lg bg-surface-container px-space-md font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-surface-variant"
                      type="button"
                      onClick={() => {
                        setPassword(generateTempPassword());
                        setShowPassword(true);
                        setCopied(false);
                      }}
                    >
                      <MaterialIcon className="text-[18px]" name="shuffle" />
                      {t("fields.generatePassword")}
                    </button>
                    <button
                      className="flex h-12 shrink-0 items-center justify-center gap-space-2xs rounded-lg bg-surface-container px-space-md font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-variant"
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(password);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 2000);
                        } catch {
                          setCopied(false);
                        }
                      }}
                    >
                      <MaterialIcon
                        className="text-[18px]"
                        name={copied ? "check" : "content_copy"}
                      />
                      {copied ? t("fields.copied") : t("fields.copyPassword")}
                    </button>
                  </div>
                  <p className="rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-on-surface-variant">
                    {t("dialog.createPasswordHint")}
                  </p>
                </div>
              ) : (
                <label className="flex items-center gap-space-sm rounded-lg bg-surface-container-low p-space-md md:col-span-2">
                  <input
                    checked={form.isActive}
                    className="h-4 w-4 accent-secondary"
                    type="checkbox"
                    onChange={(e) => update("isActive", e.target.checked)}
                  />
                  <span className="font-label-md text-label-md text-on-surface">
                    {t("fields.activeAccount")}
                  </span>
                </label>
              )}
            </div>

            <div className="mt-space-xs flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
              <button
                className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                disabled={busy}
                type="button"
                onClick={onClose}
              >
                {t("dialog.cancel")}
              </button>
              <button
                className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary hover:bg-primary-container disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                <MaterialIcon className="text-[18px]" name="check_circle" />
                {busy
                  ? t("saving")
                  : mode === "create"
                    ? t("dialog.createSubmit")
                    : t("dialog.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ResetPasswordDialog({
  open,
  user,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  user: UserDto | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (user: UserDto) => Promise<string>;
}) {
  const t = useTranslations("userManagement");
  const titleId = useId();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setTemporaryPassword(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, busy]);

  if (!open || !user || typeof document === "undefined") return null;

  const name = displayName(user);

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          {temporaryPassword ? (
            <>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container/50 text-secondary">
                <MaterialIcon className="text-[26px]" name="key" />
              </div>
              <h2
                className="font-headline-sm text-headline-sm font-semibold text-on-surface"
                id={titleId}
              >
                {t("reset.resultTitle")}
              </h2>
              <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                {t("reset.resultBody", { name })}
              </p>
              <div className="mt-space-md flex flex-col gap-space-xs sm:flex-row">
                <input
                  className="h-12 min-w-0 flex-1 rounded-lg bg-surface-container-low px-space-md font-mono text-body-md text-on-surface outline-none"
                  readOnly
                  value={temporaryPassword}
                />
                <button
                  className="flex h-12 shrink-0 items-center justify-center gap-space-2xs rounded-lg bg-surface-container px-space-md font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-variant"
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(temporaryPassword);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 2000);
                    } catch {
                      setCopied(false);
                    }
                  }}
                >
                  <MaterialIcon
                    className="text-[18px]"
                    name={copied ? "check" : "content_copy"}
                  />
                  {copied ? t("fields.copied") : t("fields.copyPassword")}
                </button>
              </div>
              <div className="mt-space-lg flex justify-end">
                <button
                  className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary hover:bg-primary-container"
                  type="button"
                  onClick={onClose}
                >
                  {t("reset.done")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-error-container/60 text-error">
                <MaterialIcon className="text-[26px]" name="lock_reset" />
              </div>
              <h2
                className="font-headline-sm text-headline-sm font-semibold text-on-surface"
                id={titleId}
              >
                {t("reset.title")}
              </h2>
              <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                {t("reset.body", { name, email: user.email })}
              </p>
              <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-on-surface-variant">
                {t("reset.securityNote")}
              </p>
              <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
                <button
                  className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                  disabled={busy}
                  type="button"
                  onClick={onClose}
                >
                  {t("dialog.cancel")}
                </button>
                <button
                  className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary hover:bg-primary-container disabled:opacity-60"
                  disabled={busy}
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        const next = await onConfirm(user);
                        setTemporaryPassword(next);
                      } catch {
                        // actionError is set by parent
                      }
                    })();
                  }}
                >
                  <MaterialIcon className="text-[18px]" name="send" />
                  {busy ? t("saving") : t("reset.confirm")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DeleteUserDialog({
  open,
  user,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  user: UserDto | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (user: UserDto) => void;
}) {
  const t = useTranslations("userManagement");
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, busy]);

  if (!open || !user || typeof document === "undefined") return null;

  const name = displayName(user);

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-inverse-surface/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-space-md"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-error-container/60 text-error">
            <MaterialIcon className="text-[26px]" name="person_remove" />
          </div>
          <h2
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            id={titleId}
          >
            {t("delete.title")}
          </h2>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {t("delete.body", { name, email: user.email })}
          </p>
          <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-on-surface-variant">
            {t("delete.securityNote")}
          </p>
          <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              {t("dialog.cancel")}
            </button>
            <button
              className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-error px-space-md font-label-md text-label-md font-bold text-on-error hover:opacity-90 disabled:opacity-60"
              disabled={busy}
              type="button"
              onClick={() => onConfirm(user)}
            >
              <MaterialIcon className="text-[18px]" name="delete" />
              {busy ? t("saving") : t("delete.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email";
}) {
  return (
    <div className="flex flex-col gap-space-2xs">
      <label className="font-label-md text-label-md text-on-surface" htmlFor={id}>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <input
        className="h-12 w-full rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface outline-none ring-2 ring-transparent focus:bg-surface-container-lowest focus:ring-primary"
        id={id}
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function generateTempPassword(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}
