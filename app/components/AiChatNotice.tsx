import Link from "next/link";
import type { AiChatError } from "@/lib/aiChatError";

export default function AiChatNotice({ error, retrySeconds }: { error: AiChatError; retrySeconds: number }) {
  const resetDate = error.resetAt ? new Date(error.resetAt).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : null;
  return (
    <div role="alert" className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
      <p className="font-semibold">{error.message}</p>
      {error.kind === "rate_limit" && <p className="mt-1" role="status">{retrySeconds > 0 ? `Try again in ${retrySeconds} second${retrySeconds === 1 ? "" : "s"}.` : "You can send your message again now."}</p>}
      {error.kind === "monthly_limit" && <>
        {resetDate && <p className="mt-1">Usage resets on {resetDate} (Philippine time).</p>}
        <p className="mt-1">You can still confirm or cancel an existing action.</p>
        <Link href="/subscription" className="mt-2 inline-block font-bold underline">View plan and usage</Link>
      </>}
    </div>
  );
}
