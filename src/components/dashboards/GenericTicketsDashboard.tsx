import { For } from "solid-js";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import Sparkline from "./ui/Sparkline";
import { tickets } from "../../mock/dashboardData";

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
  return (
    <section class="dash">
      <header class="dash-header">
        <div>
          <h2 class="dash-title">Ticket Overview</h2>
          <div class="dash-subtitle">Queues, status, and movement across the last 24 hours</div>
        </div>
        <div class="dash-actions">
          <button class="btn btn-secondary" type="button" onClick={() => alert("New ticket")}>
            New Ticket
          </button>
          <button class="btn btn-secondary" type="button" onClick={() => alert("Export")}>
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
            <button class="chip" type="button" onClick={() => alert("Filter: critical")}>
              Critical
            </button>
            <button class="chip" type="button" onClick={() => alert("Filter: auth/sso")}>
              Auth / SSO
            </button>
            <button class="chip" type="button" onClick={() => alert("Filter: reporting")}>
              Reporting
            </button>
            <button class="chip" type="button" onClick={() => alert("Filter: unassigned")}>
              Unassigned
            </button>
            <button class="chip" type="button" onClick={() => alert("Filter: stale > 24h")}>
              Stale &gt; 24h
            </button>
            <button class="chip" type="button" onClick={() => alert("Clear filters")}>
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
                  <tr onClick={() => alert(`Open ticket ${t.id}`)} class="row-click">
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
    </section>
  );
}

