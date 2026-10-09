import axios from "axios";

export interface AiChatError {
  kind: "monthly_limit" | "rate_limit" | "request";
  message: string;
  retryAt: number | null;
  resetAt: string | null;
}

interface ErrorBody {
  message?: string;
  code?: string;
  retryAfterSeconds?: number;
  resetAt?: string;
}

export function nextAiUsageReset(now = Date.now()) {
  const date = new Date(now);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString();
}

export function getAiChatError(error: unknown, now = Date.now()): AiChatError {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return { kind: "request", message: "I couldn't process that request. Your message is ready to try again.", retryAt: null, resetAt: null };
  }
  const body = error.response?.data;
  if (error.response?.status === 429) {
    if (body?.code === "USAGE_LIMIT_REACHED" || /monthly.*(?:limit|quota)/i.test(body?.message || "")) {
      return {
        kind: "monthly_limit",
        message: body?.message || "Your monthly AI request limit has been reached. Check your plan or wait for the next usage period.",
        retryAt: null,
        resetAt: body?.resetAt && Number.isFinite(Date.parse(body.resetAt)) ? body.resetAt : nextAiUsageReset(now),
      };
    }
    const retryHeader = error.response.headers?.["retry-after"];
    const seconds = Number(body?.retryAfterSeconds ?? retryHeader);
    const headerDeadline = typeof retryHeader === "string" ? Date.parse(retryHeader) : NaN;
    const wait = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds)
      : Number.isFinite(headerDeadline) && headerDeadline > now ? Math.ceil((headerDeadline - now) / 1000) : 60;
    return { kind: "rate_limit", message: "You're sending messages too quickly. Your message is ready to try again when the countdown ends.", retryAt: now + wait * 1000, resetAt: null };
  }
  return { kind: "request", message: body?.message || "The assistant is temporarily unavailable. Your message is ready to try again.", retryAt: null, resetAt: null };
}

export function aiRetrySeconds(retryAt: number | null, now = Date.now()) {
  return retryAt === null ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1000));
}

export function isAiConversationControl(message: string, confirmationId: string | null) {
  return /^(cancel|no|never mind|start over)$/i.test(message.trim())
    || (Boolean(confirmationId) && /^(confirm|yes|save|do it)$/i.test(message.trim()));
}
