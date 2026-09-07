import Link from "next/link";
import { Headset } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/user", label: "User" },
  { href: "/it", label: "IT" },
  { href: "/gm", label: "GM" },
];

export function AppShell({
  title,
  children,
  active,
}: {
  title: string;
  children: React.ReactNode;
  active?: "user" | "it" | "gm";
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Headset className="h-5 w-5" />
            <span
              className="text-lg font-semibold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              IT Helpdesk
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
                  active && link.href.endsWith(active) && "bg-secondary text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="ml-2 rounded-md px-3 py-2 text-sm text-primary hover:underline"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1
          className="mb-6 text-3xl text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
