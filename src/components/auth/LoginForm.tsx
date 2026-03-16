import { createSignal } from "solid-js";

export type LoginValues = {
  email: string;
  password: string;
};

type LoginFormProps = {
  onSubmit?: (values: LoginValues) => void;
};

export default function LoginForm(props: LoginFormProps) {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");

  return (
    <form
      class="auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit?.({ email: email(), password: password() });
      }}
    >
      <label class="field">
        <span class="label">Email</span>
        <input
          name="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="you@school.edu"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
        />
      </label>

      <label class="field">
        <span class="label">Password</span>
        <input
          name="password"
          type="password"
          autocomplete="current-password"
          placeholder="Your password"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          required
        />
      </label>

      <button class="btn btn-primary" type="submit">
        Sign in
      </button>
    </form>
  );
}
