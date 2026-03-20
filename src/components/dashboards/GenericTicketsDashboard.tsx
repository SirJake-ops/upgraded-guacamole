import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import KpiCard from "./ui/KpiCard";
import Pill from "./ui/Pill";
import Sparkline from "./ui/Sparkline";
import Modal from "../ui/modals/Modal.tsx";
import {
  createTicket as createTicketApi,
  getTickets,
  type CreateTicketInput,
  type Ticket,
} from "../../api/tickets";

type GenericTicketsDashboardProps = {
  currentUserId: string;
};

const envLabel = (e: Ticket["environment"]) => {
  if (typeof e === "string") return e;
  if (e === 0) return "Browser";
  if (e === 1) return "Device";
  if (e === 2) return "OperatingSystem";
  return "Unknown";
};

export default function GenericTicketsDashboard(props: GenericTicketsDashboardProps) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [action, setAction] = createSignal<null | { title: string; body: string; href?: string }>(null);
  const [items, { refetch }] = createResource(getTickets);
  const list = createMemo(() => items() ?? []);
  const selected = createMemo(() => list().find((t) => t.ticketId === selectedId()) ?? null);

  const openCount = createMemo(() => list().filter((t) => !t.isResolved).length);
  const resolvedCount = createMemo(() => list().filter((t) => t.isResolved).length);
  const unassignedCount = createMemo(() => list().filter((t) => !t.assigneeId).length);

  const [createOpen, setCreateOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [createError, setCreateError] = createSignal<string | null>(null);
  const [env, setEnv] = createSignal<CreateTicketInput["environment"]>(0);
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [steps, setSteps] = createSignal("");
  const [expected, setExpected] = createSignal("");

  const openCreate = () => {
    setCreateError(null);
    setEnv(0);
    setTitle("");
    setDescription("");
    setSteps("");
    setExpected("");
    setCreateOpen(true);
  };

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
          <button class="btn btn-secondary" type="button" onClick={() => openCreate()}>
            New Ticket
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            onClick={() =>
              setAction({
                title: "Export Tickets",
                body: "Export isn’t wired yet.",
              })
            }
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
            <button class="chip" type="button" onClick={() => setAction({ title: "Filter", body: "Not wired yet." })}>
              Open
            </button>
            <button class="chip" type="button" onClick={() => setAction({ title: "Filter", body: "Not wired yet." })}>
              Resolved
            </button>
            <button class="chip" type="button" onClick={() => setAction({ title: "Filter", body: "Not wired yet." })}>
              Unassigned
            </button>
            <button class="chip" type="button" onClick={() => setAction({ title: "Filter", body: "Not wired yet." })}>
              Assigned
            </button>
            <button class="chip" type="button" onClick={() => setAction({ title: "Filter", body: "Not wired yet." })}>
              Browser
            </button>
            <button class="chip" type="button" onClick={() => setAction({ title: "Clear Filters", body: "Not wired yet." })}>
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
                <th>No.</th>
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
                    <td class="mono">#{t.ticketNumber}</td>
                    <td class="cell-title">{t.title}</td>
                    <td>{envLabel(t.environment)}</td>
                    <td>
                      <Pill text={t.assigneeId ? "Assigned" : "Unassigned"} tone={t.assigneeId ? "info" : "warn"} />
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
        title={selected() ? `Ticket #${selected()!.ticketNumber}` : "Ticket"}
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
                <div class="modal-v mono">{t().submitterId.slice(0, 8)}</div>
              </div>
              <div class="modal-row">
                <div class="modal-k">Assignee</div>
                <div class="modal-v mono">{t().assigneeId ? t().assigneeId.slice(0, 8) : "unassigned"}</div>
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
                  onClick={() => navigate(`/tickets/${t().ticketId}`)}
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

      <Modal open={createOpen()} title="Create Ticket" onClose={() => (saving() ? null : setCreateOpen(false))}>
        <form
          class="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setCreateError(null);
            try {
              await createTicketApi({
                submitterId: props.currentUserId,
                environment: env(),
                title: title().trim(),
                description: description().trim(),
                stepsToReproduce: steps().trim(),
                expectedResult: expected().trim(),
              });
              setCreateOpen(false);
              await refetch();
            } catch (err) {
              setCreateError(err instanceof Error ? err.message : "Failed to create ticket");
            } finally {
              setSaving(false);
            }
          }}
        >
          <label class="field">
            <span class="label">Environment</span>
            <select
              class="select"
              value={env()}
              onInput={(e) => setEnv(Number(e.currentTarget.value) as 0 | 1 | 2)}
              disabled={saving()}
            >
              <option value="0">Browser</option>
              <option value="1">Device</option>
              <option value="2">Operating System</option>
            </select>
          </label>

          <label class="field">
            <span class="label">Title</span>
            <input
              type="text"
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder="Short summary"
              required
              disabled={saving()}
            />
          </label>

          <label class="field">
            <span class="label">Description</span>
            <textarea
              class="textarea"
              value={description()}
              onInput={(e) => setDescription(e.currentTarget.value)}
              placeholder="What’s happening?"
              required
              disabled={saving()}
              rows={4}
            />
          </label>

          <label class="field">
            <span class="label">Steps To Reproduce</span>
            <textarea
              class="textarea"
              value={steps()}
              onInput={(e) => setSteps(e.currentTarget.value)}
              placeholder="1. ... 2. ..."
              required
              disabled={saving()}
              rows={4}
            />
          </label>

          <label class="field">
            <span class="label">Expected Result</span>
            <textarea
              class="textarea"
              value={expected()}
              onInput={(e) => setExpected(e.currentTarget.value)}
              placeholder="What should happen?"
              required
              disabled={saving()}
              rows={3}
            />
          </label>

          {createError() ? <div class="auth-error">{createError()}</div> : null}

          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" onClick={() => setCreateOpen(false)} disabled={saving()}>
              Cancel
            </button>
            <button class="btn btn-primary" type="submit" disabled={saving()}>
              {saving() ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
