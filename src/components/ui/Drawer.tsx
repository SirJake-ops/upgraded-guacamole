import { Show, onCleanup, onMount } from "solid-js";

type DrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: unknown;
};

export default function Drawer(props: DrawerProps) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };

  onMount(() => {
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  return (
    <Show when={props.open}>
      <div class="drawer-overlay" onClick={() => props.onClose()} role="presentation">
        <aside class="drawer" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <header class="drawer-header">
            <div class="drawer-title">{props.title}</div>
            <button class="drawer-close" type="button" onClick={() => props.onClose()}>
              ×
            </button>
          </header>
          <div class="drawer-body">{props.children}</div>
        </aside>
      </div>
    </Show>
  );
}

