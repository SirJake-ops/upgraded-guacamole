import { Show, onCleanup, onMount } from "solid-js";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: unknown;
};

export default function Modal(props: ModalProps) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };

  onMount(() => {
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  return (
    <Show when={props.open}>
      <div class="modal-overlay" onClick={() => props.onClose()} role="presentation">
        <div class="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <header class="modal-header">
            <div class="modal-title">{props.title}</div>
            <button class="modal-close" type="button" onClick={() => props.onClose()}>
              ×
            </button>
          </header>
          <div class="modal-body">{props.children}</div>
        </div>
      </div>
    </Show>
  );
}

