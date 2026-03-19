import { createSignal } from "solid-js";
import axios from 'axios';

export type LoginValues = {
  email: string;
  password: string;
};

type LoginFormProps = {
  onSubmit?: (values: LoginValues) => void;
  disabled?: boolean;
  error?: string | null;
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
        axios.post("/api/auth/login", {
          props
        }).then(response => {
          console.log(response);
        })
            .catch((error: Error) => {
              console.log(error);
            })
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
          disabled={props.disabled}
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
          disabled={props.disabled}
        />
      </label>

      {props.error ? <div class="auth-error">{props.error}</div> : null}

      <button class="btn btn-primary" type="submit" disabled={props.disabled}>
        {props.disabled ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
