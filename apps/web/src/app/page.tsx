import Link from "next/link";
import { Headset } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="flex items-center gap-3 text-primary">
        <Headset className="h-10 w-10" />
        <p
          className="text-4xl tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          IT Helpdesk
        </p>
      </div>
      <h1 className="mt-6 max-w-2xl text-3xl font-medium leading-tight text-foreground md:text-4xl">
        Internal support desk for tickets, approvals, and IT operations.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Submit requests, track progress, and manage workload across User, IT,
        and GM dashboards.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/user">User dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/it">IT workspace</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/gm">GM overview</Link>
        </Button>
      </div>
    </main>
  );
}
