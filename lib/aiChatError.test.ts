import assert from "node:assert/strict";
import test from "node:test";
import { getAiChatError, aiRetrySeconds, isAiConversationControl } from "./aiChatError";

const now = Date.parse("2026-10-06T15:00:00Z");
const responseError = (status: number, data: unknown, headers: Record<string, string> = {}) => ({ isAxiosError: true, response: { status, data, headers } });

test("monthly limits show the usage reset instead of suggesting a one-minute retry", () => {
  const error = getAiChatError(responseError(429, { code: "USAGE_LIMIT_REACHED", message: "Monthly AI request limit reached.", resetAt: "2026-11-01T00:00:00Z" }), now);
  assert.equal(error.kind, "monthly_limit");
  assert.equal(error.retryAt, null);
  assert.equal(error.resetAt, "2026-11-01T00:00:00Z");
  assert.equal(aiRetrySeconds(error.retryAt, now), 0);
});

test("older monthly-limit responses still use the monthly reset", () => {
  const error = getAiChatError(responseError(429, { message: "Monthly AI request limit reached. Upgrade or wait." }), now);
  assert.equal(error.kind, "monthly_limit");
  assert.equal(error.resetAt, "2026-11-01T00:00:00.000Z");
});

test("rapid-request limits use the JSON retry delay and an absolute countdown", () => {
  const error = getAiChatError(responseError(429, { code: "RATE_LIMITED", retryAfterSeconds: 23 }, { "retry-after": "60" }), now);
  assert.equal(error.kind, "rate_limit");
  assert.equal(aiRetrySeconds(error.retryAt, now), 23);
  assert.equal(aiRetrySeconds(error.retryAt, now + 12500), 11);
  assert.equal(aiRetrySeconds(error.retryAt, now + 60000), 0);
});

test("Retry-After supports both seconds and HTTP dates", () => {
  assert.equal(aiRetrySeconds(getAiChatError(responseError(429, {}, { "retry-after": "17" }), now).retryAt, now), 17);
  const deadline = new Date(now + 30000).toUTCString();
  assert.equal(aiRetrySeconds(getAiChatError(responseError(429, {}, { "retry-after": deadline }), now).retryAt, now), 30);
  assert.equal(aiRetrySeconds(getAiChatError(responseError(429, { retryAfterSeconds: -10 }), now).retryAt, now), 60);
});

test("service and network failures remain retryable without being monthly limits", () => {
  const server = getAiChatError(responseError(503, { message: "Temporarily unavailable" }), now);
  assert.equal(server.kind, "request");
  assert.equal(server.message, "Temporarily unavailable");
  assert.equal(server.retryAt, null);
  assert.equal(getAiChatError(new Error("offline"), now).kind, "request");
});

test("monthly usage controls allow cancellation and only allow confirmation of a selected action", () => {
  assert.equal(isAiConversationControl(" cancel ", null), true);
  assert.equal(isAiConversationControl("start over", null), true);
  assert.equal(isAiConversationControl("CONFIRM", "draft-id"), true);
  assert.equal(isAiConversationControl("confirm", null), false);
  assert.equal(isAiConversationControl("spent 100", "draft-id"), false);
});
