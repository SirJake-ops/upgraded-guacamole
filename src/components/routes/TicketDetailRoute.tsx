import { For, Show, createEffect, createResource, createSignal, onCleanup } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { createTicketMessage, getTicketById, getTicketMessages, type TicketMessage } from "../../api/tickets";
import { useAppShell } from "../app/AppShell";
import Pill from "../dashboards/ui/Pill";

type ChatEvent = {
  kind: string;
  room: string;
  ticketId?: string;
  messageId?: number;
  fromUserId: string;
  fromRole: string;
  body: string;
  sentAt: string;
};

const wsUrl = () => {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5176";
  const trimmed = base.replace(/\/+$/, "");
  const wsBase = trimmed.startsWith("https://") ? trimmed.replace(/^https:\/\//, "wss://") : trimmed.replace(/^http:\/\//, "ws://");
  return `${wsBase}/ws/chat`;
};

export default function TicketDetailRoute() {
  const shell = useAppShell();
  const navigate = useNavigate();
  const params = useParams<{ ticketId: string }>();

  const ticketId = () => params.ticketId;
  const [ticket] = createResource(ticketId, getTicketById);
  const [messagesRes, { refetch }] = createResource(ticketId, getTicketMessages);
  const [messages, setMessages] = createSignal<TicketMessage[]>([]);
  const [draft, setDraft] = createSignal("");
  const [sending, setSending] = createSignal(false);
  const [err, setErr] = createSignal<string | null>(null);

  createEffect(() => {
    const initial = messagesRes();
    if (initial) setMessages(initial);
  });

  createEffect(() => {
    const u = shell.user();
    if (!u) return;

    const ws = new WebSocket(wsUrl());
    ws.onmessage = (ev) => {
      let parsed: ChatEvent | null = null;
      try {
        parsed = JSON.parse(ev.data) as ChatEvent;
      } catch {
        parsed = null;
      }
      if (!parsed) return;
      if (parsed.kind !== "ticketMessage") return;
      if (parsed.room !== `ticket:${ticketId()}`) return;

      // Avoid duplicates when we already have the message id.
      if (parsed.messageId != null && messages().some((m) => m.messageId === parsed!.messageId)) return;

      const msg: TicketMessage = {
        messageId: parsed.messageId ?? -Date.now(),
        ticketId: parsed.ticketId ?? ticketId(),
        senderId: parsed.fromUserId,
        body: parsed.body,
        createdAt: parsed.sentAt,
      };
      setMessages((xs) => [...xs, msg]);
    };

    const onClose = () => {
      // no-op
    };
    ws.onclose = onClose;
    ws.onerror = onClose;

    onCleanup(() => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    });
  });

  const envLabel = (e: number | string) => {
    if (typeof e === "string") return e;
    if (e === 0) return "Browser";
    if (e === 1) return "Device";
    if (e === 2) return "OperatingSystem";
    return "Unknown";
  };

  const send = async () => {
    const body = draft().trim();
    if (!body) return;
    setSending(true);
    setErr(null);
    try {
      const msg = await createTicketMessage(ticketId(), body);
      setDraft("");
      setMessages((xs) => (xs.some((m) => m.messageId === msg.messageId) ? xs : [...xs, msg]));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">
            <button class="btn btn-secondary" type="button" onClick={() => navigate("/")}>
              Back
            </button>{" "}
            <Show when={ticket()} fallback={"Ticket"}>
              {(t) => <>Ticket #{t().ticketNumber}</>}
            </Show>
          </h2>
          <div class="dash-subtitle">Ticket details and messages</div>
        </div>
        <div class="dash-actions">
          <button class="btn btn-secondary" type="button" onClick={() => refetch()}>
            Refresh Messages
          </button>
        </div>
      </header>

      <Show when={ticket()} fallback={<div class="panel"><div class="panel-body">Loading ticket...</div></div>}>
        {(t) => (
          <div class="grid-2">
            <div class="panel">
              <div class="panel-head">
                <div class="panel-title">Summary</div>
                <div class="panel-meta">
                  <Pill text={t().isResolved ? "Resolved" : "Open"} tone={t().isResolved ? "good" : "neutral"} />
                </div>
              </div>
              <div class="panel-body">
                <div class="modal-grid">
                  <div class="modal-row">
                    <div class="modal-k">Title</div>
                    <div class="modal-v">{t().title}</div>
                  </div>
                  <div class="modal-row">
                    <div class="modal-k">Environment</div>
                    <div class="modal-v">{envLabel(t().environment)}</div>
                  </div>
                  <div class="modal-row">
                    <div class="modal-k">Description</div>
                    <div class="modal-v">{t().description}</div>
                  </div>
                  <div class="modal-row">
                    <div class="modal-k">Steps</div>
                    <div class="modal-v">{t().stepsToReproduce}</div>
                  </div>
                  <div class="modal-row">
                    <div class="modal-k">Expected</div>
                    <div class="modal-v">{t().expectedResult}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel">
              <div class="panel-head">
                <div class="panel-title">Messages</div>
                <div class="panel-meta">{messages().length} shown</div>
              </div>
              <div class="panel-body">
                <div class="chat">
                  <div class="chat-list">
                    <For each={messages()}>
                      {(m) => (
                        <div class={`chat-msg ${m.senderId === shell.user()!.id ? "is-me" : ""}`}>
                          <div class="chat-meta">
                            <span class="mono">{m.senderId === shell.user()!.id ? "You" : m.senderId.slice(0, 8)}</span>
                            <span>{new Date(m.createdAt).toLocaleString()}</span>
                          </div>
                          <div class="chat-body">{m.body}</div>
                        </div>
                      )}
                    </For>
                    {messages().length === 0 ? <div class="drawer-muted">No messages yet.</div> : null}
                  </div>

                  <div class="chat-compose">
                    <textarea
                      class="textarea"
                      rows={3}
                      value={draft()}
                      disabled={sending()}
                      placeholder="Write a message..."
                      onInput={(e) => setDraft(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                    />
                    {err() ? <div class="auth-error">{err()}</div> : null}
                    <div class="modal-footer">
                      <button class="btn btn-secondary" type="button" onClick={() => setDraft("")} disabled={sending()}>
                        Clear
                      </button>
                      <button class="btn btn-primary" type="button" onClick={() => void send()} disabled={sending()}>
                        {sending() ? "Sending..." : "Send"}
                      </button>
                    </div>
                    <div class="drawer-muted">Tip: Ctrl+Enter to send.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </section>
  );
}

