'use client';

import { useSearchParams } from 'next/navigation';
import ResetPasswordForm from './ResetPasswordForm';

export default function MobileResetPassword() {
  const params = useSearchParams();
  return <ResetPasswordForm token={params.get('token') || ''} />;
}
