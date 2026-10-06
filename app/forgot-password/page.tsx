import EmailOtpFlow from "@/app/components/auth/EmailOtpForm";

export default function ForgotPasswordPage() {
  return <EmailOtpFlow purpose="recovery" />;
}
