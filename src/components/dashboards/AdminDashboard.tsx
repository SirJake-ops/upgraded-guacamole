import { For, Show, createSignal } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import Sparkline from "./ui/Sparkline";
import { adminIssues } from "../../mock/dashboardData";
import Modal from "../ui/modals/Modal.tsx";

const severityTone = (s: string) => {
  if (s === "S1") return "bad";
  if (s === "S2") return "warn";
  return "neutral";
};

export default function AdminDashboard() {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const selected = () => adminIssues.find((t) => t.id === selectedId()) ?? null;
  const [action, setAction] = createSignal<null | { title: string; body: string; href?: string }>(null);

  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">Hospital Operations</h2>
          <div class="dash-subtitle">Admin view: staffing, incidents, and integration health</div>
        </div>
        <div class="dash-actions">
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() =>
              setAction({
                title: "Create Incident",
                body: "Create and assign a new operational incident.",
                href: "/admin/incidents/new",
              })
            }
          >
            Create Incident
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() =>
              setAction({
                title: "Audit Log",
                body: "Review access and operational audit events.",
                href: "/admin/audit",
              })
            }
          >
            Audit Log
          </button>
        </div>
      </header>

      <div class="kpi-grid">
        <KpiCard label="Active Incidents" value="3" delta="+1" tone="rose" />
        <KpiCard label="Interfaces Up" value="17/18" delta="-1" tone="amber" />
        <KpiCard label="Avg Triage Time" value="7m" delta="-2m" tone="teal" />
        <KpiCard label="Coverage Gaps" value="1" delta="+1" tone="indigo" />
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">Throughput</div>
            <div class="panel-meta">Mock metrics</div>
          </div>
          <div class="panel-body split">
            <div class="split-col">
              <div class="metric">
                <div class="metric-label">ED arrivals</div>
                <div class="metric-value">142</div>
              </div>
              <div class="metric">
                <div class="metric-label">Left without being seen</div>
                <div class="metric-value">3</div>
              </div>
              <div class="metric">
                <div class="metric-label">Bed turnover</div>
                <div class="metric-value">34</div>
              </div>
            </div>
            <div class="split-col">
              <Sparkline points={[72, 75, 70, 78, 84, 90, 96, 102, 97, 110, 118, 142]} />
              <div class="spark-caption">Arrivals</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">Controls</div>
            <div class="panel-meta">Mock actions</div>
          </div>
          <div class="panel-body chip-grid">
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Page On-Call",
                  body: "Notify the current on-call team.",
                  href: "/admin/on-call",
                })
              }
            >
              Page on-call
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Broadcast Status",
                  body: "Send a status update to stakeholders.",
                  href: "/admin/status",
                })
              }
            >
              Broadcast status
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Downtime Procedure",
                  body: "Open downtime workflow and checklists.",
                  href: "/admin/downtime",
                })
              }
            >
              Downtime procedure
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Interface Report",
                  body: "View interface uptime and latency summary.",
                  href: "/admin/interfaces",
                })
              }
            >
              Interface report
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Staffing View",
                  body: "Review staffing gaps and coverage.",
                  href: "/admin/staffing",
                })
              }
            >
              Staffing view
            </button>
            <button
              class="chip"
              type="button"
              onClick={() =>
                setAction({
                  title: "Settings",
                  body: "Open administrative settings.",
                  href: "/admin/settings",
                })
              }
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">Active Issues</div>
          <div class="panel-meta">Mock data</div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Department</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Title</th>
                <th>Owner</th>
                <th>ETA</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <For each={adminIssues}>
                {(i) => (
                  <tr onClick={() => setSelectedId(i.id)} class="row-click">
                    <td class="mono">{i.id}</td>
                    <td>{i.department}</td>
                    <td>{i.category}</td>
                    <td>
                      <Pill text={i.severity} tone={severityTone(i.severity)} />
                    </td>
                    <td class="cell-title">{i.title}</td>
                    <td>{i.owner}</td>
                    <td>{i.eta}</td>
                    <td>{i.updatedAt}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={selected() !== null}
        title={selected() ? `Issue ${selected()!.id}` : "Issue"}
        onClose={() => setSelectedId(null)}
      >
        <Show when={selected()}>
          {(i) => (
            <div class="modal-grid">
              <div class="modal-row">
                <div class="modal-k">Title</div>
                <div class="modal-v">{i().title}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Department</div>
                <div class="modal-v">{i().department}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Category</div>
                <div class="modal-v">{i().category}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Severity</div>
                <div class="modal-v">
                  <Pill text={i().severity} tone={severityTone(i().severity)} />
                </div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Owner</div>
                <div class="modal-v">{i().owner}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">ETA</div>
                <div class="modal-v">{i().eta}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Updated</div>
                <div class="modal-v">{i().updatedAt}</div>
              </div>

              <div class="modal-footer">
                <button class="btn btn-secondary" type="button" onClick={() => setSelectedId(null)}>
                  Close
                </button>
                <button
                  class="btn btn-primary"
                  type="button"
                  onClick={() => window.location.assign(i().url)}
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
