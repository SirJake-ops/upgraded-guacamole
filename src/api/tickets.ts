import type { User } from "./auth";

const auth_base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5176";
const api_base = `${auth_base.replace(/\/+$/, "")}/api`;

export type Ticket = {
  ticketId: string;
  ticketNumber: number;
  submitterId: string;
  assigneeId: string | null;
  environment: number | string;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  isResolved: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getTickets(): Promise<Ticket[]> {
  const res = await fetch(`${api_base}/tickets`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`GET /api/tickets failed (${res.status})`);
  return (await res.json()) as Ticket[];
}

export type CreateTicketInput = {
  submitterId: string;
  environment: 0 | 1 | 2;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
};

export type TicketResponse = {
  ticketId: string;
  ticketNumber: number;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  environment: string;
  submitterId: string;
  assigneeId: string;
  createdAt: string;
  isResolved: boolean;
};

export async function createTicket(input: CreateTicketInput): Promise<TicketResponse> {
  const res = await fetch(`${api_base}/tickets`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      submitterId: input.submitterId,
      environment: input.environment,
      title: input.title,
      description: input.description,
      stepsToReproduce: input.stepsToReproduce,
      expectedResult: input.expectedResult,
      files: [],
      isResolved: false,
    }),
  });
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `POST /api/tickets failed (${res.status})`);
  }
  return (await res.json()) as TicketResponse;
}

export async function getTicketById(ticketId: string): Promise<Ticket> {
  const res = await fetch(`${api_base}/tickets/${ticketId}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error(`GET /api/tickets/${ticketId} failed (${res.status})`);
  return (await res.json()) as Ticket;
}

export type TicketMessage = {
  messageId: number;
  ticketId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const res = await fetch(`${api_base}/tickets/${ticketId}/messages`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error(`GET /api/tickets/${ticketId}/messages failed (${res.status})`);
  return (await res.json()) as TicketMessage[];
}

export async function createTicketMessage(ticketId: string, body: string): Promise<TicketMessage> {
  const res = await fetch(`${api_base}/tickets/${ticketId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ body }),
  });
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `POST /api/tickets/${ticketId}/messages failed (${res.status})`);
  }
  return (await res.json()) as TicketMessage;
}

export const canSeeAdmin = (u: User | null) => (u?.role ?? "").toLowerCase() === "admin";
export const isClinician = (u: User | null) => {
  const r = (u?.role ?? "").toLowerCase();
  return r === "doctor" || r === "nurse";
};
