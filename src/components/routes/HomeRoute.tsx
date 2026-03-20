import AdminDashboard from "../dashboards/AdminDashboard";
import ClinicianDashboard from "../dashboards/ClinicianDashboard";
import GenericTicketsDashboard from "../dashboards/GenericTicketsDashboard";
import { useAppShell } from "../app/AppShell";

export default function HomeRoute() {
  const shell = useAppShell();
  const authed = () => shell.user() !== null;

  return (
    <>
      {authed() && shell.view() === "tickets" ? <GenericTicketsDashboard currentUserId={shell.user()!.id} /> : null}
      {authed() && shell.view() === "clinical" ? <ClinicianDashboard /> : null}
      {authed() && shell.view() === "admin" ? <AdminDashboard /> : null}
    </>
  );
}

