import { For, Show, createSignal } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import Sparkline from "./ui/Sparkline";
import { tickets } from "../../mock/dashboardData";
import Modal from "../ui/Modal";

const statusTone = (s: string) => {
  if (s === "Resolved") return "good";
  if (s === "Waiting") return "info";
  if (s === "In Progress") return "warn";
  return "neutral";
};

const priorityTone = (p: string) => {
  if (p === "Critical") return "bad";
  if (p === "High") return "warn";
  if (p === "Medium") return "info";
  return "neutral";
};

export default function GenericTicketsDashboard() {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const selected = () => tickets.find((t) => t.id === selectedId()) ?? null;
  const [action, setAction] = createSignal<null | { title: string; body: string; href?: string }>(null);

  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">Ticket Overview</h2>
          <div class="dash-subtitle">Queues, status, and movement across the last 24 hours</div>
        </div>
        <div class="dash-actions">
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() => {
              setSelectedId(null);
              setAction({
                title: "Create Ticket",
                body: "Start a new ticket. This is a mock modal for now; wire it to your .NET create-ticket flow.",
                href: "/tickets/new",
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
                body: "Export current ticket results. Add format/filters later.",
                href: "/tickets/export",
              });
            }}
          >
            Export
          </button>
        </div>
      </header>

      <div class="kpi-grid">
        <KpiCard label="Open" value="18" delta="+3" tone="teal" />
        <KpiCard label="In Progress" value="7" delta="-1" tone="indigo" />
        <KpiCard label="Waiting" value="5" delta="+2" tone="amber" />
        <KpiCard label="SLA Risk" value="2" delta="+1" tone="rose" />
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
            <div class="panel-meta">Buttons just alert for now</div>
          </div>
          <div class="panel-body chip-grid">
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter: Critical",
                  body: "Shows critical-priority tickets.",
                  href: "/tickets?priority=critical",
                })
              }
            >
              Critical
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter: Auth / SSO",
                  body: "Shows tickets tagged auth or sso.",
                  href: "/tickets?tag=auth,sso",
                })
              }
            >
              Auth / SSO
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter: Reporting",
                  body: "Shows tickets tagged reporting.",
                  href: "/tickets?tag=reporting",
                })
              }
            >
              Reporting
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Filter: Unassigned",
                  body: "Shows tickets that are not assigned.",
                  href: "/tickets?assigned=false",
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
                  title: "Filter: Stale (> 24h)",
                  body: "Shows tickets that have not been updated in over 24 hours.",
                  href: "/tickets?stale=24h",
                })
              }
            >
              Stale &gt; 24h
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Clear Filters",
                  body: "Returns to the unfiltered ticket list.",
                  href: "/tickets",
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
          <div class="panel-title">Latest Tickets</div>
          <div class="panel-meta">Mock data</div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <For each={tickets}>
                {(t) => (
                  <tr onClick={() => setSelectedId(t.id)} class="row-click">
                    <td class="mono">{t.id}</td>
                    <td>
                      <div class="cell-title">{t.title}</div>
                      <div class="cell-tags">
                        <For each={t.tags}>{(tag) => <span class="tag">{tag}</span>}</For>
                      </div>
                    </td>
                    <td>{t.requester}</td>
                    <td>
                      <Pill text={t.status} tone={statusTone(t.status)} />
                    </td>
                    <td>
                      <Pill text={t.priority} tone={priorityTone(t.priority)} />
                    </td>
                    <td>{t.updatedAt}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={selected() !== null}
        title={selected() ? `Ticket ${selected()!.id}` : "Ticket"}
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
                <div class="modal-k">Requester</div>
                <div class="modal-v">{t().requester}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Status</div>
                <div class="modal-v">
                  <Pill text={t().status} tone={statusTone(t().status)} />{" "}
                  <Pill text={t().priority} tone={priorityTone(t().priority)} />
                </div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Updated</div>
                <div class="modal-v">{t().updatedAt}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Tags</div>
                <div class="modal-v">
                  <div class="cell-tags">
                    <For each={t().tags}>{(tag) => <span class="tag">{tag}</span>}</For>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn btn-secondary" type="button" onClick={() => setSelectedId(null)}>
                  Close
                </button>
                <button
                  class="btn btn-primary"
                  type="button"
                  onClick={() => window.location.assign(t().url)}
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
