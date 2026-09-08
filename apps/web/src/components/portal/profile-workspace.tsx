"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  PROFILE_SKILL_CATALOG,
  useItAuth,
  type DutyStatus,
  type ProfileSkill,
} from "@/components/auth/it-auth-context";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { ItLoginDialog } from "@/components/auth/it-login-dialog";
import { MaterialIcon } from "@/components/shared/material-icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-12 w-full rounded-lg bg-surface-container-lowest py-3 pl-11 pr-4 font-body-md text-body-md text-on-surface shadow-sm outline-none ring-2 ring-transparent transition-all focus:ring-primary";

const DEFAULT_FALLBACK_AVATAR =
  "https://www.kindpng.com/picc/m/24-248253_user-profile-default-image-png-clipart-png-download.png";

export function ProfileWorkspace() {
  const t = useTranslations("profile");
  const { user, isAuthenticated, updateProfile } = useItAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (!isAuthenticated || !user) {
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
          {t("signInToEdit")}
        </button>
        <ItLoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return <ProfileEditor key={user.id} />;
}

function ProfileEditor() {
  const t = useTranslations("profile");
  const { user, updateProfile } = useItAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayNameTh, setDisplayNameTh] = useState(user!.displayNameTh);
  const [displayNameEn, setDisplayNameEn] = useState(user!.displayNameEn);
  const [jobTitle, setJobTitle] = useState(user!.jobTitle);
  const [email, setEmail] = useState(user!.email);
  const [extension, setExtension] = useState(user!.extension);
  const [mobile, setMobile] = useState(user!.mobile);
  const [location, setLocation] = useState(user!.location);
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>(user!.dutyStatus);
  const [skills, setSkills] = useState<ProfileSkill[]>(user!.skills);
  const [avatarUrl, setAvatarUrl] = useState(user!.avatarUrl);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMode, setToastMode] = useState<"profile" | "password">("profile");
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timer = setTimeout(() => setToastOpen(false), 3500);
    return () => clearTimeout(timer);
  }, [toastOpen]);

  function resetForm() {
    setDisplayNameTh(user!.displayNameTh);
    setDisplayNameEn(user!.displayNameEn);
    setJobTitle(user!.jobTitle);
    setEmail(user!.email);
    setExtension(user!.extension);
    setMobile(user!.mobile);
    setLocation(user!.location);
    setDutyStatus(user!.dutyStatus);
    setSkills(user!.skills);
    setAvatarUrl(user!.avatarUrl);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile({
      displayNameTh,
      displayNameEn,
      jobTitle,
      email,
      extension,
      mobile,
      location,
      dutyStatus,
      skills,
      avatarUrl,
    });
    setToastMode("profile");
    setToastOpen(true);
  }

  function handleAvatarFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setAvatarUrl(URL.createObjectURL(file));
  }

  function removeSkill(id: string) {
    setSkills((prev) => prev.filter((skill) => skill.id !== id));
  }

  function addSkill(skill: ProfileSkill) {
    setSkills((prev) => {
      if (prev.some((item) => item.id === skill.id)) return prev;
      return [...prev, skill];
    });
    setSkillPickerOpen(false);
  }

  const availableSkills = PROFILE_SKILL_CATALOG.filter(
    (skill) => !skills.some((item) => item.id === skill.id),
  );

  const dutyOptions: Array<{
    value: DutyStatus;
    dotClass: string;
    activeClass: string;
  }> = [
    {
      value: "available",
      dotClass: "bg-secondary ring-4 ring-secondary/20 animate-pulse",
      activeClass: "bg-secondary-container/30",
    },
    {
      value: "break",
      dotClass: "bg-tertiary-fixed-dim",
      activeClass: "bg-surface-container",
    },
    {
      value: "onsite",
      dotClass: "bg-error",
      activeClass: "bg-surface-container",
    },
  ];

  return (
    <>
      <div className="mb-space-xl flex flex-col justify-between gap-space-md pb-space-lg md:flex-row md:items-end">
        <div className="flex flex-col gap-space-2xs">
          <nav
            aria-label={t("breadcrumbAria")}
            className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant"
          >
            <Link className="transition-colors hover:text-primary" href="/">
              {t("breadcrumbRoot")}
            </Link>
            <MaterialIcon className="text-[16px] text-outline" name="chevron_right" />
            <span>{t("breadcrumbAccount")}</span>
            <MaterialIcon className="text-[16px] text-outline" name="chevron_right" />
            <span className="font-semibold text-primary">{t("breadcrumbCurrent")}</span>
          </nav>
          <h1 className="mt-space-2xs font-headline-lg text-headline-lg tracking-tight text-primary">
            {t("title")}
          </h1>
          <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-space-xs self-start rounded-xl bg-surface-container px-space-md py-space-xs shadow-sm md:self-auto">
          <MaterialIcon className="text-[20px] text-secondary" name="history" />
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {t("lastSaved", { when: t(`lastSavedTimes.${user!.lastSavedLabelKey}`) })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-4">
          <div className="flex flex-col items-center rounded-xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
            <div className="group relative my-space-xs">
              <div className="h-28 w-28 overflow-hidden rounded-full bg-surface-container-high shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={displayNameTh}
                  className="h-full w-full object-cover"
                  src={avatarUrl}
                />
              </div>
              <button
                aria-label={t("changePhoto")}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-md transition-transform duration-150 hover:bg-primary-container active:scale-95"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <MaterialIcon className="text-[18px]" name="photo_camera" />
              </button>
              <input
                accept="image/jpeg,image/png"
                className="hidden"
                ref={fileInputRef}
                type="file"
                onChange={(e) => handleAvatarFile(e.target.files)}
              />
            </div>

            <div className="mt-space-sm flex flex-col items-center">
              <div className="flex items-center gap-space-2xs">
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {displayNameTh.replace(/^คุณ/, "") || user!.displayName}
                </h2>
                <MaterialIcon
                  className="text-[20px] text-secondary"
                  name="verified"
                />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                System & Network Specialist
              </p>
            </div>

            <div className="mt-space-md flex flex-wrap items-center justify-center gap-space-xs">
              <span className="flex items-center gap-1 rounded-lg bg-surface-container px-space-sm py-1 font-label-sm text-label-sm font-semibold text-primary">
                <MaterialIcon className="text-[16px] text-primary" name="shield_person" />
                {t(`levels.${user!.levelLabelKey}`)}
              </span>
              <span className="rounded-lg bg-surface-container-low px-space-sm py-1 font-mono font-label-sm text-label-sm text-on-surface-variant">
                {user!.employeeId}
              </span>
            </div>

            <div className="mt-space-lg flex w-full flex-col items-center gap-space-2xs rounded-lg bg-surface-container-low/50 p-space-sm pt-space-md">
              <div className="flex w-full items-center gap-space-xs">
                <button
                  className="flex h-10 flex-1 items-center justify-center gap-space-2xs rounded-lg bg-surface-container px-space-sm font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-variant"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <MaterialIcon className="text-[18px]" name="upload" />
                  {t("uploadPhoto")}
                </button>
                <button
                  aria-label={t("removePhoto")}
                  className="flex h-10 items-center justify-center rounded-lg px-space-sm text-error transition-colors hover:bg-error-container/40"
                  type="button"
                  onClick={() => setAvatarUrl(DEFAULT_FALLBACK_AVATAR)}
                >
                  <MaterialIcon className="text-[20px]" name="delete" />
                </button>
              </div>
              <span className="text-[12px] font-body-sm text-on-surface-variant">
                {t("photoHint")}
              </span>
            </div>

            <div className="mt-space-lg w-full text-left">
              <label className="mb-space-xs block font-label-md text-label-md text-on-surface">
                {t("dutyStatus")}
              </label>
              <div className="flex flex-col gap-space-2xs">
                {dutyOptions.map((option) => {
                  const selected = dutyStatus === option.value;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg p-space-sm transition-colors hover:bg-surface-container",
                        selected && option.activeClass,
                      )}
                    >
                      <div className="flex items-center gap-space-sm">
                        <span
                          className={cn("h-3 w-3 rounded-full", option.dotClass)}
                        />
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-semibold leading-tight text-on-surface">
                            {t(`duty.${option.value}.title`)}
                          </span>
                          <span className="text-[12px] font-body-sm leading-tight text-on-surface-variant">
                            {t(`duty.${option.value}.hint`)}
                          </span>
                        </div>
                      </div>
                      <input
                        checked={selected}
                        className="h-4 w-4 accent-secondary"
                        name="duty-status"
                        type="radio"
                        value={option.value}
                        onChange={() => setDutyStatus(option.value)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md font-semibold text-primary">
                {t("metricsTitle")}
              </span>
              <span className="font-label-sm text-label-sm font-semibold text-secondary">
                {t("metricsYear", { year: user!.metrics.yearLabel })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-space-xs py-space-xs text-center">
              <MetricCell
                label={t("metrics.closed")}
                value={String(user!.metrics.closedCases)}
              />
              <MetricCell
                label={t("metrics.rating")}
                value={user!.metrics.rating}
                valueClassName="text-secondary"
              />
              <MetricCell
                label={t("metrics.avgTime")}
                value={user!.metrics.avgTime}
              />
            </div>
            <div className="flex flex-col gap-space-2xs pt-space-xs">
              <div className="flex justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant">{t("slaLabel")}</span>
                <span className="font-bold text-secondary">
                  {user!.metrics.slaPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-2.5 rounded-full bg-secondary"
                  style={{ width: `${user!.metrics.slaPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <form
          className="flex flex-col gap-space-lg lg:col-span-8"
          onSubmit={handleSave}
        >
          <SectionCard
            icon="badge"
            subtitle={t("identitySubtitle")}
            title={t("identityTitle")}
          >
            <div className="grid grid-cols-1 gap-space-md pt-space-xs md:grid-cols-2">
              <IconField
                hint={t("nameThHint")}
                icon="person"
                id="profile-name-th"
                label={t("nameTh")}
                required
                value={displayNameTh}
                onChange={setDisplayNameTh}
              />
              <IconField
                hint={t("nameEnHint")}
                icon="translate"
                id="profile-name-en"
                label={t("nameEn")}
                required
                value={displayNameEn}
                onChange={setDisplayNameEn}
              />
              <div className="flex flex-col gap-space-2xs md:col-span-2">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="profile-job"
                >
                  {t("jobTitle")}
                </label>
                <div className="relative flex items-center">
                  <MaterialIcon
                    className="absolute left-3.5 text-[20px] text-outline"
                    name="work"
                  />
                  <input
                    className={fieldClassName}
                    id="profile-job"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-space-2xs rounded-lg bg-surface-container-low/70 p-space-md md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <MaterialIcon
                      className="text-[20px] text-primary"
                      name="admin_panel_settings"
                    />
                    <span className="font-label-md text-label-md font-semibold text-primary">
                      {t("systemRole")}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 rounded-lg bg-surface-container-highest px-space-sm py-1 font-label-sm text-label-sm text-primary">
                    <MaterialIcon className="text-[16px]" name="lock" />
                    {t(`roles.${user!.role}`)}
                  </span>
                </div>
                <p className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                  {t("systemRoleHint")}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon="contact_phone"
            subtitle={t("contactSubtitle")}
            title={t("contactTitle")}
          >
            <div className="grid grid-cols-1 gap-space-md pt-space-xs md:grid-cols-2">
              <IconField
                icon="mail"
                id="profile-email"
                label={t("email")}
                type="email"
                value={email}
                onChange={setEmail}
              />
              <IconField
                icon="phone_in_talk"
                iconClassName="text-secondary"
                id="profile-extension"
                label={t("extension")}
                value={extension}
                onChange={setExtension}
              />
              <IconField
                icon="smartphone"
                id="profile-mobile"
                label={t("mobile")}
                type="tel"
                value={mobile}
                onChange={setMobile}
              />
              <IconField
                icon="meeting_room"
                id="profile-location"
                label={t("location")}
                value={location}
                onChange={setLocation}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon="psychology"
            subtitle={t("skillsSubtitle")}
            title={t("skillsTitle")}
          >
            <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-space-md py-2 font-label-md text-label-md text-on-surface shadow-sm"
                >
                  <MaterialIcon
                    className="text-[18px] text-secondary"
                    name={skill.icon}
                  />
                  <span>{t(`skillLabels.${skill.labelKey}`)}</span>
                  <button
                    aria-label={t("removeSkill", {
                      skill: t(`skillLabels.${skill.labelKey}`),
                    })}
                    className="ml-1 text-outline hover:text-error"
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                  >
                    <MaterialIcon className="text-[18px]" name="close" />
                  </button>
                </div>
              ))}
              <div className="relative">
                <button
                  className="flex h-10 items-center gap-1 rounded-lg bg-surface-container-low px-space-md font-label-md text-label-md text-secondary transition-colors hover:bg-surface-container"
                  type="button"
                  onClick={() => setSkillPickerOpen((v) => !v)}
                >
                  <MaterialIcon className="text-[20px]" name="add" />
                  {t("addSkill")}
                </button>
                {skillPickerOpen && availableSkills.length > 0 ? (
                  <div className="absolute left-0 z-10 mt-2 min-w-[14rem] overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-1 shadow-lg">
                    {availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-label-md text-label-md text-on-surface hover:bg-surface-container"
                        type="button"
                        onClick={() => addSkill(skill)}
                      >
                        <MaterialIcon
                          className="text-[18px] text-secondary"
                          name={skill.icon}
                        />
                        {t(`skillLabels.${skill.labelKey}`)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon="lock_reset"
            subtitle={t("securitySubtitle")}
            title={t("securityTitle")}
            trailing={
              <button
                className="flex h-11 shrink-0 items-center gap-space-xs rounded-lg bg-surface-container px-space-md font-label-md text-label-md text-primary transition-colors hover:bg-surface-variant"
                type="button"
                onClick={() => setChangePasswordOpen(true)}
              >
                <MaterialIcon className="text-[18px]" name="vpn_key" />
                {t("changePassword")}
              </button>
            }
          />

          <ChangePasswordDialog
            open={changePasswordOpen}
            onClose={() => setChangePasswordOpen(false)}
            onSuccess={() => {
              setToastMode("password");
              setToastOpen(true);
            }}
          />

          <div className="mb-space-3xl flex flex-col items-center justify-end gap-space-md pt-space-md sm:flex-row">
            <button
              className="h-target-min w-full rounded-lg px-space-xl text-center font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container sm:w-auto"
              type="button"
              onClick={resetForm}
            >
              {t("cancel")}
            </button>
            <button
              className="flex h-target-min w-full items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-xl font-label-md text-label-md text-on-primary shadow-md transition-all duration-150 hover:bg-primary active:scale-[0.98] sm:w-auto"
              type="submit"
            >
              <MaterialIcon className="text-[20px]" name="check_circle" />
              {t("save")}
            </button>
          </div>
        </form>
      </div>

      <div
        className={cn(
          "pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-space-sm rounded-xl bg-inverse-surface px-space-lg py-space-md text-inverse-on-surface shadow-xl transition-all duration-300",
          toastOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0",
        )}
      >
        <MaterialIcon
          className="text-[24px] text-secondary-fixed"
          name="check_circle"
        />
        <div className="flex flex-col">
          <span className="font-label-md text-label-md font-semibold">
            {toastMode === "password" ? t("passwordToastTitle") : t("toastTitle")}
          </span>
          <span className="font-body-sm text-body-sm text-inverse-on-surface/80">
            {toastMode === "password" ? t("passwordToastBody") : t("toastBody")}
          </span>
        </div>
      </div>
    </>
  );
}

function MetricCell({
  value,
  label,
  valueClassName,
}: {
  value: string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-surface-container-low p-space-xs">
      <span
        className={cn(
          "font-headline-sm text-headline-sm font-bold text-primary",
          valueClassName,
        )}
      >
        {value}
      </span>
      <span className="mt-0.5 text-[12px] font-body-sm text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  trailing,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
      <div className="flex flex-col gap-space-sm pb-space-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
            <MaterialIcon className="text-[24px]" name={icon} />
          </div>
          <div className="flex flex-col">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">
              {title}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {subtitle}
            </p>
          </div>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function IconField({
  id,
  label,
  icon,
  value,
  onChange,
  hint,
  required,
  type = "text",
  iconClassName,
}: {
  id: string;
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  type?: "text" | "email" | "tel";
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-space-2xs">
      <label className="font-label-md text-label-md text-on-surface" htmlFor={id}>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <div className="relative flex items-center">
        <MaterialIcon
          className={cn("absolute left-3.5 text-[20px] text-outline", iconClassName)}
          name={icon}
        />
        <input
          className={fieldClassName}
          id={id}
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {hint ? (
        <span className="text-[12px] font-body-sm text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
