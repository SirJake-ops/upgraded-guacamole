import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import Sparkline from "./ui/Sparkline";
import Modal from "../ui/Modal";
import { getTickets, type Ticket } from "../../api/tickets";

const envLabel = (e: Ticket["environment"]) => {
  if (typeof e === "string") return e;
  if (e === 0) return "Browser";
  if (e === 1) return "Device";
  if (e === 2) return "OperatingSystem";
  return "Unknown";
};

export default function GenericTicketsDashboard() {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [action, setAction] = createSignal<null | { title: string; body: string; href?: string }>(null);
  const [items, { refetch }] = createResource(getTickets);
  const list = createMemo(() => items() ?? []);
  const selected = createMemo(() => list().find((t) => t.ticketId === selectedId()) ?? null);
  const apiBase = createMemo(() => {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5176";
    return `${base.replace(/\/+$/, "")}/api`;
  });

  const openCount = createMemo(() => list().filter((t) => !t.isResolved).length);
  const resolvedCount = createMemo(() => list().filter((t) => t.isResolved).length);
  const unassignedCount = createMemo(() => list().filter((t) => !t.assigneeId).length);

  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">Ticket Overview</h2>
          <div class="dash-subtitle">
            {items.loading ? "Loading tickets..." : "Tickets from /api/tickets (role-filtered by backend)"}
          </div>
        </div>
        <div class="dash-actions">
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() => {
              setSelectedId(null);
              setAction({
                title: "Create Ticket",
                body: "This UI isn’t wired yet. Your backend create route is POST /api/tickets.",
              });
            }}
          >
            New Ticket
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() => {
              setSelectedId(null);
              setAction({
                title: "Export Tickets",
                body: "Export isn’t wired yet. This will be driven by your backend later.",
              });
            }}
          >
            Export
          </button>
          <button class="btn btn-secondary" type="button" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </header>

      <div class="kpi-grid">
        <KpiCard label="Open" value={`${openCount()}`} tone="teal" />
        <KpiCard label="Resolved" value={`${resolvedCount()}`} tone="indigo" />
        <KpiCard label="Unassigned" value={`${unassignedCount()}`} tone="amber" />
        <KpiCard label="Total" value={`${list().length}`} tone="rose" />
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">Queue Trend</div>
            <div class="panel-meta">Mock trend line</div>
          </div>
          <div class="panel-body split">
            <div class="split-col">
              <div class="metric">
                <div class="metric-label">Created</div>
                <div class="metric-value">24</div>
              </div>
              <div class="metric">
                <div class="metric-label">Resolved</div>
                <div class="metric-value">19</div>
              </div>
              <div class="metric">
                <div class="metric-label">Avg first response</div>
                <div class="metric-value">18m</div>
              </div>
            </div>
            <div class="split-col">
              <Sparkline points={[10, 12, 11, 15, 14, 16, 18, 17, 19, 21, 20, 18]} />
              <div class="spark-caption">Open tickets</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">Quick Filters</div>
            <div class="panel-meta">Modal only (not wired)</div>
          </div>
          <div class="panel-body chip-grid">
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter",
                  body: "Filtering isn’t wired yet. The backend already role-filters ticket visibility.",
                })
              }
            >
              Open
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter",
                  body: "Filtering isn’t wired yet. The backend already role-filters ticket visibility.",
                })
              }
            >
              Resolved
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter",
                  body: "Filtering isn’t wired yet. The backend already role-filters ticket visibility.",
                })
              }
            >
              Unassigned
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter",
                  body: "Filtering isn’t wired yet. The backend already role-filters ticket visibility.",
                })
              }
            >
              Assigned
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter",
                  body: "Filtering isn’t wired yet. The backend already role-filters ticket visibility.",
                })
              }
            >
              Browser
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Clear Filters",
                  body: "Filtering isn’t wired yet.",
                })
              }
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">Tickets</div>
          <div class="panel-meta">{items.loading ? "Loading..." : `${list().length} shown`}</div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
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
                <div class="modal-v">
                  <Pill text={t().assigneeId ? "Assigned" : "Unassigned"} tone={t().assigneeId ? "info" : "warn"} />
                </div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Status</div>
                <div class="modal-v">
                  <Pill text={t().isResolved ? "Resolved" : "Open"} tone={t().isResolved ? "good" : "neutral"} />
                </div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Submitter</div>
                <div class="modal-v mono">{t().submitterId}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Assignee</div>
                <div class="modal-v mono">{t().assigneeId ?? "null"}</div>
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
