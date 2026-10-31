import ResetPasswordForm from "./ResetPasswordForm";
import MobileResetPassword from "./MobileResetPassword";
import { Suspense } from 'react';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (process.env.NEXT_PUBLIC_NATIVE_BUILD === '1') {
    return <Suspense fallback={<p role="status" className="p-8 text-center text-sm text-slate-500">Loading account recovery…</p>}>
      <MobileResetPassword />
    </Suspense>;
  }
  const { token = "" } = await searchParams;
  return <ResetPasswordForm token={token} />;
}
