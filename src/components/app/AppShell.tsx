import { createContext, createMemo, createSignal, For, onCleanup, onMount, useContext, type Accessor } from "solid-js";
import { useNavigate, type RouteSectionProps } from "@solidjs/router";
import LoginPage from "../auth/LoginPage";
import ToastCenter, { type Toast } from "../notifications/ToastCenter";
import type { AppEvent } from "../../tauri/events";
import Drawer from "../ui/Drawer";
import { getCurrentUser, login, logout, type User } from "../../api/auth";

type ViewKey = "tickets" | "clinical" | "admin";

const views: { key: ViewKey; label: string }[] = [
  { key: "tickets", label: "Tickets" },
  { key: "clinical", label: "Doctor/Nurse" },
  { key: "admin", label: "Hospital Admin" },
];

type AppShellContextValue = {
  user: Accessor<User | null>;
  setUser: (u: User | null) => void;
  role: Accessor<string>;
  view: Accessor<ViewKey>;
  setView: (v: ViewKey) => void;
  allowedViews: Accessor<{ key: ViewKey; label: string }[]>;
};

const AppShellContext = createContext<AppShellContextValue>();

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within <AppShellContext.Provider>");
  return ctx;
}

export default function AppShell(props: RouteSectionProps) {
  const navigate = useNavigate();
  const [view, setView] = createSignal<ViewKey>("tickets");
  const [user, setUser] = createSignal<User | null>(null);
  const role = createMemo(() => (user()?.role ?? "").toLowerCase());
  const allowedViews = createMemo(() => {
    const r = role();
    if (r === "admin") return views;
    if (r === "doctor" || r === "nurse") return views.filter((v) => v.key !== "admin");
    return views.filter((v) => v.key === "tickets");
  });
  const active = createMemo(() => allowedViews().find((v) => v.key === view())?.label ?? "App");
  const [checking, setChecking] = createSignal(true);
  const [authBusy, setAuthBusy] = createSignal(false);
  const [authError, setAuthError] = createSignal<string | null>(null);
  const authed = createMemo(() => user() !== null);
  const [unread, setUnread] = createSignal(0);
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  const [events, setEvents] = createSignal<{ id: string; at: string; event: AppEvent }[]>([]);
  const [drawer, setDrawer] = createSignal<null | "search" | "alerts">(null);
  const [accountOpen, setAccountOpen] = createSignal(false);

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
    try {
      const u = await getCurrentUser();
      if (u) {
        setUser(u);
        const r = (u.role ?? "").toLowerCase();
        if (r === "doctor" || r === "nurse") setView("clinical");
        else setView("tickets");
      }
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  });

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

  const onLogin = async (values: { email: string; password: string }) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const u = await login(values.email, values.password);
      setUser(u);
      const r = (u.role ?? "").toLowerCase();
      if (r === "doctor" || r === "nurse") setView("clinical");
      else setView("tickets");
    } catch (e) {
      setUser(null);
      setAuthError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setAuthBusy(false);
    }
  };

  const setViewAndGo = (v: ViewKey) => {
    setView(v);
    navigate("/");
  };

  return (
    <AppShellContext.Provider
      value={{
        user,
        setUser,
        role,
        view,
        setView: setViewAndGo,
        allowedViews,
      }}
    >
      <div class={`app ${!authed() ? "app-login" : ""}`}>
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
          <div class="drawer-muted"></div>
          <div class="drawer-list">
            <button
              class="drawer-item"
              type="button"
              onClick={() => {
                setViewAndGo("tickets");
                setDrawer(null);
              }}
            >
              Go to tickets
            </button>
            <button
              class="drawer-item"
              type="button"
              onClick={() => {
                setViewAndGo("clinical");
                setDrawer(null);
              }}
              disabled={allowedViews().find((v) => v.key === "clinical") == null}
            >
              Go to clinical
            </button>
            <button
              class="drawer-item"
              type="button"
              onClick={() => {
                setViewAndGo("admin");
                setDrawer(null);
              }}
              disabled={allowedViews().find((v) => v.key === "admin") == null}
            >
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
                    if (ev.type === "TicketCreated") navigate(`/tickets/${ev.payload.ticket_id}`);
                    if (ev.type === "TicketUpdated") navigate(`/tickets/${ev.payload.ticket_id}`);
                    setDrawer(null);
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

      <Drawer open={accountOpen()} title="Account" onClose={() => setAccountOpen(false)}>
        <div class="drawer-stack">
          <div class="drawer-muted">
            Signed in as{" "}
            <span class="mono">{user()?.userName ?? user()?.email ?? "user"}</span>
          </div>
          <div class="drawer-list">
            <button
              class="drawer-item"
              type="button"
              onClick={async () => {
                await logout();
                setUser(null);
                setDrawer(null);
                setAccountOpen(false);
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </Drawer>

      {authed() ? (
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
            <For each={allowedViews()}>
              {(v) => (
                <button
                  type="button"
                  class={`nav-item ${view() === v.key ? "is-active" : ""}`}
                  onClick={() => setViewAndGo(v.key)}
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
            <button class="icon-btn" type="button" onClick={() => setAccountOpen(true)}>
              Account
            </button>
          </div>
        </header>
      ) : null}

      <main class={`content ${!authed() ? "content-login" : ""}`}>
        {!authed() ? (
          <LoginPage
            onLogin={onLogin}
            onSso={() => setAuthError("SSO not wired yet")}
            busy={checking() || authBusy()}
            error={authError()}
          />
        ) : null}
        {authed() ? props.children : null}
      </main>
      </div>
    </AppShellContext.Provider>
  );
}
