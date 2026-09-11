import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapTicketToBoardColumn,
  ticketHasLead,
} from "./board-column.mapping.ts";

describe("mapTicketToBoardColumn", () => {
  it("maps open work with no Lead to backlog", () => {
    assert.equal(
      mapTicketToBoardColumn({ status: "OPEN", hasLead: false }),
      "backlog",
    );
  });

  it("maps IN_PROGRESS to in_progress even without a Lead", () => {
    assert.equal(
      mapTicketToBoardColumn({ status: "IN_PROGRESS", hasLead: false }),
      "in_progress",
    );
  });

  it("maps a ticket with a Lead to in_progress", () => {
    assert.equal(
      mapTicketToBoardColumn({ status: "OPEN", hasLead: true }),
      "in_progress",
    );
  });

  it("maps Awaiting User Test to pending_user", () => {
    assert.equal(
      mapTicketToBoardColumn({
        status: "AWAITING_USER_TEST",
        hasLead: true,
      }),
      "pending_user",
    );
  });

  it("maps legacy PENDING_APPROVAL to pending_user", () => {
    assert.equal(
      mapTicketToBoardColumn({
        status: "PENDING_APPROVAL",
        hasLead: true,
      }),
      "pending_user",
    );
  });

  it("maps Resolved to the rightmost column", () => {
    assert.equal(
      mapTicketToBoardColumn({ status: "RESOLVED", hasLead: true }),
      "resolved",
    );
  });

  it("maps Closed Ticket to the rightmost column", () => {
    assert.equal(
      mapTicketToBoardColumn({ status: "CLOSED", hasLead: true }),
      "resolved",
    );
  });
});

describe("ticketHasLead", () => {
  it("is true when any assignee is Lead", () => {
    assert.equal(
      ticketHasLead([{ role: "COLLABORATOR" }, { role: "LEAD" }]),
      true,
    );
  });

  it("is false when nobody is Lead", () => {
    assert.equal(ticketHasLead([{ role: "COLLABORATOR" }]), false);
    assert.equal(ticketHasLead([]), false);
    assert.equal(ticketHasLead(undefined), false);
  });
});
