type AuthDividerProps = {
  text?: string;
};

export default function AuthDivider(props: AuthDividerProps) {
  return (
    <div class="auth-divider" aria-hidden="true">
      <span>{props.text ?? "or"}</span>
    </div>
  );
}

