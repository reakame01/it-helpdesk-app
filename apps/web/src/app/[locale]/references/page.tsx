"use client";

import { PortalFooter } from "@/components/portal/portal-footer";
import { PortalHeader } from "@/components/portal/portal-header";
import { DataReferencesWorkspace } from "@/components/portal/data-references-workspace";

export default function DataReferencesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PortalHeader activeNav="dataReferences" />
      <main className="w-full flex-1 pt-[8.5rem]">
        <section className="mx-auto w-full max-w-container-max px-gutter-desktop py-space-xl">
          <DataReferencesWorkspace />
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
