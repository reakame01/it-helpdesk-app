import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildConfirmDeepLink,
  hashConfirmToken,
  issueConfirmTokenPlain,
} from "./user-confirm-token.ts";

describe("user confirm token", () => {
  it("hashes the same plaintext to a stable SHA-256 hex", () => {
    const hash = hashConfirmToken("plain-token");
    assert.equal(hash.length, 64);
    assert.equal(hash, hashConfirmToken("plain-token"));
    assert.notEqual(hash, "plain-token");
  });

  it("issues a random plaintext that is not the stored hash", () => {
    const issued = issueConfirmTokenPlain();
    assert.notEqual(issued.plain, issued.tokenHash);
    assert.equal(issued.tokenHash, hashConfirmToken(issued.plain));
    assert.ok(issued.expiresAt.getTime() > Date.now());
  });

  it("builds a board deep link without extra action buttons", () => {
    const link = buildConfirmDeepLink({
      webBaseUrl: "http://localhost:3000/",
      locale: "th",
      ticketId: "t1",
      token: "abc",
    });
    assert.equal(
      link,
      "http://localhost:3000/th/it?ticket=t1&token=abc",
    );
  });
});
