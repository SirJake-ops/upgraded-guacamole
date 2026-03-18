export type AppEvent =
  | { type: "TicketCreated"; payload: { ticket_id: string; subject: string } }
  | { type: "TicketUpdated"; payload: { ticket_id: string } };

