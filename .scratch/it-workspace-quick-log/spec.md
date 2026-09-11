# Spec: Quick Log (บันทึกงานด่วน)

Status: ready-for-agent

Seam (confirmed): HTTP Board/Ticket API (`POST /tickets/quick-log`) plus lifecycle rules.  
Domain: `CONTEXT.md`, ADR 0002, ADR 0004, ADR 0005.

## Problem Statement

IT already finishes many walk-up fixes on the floor, but **Quick Log** in the workspace is a mock dialog: submit only toasts. Those cases never become tickets, so stats and credit are lost. Guests must not create them.

## Solution

An **IT session** submits department, symptom, resolution, and optional requester name. The API creates a **Quick Log** ticket (`QUICK_TICKET`) as a **Closed Ticket** immediately (ADR 0005): actor is **Lead**, no User Confirm Token, no Supervisor approval in this slice. The card appears in the rightmost board column. Departments come from Data References. Drag-and-drop, websocket realtime, and Work Cycle Close stay out of scope.

## User Stories

1. As IT Staff / Supervisor / IT Manager, I want to save a walk-up fix from the board, so that the work is a real Closed Ticket.
2. As a Guest, I want Quick Log hidden, so that only an IT session can write.
3. As an Assignee who just logged a fix, I want the card in the Resolved/Closed column with me as Lead, so that credit is visible.
4. As a reporting consumer, I want department from Data References and the symptom as the title, so that frequent-issue reports later have real data.
5. As product, I want Supervisor Quick Ticket approval deferred, so that the floor flow matches “ปิดเคสทันที”.

## Implementation Decisions

1. **AuthZ**: JWT IT session only (`IT_STAFF`, `SUPERVISOR`, `IT_MANAGER`). Guest 401/403.
2. **Payload**: `departmentCode`, `issue`, `resolve`, optional `requesterName`.
3. **Persistence**: `type = QUICK_TICKET`, `status = CLOSED`, `resolvedAt = now`, category `OTHER` / `other` (no category field in the current dialog), priority medium, actor as Lead, worklog = resolution, audit `QUICK_LOG`.
4. **Board**: include `type` on `BoardTicketDto`; map CLOSED to the rightmost column as today.
5. **No tokens / no QuickTicketApproval records** in this slice.
6. **UI**: keep dialog layout; load departments from references; submit hits API then refresh the board.

## Out of Scope

- Supervisor approve/reject of Quick Tickets (`QuickTicketApproval` UX)
- Drag-and-drop, websocket realtime, Work Cycle Close
- Category picker on the Quick Log form (defaults to Other)
