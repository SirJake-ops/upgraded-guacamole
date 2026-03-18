export type TicketStatus = "Open" | "In Progress" | "Waiting" | "Resolved";
export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export type Ticket = {
  id: string;
  title: string;
  requester: string;
  status: TicketStatus;
  priority: TicketPriority;
  updatedAt: string;
  tags: string[];
};

export type PatientTicket = {
  id: string;
  patient: string;
  unit: string;
  summary: string;
  priority: "Routine" | "Urgent" | "STAT";
  assignedTo?: string;
  updatedAt: string;
  flags: string[];
};

export type AdminIssue = {
  id: string;
  department: string;
  category: "Access" | "Integration" | "Staffing" | "Reporting" | "Incident";
  severity: "S1" | "S2" | "S3";
  title: string;
  owner: string;
  updatedAt: string;
  eta: string;
};

export const tickets: Ticket[] = [
  {
    id: "TCK-1042",
    title: "Printer won’t connect on 3rd floor",
    requester: "Facilities",
    status: "Open",
    priority: "Medium",
    updatedAt: "Today 09:14",
    tags: ["hardware", "network"],
  },
  {
    id: "TCK-1041",
    title: "Password reset request (SSO mismatch)",
    requester: "Student Worker",
    status: "In Progress",
    priority: "High",
    updatedAt: "Today 08:41",
    tags: ["auth", "sso"],
  },
  {
    id: "TCK-1036",
    title: "Export CSV missing headers in report view",
    requester: "Admin Office",
    status: "Waiting",
    priority: "Low",
    updatedAt: "Yesterday 15:02",
    tags: ["ui", "reporting"],
  },
  {
    id: "TCK-1031",
    title: "API returns 500 when creating ticket with attachment",
    requester: "Integration Bot",
    status: "In Progress",
    priority: "Critical",
    updatedAt: "Yesterday 13:28",
    tags: ["api", "bug"],
  },
  {
    id: "TCK-1024",
    title: "Can we add a new queue for lab requests?",
    requester: "Operations",
    status: "Resolved",
    priority: "Low",
    updatedAt: "Mon 11:10",
    tags: ["config"],
  },
];

export const patientTickets: PatientTicket[] = [
  {
    id: "PT-8841",
    patient: "Jordan M.",
    unit: "ED - Bay 7",
    summary: "Chest pain workup; EKG pending review",
    priority: "STAT",
    assignedTo: "Dr. Patel",
    updatedAt: "Today 09:21",
    flags: ["troponin", "ekg"],
  },
  {
    id: "PT-8837",
    patient: "Casey R.",
    unit: "ICU - 12A",
    summary: "Vent settings check; agitation after sedation change",
    priority: "Urgent",
    assignedTo: "Nurse Lewis",
    updatedAt: "Today 08:57",
    flags: ["vent", "sedation"],
  },
  {
    id: "PT-8820",
    patient: "Morgan S.",
    unit: "Med/Surg - 5C",
    summary: "Discharge paperwork; med rec needs signature",
    priority: "Routine",
    updatedAt: "Yesterday 16:10",
    flags: ["discharge", "med-rec"],
  },
  {
    id: "PT-8816",
    patient: "Taylor K.",
    unit: "Ortho - 2B",
    summary: "Post-op pain escalation; order clarification requested",
    priority: "Urgent",
    assignedTo: "Dr. Nguyen",
    updatedAt: "Yesterday 14:34",
    flags: ["post-op", "pain"],
  },
];

export const adminIssues: AdminIssue[] = [
  {
    id: "ADM-211",
    department: "Radiology",
    category: "Integration",
    severity: "S2",
    title: "PACS interface latency spikes during peak hours",
    owner: "IT Ops",
    updatedAt: "Today 09:03",
    eta: "Today 17:00",
  },
  {
    id: "ADM-206",
    department: "Emergency",
    category: "Staffing",
    severity: "S1",
    title: "Triage coverage gap: 11:00-14:00",
    owner: "House Sup",
    updatedAt: "Today 08:12",
    eta: "Today 11:00",
  },
  {
    id: "ADM-199",
    department: "Billing",
    category: "Reporting",
    severity: "S3",
    title: "Monthly reconciliation export missing payer group column",
    owner: "Data Team",
    updatedAt: "Yesterday 12:46",
    eta: "Thu 10:30",
  },
  {
    id: "ADM-193",
    department: "Pharmacy",
    category: "Access",
    severity: "S2",
    title: "New hire provisioning stuck in pending state",
    owner: "IAM",
    updatedAt: "Mon 16:05",
    eta: "Wed 13:00",
  },
];

