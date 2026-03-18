import { For } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import Sparkline from "./ui/Sparkline";
import { adminIssues } from "../../mock/dashboardData";

const severityTone = (s: string) => {
  if (s === "S1") return "bad";
  if (s === "S2") return "warn";
  return "neutral";
};

export default function AdminDashboard() {
  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">Hospital Operations</h2>
          <div class="dash-subtitle">Admin view: staffing, incidents, and integration health</div>
        </div>
        <div class="dash-actions">
          <button class="btn btn-secondary" type="button" onClick={() => alert("Create incident")}>
            Create Incident
          </button>
          <button class="btn btn-secondary" type="button" onClick={() => alert("Open audit log")}>
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
            <button class="chip" type="button" onClick={() => alert("Page on-call")}>
              Page on-call
            </button>
            <button class="chip" type="button" onClick={() => alert("Broadcast status")}>
              Broadcast status
            </button>
            <button class="chip" type="button" onClick={() => alert("Downtime procedure")}>
              Downtime procedure
            </button>
            <button class="chip" type="button" onClick={() => alert("Interface report")}>
              Interface report
            </button>
            <button class="chip" type="button" onClick={() => alert("Staffing view")}>
              Staffing view
            </button>
            <button class="chip" type="button" onClick={() => alert("Open settings")}>
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
                  <tr onClick={() => alert(`Open admin issue ${i.id}`)} class="row-click">
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
    </section>
  );
}

