"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ItLoginDialog } from "@/components/auth/it-login-dialog";
import { useItAuth } from "@/components/auth/it-auth-context";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  createEmptyReferenceItem,
  initialReferenceItems,
  referenceCatalogs,
  type ReferenceCatalogId,
  type ReferenceItem,
} from "@/lib/mock/references";
import { cn } from "@/lib/utils";

type ToastState = { title: string; body: string } | null;
type EditorMode = "create" | "edit";

export function DataReferencesWorkspace() {
  const t = useTranslations("dataReferences");
  const { isAuthenticated } = useItAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [catalogId, setCatalogId] =
    useState<ReferenceCatalogId>("departments");
  const [itemsByCatalog, setItemsByCatalog] = useState(initialReferenceItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const items = itemsByCatalog[catalogId];
  const showIcon = catalogId === "categories" || catalogId === "skills";

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
    setEditorOpen(true);
  }

  function openEdit(item: ReferenceItem) {
    setEditorMode("edit");
    setEditingItem(item);
    setEditorOpen(true);
  }

  function saveItem(payload: Omit<ReferenceItem, "id"> & { id?: string }) {
    setItemsByCatalog((prev) => {
      const list = prev[catalogId];
      if (editorMode === "create") {
        return {
          ...prev,
          [catalogId]: [
            ...list,
            { ...payload, id: `${catalogId}-${Date.now()}` },
          ],
        };
      }
      return {
        ...prev,
        [catalogId]: list.map((item) =>
          item.id === payload.id ? { ...item, ...payload, id: item.id } : item,
        ),
      };
    });
    setEditorOpen(false);
    setToast({
      title:
        editorMode === "create"
          ? t("toast.createdTitle")
          : t("toast.updatedTitle"),
      body:
        editorMode === "create"
          ? t("toast.createdBody")
          : t("toast.updatedBody"),
    });
  }

  function toggleActive(item: ReferenceItem) {
    setItemsByCatalog((prev) => ({
      ...prev,
      [catalogId]: prev[catalogId].map((row) =>
        row.id === item.id ? { ...row, isActive: !row.isActive } : row,
      ),
    }));
    setToast({
      title: item.isActive
        ? t("toast.deactivatedTitle")
        : t("toast.activatedTitle"),
      body: t("toast.statusBody", { label: item.labelTh }),
    });
  }

  function removeItem(item: ReferenceItem) {
    if (!window.confirm(t("confirmDelete", { label: item.labelTh }))) return;
    setItemsByCatalog((prev) => ({
      ...prev,
      [catalogId]: prev[catalogId].filter((row) => row.id !== item.id),
    }));
    setToast({
      title: t("toast.deletedTitle"),
      body: t("toast.deletedBody", { label: item.labelTh }),
    });
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

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <aside className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm lg:col-span-3">
          <p className="px-space-sm py-space-xs font-label-sm text-label-sm font-semibold text-on-surface-variant">
            {t("catalogsHeading")}
          </p>
          {referenceCatalogs.map((catalog) => {
            const count = itemsByCatalog[catalog.id].filter(
              (item) => item.isActive,
            ).length;
            const selected = catalog.id === catalogId;
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
                  setCatalogId(catalog.id);
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                <MaterialIcon className="text-[22px]" name={catalog.icon} />
                <span className="min-w-0 flex-1">
                  <span className="block font-label-md text-label-md font-semibold">
                    {t(`catalogs.${catalog.id}.name`)}
                  </span>
                  <span
                    className={cn(
                      "block font-body-sm text-body-sm",
                      selected ? "text-on-primary/80" : "text-on-surface-variant",
                    )}
                  >
                    {t("activeCount", { count })}
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
                {t(`catalogs.${catalogId}.name`)}
              </h2>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {t(`catalogs.${catalogId}.description`)}
              </p>
              <p className="mt-space-2xs font-label-sm text-label-sm text-outline">
                {t("summary", {
                  active: activeCount,
                  total: items.length,
                })}
              </p>
            </div>
            <button
              className="flex h-11 shrink-0 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary shadow-sm hover:bg-primary-container"
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
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
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
                {filtered.length === 0 ? (
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
                            label={t("actions.edit")}
                            name="edit"
                            onClick={() => openEdit(item)}
                          />
                          <IconAction
                            danger={item.isActive}
                            label={
                              item.isActive
                                ? t("actions.deactivate")
                                : t("actions.activate")
                            }
                            name={item.isActive ? "visibility_off" : "visibility"}
                            onClick={() => toggleActive(item)}
                          />
                          <IconAction
                            danger
                            label={t("actions.delete")}
                            name="delete"
                            onClick={() => removeItem(item)}
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
        key={`${catalogId}-${editorMode}-${editingItem?.id ?? "new"}-${editorOpen}`}
        catalogId={catalogId}
        mode={editorMode}
        nextOrder={items.length + 1}
        open={editorOpen}
        showIcon={showIcon}
        item={editingItem}
        onClose={() => setEditorOpen(false)}
        onSave={saveItem}
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
}: {
  name: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container",
        danger && "hover:bg-error-container/50 hover:text-error",
      )}
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
  catalogId,
  item,
  nextOrder,
  showIcon,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: EditorMode;
  catalogId: ReferenceCatalogId;
  item: ReferenceItem | null;
  nextOrder: number;
  showIcon: boolean;
  onClose: () => void;
  onSave: (payload: Omit<ReferenceItem, "id"> & { id?: string }) => void;
}) {
  const t = useTranslations("dataReferences");
  const titleId = useId();
  const defaults = item ?? createEmptyReferenceItem(catalogId, nextOrder);
  const [form, setForm] = useState(defaults);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          if (event.target === event.currentTarget) onClose();
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
            className="absolute right-space-md top-space-md flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
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
              {t(`catalogs.${catalogId}.name`)}
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
              <Field
                id="ref-icon"
                hint={t("fields.iconHint")}
                label={t("fields.icon")}
                value={form.icon ?? ""}
                onChange={(v) => update("icon", v)}
              />
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
                className="h-11 rounded-lg px-space-md font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
                type="button"
                onClick={onClose}
              >
                {t("dialog.cancel")}
              </button>
              <button
                className="flex h-11 items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary hover:bg-primary-container"
                type="submit"
              >
                <MaterialIcon className="text-[18px]" name="check_circle" />
                {mode === "create" ? t("dialog.createSubmit") : t("dialog.save")}
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
