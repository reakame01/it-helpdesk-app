"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { ReferenceCatalogDto, ReferenceItemDto } from "@helpdesk/types";
import { ItLoginDialog } from "@/components/auth/it-login-dialog";
import { useItAuth } from "@/components/auth/it-auth-context";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  createReferenceItem,
  deleteReferenceItem,
  fetchReferenceCatalogs,
  fetchReferenceItems,
  getApiErrorMessage,
  updateReferenceItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ToastState = { title: string; body: string } | null;
type EditorMode = "create" | "edit";
type StatusFilter = "all" | "active" | "inactive";

type EditorForm = {
  code: string;
  labelTh: string;
  labelEn: string;
  isActive: boolean;
  sortOrder: number;
  icon?: string;
};

const CATALOG_ICONS: Record<string, string> = {
  departments: "corporate_fare",
  categories: "category",
  skills: "psychology",
};

const CATALOG_ORDER = ["departments", "categories", "skills"] as const;

function catalogIcon(code: string) {
  return CATALOG_ICONS[code] ?? "dataset";
}

function emptyForm(catalogCode: string, nextOrder: number): EditorForm {
  return {
    code: "",
    labelTh: "",
    labelEn: "",
    isActive: true,
    sortOrder: nextOrder,
    icon:
      catalogCode === "categories"
        ? "category"
        : catalogCode === "skills"
          ? "psychology"
          : undefined,
  };
}

