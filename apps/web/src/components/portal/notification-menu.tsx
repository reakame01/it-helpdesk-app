"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MaterialIcon } from "@/components/shared/material-icon";
import { Link } from "@/i18n/navigation";
import {
  mockNotifications,
  notificationTypeIcon,
  type MockNotification,
} from "@/lib/mock/notifications";
import { cn } from "@/lib/utils";

export function NotificationMenu() {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MockNotification[]>(mockNotifications);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const unreadCount = items.filter((item) => item.unread).length;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function markAllRead() {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  }

  function markRead(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unread: false } : item,
      ),
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={tCommon("notifications")}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface",
          open && "bg-surface-container text-on-surface",
        )}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <MaterialIcon className="text-[22px]" name="notifications" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 font-label-md text-[10px] font-bold text-on-error">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg"
          id={menuId}
          role="menu"
        >
          <div className="flex items-start justify-between gap-space-sm border-b border-outline-variant/30 px-space-md py-space-sm">
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                {t("title")}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {unreadCount > 0
                  ? t("unreadCount", { count: unreadCount })
                  : t("allCaughtUp")}
              </span>
            </div>
            {unreadCount > 0 ? (
              <button
                className="shrink-0 font-label-sm text-label-sm font-semibold text-primary hover:underline"
                type="button"
                onClick={markAllRead}
              >
                {t("markAllRead")}
              </button>
            ) : null}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-space-md py-space-xl text-center">
                <MaterialIcon
                  className="mx-auto text-[32px] text-outline"
                  name="notifications_none"
                />
                <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                  {t("empty")}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  className={cn(
                    "flex gap-space-sm border-b border-outline-variant/20 px-space-md py-space-sm transition-colors last:border-b-0 hover:bg-surface-container",
                    item.unread && "bg-primary-fixed/20",
                  )}
                  href={item.href}
                  role="menuitem"
                  onClick={() => {
                    markRead(item.id);
                    setOpen(false);
                  }}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      item.type === "slaRisk"
                        ? "bg-error-container text-error"
                        : item.type === "reopened"
                          ? "bg-tertiary-fixed text-tertiary"
                          : "bg-surface-container text-primary",
                    )}
                  >
                    <MaterialIcon
                      className="text-[20px]"
                      name={notificationTypeIcon[item.type]}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-space-xs">
                      <p
                        className={cn(
                          "font-label-md text-label-md leading-snug text-on-surface",
                          item.unread && "font-semibold",
                        )}
                      >
                        {t(`items.${item.titleKey}`)}
                      </p>
                      {item.unread ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                      {t(`items.${item.bodyKey}`, {
                        ticketId: item.ticketId ?? "",
                      })}
                    </p>
                    <p className="mt-1 font-label-sm text-label-sm text-outline">
                      {t(`times.${item.timeKey}`)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-outline-variant/30 bg-surface-container-low/60 px-space-md py-space-sm">
            <Link
              className="flex items-center justify-center gap-1 font-label-md text-label-md font-semibold text-primary hover:underline"
              href="/it"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t("viewBoard")}
              <MaterialIcon className="text-[18px]" name="arrow_forward" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
