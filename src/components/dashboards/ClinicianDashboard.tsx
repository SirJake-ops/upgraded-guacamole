import { For } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import { patientTickets } from "../../mock/dashboardData";

const priorityTone = (p: string) => {
  if (p === "STAT") return "bad";
  if (p === "Urgent") return "warn";
  return "neutral";
};

export default function ClinicianDashboard() {
  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">Clinical Queue</h2>
          <div class="dash-subtitle">Mock patient-ticket workflow for a doctor or nurse</div>
        </div>
        <div class="dash-actions">
          <button class="btn btn-secondary" type="button" onClick={() => alert("Refresh queue")}>
            Refresh
          </button>
          <button class="btn btn-secondary" type="button" onClick={() => alert("Handoff")}>
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
                    <tr onClick={() => alert(`Open patient ticket ${t.id}`)} class="row-click">
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
              <button class="btn btn-primary" type="button" onClick={() => alert("Open vitals watch")}>
                Review Now
              </button>
            </div>

            <div class="callout">
              <div class="callout-title">Orders Pending</div>
              <div class="callout-sub">3 items waiting for signature/clarification</div>
              <button class="btn btn-secondary" type="button" onClick={() => alert("Open pending orders")}>
                View Orders
              </button>
            </div>

            <div class="callout">
              <div class="callout-title">Handoff Notes</div>
              <div class="callout-sub">Draft a quick summary for the next shift</div>
              <button class="btn btn-secondary" type="button" onClick={() => alert("Draft handoff")}>
                Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

