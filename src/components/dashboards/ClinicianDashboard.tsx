import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import Modal from "../ui/modals/Modal.tsx";
import { getTickets, type Ticket } from "../../api/tickets";

const envLabel = (e: Ticket["environment"]) => {
  if (typeof e === "string") return e;
  if (e === 0) return "Browser";
  if (e === 1) return "Device";
  if (e === 2) return "OperatingSystem";
  return "Unknown";
};

export default function ClinicianDashboard() {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [items, { refetch }] = createResource(getTickets);
  const list = createMemo(() => items() ?? []);
  const selected = createMemo(() => list().find((t) => t.ticketId === selectedId()) ?? null);
  const [action, setAction] = createSignal<null | { title: string; body: string; href?: string }>(null);
  const apiBase = createMemo(() => {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5176";
    return `${base.replace(/\/+$/, "")}/api`;
  });

  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">Clinical Queue</h2>
          <div class="dash-subtitle">Mock patient-ticket workflow for a doctor or nurse</div>
        </div>
        <div class="dash-actions">
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() => refetch()}
          >
            Refresh
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() =>
              setAction({
                title: "Handoff",
                body: "Prepare shift handoff notes and tasks.",
                href: "/clinical/handoff",
              })
            }
          >
            Handoff
          </button>
        </div>
      </header>

      <div class="kpi-grid">
        <KpiCard label="Assigned to Me" value="6" delta="+1" tone="indigo" />
        <KpiCard label="STAT" value="2" delta="+1" tone="rose" />
        <KpiCard label="Due in 30m" value="3" delta="0" tone="amber" />
        <KpiCard label="Completed" value="11" delta="+4" tone="teal" />
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">My Queue</div>
            <div class="panel-meta">{items.loading ? "Loading..." : `${list().length} shown`}</div>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Summary</th>
                  <th>Environment</th>
                  <th>Assigned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <For each={list()}>
                  {(t) => (
                    <tr onClick={() => setSelectedId(t.ticketId)} class="row-click">
                      <td class="mono">{t.ticketId}</td>
                      <td class="cell-title">{t.title}</td>
                      <td>{envLabel(t.environment)}</td>
                      <td>
                        <Pill
                          text={t.assigneeId ? "Assigned" : "Unassigned"}
                          tone={t.assigneeId ? "info" : "warn"}
                        />
                      </td>
                      <td>
                        <Pill text={t.isResolved ? "Resolved" : "Open"} tone={t.isResolved ? "good" : "neutral"} />
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">Action Center</div>
            <div class="panel-meta">Mock buttons</div>
          </div>
          <div class="panel-body stack">
            <div class="callout">
              <div class="callout-title">Vitals Watch</div>
              <div class="callout-sub">2 patients flagged for review in the last hour</div>
              <button
                class="btn btn-primary"
                type="button"
                onClick={() =>
                  setAction({
                    title: "Vitals Watch",
                    body: "Open the vitals watchlist for flagged patients.",
                    href: "/clinical/vitals-watch",
                  })
                }
              >
                Review Now
              </button>
            </div>

            <div class="callout">
              <div class="callout-title">Orders Pending</div>
              <div class="callout-sub">3 items waiting for signature/clarification</div>
              <button
                class="btn btn-secondary"
                type="button"
                onClick={() =>
                  setAction({
                    title: "Orders Pending",
                    body: "Review pending orders and required signatures.",
                    href: "/clinical/orders",
                  })
                }
              >
                View Orders
              </button>
            </div>

            <div class="callout">
              <div class="callout-title">Handoff Notes</div>
              <div class="callout-sub">Draft a quick summary for the next shift</div>
              <button
                class="btn btn-secondary"
                type="button"
                onClick={() =>
                  setAction({
                    title: "Draft Handoff",
                    body: "Draft a handoff note for the next shift.",
                    href: "/clinical/handoff/draft",
                  })
                }
              >
                Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={selected() !== null}
        title={selected() ? `Ticket ${selected()!.ticketId}` : "Ticket"}
        onClose={() => setSelectedId(null)}
      >
        <Show when={selected()}>
          {(t) => (
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
                <div class="modal-k">Assigned</div>
                <div class="modal-v">{t().assigneeId ? <Pill text="Assigned" tone="info" /> : <Pill text="Unassigned" tone="warn" />}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Status</div>
                <div class="modal-v">
                  <Pill text={t().isResolved ? "Resolved" : "Open"} tone={t().isResolved ? "good" : "neutral"} />
                </div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Summary</div>
                <div class="modal-v">{t().description}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Steps</div>
                <div class="modal-v">{t().stepsToReproduce}</div>
              </div>

              <div class="modal-footer">
                <button class="btn btn-secondary" type="button" onClick={() => setSelectedId(null)}>
                  Close
                </button>
                <button
                  class="btn btn-primary"
                  type="button"
                  onClick={() => window.location.assign(`${apiBase()}/tickets/${t().ticketId}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          )}
        </Show>
      </Modal>

      <Modal open={action() !== null} title={action()?.title ?? "Action"} onClose={() => setAction(null)}>
        <Show when={action()}>
          {(a) => (
            <div class="action-modal">
              <div class="action-body">{a().body}</div>
              <div class="modal-footer">
                <button class="btn btn-secondary" type="button" onClick={() => setAction(null)}>
                  Close
                </button>
                {a().href ? (
                  <button class="btn btn-primary" type="button" onClick={() => window.location.assign(a().href!)}>
                    Go
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </Show>
      </Modal>
    </section>
  );
}
