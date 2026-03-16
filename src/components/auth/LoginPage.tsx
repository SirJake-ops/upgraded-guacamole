import SsoButton from "./SsoButton";
import AuthDivider from "./AuthDivider";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main class="auth-shell">
      <section class="auth-card" aria-label="Login">
        <header class="auth-header">
          <h1 class="auth-title">Sign in</h1>
          <p class="auth-subtitle">Use your email and password, or continue with SSO.</p>
        </header>

        <SsoButton onClick={() => alert("SSO button clicked")} />
        <AuthDivider />
        <LoginForm
          onSubmit={({ email, password }) => {
            alert(`email: ${email}\npassword: ${password}`);
          }}
        />

        <footer class="auth-footer">
          <span>Demo only: this page just alerts values.</span>
        </footer>
      </section>
    </main>
  );
}
