"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
};

export function BrandLogo({ href = "/", className }: BrandLogoProps) {
  const locale = useLocale();
  const subtitleByLocale: Record<string, string> = {
    th: "ระบบบริการ & แจ้งปัญหา",
    en: "Services & Reports",
    // ja: "サービス＆サポート",
  };
  const subtitle = subtitleByLocale[locale] ?? subtitleByLocale.en;
  const usesLatinUi = locale === "en" || locale === "ja";
  const subtitleSize = usesLatinUi ? "10" : "9.5";
  const subtitleTracking = usesLatinUi ? "0.2px" : "0.1px";
  const fontFamily = usesLatinUi
    ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Noto Sans Thai', 'Noto Sans', 'Segoe UI', Roboto, sans-serif";

  return (
    <Link className="inline-flex shrink-0 items-center" href={href}>
      <svg
        aria-label="IT HelpDesk"
        className={cn("h-16 w-auto", className)}
        fill="none"
        height="64"
        role="img"
        viewBox="0 0 200 50"
        width="256"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="6" width="38" height="38" rx="10" fill="#1E4D6B" />
        <path
          d="M 16 25 C 16 19.5 20 15 25 15 C 30 15 34 19.5 34 25"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <rect x="14.5" y="23.5" width="3" height="6.5" rx="1.5" fill="#38BDF8" />
        <rect x="32.5" y="23.5" width="3" height="6.5" rx="1.5" fill="#38BDF8" />
        <path
          d="M 34 27 C 34 32 29.5 33.5 26 33.5"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="23.5" cy="33.5" r="2" fill="#10B981" />
        <circle cx="25" cy="23" r="1.8" fill="#FFFFFF" />
        <text
          x="52"
          y="25"
          fill="#0F172A"
          fontFamily={fontFamily}
          fontSize="16"
          fontWeight="800"
          letterSpacing="-0.2px"
        >
          IT HelpDesk
        </text>
        <text
          x="52.5"
          y="38"
          fill="#64748B"
          fontFamily={fontFamily}
          fontSize={subtitleSize}
          fontWeight="600"
          letterSpacing={subtitleTracking}
        >
          {subtitle}
        </text>
      </svg>
    </Link>
  );
}