export function DataReferencesWorkspace() {
  const t = useTranslations("dataReferences");
  const { isAuthenticated } = useItAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [catalogs, setCatalogs] = useState<ReferenceCatalogDto[]>([]);
  const [catalogCode, setCatalogCode] = useState<string>("departments");
  const [items, setItems] = useState<ReferenceItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingItem, setEditingItem] = useState<ReferenceItemDto | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadCatalogs = useCallback(async () => {
    const rows = await fetchReferenceCatalogs();
    const ordered = [...rows].sort((a, b) => {
      const ai = CATALOG_ORDER.indexOf(
        a.code as (typeof CATALOG_ORDER)[number],
      );
      const bi = CATALOG_ORDER.indexOf(
        b.code as (typeof CATALOG_ORDER)[number],
      );
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    setCatalogs(ordered);
    return ordered;
  }, []);

  const loadItems = useCallback(async (code: string) => {
    const rows = await fetchReferenceItems(code);
    setItems(rows);
    return rows;
  }, []);

  const refreshCatalogs = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setLoadError(null);
    try {
      const nextCatalogs = await loadCatalogs();
      const selected =
        nextCatalogs.find((c) => c.code === catalogCode)?.code ??
        nextCatalogs[0]?.code;
      if (selected && selected !== catalogCode) {
        setCatalogCode(selected);
      }
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadCatalogs, catalogCode]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCatalogs([]);
      setItems([]);
      setLoadError(null);
      return;
    }
    void refreshCatalogs();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps -- initial catalogs when signed in

  useEffect(() => {
    if (!isAuthenticated || !catalogCode) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        await loadItems(catalogCode);
      } catch (error) {
        if (!cancelled) setLoadError(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogCode, isAuthenticated, loadItems]);

  const showIcon = catalogCode === "categories" || catalogCode === "skills";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...items]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((item) => {
        if (statusFilter === "active" && !item.isActive) return false;
        if (statusFilter === "inactive" && item.isActive) return false;
        if (!q) return true;
        return [item.code, item.labelTh, item.labelEn]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [items, query, statusFilter]);

  const activeCount = items.filter((item) => item.isActive).length;

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
    setEditingItem(null);
    setActionError(null);
    setEditorOpen(true);
  }

  function openEdit(item: ReferenceItemDto) {
    setEditorMode("edit");
    setEditingItem(item);
    setActionError(null);
    setEditorOpen(true);
  }

  async function saveItem(payload: EditorForm & { id?: string }) {
    setBusy(true);
    setActionError(null);
    try {
      if (editorMode === "create") {
        await createReferenceItem(catalogCode, {
          code: payload.code,
          labelTh: payload.labelTh,
          labelEn: payload.labelEn,
          icon: showIcon ? payload.icon ?? null : null,
          isActive: true,
          sortOrder: payload.sortOrder,
        });
        setToast({
          title: t("toast.createdTitle"),
          body: t("toast.createdBody"),
        });
      } else if (payload.id) {
        await updateReferenceItem(payload.id, {
          code: payload.code,
          labelTh: payload.labelTh,
          labelEn: payload.labelEn,
          icon: showIcon ? payload.icon ?? null : null,
          isActive: payload.isActive,
          sortOrder: payload.sortOrder,
        });
        setToast({
          title: t("toast.updatedTitle"),
          body: t("toast.updatedBody"),
        });
      }
      setEditorOpen(false);
      await Promise.all([loadCatalogs(), loadItems(catalogCode)]);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(item: ReferenceItemDto) {
    setBusy(true);
    setActionError(null);
    try {
      await updateReferenceItem(item.id, { isActive: !item.isActive });
      setToast({
        title: item.isActive
          ? t("toast.deactivatedTitle")
          : t("toast.activatedTitle"),
        body: t("toast.statusBody", { label: item.labelTh }),
      });
      await Promise.all([loadCatalogs(), loadItems(catalogCode)]);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: ReferenceItemDto) {
    if (!window.confirm(t("confirmDelete", { label: item.labelTh }))) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteReferenceItem(item.id);
      setToast({
        title: t("toast.deletedTitle"),
        body: t("toast.deletedBody", { label: item.labelTh }),
      });
      await Promise.all([loadCatalogs(), loadItems(catalogCode)]);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function catalogName(code: string) {
    if (
      code === "departments" ||
      code === "categories" ||
      code === "skills"
    ) {
      return t(`catalogs.${code}.name`);
    }
    return code;
  }

  function catalogDescription(code: string) {
    if (
      code === "departments" ||
      code === "categories" ||
      code === "skills"
    ) {
      return t(`catalogs.${code}.description`);
    }
    return "";
  }

  return (
    <div className="flex flex-col gap-space-xl">
      <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative flex flex-col gap-space-xs">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-space-md py-1 font-label-sm text-label-sm font-semibold text-primary">
            <MaterialIcon className="text-[16px]" name="dataset" />
            {t("badge")}
          </span>
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            {t("title")}
          </h1>
          <p className="max-w-3xl font-body-md text-body-md text-on-surface-variant">
            {t("subtitle")}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("scopeNote")}
          </p>
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
            onClick={() => void refreshCatalogs()}
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

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <aside className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm lg:col-span-3">
          <p className="px-space-sm py-space-xs font-label-sm text-label-sm font-semibold text-on-surface-variant">
            {t("catalogsHeading")}
          </p>
          {catalogs.map((catalog) => {
            const selected = catalog.code === catalogCode;
            return (
              <button
                key={catalog.id}
                className={cn(
                  "flex items-center gap-space-sm rounded-lg px-space-sm py-space-sm text-left transition-colors",
                  selected
                    ? "bg-primary text-on-primary"
                    : "text-on-surface hover:bg-surface-container",
                )}
                type="button"
                onClick={() => {
                  setCatalogCode(catalog.code);
                  setQuery("");
                  setStatusFilter("all");
                  setActionError(null);
                }}
              >
                <MaterialIcon
                  className="text-[22px]"
                  name={catalogIcon(catalog.code)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-label-md text-label-md font-semibold">
                    {catalogName(catalog.code)}
                  </span>
                  <span
                    className={cn(
                      "block font-body-sm text-body-sm",
                      selected ? "text-on-primary/80" : "text-on-surface-variant",
                    )}
                  >
                    {t("activeCount", {
                      count:
                        catalog.code === catalogCode
                          ? activeCount
                          : catalog.itemCount,
                    })}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:p-space-lg lg:col-span-9">
          <div className="flex flex-col gap-space-sm lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">
                {catalogName(catalogCode)}
              </h2>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {catalogDescription(catalogCode)}
              </p>
              <p className="mt-space-2xs font-label-sm text-label-sm text-outline">
                {loading
                  ? t("loading")
                  : t("summary", {
                      active: activeCount,
                      total: items.length,
                    })}
              </p>
            </div>
            <button
              className="flex h-11 shrink-0 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary shadow-sm hover:bg-primary-container disabled:opacity-60"
              disabled={busy || loading}
              type="button"
              onClick={openCreate}
            >
              <MaterialIcon className="text-[20px]" name="add" />
              {t("addItem")}
            </button>
          </div>

          <div className="flex flex-col gap-space-sm sm:flex-row">
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
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
            >
              <option value="all">{t("filters.all")}</option>
              <option value="active">{t("filters.active")}</option>
              <option value="inactive">{t("filters.inactive")}</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr className="font-label-md text-label-md text-on-surface-variant">
                  <th className="px-space-md py-3 font-semibold">
                    {t("table.order")}
                  </th>
                  {showIcon ? (
                    <th className="px-space-md py-3 font-semibold">
                      {t("table.icon")}
                    </th>
                  ) : null}
                  <th className="px-space-md py-3 font-semibold">
                    {t("table.code")}
                  </th>
                  <th className="px-space-md py-3 font-semibold">
                    {t("table.labelTh")}
                  </th>
                  <th className="hidden px-space-md py-3 font-semibold md:table-cell">
                    {t("table.labelEn")}
                  </th>
                  <th className="px-space-md py-3 font-semibold">
                    {t("table.status")}
                  </th>
                  <th className="px-space-md py-3 text-right font-semibold">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  <tr>
                    <td
                      className="px-space-md py-space-xl text-center font-body-sm text-body-sm text-on-surface-variant"
                      colSpan={showIcon ? 7 : 6}
                    >
                      {t("loading")}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      className="px-space-md py-space-xl text-center font-body-sm text-body-sm text-on-surface-variant"
                      colSpan={showIcon ? 7 : 6}
                    >
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-outline-variant/20 hover:bg-surface-container-low/60"
                    >
                      <td className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant">
                        {item.sortOrder}
                      </td>
                      {showIcon ? (
                        <td className="px-space-md py-space-sm">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-primary">
                            <MaterialIcon
                              className="text-[20px]"
                              name={item.icon ?? "category"}
                            />
                          </span>
                        </td>
                      ) : null}
                      <td className="px-space-md py-space-sm font-mono text-[13px] text-on-surface-variant">
                        {item.code}
                      </td>
                      <td className="px-space-md py-space-sm font-label-md text-label-md font-semibold text-on-surface">
                        {item.labelTh}
                      </td>
                      <td className="hidden px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant md:table-cell">
                        {item.labelEn}
                      </td>
                      <td className="px-space-md py-space-sm">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-space-sm py-1 font-label-sm text-label-sm font-semibold",
                            item.isActive
                              ? "bg-secondary-container/40 text-on-secondary-container"
                              : "bg-error-container/50 text-error",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              item.isActive ? "bg-secondary" : "bg-error",
                            )}
                          />
                          {item.isActive
                            ? t("filters.active")
                            : t("filters.inactive")}
                        </span>
                      </td>
                      <td className="px-space-md py-space-sm">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction
                            disabled={busy}
                            label={t("actions.edit")}
                            name="edit"
                            onClick={() => openEdit(item)}
                          />
                          <IconAction
                            danger={item.isActive}
                            disabled={busy}
                            label={
                              item.isActive
                                ? t("actions.deactivate")
                                : t("actions.activate")
                            }
                            name={
                              item.isActive ? "visibility_off" : "visibility"
                            }
                            onClick={() => void toggleActive(item)}
                          />
                          <IconAction
                            danger
                            disabled={busy}
                            label={t("actions.delete")}
                            name="delete"
                            onClick={() => void removeItem(item)}
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
      </div>

      <ReferenceEditorDialog
        key={`${catalogCode}-${editorMode}-${editingItem?.id ?? "new"}-${editorOpen}`}
        busy={busy}
        catalogCode={catalogCode}
        catalogLabel={catalogName(catalogCode)}
        item={editingItem}
        mode={editorMode}
        nextOrder={
          items.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1
        }
        open={editorOpen}
        showIcon={showIcon}
        onClose={() => {
          if (!busy) setEditorOpen(false);
        }}
        onSave={(payload) => void saveItem(payload)}
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
        "flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40",
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

function ReferenceEditorDialog({
  open,
  mode,
  catalogCode,
  catalogLabel,
  item,
  nextOrder,
  showIcon,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: EditorMode;
  catalogCode: string;
  catalogLabel: string;
  item: ReferenceItemDto | null;
  nextOrder: number;
  showIcon: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (payload: EditorForm & { id?: string }) => void;
}) {
  const t = useTranslations("dataReferences");
  const titleId = useId();
  const defaults: EditorForm = item
    ? {
        code: item.code,
        labelTh: item.labelTh,
        labelEn: item.labelEn,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
        icon: item.icon ?? undefined,
      }
    : emptyForm(catalogCode, nextOrder);
  const [form, setForm] = useState(defaults);

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
    onSave({
      code: form.code.trim(),
      labelTh: form.labelTh.trim(),
      labelEn: form.labelEn.trim(),
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || nextOrder,
      icon: showIcon ? form.icon?.trim() || "category" : undefined,
      id: mode === "edit" ? item?.id : undefined,
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
          className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest p-space-xl shadow-2xl"
          role="dialog"
        >
          <button
            aria-label={t("dialog.close")}
            className="absolute right-space-md top-space-md flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
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
              {mode === "create"
                ? t("dialog.createTitle")
                : t("dialog.editTitle")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {catalogLabel}
            </p>
          </div>

          <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
            <Field
              id="ref-code"
              hint={t("fields.codeHint")}
              label={t("fields.code")}
              required
              value={form.code}
              onChange={(v) => update("code", v)}
            />
            <Field
              id="ref-th"
              label={t("fields.labelTh")}
              required
              value={form.labelTh}
              onChange={(v) => update("labelTh", v)}
            />
            <Field
              id="ref-en"
              label={t("fields.labelEn")}
              required
              value={form.labelEn}
              onChange={(v) => update("labelEn", v)}
            />
            <Field
              id="ref-order"
              label={t("fields.sortOrder")}
              type="number"
              value={String(form.sortOrder)}
              onChange={(v) => update("sortOrder", Number(v) || 0)}
            />
            {showIcon ? (
              <div className="flex flex-col gap-space-2xs">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="ref-icon"
                >
                  {t.rich("fields.iconLabel", {
                    link: (chunks) => (
                      <a
                        className="font-semibold text-primary underline-offset-2 hover:underline"
                        href="https://fonts.google.com/icons"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </label>
                <input
                  className="h-12 w-full rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface outline-none ring-2 ring-transparent focus:bg-surface-container-lowest focus:ring-primary"
                  id="ref-icon"
                  value={form.icon ?? ""}
                  onChange={(e) => update("icon", e.target.value)}
                />
                <span className="text-[12px] font-body-sm text-on-surface-variant">
                  {t("fields.iconHint")}
                </span>
              </div>
            ) : null}
            {mode === "edit" ? (
              <label className="flex items-center gap-space-sm rounded-lg bg-surface-container-low p-space-md">
                <input
                  checked={form.isActive}
                  className="h-4 w-4 accent-secondary"
                  type="checkbox"
                  onChange={(e) => update("isActive", e.target.checked)}
                />
                <span className="font-label-md text-label-md text-on-surface">
                  {t("fields.active")}
                </span>
              </label>
            ) : null}

            <div className="mt-space-xs flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
              <button
                className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
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

function Field({
  id,
  label,
  value,
  onChange,
  required,
  hint,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  type?: "text" | "number";
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
      {hint ? (
        <span className="text-[12px] font-body-sm text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
