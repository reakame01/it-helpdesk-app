"use client";

import { PortalFooter } from "@/components/portal/portal-footer";
import { PortalHeader } from "@/components/portal/portal-header";
import { KanbanWorkspace } from "@/components/kanban/kanban-workspace";

export default function ItWorkspacePage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PortalHeader activeNav="itWorkspace" />
      <main className="w-full flex-1 pt-[8.5rem]">
        <section className="mx-auto w-full max-w-container-max px-gutter-desktop py-space-xl">
          <KanbanWorkspace />
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
