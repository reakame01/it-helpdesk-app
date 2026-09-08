"use client";

import { PortalFooter } from "@/components/portal/portal-footer";
import { PortalHeader } from "@/components/portal/portal-header";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

export default function GmDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PortalHeader activeNav="gmDashboard" />
      <main className="w-full flex-1 pt-[8.5rem]">
        <section className="mx-auto w-full max-w-container-max px-gutter-desktop py-space-xl">
          <DashboardWorkspace />
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
