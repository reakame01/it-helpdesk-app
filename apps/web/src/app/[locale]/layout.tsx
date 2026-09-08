import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Noto_Sans, Noto_Sans_Thai } from "next/font/google";
import { ItAuthProvider } from "@/components/auth/it-auth-context";
import { routing } from "@/i18n/routing";
import "../globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-latin",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${notoSans.variable} ${notoSansThai.variable} bg-surface font-body-md text-body-md text-on-surface antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ItAuthProvider>{children}</ItAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
