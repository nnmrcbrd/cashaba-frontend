import AuthShell from "@/app/components/auth/AuthShell";
import AuthSwitcher from "@/app/components/auth/AuthSwitcher";
import SignupForm from "@/app/components/auth/SignupForm";
import SocialButtons from "@/app/components/auth/SocialButtons";

export default function SignupPage() {
  return (
    <AuthShell eyebrow="Secure registration" title="Create your account" description="Create your account, verify your email, then sign in to complete your financial setup.">
      <AuthSwitcher active="signup" />
      <SocialButtons />
      <SignupForm />
    </AuthShell>
  );
}
