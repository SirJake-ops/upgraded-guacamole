type SsoButtonProps = {
  onClick?: () => void;
};

export default function SsoButton(props: SsoButtonProps) {
  return (
    <button class="btn btn-secondary" type="button" onClick={props.onClick}>
      Continue with SSO
    </button>
  );
}

