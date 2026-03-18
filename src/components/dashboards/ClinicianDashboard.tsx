import { For, Show, createSignal } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import { patientTickets } from "../../mock/dashboardData";
import Modal from "../ui/Modal";

const priorityTone = (p: string) => {
  if (p === "STAT") return "bad";
  if (p === "Urgent") return "warn";
  return "neutral";
};

export default function ClinicianDashboard() {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const selected = () => patientTickets.find((t) => t.id === selectedId()) ?? null;
  const [action, setAction] = createSignal<null | { title: string; body: string; href?: string }>(null);

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
            onClick={() =>
              setAction({
                title: "Refresh Queue",
                body: "Refresh the clinical queue from the backend (mock modal).",
              })
            }
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
            <div class="panel-title">Triage Queue</div>
            <div class="panel-meta">Click a row to open</div>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Unit</th>
                  <th>Summary</th>
                  <th>Priority</th>
                  <th>Assigned</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                <For each={patientTickets}>
                  {(t) => (
                    <tr onClick={() => setSelectedId(t.id)} class="row-click">
                      <td class="mono">{t.id}</td>
                      <td class="cell-title">{t.patient}</td>
                      <td>{t.unit}</td>
                      <td>
                        <div class="cell-title">{t.summary}</div>
                        <div class="cell-tags">
                          <For each={t.flags}>{(f) => <span class="tag tag-soft">{f}</span>}</For>
                        </div>
                      </td>
                      <td>
                        <Pill text={t.priority} tone={priorityTone(t.priority)} />
                      </td>
                      <td>{t.assignedTo ?? "Unassigned"}</td>
                      <td>{t.updatedAt}</td>
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
        title={selected() ? `Patient Ticket ${selected()!.id}` : "Patient Ticket"}
        onClose={() => setSelectedId(null)}
      >
        <Show when={selected()}>
          {(t) => (
            <div class="modal-grid">
              <div class="modal-row">
                <div class="modal-k">Patient</div>
                <div class="modal-v">{t().patient}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Unit</div>
                <div class="modal-v">{t().unit}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Priority</div>
                <div class="modal-v">
                  <Pill text={t().priority} tone={priorityTone(t().priority)} />
                </div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Assigned</div>
                <div class="modal-v">{t().assignedTo ?? "Unassigned"}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Summary</div>
                <div class="modal-v">{t().summary}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Flags</div>
                <div class="modal-v">
                  <div class="cell-tags">
                    <For each={t().flags}>{(f) => <span class="tag tag-soft">{f}</span>}</For>
                  </div>
                </div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Updated</div>
                <div class="modal-v">{t().updatedAt}</div>
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
