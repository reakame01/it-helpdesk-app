"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ReferenceItemDto } from "@helpdesk/types";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  fetchReferenceItems,
  getApiErrorMessage,
  reportTicket,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type SuccessPayload = {
  ticketId: string;
  requesterLabel: string;
  categoryLabel: string;
  extension: string;
};

type SubmitTicketFormProps = {
  onSuccess: (payload: SuccessPayload) => void;
};

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 10;

type AttachmentItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function itemLabel(item: ReferenceItemDto, locale: string): string {
  return locale.startsWith("th") ? item.labelTh : item.labelEn;
}

function createAttachmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function SubmitTicketForm({ onSuccess }: SubmitTicketFormProps) {
  const t = useTranslations("form");
  const tSteps = useTranslations("portal.steps");
  const locale = useLocale();

  const [departments, setDepartments] = useState<ReferenceItemDto[]>([]);
  const [categories, setCategories] = useState<ReferenceItemDto[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [requesterName, setRequesterName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const [deptRows, categoryRows] = await Promise.all([
        fetchReferenceItems("departments", { activeOnly: true }),
        fetchReferenceItems("categories", { activeOnly: true }),
      ]);
      setDepartments(deptRows);
      setCategories(categoryRows);
      setDepartment((prev) =>
        prev && deptRows.some((d) => d.code === prev)
          ? prev
          : (deptRows[0]?.code ?? ""),
      );
      setCategory((prev) =>
        prev && categoryRows.some((c) => c.code === prev)
          ? prev
          : (categoryRows[0]?.code ?? ""),
      );
    } catch (error) {
      setOptionsError(getApiErrorMessage(error));
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    return () => {
      for (const item of attachmentsRef.current) {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);
  const stepState = useMemo(() => {
    const step1Done = Boolean(requesterName && email && department && extPhone);
    const step2Done = Boolean(category);
    const step3Done = Boolean(title && detail);
    return { step1Done, step2Done, step3Done };
  }, [requesterName, email, department, extPhone, category, title, detail]);

  function addAttachmentFiles(incoming: File[]) {
    if (incoming.length === 0) return;

    setAttachments((prev) => {
      const remaining = MAX_ATTACHMENT_COUNT - prev.length;
      if (remaining <= 0) {
        setSubmitError(t("attachmentTooMany", { max: MAX_ATTACHMENT_COUNT }));
        return prev;
      }

      const next = [...prev];
      let rejectedType = false;
      let rejectedSize = false;
      let rejectedCount = false;

      for (const file of incoming) {
        if (next.length >= MAX_ATTACHMENT_COUNT) {
          rejectedCount = true;
          break;
        }
        if (!["image/jpeg", "image/png"].includes(file.type)) {
          rejectedType = true;
          continue;
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          rejectedSize = true;
          continue;
        }
        next.push({
          id: createAttachmentId(),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }

      if (rejectedCount) {
        setSubmitError(t("attachmentTooMany", { max: MAX_ATTACHMENT_COUNT }));
      } else if (rejectedType) {
        setSubmitError(t("attachmentInvalidType"));
      } else if (rejectedSize) {
        setSubmitError(t("attachmentTooLarge"));
      } else {
        setSubmitError(null);
      }

      return next;
    });
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        event.preventDefault();
        addAttachmentFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(fileList: FileList | null) {
    if (!fileList?.length) return;
    addAttachmentFiles(Array.from(fileList));
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
    setSubmitError(null);
  }

  function clearAttachments() {
    setAttachments((prev) => {
      for (const item of prev) {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
      return [];
    });
  }

  function resetFormFields() {
    setRequesterName("");
    setEmail("");
    setDepartment(departments[0]?.code ?? "");
    setExtPhone("");
    setCategory(categories[0]?.code ?? "");
    setTitle("");
    setDetail("");
    setPriority("normal");
    clearAttachments();
    setSubmitError(null);
  }

  function resetForm() {
    if (!confirm(t("resetConfirm"))) return;
    resetFormFields();
  }

  function departmentLabel(code: string): string {
    const item = departments.find((d) => d.code === code);
    return item ? itemLabel(item, locale) : code;
  }

  function categoryLabel(code: string): string {
    const item = categories.find((c) => c.code === code);
    return item ? itemLabel(item, locale) : code;
  }

  function categoryDescription(code: string): string {
    const known = [
      "software",
      "hardware",
      "network",
      "access",
      "feature_request",
    ] as const;
    if ((known as readonly string[]).includes(code)) {
      return t(`categories.${code}.description`);
    }
    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || optionsLoading || optionsError) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const ticket = await reportTicket({
        requesterName: requesterName.trim(),
        requesterEmail: email.trim(),
        departmentCode: department,
        extension: extPhone.trim(),
        categoryCode: category,
        title: title.trim(),
        description: detail.trim(),
        priority,
        attachments: attachments.map((item) => item.file),
      });
      onSuccess({
        ticketId: ticket.ticketNo,
        requesterLabel: `${ticket.requesterName} (${departmentLabel(ticket.departmentCode)})`,
        categoryLabel: categoryLabel(ticket.categoryCode),
        extension: ticket.extension,
      });
      resetFormFields();
    } catch (error) {
      setSubmitError(
        t("submitFailed", { message: getApiErrorMessage(error) }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (optionsLoading) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-space-xl font-body-md text-body-md text-on-surface-variant shadow-sm">
        {t("optionsLoading")}
      </div>
    );
  }

  if (optionsError) {
    return (
      <div className="flex flex-col items-start gap-space-md rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <p className="font-body-md text-body-md text-error">
          {t("optionsError")} ({optionsError})
        </p>
        <button
          className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-space-md font-label-md text-label-md font-bold text-on-primary"
          type="button"
          onClick={() => void loadOptions()}
        >
          {t("retryOptions")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex items-center justify-between gap-space-xs rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <StepPill
          active={stepState.step1Done}
          number={1}
          subtitle={tSteps("step1Subtitle")}
          title={tSteps("step1Title")}
        />
        <div className="hidden h-0.5 w-8 shrink-0 bg-surface-container-highest sm:block" />
        <StepPill
          active={stepState.step2Done}
          number={2}
          subtitle={tSteps("step2Subtitle")}
          title={tSteps("step2Title")}
        />
        <div className="hidden h-0.5 w-8 shrink-0 bg-surface-container-highest sm:block" />
        <StepPill
          active={stepState.step3Done}
          muted={!stepState.step3Done}
          number={3}
          subtitle={tSteps("step3Subtitle")}
          title={tSteps("step3Title")}
        />
      </div>

      <form className="flex flex-col gap-space-lg" onSubmit={handleSubmit}>
        <section className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
          <div className="mb-space-lg flex items-center gap-space-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <MaterialIcon className="text-[24px]" name="badge" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md tracking-tight text-primary">
                {t("step1Heading")}
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t("step1Hint")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <Field hint={t("nameHint")} icon="person" label={t("name")} required>
              <input
                className="h-target-min w-full rounded-lg bg-surface-container-lowest pl-12 pr-space-md font-body-md text-body-md text-on-surface shadow-sm outline-none ring-2 ring-transparent transition-colors focus:bg-surface-container-low focus:ring-secondary"
                required
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
              />
            </Field>

            <Field
              hint={t("emailHint")}
              icon="mail"
              label={t("email")}
              required
            >
              <input
                autoComplete="email"
                className="h-target-min w-full rounded-lg bg-surface-container-lowest pl-12 pr-space-md font-body-md text-body-md text-on-surface shadow-sm outline-none ring-2 ring-transparent transition-colors focus:bg-surface-container-low focus:ring-secondary"
                placeholder={t("emailPlaceholder")}
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field
              hint={t("departmentHint")}
              icon="corporate_fare"
              label={t("department")}
              required
            >
              <select
                className="h-target-min w-full cursor-pointer appearance-none rounded-lg bg-surface-container-lowest pl-12 pr-space-lg font-body-md text-body-md text-on-surface shadow-sm outline-none ring-2 ring-transparent transition-colors focus:bg-surface-container-low focus:ring-secondary"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option disabled value="">
                  {t("departmentPlaceholder")}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.code}>
                    {itemLabel(dept, locale)}
                  </option>
                ))}
              </select>
              <MaterialIcon
                className="pointer-events-none absolute right-space-md text-outline"
                name="expand_more"
              />
            </Field>

            <Field
              hint={t("extensionHint")}
              icon="phone_in_talk"
              label={t("extension")}
              required
            >
              <input
                className="h-target-min w-full rounded-lg bg-surface-container-lowest pl-12 pr-space-md font-body-md text-body-md font-semibold text-on-surface shadow-sm outline-none ring-2 ring-transparent transition-colors focus:bg-surface-container-low focus:ring-secondary"
                required
                type="text"
                value={extPhone}
                onChange={(e) => setExtPhone(e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
          <div className="mb-space-xs flex items-center gap-space-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <MaterialIcon className="text-[24px]" name="category" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md tracking-tight text-primary">
                {t("step2Heading")}
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t("step2Hint")}
              </span>
            </div>
          </div>

          {categories.length === 0 ? (
            <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant">
              {t("step2Empty")}
            </p>
          ) : (
            <div
              className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2"
              role="radiogroup"
            >
              {categories.map((item) => {
                const fullWidth = item.code === "feature_request";
                const badge =
                  item.code === "feature_request"
                    ? t("categories.feature_request.badge")
                    : null;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "group relative flex min-h-target-min cursor-pointer items-start gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm transition-all hover:bg-surface-container has-[:checked]:bg-primary-container has-[:checked]:text-on-primary",
                      fullWidth && "ring-1 ring-secondary/20 md:col-span-2",
                    )}
                  >
                    <input
                      checked={category === item.code}
                      className="mt-1 h-6 w-6 shrink-0 cursor-pointer accent-primary"
                      name="ticketCategory"
                      type="radio"
                      value={item.code}
                      onChange={() => setCategory(item.code)}
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <MaterialIcon
                            className="text-[24px] text-secondary group-has-[:checked]:text-secondary-fixed"
                            name={item.icon || "category"}
                          />
                          <span className="font-headline-sm text-headline-sm text-on-surface group-has-[:checked]:text-on-primary">
                            {categoryLabel(item.code)}
                          </span>
                        </div>
                        {badge ? (
                          <span className="flex items-center gap-1 rounded-full bg-secondary-container px-space-xs py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-container group-has-[:checked]:bg-secondary-fixed group-has-[:checked]:text-on-secondary-fixed">
                            <MaterialIcon className="text-[16px]" name="code" />
                            {badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-space-2xs font-body-sm text-body-sm leading-relaxed text-on-surface-variant group-has-[:checked]:text-on-primary-container">
                        {categoryDescription(item.code)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant">
              <MaterialIcon className="text-[24px]" name="description" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md tracking-tight text-primary">
                {t("step3Heading")}
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t("step3Hint")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-lg text-label-lg font-bold text-on-surface">
              {t("ticketTitle")} <span className="text-error">*</span>
            </label>
            <input
              className="h-target-min w-full rounded-lg bg-surface-container-low px-space-md font-body-lg text-body-lg text-on-surface shadow-sm outline-none ring-2 ring-transparent transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:ring-secondary"
              placeholder={t("ticketTitlePlaceholder")}
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t("ticketTitleHint")}
            </span>
          </div>

          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-lg text-label-lg font-bold text-on-surface">
              {t("ticketDetail")} <span className="text-error">*</span>
            </label>
            <textarea
              className="w-full rounded-lg bg-surface-container-low p-space-md font-body-md text-body-md leading-relaxed text-on-surface shadow-sm outline-none ring-2 ring-transparent transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:ring-secondary"
              placeholder={t("ticketDetailPlaceholder")}
              required
              rows={4}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t("ticketDetailHint")}
            </span>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="flex items-center justify-between font-label-lg text-label-lg font-bold text-on-surface">
              <span>{t("attachmentLabel")}</span>
              <span className="font-label-sm text-label-sm font-semibold text-secondary">
                {t("attachmentRecommended")}
              </span>
            </label>

            <div className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container-low p-space-lg text-center shadow-inner transition-all hover:bg-surface-container">
              <input
                accept="image/png,image/jpeg"
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                multiple
                type="file"
                onChange={(e) => {
                  handleFileChange(e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="mb-space-sm flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-sm transition-transform group-hover:scale-105">
                <MaterialIcon
                  className="text-[32px]"
                  name="add_photo_alternate"
                />
              </div>
              <h3 className="mb-1 font-headline-sm text-headline-sm text-primary">
                {t("dropzoneTitle")}
              </h3>
              <p className="mb-space-sm max-w-md font-body-md text-body-md text-on-surface-variant">
                {t("dropzoneHint", { max: MAX_ATTACHMENT_COUNT })}
              </p>
              <div className="inline-flex items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-md py-2 font-label-md text-label-md text-secondary shadow-sm">
                <MaterialIcon className="text-[20px]" name="upload_file" />
                <span>{t("chooseFile")}</span>
              </div>
            </div>

            {attachments.length > 0 ? (
              <div className="mt-space-md flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    {t("attachmentCount", {
                      count: attachments.length,
                      max: MAX_ATTACHMENT_COUNT,
                    })}
                  </span>
                  <button
                    className="font-label-sm text-label-sm font-semibold text-error hover:underline"
                    type="button"
                    onClick={clearAttachments}
                  >
                    {t("removeAllImages")}
                  </button>
                </div>
                {attachments.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container p-space-md shadow-sm sm:flex-row"
                  >
                    <div className="flex w-full items-center gap-space-md sm:w-auto">
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-dim shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                          src={item.previewUrl}
                        />
                        <div className="absolute inset-0 bg-primary/10" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-space-2xs">
                          <span className="truncate font-label-md text-label-md font-bold text-primary">
                            {item.file.name}
                          </span>
                          <span className="rounded bg-secondary px-space-xs py-0.5 font-label-sm text-[11px] text-label-sm text-on-secondary">
                            {t("readyToSend")}
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {t("attachmentMeta")}
                        </span>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-end gap-space-xs sm:w-auto">
                      <button
                        className="flex h-10 items-center gap-space-2xs rounded-lg bg-surface-container-lowest px-space-sm font-label-sm text-label-sm text-primary shadow-sm transition-colors hover:bg-surface-container-high"
                        type="button"
                        onClick={() => window.open(item.previewUrl, "_blank")}
                      >
                        <MaterialIcon
                          className="text-[18px]"
                          name="visibility"
                        />
                        <span>{t("viewFull")}</span>
                      </button>
                      <button
                        className="flex h-10 items-center gap-space-2xs rounded-lg bg-error-container px-space-sm font-label-sm text-label-sm text-on-error-container shadow-sm transition-colors hover:bg-error hover:text-on-error"
                        type="button"
                        onClick={() => removeAttachment(item.id)}
                      >
                        <MaterialIcon className="text-[18px]" name="delete" />
                        <span>{t("removeImage")}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-space-xs pt-space-xs">
            <label className="font-label-lg text-label-lg font-bold text-on-surface">
              {t("priorityLabel")}
            </label>
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <label className="flex min-h-target-min cursor-pointer items-center gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container has-[:checked]:bg-surface-container-highest">
                <input
                  checked={priority === "normal"}
                  className="h-6 w-6 shrink-0 cursor-pointer accent-primary"
                  name="ticketPriority"
                  type="radio"
                  value="normal"
                  onChange={() => setPriority("normal")}
                />
                <div className="flex flex-col">
                  <span className="flex items-center gap-space-2xs font-label-md text-label-md font-bold text-on-surface">
                    <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                    {t("priorityNormal")}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {t("priorityNormalHint")}
                  </span>
                </div>
              </label>
              <label className="flex min-h-target-min cursor-pointer items-center gap-space-md rounded-xl bg-error-container/40 p-space-md shadow-sm transition-all hover:bg-error-container/60 has-[:checked]:bg-error-container">
                <input
                  checked={priority === "urgent"}
                  className="h-6 w-6 shrink-0 cursor-pointer accent-error"
                  name="ticketPriority"
                  type="radio"
                  value="urgent"
                  onChange={() => setPriority("urgent")}
                />
                <div className="flex flex-col">
                  <span className="flex items-center gap-space-2xs font-label-md text-label-md font-bold text-error">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
                    {t("priorityUrgent")}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-error-container">
                    {t("priorityUrgentHint")}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {submitError ? (
            <p className="font-body-sm text-body-sm text-error">{submitError}</p>
          ) : null}

          <div className="flex flex-col items-center gap-space-md pt-space-md sm:flex-row">
            <button
              className="flex h-14 w-full flex-1 cursor-pointer items-center justify-center gap-space-sm rounded-xl bg-primary px-space-xl font-headline-sm text-headline-sm text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-[0.99] disabled:opacity-60 sm:w-auto"
              disabled={submitting || categories.length === 0}
              type="submit"
            >
              <MaterialIcon className="text-[28px]" name="send" />
              <span>{submitting ? t("submitting") : t("submit")}</span>
            </button>
            <button
              className="flex h-14 w-full items-center justify-center gap-space-2xs rounded-xl bg-surface-container px-space-lg font-label-md text-label-md text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container-high disabled:opacity-60 sm:w-auto"
              disabled={submitting}
              type="button"
              onClick={resetForm}
            >
              <MaterialIcon className="text-[20px]" name="restart_alt" />
              <span>{t("reset")}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-space-xs font-body-sm text-body-sm text-secondary sm:justify-start">
            <MaterialIcon className="text-[20px]" name="check_circle" />
            <span>{t("submitHint")}</span>
          </div>
        </section>
      </form>
    </div>
  );
}

function StepPill({
  number,
  title,
  subtitle,
  active,
  muted,
}: {
  number: number;
  title: string;
  subtitle: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-space-sm rounded-lg px-space-sm py-space-xs",
        muted && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label-md text-label-md font-bold",
          active
            ? "bg-secondary text-on-secondary"
            : "bg-surface-container-highest text-on-surface-variant",
        )}
      >
        {number}
      </span>
      <div className="min-w-0 flex-col hidden sm:flex">
        <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
          {title}
        </span>
        <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  icon,
  required,
  children,
}: {
  label: string;
  hint?: string;
  icon: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-space-2xs">
      <label className="font-label-md text-label-md font-bold text-on-surface">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <div className="relative flex items-center">
        <MaterialIcon
          className="pointer-events-none absolute left-space-md text-[20px] text-outline"
          name={icon}
        />
        {children}
      </div>
      {hint ? (
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
