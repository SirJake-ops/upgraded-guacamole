import "./App.css";
import { Route, Router } from "@solidjs/router";
import AppShell from "./components/app/AppShell";
import HomeRoute from "./components/routes/HomeRoute";
import TicketDetailRoute from "./components/routes/TicketDetailRoute";

function App() {
  return (
    <Router>
      <Route path="/" component={AppShell}>
        <Route path="/" component={HomeRoute} />
        <Route path="/tickets/:ticketId" component={TicketDetailRoute} />
      </Route>
    </Router>
  );
}

export default App;
