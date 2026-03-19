# Ticketing Dashboard System -- User Stories

## Epic 1: User Authentication

### Story 1: User Login

**As a** system user\
**I want to** log into the application\
**So that** I can access the ticket management dashboard.

**Acceptance Criteria** - User can enter username/email and password -
Login request is sent to the .NET API authentication endpoint - API
returns a JWT or session token - Token is stored securely in the
frontend - User is redirected to the appropriate dashboard - Invalid
credentials return an error message

- [x] User can now login proper
------------------------------------------------------------------------

### Story 2: Authentication Validation

**As a** logged-in user\
**I want** my session validated on protected routes\
**So that** unauthorized users cannot access dashboards.

**Acceptance Criteria** - Token is sent with each API request - API
validates token - Invalid or expired tokens redirect the user back to
the login page - User session persists during refresh if token is valid

- [x] User can log in and is authenticated and has a session tied to them
------------------------------------------------------------------------

# Epic 2: Dashboard Overview

### Story 3: View Ticket Dashboard

**As a** support staff user\
**I want to** see a dashboard overview of tickets\
**So that** I can quickly understand system workload.

**Acceptance Criteria** - Dashboard displays ticket statistics: - Open
tickets - Tickets in progress - Waiting tickets - SLA risk tickets -
Data is retrieved from the backend API - Dashboard refreshes
automatically or via manual reload - Layout renders correctly across
screen sizes

- [x] User when logged in can see their roles can see tickets
- [ ] User cannot create tickets yet TBD
------------------------------------------------------------------------

### Story 4: View Ticket Queue Trends

**As a** system user\
**I want to** view ticket trend metrics\
**So that** I can track ticket creation and resolution patterns.

**Acceptance Criteria** - Dashboard shows metrics such as: - Tickets
created - Tickets resolved - Average first response time - Trend graph
updates dynamically based on API data

------------------------------------------------------------------------

# Epic 3: Ticket List Management

### Story 5: View Ticket List

**As a** system user\
**I want to** see a list of recent tickets\
**So that** I can quickly access active support requests.

**Acceptance Criteria** - Ticket table displays: - Ticket ID - Title -
Requester - Status - Priority - Last updated time - Ticket data loads
from the backend API - Table supports sorting or filtering if available

------------------------------------------------------------------------

### Story 6: Open Ticket Preview

**As a** system user\
**I want to** click a ticket from the dashboard\
**So that** I can view summary information about that ticket.

**Acceptance Criteria** - Clicking a ticket row opens a ticket preview
modal - Modal displays: - Ticket ID - Title - Requester - Status -
Priority - Tags - Last updated timestamp - Modal can be closed without
navigation

------------------------------------------------------------------------

# Epic 4: Ticket Detail View

### Story 7: Navigate to Ticket Detail Page

**As a** system user\
**I want to** view the full ticket detail page\
**So that** I can review the complete ticket information.

**Acceptance Criteria** - Clicking "View Details" in the preview modal
navigates to `/tickets/{ticketId}` - Ticket detail page retrieves data
from the API - Page displays: - Ticket description - Activity log -
Status - Assigned user - Attachments - Comments or discussion thread

------------------------------------------------------------------------

# Epic 5: Ticket Filtering

### Story 8: Filter Tickets

**As a** system user\
**I want to** filter tickets by category\
**So that** I can quickly locate relevant issues.

**Acceptance Criteria** Users can filter tickets by: - Critical -
Authentication / SSO - Reporting - Unassigned - Stale (\>24 hours)

Filtered results update the ticket list dynamically.

------------------------------------------------------------------------

# Epic 6: Ticket Creation

### Story 9: Create New Ticket

**As a** system user\
**I want to** create a new ticket\
**So that** I can report an issue or request support.

**Acceptance Criteria** - User clicks "New Ticket" - Ticket form opens -
Required fields: - Title - Description - Priority - Tags - Submission
sends request to backend API - New ticket appears in the ticket list

------------------------------------------------------------------------

# Epic 7: Role-Based Dashboards

### Story 10: Role-Based Dashboard Access

**As a** system user\
**I want** the dashboard to adjust based on my role\
**So that** I see only relevant ticket data.

**Acceptance Criteria** Different roles display different dashboard
views:

  Role              Dashboard
  ----------------- -----------------------------------
  General Support   Full ticket dashboard
  Doctor/Nurse      Limited medical system tickets
  Hospital Admin    Administrative and system tickets

Access control is enforced via backend role validation.

------------------------------------------------------------------------

# Optional Feature

### Story 11: Ticket Export

**As a** system administrator\
**I want to** export ticket data\
**So that** I can analyze system performance.

**Acceptance Criteria** - User clicks "Export" - Data is downloaded as
CSV - Export includes filtered results if filters are applied
