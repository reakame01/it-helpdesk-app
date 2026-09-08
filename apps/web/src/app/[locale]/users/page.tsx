"use client";

import { PortalFooter } from "@/components/portal/portal-footer";
import { PortalHeader } from "@/components/portal/portal-header";
import { UserManagementWorkspace } from "@/components/portal/user-management-workspace";

export default function UserManagementPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PortalHeader activeNav="userManagement" />
      <main className="w-full flex-1 pt-[8.5rem]">
        <section className="mx-auto w-full max-w-container-max px-gutter-desktop py-space-xl">
          <UserManagementWorkspace />
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
