import SsoButton from "./SsoButton";
import AuthDivider from "./AuthDivider";
import LoginForm from "./LoginForm";
import type { LoginValues } from "./LoginForm";

type LoginPageProps = {
  onLogin?: (values: LoginValues) => void;
  onSso?: () => void;
  busy?: boolean;
  error?: string | null;
};

export default function LoginPage(props: LoginPageProps) {
  return (
    <main class="auth-shell">
      <section class="auth-card" aria-label="Login">
        <header class="auth-header">
          <h1 class="auth-title">Sign in</h1>
          <p class="auth-subtitle">Use your email and password, or continue with SSO.</p>
        </header>

        <SsoButton onClick={props.onSso} />
        <AuthDivider />
        <LoginForm onSubmit={props.onLogin} disabled={props.busy} error={props.error} />

        <footer class="auth-footer">
          <span>Mock login UI.</span>
        </footer>
      </section>
    </main>
  );
}
