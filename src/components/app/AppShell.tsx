import { createMemo, createSignal, For, onCleanup, onMount } from "solid-js";
import LoginPage from "../auth/LoginPage";
import GenericTicketsDashboard from "../dashboards/GenericTicketsDashboard";
import ClinicianDashboard from "../dashboards/ClinicianDashboard";
import AdminDashboard from "../dashboards/AdminDashboard";
import ToastCenter, { type Toast } from "../notifications/ToastCenter";
import type { AppEvent } from "../../tauri/events";

type ViewKey = "login" | "tickets" | "clinical" | "admin";

const views: { key: ViewKey; label: string }[] = [
  { key: "tickets", label: "Tickets" },
  { key: "clinical", label: "Doctor/Nurse" },
  { key: "admin", label: "Hospital Admin" },
  { key: "login", label: "Login" },
];

export default function AppShell() {
  const [view, setView] = createSignal<ViewKey>("tickets");
  const active = createMemo(() => views.find((v) => v.key === view())?.label ?? "App");
  const isLogin = createMemo(() => view() === "login");
  const [unread, setUnread] = createSignal(0);
  const [toasts, setToasts] = createSignal<Toast[]>([]);

  const dismissToast = (id: string) => {
    setToasts((xs) => xs.filter((t) => t.id !== id));
  };

  const pushToast = (t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: Toast = { id, ...t };
    setToasts((xs) => [toast, ...xs].slice(0, 5));
    setTimeout(() => dismissToast(id), 6000);
  };

  onMount(async () => {
    let unlisten: null | (() => void) = null;
    try {
      const mod = await import("@tauri-apps/api/event");
      unlisten = await mod.listen<AppEvent>("notification", (e) => {
        setUnread((n) => n + 1);
        const ev = e.payload;
        if (ev.type === "TicketCreated") {
          pushToast({
            title: "New Ticket",
            message: `${ev.payload.ticket_id} • ${ev.payload.subject}`,
            tone: "info",
          });
        } else if (ev.type === "TicketUpdated") {
          pushToast({
            title: "Ticket Updated",
            message: `${ev.payload.ticket_id}`,
            tone: "neutral",
          });
        }
      });
    } catch {
      setUnread(0);
    }

    onCleanup(() => {
      unlisten?.();
    });
  });

  return (
    <div class={`app ${isLogin() ? "app-login" : ""}`}>
      <ToastCenter toasts={toasts()} onDismiss={dismissToast} />
      {!isLogin() ? (
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">
              <span />
            </div>
            <div class="brand-text">
              <div class="brand-title">Upgraded Guacamole</div>
              <div class="brand-sub">{active()}</div>
            </div>
          </div>

          <nav class="nav">
            <For each={views.filter((v) => v.key !== "login")}>
              {(v) => (
                <button
                  type="button"
                  class={`nav-item ${view() === v.key ? "is-active" : ""}`}
                  onClick={() => setView(v.key)}
                >
                  {v.label}
                </button>
              )}
            </For>
          </nav>

          <div class="topbar-actions">
            <button class="icon-btn" type="button" onClick={() => alert("Search")}>
              Search
            </button>
            <button
              class="icon-btn"
              type="button"
              onClick={() => {
                setUnread(0);
                alert("Alerts");
              }}
            >
              Alerts {unread() > 0 ? <span class="badge">{unread()}</span> : null}
            </button>
          </div>
        </header>
      ) : null}

      <main class={`content ${isLogin() ? "content-login" : ""}`}>
        {view() === "login" ? <LoginPage /> : null}
        {view() === "tickets" ? <GenericTicketsDashboard /> : null}
        {view() === "clinical" ? <ClinicianDashboard /> : null}
        {view() === "admin" ? <AdminDashboard /> : null}
      </main>
    </div>
  );
}
