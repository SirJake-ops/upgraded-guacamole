import { For } from "solid-js";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
};

type ToastCenterProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

export default function ToastCenter(props: ToastCenterProps) {
  return (
    <div class="toasts" aria-live="polite" aria-relevant="additions removals">
      <For each={props.toasts}>
        {(t) => (
          <div class={`toast toast-${t.tone ?? "neutral"}`}>
            <div class="toast-body">
              <div class="toast-title">{t.title}</div>
              {t.message ? <div class="toast-msg">{t.message}</div> : null}
            </div>
            <button class="toast-x" type="button" onClick={() => props.onDismiss(t.id)}>
              ×
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

