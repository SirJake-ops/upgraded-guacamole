import { createMemo, createSignal, For, onCleanup, onMount } from "solid-js";
import LoginPage from "../auth/LoginPage";
import GenericTicketsDashboard from "../dashboards/GenericTicketsDashboard";
import ClinicianDashboard from "../dashboards/ClinicianDashboard";
import AdminDashboard from "../dashboards/AdminDashboard";
import ToastCenter, { type Toast } from "../notifications/ToastCenter";
import type { AppEvent } from "../../tauri/events";
import Drawer from "../ui/Drawer";

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
  const [events, setEvents] = createSignal<{ id: string; at: string; event: AppEvent }[]>([]);
  const [drawer, setDrawer] = createSignal<null | "search" | "alerts">(null);

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
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const at = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setEvents((xs) => [{ id, at, event: ev }, ...xs].slice(0, 25));
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
      <Drawer open={drawer() === "search"} title="Search" onClose={() => setDrawer(null)}>
        <div class="drawer-stack">
          <div class="drawer-field">
            <div class="drawer-label">Query</div>
            <input
              type="text"
              placeholder="Search tickets, patients, issues"
              onKeyDown={(e) => {
                if (e.key === "Enter") setDrawer(null);
              }}
            />
          </div>
          <div class="drawer-muted">Mock UI. Wire this to your .NET backend search later.</div>
          <div class="drawer-list">
            <button class="drawer-item" type="button" onClick={() => window.location.assign("/tickets")}>
              Go to tickets
            </button>
            <button class="drawer-item" type="button" onClick={() => window.location.assign("/clinical")}>
              Go to clinical
            </button>
            <button class="drawer-item" type="button" onClick={() => window.location.assign("/admin")}>
              Go to admin
            </button>
          </div>
        </div>
      </Drawer>

      <Drawer open={drawer() === "alerts"} title="Alerts" onClose={() => setDrawer(null)}>
        <div class="drawer-stack">
          <div class="drawer-row">
            <div class="drawer-muted">Unread: {unread()}</div>
            <button
              class="btn btn-secondary"
              type="button"
              onClick={() => {
                setUnread(0);
              }}
            >
              Mark All Read
            </button>
          </div>
          <div class="drawer-feed">
            {events().length === 0 ? <div class="drawer-muted">No events yet.</div> : null}
            <For each={events()}>
              {(x) => (
                <button
                  class="feed-item"
                  type="button"
                  onClick={() => {
                    const ev = x.event;
                    if (ev.type === "TicketCreated") window.location.assign(`/tickets/${ev.payload.ticket_id}`);
                    if (ev.type === "TicketUpdated") window.location.assign(`/tickets/${ev.payload.ticket_id}`);
                  }}
                >
                  <div class="feed-top">
                    <div class="feed-title">{x.event.type}</div>
                    <div class="feed-at">{x.at}</div>
                  </div>
                  <div class="feed-msg">
                    {x.event.type === "TicketCreated"
                      ? `${x.event.payload.ticket_id} • ${x.event.payload.subject}`
                      : `${x.event.payload.ticket_id}`}
                  </div>
                </button>
              )}
            </For>
          </div>
        </div>
      </Drawer>

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
            <button class="icon-btn" type="button" onClick={() => setDrawer("search")}>
              Search
            </button>
            <button
              class="icon-btn"
              type="button"
              onClick={() => {
                setUnread(0);
                setDrawer("alerts");
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
