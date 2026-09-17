import AuthShell from "@/app/components/auth/AuthShell";
import AuthSwitcher from "@/app/components/auth/AuthSwitcher";
import LoginForm from "@/app/components/auth/LoginForm";
import SocialButtons from "@/app/components/auth/SocialButtons";

export default function LoginPage() {
  return (
    <AuthShell eyebrow="Secure access" title="Access your account" description="Use your email and password, or a configured identity provider.">
      <AuthSwitcher active="login" />
      <SocialButtons />
      <LoginForm />
    </AuthShell>
  );
}
