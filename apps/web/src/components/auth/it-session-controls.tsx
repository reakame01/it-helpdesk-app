"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ItLoginDialog } from "@/components/auth/it-login-dialog";
import { useItAuth } from "@/components/auth/it-auth-context";
import { MaterialIcon } from "@/components/shared/material-icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function ItSessionControls() {
  const t = useTranslations("header");
  const { user, isAuthenticated, logout } = useItAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  function openMenu() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setMenuOpen(true);
  }

  function scheduleCloseMenu() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setMenuOpen(false), 150);
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <button
          className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-3 font-label-md text-label-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
          type="button"
          onClick={() => setLoginOpen(true)}
        >
          <MaterialIcon className="text-[20px]" name="login" />
          <span>{t("itSignIn")}</span>
        </button>
        <ItLoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative pl-space-xs"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleCloseMenu}
    >
      <button
        aria-controls={menuId}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={t("accountMenu")}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-transparent transition-shadow",
          menuOpen && "ring-primary/30",
        )}
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-8 w-8 rounded-full object-cover"
          src={user.avatarUrl}
        />
      </button>

      {menuOpen ? (
        <div
          className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-1 shadow-lg"
          id={menuId}
          role="menu"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleCloseMenu}
        >
          <Link
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container"
            href="/profile"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            <MaterialIcon className="text-[18px]" name="manage_accounts" />
            {t("editProfile")}
          </Link>
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-label-md text-label-md text-error transition-colors hover:bg-surface-container"
            role="menuitem"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
          >
            <MaterialIcon className="text-[18px]" name="logout" />
            {t("logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
