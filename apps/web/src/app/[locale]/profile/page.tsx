"use client";

import { PortalFooter } from "@/components/portal/portal-footer";
import { PortalHeader } from "@/components/portal/portal-header";
import { ProfileWorkspace } from "@/components/portal/profile-workspace";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PortalHeader />
      <main className="w-full flex-1 pt-[8.5rem]">
        <section className="mx-auto w-full max-w-container-max px-gutter-desktop py-space-xl">
          <ProfileWorkspace />
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
