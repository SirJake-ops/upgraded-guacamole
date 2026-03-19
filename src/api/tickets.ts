import type { User } from "./auth";

const auth_base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5176";
const api_base = `${auth_base.replace(/\/+$/, "")}/api`;

export type Ticket = {
  ticketId: string;
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

export const canSeeAdmin = (u: User | null) => (u?.role ?? "").toLowerCase() === "admin";
export const isClinician = (u: User | null) => {
  const r = (u?.role ?? "").toLowerCase();
  return r === "doctor" || r === "nurse";
};

