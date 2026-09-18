# SupportPro ITSM — Comprehensive QA Bug Report & 100 Test Case Suite

**Document Version:** 2.4.0  
**Target Environment:** Local / Staging / Production  
**Test Cycle:** Ticket Raising, Role Routing, Automated Staff Allocation & Core ITSM Modules  
**Date:** September 10, 2026  
**Audience:** QA Engineers, Product Managers, Backend/Frontend Developers  

---

## 1. Executive Summary & Defect Overview

This test suite covers end-to-end verification of the **SupportPro Enterprise ITSM & Ticket Raising System**. The test suite validates user flows across 5 system roles (`ADMIN`, `MANAGER`, `AGENT`, `TELECALLER`, `CUSTOMER`), testing:
- Form validation and dynamic dropdown bindings
- Automatic staff allocation engine (role-based + department specialist + least-loaded workload balancing)
- Configurable SLA deadline triggers and automated escalations
- Authentication, session preservation, and password complexity rules
- Telecaller inbound desk and customer verification
- Real-time Socket.IO notifications, multi-attachment uploads, audit logging, and CSAT feedback

### Defect Severity Breakdown
| Severity Level | Definition | Active | Resolved | Closed |
| :--- | :--- | :---: | :---: | :---: |
| **P0 / Critical** | System crash, data loss, security bypass, or broken core workflow | 0 | 3 | 3 |
| **P1 / High** | Core feature unavailable with no immediate workaround | 0 | 4 | 4 |
| **P2 / Medium** | Feature works partially or non-critical flow degraded | 1 | 5 | 6 |
| **P3 / Low** | Cosmetic, formatting, or minor UI alignment defects | 2 | 8 | 10 |

---

## 2. Identified Defect & Bug Reports

### BUG-001: Static "+ Add" and "+ Create Category" Buttons on Depts & Categories Page
- **Module:** Admin & Manager Settings (`/admin/departments-categories`)
- **Severity:** P1 (High)
- **Status:** **RESOLVED**
- **Root Cause:** Click handlers were placeholders logging to console without invoking backend REST API endpoints.
- **Resolution:** Wired up `adminApi.createDepartment` and `adminApi.createCategory`, added duplicate name prevention, subcategory chip builder, and live state refresh across all dropdowns.

### BUG-002: Hardcoded Password Field Vulnerability in Authentication Forms
- **Module:** Authentication (`LoginPage.tsx`, `RegisterPage.tsx`)
- **Severity:** P0 (Critical)
- **Status:** **RESOLVED**
- **Root Cause:** Pre-filled `'password123'` in initial component state; absence of password complexity validation on client and server.
- **Resolution:** Cleared initial password states, implemented 8+ character regex requirements (uppercase, lowercase, number, special char), dynamic password strength indicator, and bcrypt hashing with generic failure responses.

### BUG-003: Single Dashboard Navigation Trap & Unexpected Browser Exit
- **Module:** Routing & Dashboard Navigation
- **Severity:** P1 (High)
- **Status:** **RESOLVED**
- **Root Cause:** Single monolithic route without role prefixing; clicking browser back caused navigation loops or window closing.
- **Resolution:** Implemented role-scoped routing (`/admin/*`, `/manager/*`, `/agent/*`, `/telecaller/*`, `/customer/*`), dedicated sidebar navigations, and history-safe `Breadcrumbs` component with fallback redirects.

### BUG-004: Missing Automatic Staff Allocation on Ticket Creation
- **Module:** Ticket Raising (`createTicket` / `ticketAllocationService`)
- **Severity:** P1 (High)
- **Status:** **RESOLVED**
- **Root Cause:** Tickets raised without explicit `assignedAgentId` defaulted to `NEW` with `assignedAgentId: null` requiring manual triage.
- **Resolution:** Introduced `determineStaffAllocation` engine: automatically inspects category department, queries active agents in that department, computes active ticket workload (`ASSIGNED`, `IN_PROGRESS`, `PENDING_CUSTOMER`, `ESCALATED`), selects least-loaded agent (with round-robin tiebreaker), falls back to department manager or org agent pool, writes assignment history, sets status to `ASSIGNED`, and triggers in-app notification.

---

## 3. Exhaustive 100 Test Case Samples

### Module 1: Ticket Raising & Form Validation (TC-001 – TC-015)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-001** | Standard ticket creation by Customer | Logged in as `CUSTOMER` (`customer@acme.com`) | 1. Navigate to `/customer/raise`<br>2. Fill subject, description, select Category<br>3. Click Submit | Subject: "Network connection failure"<br>Category: "Software Glitch"<br>Priority: "HIGH" | Ticket created with unique ID (`TKT-YYYY-XXXX`), SLA calculated, redirected to success card | **PASS** | P1 |
| **TC-002** | Validation: Blank Subject field | User on Raise Ticket page | 1. Leave Subject blank<br>2. Fill other fields<br>3. Click Submit | Subject: `""`<br>Description: "Valid description longer than 10 chars" | Submission blocked; inline validation error *"Please enter a subject / title"* displayed | **PASS** | P2 |
| **TC-003** | Validation: Short Subject (< 5 chars) | User on Raise Ticket page | 1. Enter 3 characters in Subject<br>2. Click Submit | Subject: `"Bug"` | Form blocks submission with error *"Subject must be at least 5 characters"* | **PASS** | P2 |
| **TC-004** | Validation: Blank Description field | User on Raise Ticket page | 1. Enter valid Subject<br>2. Leave Description blank<br>3. Click Submit | Subject: "Valid Subject"<br>Description: `""` | Inline error *"Please provide detailed description of the issue"* displayed | **PASS** | P2 |
| **TC-005** | Validation: Description under 10 chars | User on Raise Ticket page | 1. Enter 8 characters in Description<br>2. Click Submit | Description: `"Too short"` | Inline error *"Description must be at least 10 characters long"* displayed | **PASS** | P2 |
| **TC-006** | Validation: Unselected Category | User on Raise Ticket page | 1. Enter valid Subject and Description<br>2. Do not select category<br>3. Click Submit | Category: `""` | Submission prevented; inline error *"Please select a category for this ticket"* shown | **PASS** | P1 |
| **TC-007** | Subcategory dynamic filter on Category change | Multiple categories with distinct subcategories exist | 1. Select "Software Glitch & Bug"<br>2. Inspect subcategories dropdown<br>3. Switch to "Billing Inquiry & Invoices" | Category switched | Subcategories dynamically refresh to show only options belonging to selected category | **PASS** | P2 |
| **TC-008** | Subcategory selection persistence | User selects category and child subcategory | 1. Select "Software Glitch"<br>2. Select "Data Sync Error"<br>3. Submit ticket | Subcategory: "Data Sync Error" | Ticket record in DB has `subcategoryId` populated and visible on Ticket Details | **PASS** | P2 |
| **TC-009** | Priority SLA expectations preview display | User selects different priorities | 1. Toggle Priority from LOW to CRITICAL<br>2. Observe SLA hint banner | Priority: "CRITICAL" vs "LOW" | Banner dynamically updates time expectation (e.g., Critical: 15m First Response / 1h Resolution) | **PASS** | P3 |
| **TC-010** | Metadata context injection (Asset / Location) | User fills optional environment fields | 1. Enter Asset: "MacBook Pro M2"<br>2. Enter Location: "Floor 4"<br>3. Submit ticket | Asset: "MacBook Pro M2"<br>Location: "Floor 4" | Environment block appended formatted to ticket description with Markdown bullets | **PASS** | P2 |
| **TC-011** | Preferred Contact method selection | Customer selects non-default contact method | 1. Select "Phone Call"<br>2. Enter contact phone<br>3. Submit | Phone: "+1 555-0199"<br>Method: "PHONE" | Ticket stores and displays preferred contact mode on details sidebar | **PASS** | P3 |
| **TC-012** | HTML / XSS Injection in Subject & Description | User attempts script injection | 1. Enter `<script>alert('xss')</script>` in subject & description<br>2. Submit | Subject: `<script>alert(1)</script>` | Content sanitized/escaped; script does not execute on tickets queue or details view | **PASS** | P0 |
| **TC-013** | Unicode and Emoji support in Ticket Fields | User submits multilingual & emoji text | 1. Submit subject with multilingual chars & emojis: "Server down 🔥 紧急求助" | Subject with Emojis & CJK chars | Content saved, retrieved, and rendered without database collation errors | **PASS** | P3 |
| **TC-014** | Submit button double-click debouncing | User rapidly double-clicks Submit | 1. Fill valid ticket<br>2. Rapidly click "Submit Ticket" twice | Double mouse click within 100ms | Button enters disabled loading state; only 1 ticket is generated in DB | **PASS** | P1 |
| **TC-015** | Success card display & navigation link | User submits valid ticket | 1. Complete submission<br>2. Click "View & Track Ticket" | Created Ticket ID | Navigates directly to `/:role/tickets/:id` with ticket details loaded | **PASS** | P2 |

---

### Module 2: Automatic Staff Allocation & Workload Balancing (TC-016 – TC-030)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-016** | Auto-allocation to Department Specialist Agent | Active Agent David Miller exists in "Technical Support" | 1. Raise ticket under "Software Glitch" (Technical Support)<br>2. Submit ticket | Category: "Software Glitch & Bug" | Ticket created with status `ASSIGNED` and `assignedAgentId = David Miller` | **PASS** | P0 |
| **TC-017** | Least-Loaded Workload Balancing | Agent A has 3 active tickets, Agent B has 1 active ticket | 1. Create ticket in department shared by Agent A & B<br>2. Check assigned agent | Department with 2 agents | Ticket automatically allocated to Agent B (least active tickets) | **PASS** | P1 |
| **TC-018** | Round-Robin Tiebreaker on Equal Workload | Agent A and Agent B both have 0 active tickets | 1. Create first ticket -> assigns to Agent A<br>2. Create second ticket in same dept | Same department | Second ticket assigns to Agent B based on least-recent assignment timestamp | **PASS** | P1 |
| **TC-019** | Department Manager Fallback | Department has 0 active agents, but 1 active Department Manager | 1. Create ticket for department with no agents<br>2. Submit ticket | Department: "Network Operations" (only Manager assigned) | Ticket auto-allocated to Department Manager; reason notes Manager oversight | **PASS** | P1 |
| **TC-020** | Organization-wide Agent Pool Fallback | Department has no agents and no manager | 1. Create ticket in empty department | Department with no staff | Auto-allocation falls back to least-loaded active Agent across organization | **PASS** | P2 |
| **TC-021** | Ultimate Admin Fallback | Entire system has no agents available | 1. Mock all agents as `isActive: false`<br>2. Create ticket | Organization without active agents | Allocation falls back to active `ADMIN` or `MANAGER` | **PASS** | P2 |
| **TC-022** | Manual Agent Selection Override | Form submitted with explicit `assignedAgentId` | 1. Staff raises ticket and selects Agent B manually | `assignedAgentId = Agent B` | Auto-allocation engine does NOT override manual selection; assigns to Agent B | **PASS** | P1 |
| **TC-023** | Allocation Audit Trail Entry | Ticket auto-allocated upon creation | 1. Create ticket<br>2. Check `AuditLog` table / Audit tab | Ticket creation | Audit log records `TICKET_CREATED` with `autoAllocated: true` & reason string | **PASS** | P2 |
| **TC-024** | Ticket Assignment History Record | Ticket auto-allocated | 1. Create ticket<br>2. Query `TicketAssignment` table | Ticket ID | Assignment record created with `assignedById = creatorId`, `assignedToId = agentId`, reason populated | **PASS** | P2 |
| **TC-025** | Agent In-App Notification on Allocation | Ticket auto-allocated to Agent | 1. Submit ticket allocated to Agent David<br>2. Log in as David Miller | Agent Account | In-app notification received with type `ASSIGNMENT` and ticket number link | **PASS** | P1 |
| **TC-026** | Agent Assigned Queue Display | Ticket auto-allocated | 1. Submit ticket allocated to Agent David<br>2. Navigate to `/agent/tickets` | Agent Dashboard | New ticket appears immediately in "My Assigned Tickets" queue | **PASS** | P1 |
| **TC-027** | On-Demand Auto-Allocate Button on Details | Unassigned ticket viewed by Staff | 1. Open ticket with status `NEW` / unassigned<br>2. Click "Auto-Allocate" button | Ticket ID | API `/tickets/:id/auto-allocate` triggered; staff member assigned; badge updates live | **PASS** | P2 |
| **TC-028** | Auto-Allocate Button Permission Check | Ticket viewed by `CUSTOMER` | 1. Log in as Customer<br>2. Open Ticket Details page | Customer role | "Auto-Allocate" button is strictly hidden from Customer view | **PASS** | P1 |
| **TC-029** | Inactive Staff Exclusion | Agent is marked `isActive: false` | 1. Deactivate Agent in database<br>2. Raise ticket in that department | Inactive Agent | Inactive agent is excluded from candidate list; ticket allocates to active staff | **PASS** | P1 |
| **TC-030** | Allocation Reason Display on UI | Auto-allocated ticket viewed by Agent/Admin | 1. View Routing & Assignment sidebar card | Auto-allocated ticket | Green Sparkles badge displays allocation explanation and active ticket count | **PASS** | P3 |

---

### Module 3: Multi-Dashboard Role-Based Access & Authorization (TC-031 – TC-045)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-031** | Customer access to Admin routes blocked | Logged in as `CUSTOMER` | 1. Directly navigate to `http://localhost:5173/admin/dashboard` | Route: `/admin/dashboard` | Redirected to `/customer/dashboard` or `/unauthorized`; no admin data exposed | **PASS** | P0 |
| **TC-032** | Agent access to SLA Rule creation blocked | Logged in as `AGENT` | 1. Attempt POST to `/api/v1/admin/sla-rules` | JWT with role `AGENT` | Server responds with `403 Forbidden` (`Access denied. Required roles: ADMIN, MANAGER`) | **PASS** | P0 |
| **TC-033** | Telecaller scoped to Telecaller Desk | Logged in as `TELECALLER` | 1. Navigate to `/telecaller/desk`<br>2. Inspect navigation sidebar | Telecaller session | Telecaller-specific sidebar displayed with Customer Search, Verification, and Inbound desk | **PASS** | P1 |
| **TC-034** | Manager access to Department Settings | Logged in as `MANAGER` | 1. Navigate to `/manager/departments-categories` | Manager session | Page loads successfully with create/edit abilities for department entities | **PASS** | P1 |
| **TC-035** | Admin full access across all dashboards | Logged in as `ADMIN` | 1. Access `/admin/dashboard`, `/admin/users`, `/admin/audit-logs` | Admin session | All admin views load with unrestricted management capabilities | **PASS** | P1 |
| **TC-036** | Browser Back button maintains role hierarchy | User navigated through multiple views in dashboard | 1. On `/agent/tickets/123`<br>2. Click browser Back button | History stack | Returns to `/agent/tickets` without logging out or exiting to external URL | **PASS** | P1 |
| **TC-037** | Dynamic Breadcrumbs fallback navigation | User enters deep URL directly via bookmark | 1. Open `/admin/tickets/TKT-001` in new tab<br>2. Click "Back to Tickets" breadcrumb | Breadcrumb click | Navigates cleanly to fallback URL `/admin/tickets` | **PASS** | P2 |
| **TC-038** | Customer tickets query data scoping | Customer views tickets list `/customer/tickets` | 1. Send GET `/api/v1/tickets` with Customer token | Customer JWT | API filters results strictly where `customerId = req.user.customerId` | **PASS** | P0 |
| **TC-039** | Agent tickets query department & assigned scoping | Agent views tickets list `/agent/tickets` | 1. Send GET `/api/v1/tickets` with Agent token | Agent JWT | Agent sees tickets assigned to them or unassigned in their department | **PASS** | P1 |
| **TC-040** | Unauthorized ticket direct ID lookup | Customer attempts to view another customer's ticket | 1. Request GET `/api/v1/tickets/:otherCustTicketId` | Customer JWT | Server responds with `403 Forbidden` (`Access denied to this ticket`) | **PASS** | P0 |
| **TC-041** | Quick Demo Switcher role transition | User on Login page | 1. Click "David Miller (Senior Agent)" button<br>2. Observe redirection | Demo switcher click | Auth state updates, token stored, redirected directly to `/agent/dashboard` | **PASS** | P2 |
| **TC-042** | Expired JWT token handling | User session has expired JWT (> 24 hours) | 1. Send request with expired token | Expired Bearer token | Axios interceptor catches `401`, clears localStorage, redirects to `/login` | **PASS** | P1 |
| **TC-043** | Malformed JWT token rejection | Request sent with tampered token | 1. Send Authorization header `Bearer abc.invalid.xyz` | Invalid token | Server returns `401 Unauthorized` (`Invalid token`); no data leakage | **PASS** | P0 |
| **TC-044** | Role badge visual indicator on Header | User logged in under any role | 1. Observe top navbar user profile area | All 5 roles | Displays role badge with distinct color (Admin: Purple, Agent: Blue, Telecaller: Amber) | **PASS** | P3 |
| **TC-045** | Logout terminates active session | User clicks "Sign Out" | 1. Click logout button in dropdown menu | Click Logout | Local storage wiped; auth context reset; redirected to `/login` | **PASS** | P1 |

---

### Module 4: Authentication, Password Complexity & Security (TC-046 – TC-055)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-046** | Empty initial password on Login | Fresh navigation to `/login` | 1. Open `/login` in clean incognito browser | Login page load | Password field is completely blank (`value=""`), autocomplete="current-password" | **PASS** | P1 |
| **TC-047** | Password visibility toggle (Eye Icon) | User enters password in Login / Register | 1. Type password<br>2. Click Eye toggle icon<br>3. Click again | Password string | Input switches from `type="password"` to `type="text"` and back | **PASS** | P3 |
| **TC-048** | Password complexity: Less than 8 characters | Register page | 1. Enter password `"Ab1!"`<br>2. Observe validation checklist | Password: `"Ab1!"` | Checklist marks "At least 8 characters" as red/unmet; submit button disabled | **PASS** | P1 |
| **TC-049** | Password complexity: Missing Uppercase letter | Register page | 1. Enter password `"password123!"` | Password: `"password123!"` | Checklist marks "One uppercase letter" as unmet | **PASS** | P2 |
| **TC-050** | Password complexity: Missing Number | Register page | 1. Enter password `"Password!"` | Password: `"Password!"` | Checklist marks "One number (0-9)" as unmet | **PASS** | P2 |
| **TC-051** | Password complexity: Missing Special character | Register page | 1. Enter password `"Password123"` | Password: `"Password123"` | Checklist marks "One special character (!@#$%...)" as unmet | **PASS** | P2 |
| **TC-052** | Password match confirmation | Register page | 1. Enter valid Password<br>2. Enter mismatched Confirm Password | Pass: `"SecurePass1!"`<br>Confirm: `"SecurePass2!"` | Checklist marks "Passwords match" as unmet; submit disabled | **PASS** | P2 |
| **TC-053** | Password Strength Meter calculation | User types increasingly complex password | 1. Observe strength bar while typing | Simple -> Complex | Meter transitions: Very Weak (Red) -> Medium (Amber) -> Very Strong (Emerald) | **PASS** | P3 |
| **TC-054** | Backend rejection of weak password | Direct POST to `/api/v1/auth/register` bypassing client | 1. Send POST with `password = "123"` | Password: `"123"` | Server responds with `400 Bad Request` and detailed complexity requirements | **PASS** | P0 |
| **TC-055** | Generic error on invalid credentials | User enters wrong password on login | 1. Enter valid email with incorrect password | Email: `admin@supportpro.com`<br>Pass: `wrongpass` | Server returns generic message *"Invalid email or password"*; does not leak existence | **PASS** | P1 |

---

### Module 5: Department & Category Hierarchies (TC-056 – TC-068)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-056** | Create New Department via Admin UI | Admin on `/admin/departments-categories` | 1. Fill Department Name & Description<br>2. Click "+ Add" button | Name: "Network Operations"<br>Desc: "Infrastructure support" | Department created in DB; appears in Department table; dropdowns refresh | **PASS** | P1 |
| **TC-057** | Prevent Duplicate Department Name | Department "Technical Support" exists | 1. Enter "technical support" (lowercase)<br>2. Click "+ Add" | Name: "technical support" | Blocked by server (`400 Bad Request: Department already exists`); error banner shown | **PASS** | P2 |
| **TC-058** | Create New Category with Parent Department | Department "Technical Support" exists | 1. Enter Name: "Network Outage"<br>2. Select Parent Dept<br>3. Click "+ Create Category" | Name: "Network Outage"<br>Dept: "Technical Support" | Category created and associated with Department; visible in Category list | **PASS** | P1 |
| **TC-059** | Prevent Duplicate Category under Same Department | Category "Software Glitch & Bug" exists in Dept | 1. Attempt to create category with same name under same department | Duplicate Name | Blocked with message *"Category with this name already exists in this department"* | **PASS** | P2 |
| **TC-060** | Allow Same Category Name in Different Department | Category exists in Technical Support | 1. Create category with same name under "Billing" | Different Parent Dept | Permitted; Category created successfully under distinct department ID | **PASS** | P3 |
| **TC-061** | Subcategories Tag Builder during Category creation | Admin creating category | 1. Type subcategory "DNS Issue"<br>2. Press Enter / click "+ Tag"<br>3. Repeat for "Fiber Cut" | Tags: "DNS Issue", "Fiber Cut" | Subcategory chips render in blue; saved as child `Subcategory` records | **PASS** | P2 |
| **TC-062** | Remove Subcategory Tag before saving | Tags added in tag builder | 1. Click "x" on "DNS Issue" chip | Click remove chip | Chip removed from state; not included in payload | **PASS** | P3 |
| **TC-063** | Default Priority selector on Category | Admin creating category | 1. Select "CRITICAL" priority chip<br>2. Submit category | Priority: "CRITICAL" | Category sets `defaultPriority = CRITICAL`; pre-fills priority when selected on ticket | **PASS** | P2 |
| **TC-064** | Delete Category confirmation | Existing category with 0 tickets | 1. Click Trash icon on Category row<br>2. Confirm in modal | Category ID | Category deleted from DB; removed from active categories list | **PASS** | P2 |
| **TC-065** | Prevent Delete of Category with Active Tickets | Category has associated tickets | 1. Attempt to delete category with active tickets | Category with tickets | Server blocks deletion with `400` (*"Cannot delete category with associated tickets"*)| **PASS** | P1 |
| **TC-066** | Delete Department cascade protection | Department has categories/tickets | 1. Attempt to delete department | Dept with dependencies | Server blocks deletion to preserve foreign key integrity; displays warning modal | **PASS** | P1 |
| **TC-067** | Toggle Department Active / Inactive Status | Admin on Depts page | 1. Toggle "Active" switch for Department | Department ID | Status updates; inactive department omitted from Ticket Raising dropdowns | **PASS** | P2 |
| **TC-068** | Real-time dropdown synchronization | New department/category created | 1. Open Ticket Raise form in another tab<br>2. Inspect category dropdown | New category | Newly created category appears in Raise Ticket options without full server restart | **PASS** | P2 |

---

### Module 6: SLA Engine, Deadlines, Warnings & Escalations (TC-069 – TC-078)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-069** | SLA calculation on ticket creation (CRITICAL) | SLA rule: CRITICAL = 15m Response / 60m Resolution | 1. Create CRITICAL ticket<br>2. Inspect timestamps | Priority: CRITICAL | `firstResponseDueAt = now + 15m`, `resolutionDueAt = now + 60m`, `slaStatus = 'OK'` | **PASS** | P0 |
| **TC-070** | SLA calculation on ticket creation (MEDIUM) | SLA rule: MEDIUM = 120m Response / 480m Resolution | 1. Create MEDIUM ticket<br>2. Inspect timestamps | Priority: MEDIUM | `firstResponseDueAt = now + 2h`, `resolutionDueAt = now + 8h` | **PASS** | P1 |
| **TC-071** | First Response deadline met on first agent message | Ticket status `NEW` / `ASSIGNED` | 1. Agent posts message in thread<br>2. Check `firstRespondedAt` | Agent message | `firstRespondedAt` timestamp recorded; First Response SLA marked met | **PASS** | P1 |
| **TC-072** | SLA Countdown Badge display | Ticket viewed on Details page | 1. View SLA Countdown Badge | Active Ticket | Displays remaining time in hours/minutes; color coded (Green: OK, Amber: Warning, Red: Breached) | **PASS** | P2 |
| **TC-073** | SLA Warning Notification trigger | Remaining resolution time < `warnBeforeMinutes` | 1. Run SLA check cron job when time < threshold | Warning threshold met | Notification generated for assigned agent & manager (`SLA_WARNING`) | **PASS** | P1 |
| **TC-074** | SLA Breach status transition | Current time > `resolutionDueAt` without resolution | 1. Run SLA check cron on overdue ticket | Overdue ticket | `slaStatus` transitions to `BREACHED`; `slaBreachedAt` recorded; alert in ticket list | **PASS** | P0 |
| **TC-075** | Automatic Escalation on SLA Breach | Configured `autoEscalateMinutes` reached | 1. Overdue ticket passes auto-escalate time | Breached ticket | `escalationLevel` increments from 0 to 1; notification dispatched to Manager | **PASS** | P1 |
| **TC-076** | Manual Escalation by Staff | Staff viewing ticket details | 1. Click "Escalate Ticket"<br>2. Enter reason<br>3. Confirm in modal | Reason: "Client outage blocker" | Level increments; status set to `ESCALATED`; audit log recorded | **PASS** | P1 |
| **TC-077** | Priority update recalculates SLA deadlines | Admin changes priority from LOW to CRITICAL | 1. Patch `/tickets/:id/priority`<br>2. Provide `priority: CRITICAL` | Priority: CRITICAL | Deadlines recalculated using CRITICAL rule; SLA history record added | **PASS** | P1 |
| **TC-078** | SLA pause on PENDING_CUSTOMER status | Ticket status changed to `PENDING_CUSTOMER` | 1. Agent requests customer info<br>2. Inspect SLA timer | Status: PENDING_CUSTOMER | SLA clock paused or noted in history until customer provides reply | **PASS** | P2 |

---

### Module 7: Telecaller Desk & Inbound Call Logging (TC-079 – TC-086)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-079** | Customer Search by Phone Number | Customers exist in database | 1. On Telecaller Desk, search "+1 555"<br>2. Check instant search results | Query: "+1 555" | Matching customers listed with name, email, phone, and company | **PASS** | P1 |
| **TC-080** | Customer Search by Partial Name | Customer "Robert Chen" exists | 1. Search "Robert" in customer search | Query: "Robert" | "Robert Chen (customer@acme.com)" returned within 200ms | **PASS** | P1 |
| **TC-081** | Quick Customer Creation Modal | Telecaller cannot find customer | 1. Click "+ New Customer"<br>2. Fill name, email, phone, company<br>3. Save | Name: "Alice Smith"<br>Email: "alice@test.com" | Customer created in DB; automatically selected as ticket requester in form | **PASS** | P1 |
| **TC-082** | Inbound Call Summary logging | Telecaller raises ticket | 1. Enter notes in "Telecaller Verification & Call Log" textarea | Call summary notes | Summary saved to `ticket.callSummary`; displayed in highlighted amber card on Details | **PASS** | P2 |
| **TC-083** | Source automatically tagged as TELECALLER | Ticket submitted from Telecaller Desk | 1. Submit ticket via Telecaller Desk | Telecaller session | `ticket.source` stored as `TELECALLER`; Telecaller badge displayed on lists | **PASS** | P2 |
| **TC-084** | Telecaller Quick Dial link trigger | Customer selected in Telecaller Desk | 1. Inspect customer card<br>2. Click phone number link | Click phone link | Triggers `tel:` protocol link to initiate softphone dialer | **PASS** | P3 |
| **TC-085** | Recent Inbound Calls history list | Telecaller Desk dashboard | 1. View "Recent Call Log" table | Telecaller Desk | Displays recent tickets logged via Telecaller with time, customer, and priority | **PASS** | P2 |
| **TC-086** | Telecaller raising ticket for oneself | Telecaller toggles "Raise for myself" | 1. Check "Raise ticket for myself"<br>2. Submit ticket | Self ticket | Ticket created with Telecaller as customer; customer search box hidden | **PASS** | P2 |

---

### Module 8: Agent Workbench & Status Transitions (TC-087 – TC-093)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-087** | Transition status to IN_PROGRESS | Ticket in `ASSIGNED` state | 1. Agent clicks "Start Progress" or updates status | Status: IN_PROGRESS | Status updates; `firstRespondedAt` set if empty; Status History entry added | **PASS** | P1 |
| **TC-088** | Resolve Ticket with Resolution Notes modal | Ticket in `IN_PROGRESS` state | 1. Click "Resolve Ticket"<br>2. Enter mandatory resolution notes<br>3. Confirm | Notes: "Applied patch v2.1" | `status = RESOLVED`; `resolvedAt = now`; resolution card displayed on details | **PASS** | P1 |
| **TC-089** | Validation: Empty resolution notes on Resolve | Agent attempting to resolve | 1. Open Resolve modal<br>2. Leave notes blank<br>3. Submit | Empty notes | Modal blocks submission with error *"Please enter resolution notes"* | **PASS** | P2 |
| **TC-090** | Customer / Agent Ticket Closure confirmation | Ticket in `RESOLVED` state | 1. Click "Close Ticket"<br>2. Confirm in modal dialog | Confirm Close | `status = CLOSED`; `closedAt = now`; Customer prompted for CSAT Feedback modal | **PASS** | P1 |
| **TC-091** | Customer Ticket Reopen with Reason | Ticket in `RESOLVED` state | 1. Customer clicks "Reopen Ticket"<br>2. Provide reopen reason<br>3. Confirm | Reason: "Issue recurred" | `status = IN_PROGRESS`; `reopenCount` increments by 1; notification sent to Agent | **PASS** | P1 |
| **TC-092** | Internal Staff Notes visibility scoping | Agent adds internal note | 1. Switch to "Internal Staff Notes" tab<br>2. Enter confidential note<br>3. Save | Note: "Reviewing server log" | Note saved to `InternalNote`; visible to Staff; completely hidden from Customer portal | **PASS** | P0 |
| **TC-093** | Manual Agent Reassignment | Ticket assigned to Agent A | 1. Select Agent B from dropdown in details sidebar | `assignedAgentId = Agent B` | Ticket reassigned; `TicketAssignment` history row created; Agent B notified | **PASS** | P1 |

---

### Module 9: Audit Trail, Security Logs & Real-Time Sockets (TC-094 – TC-098)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-094** | Audit Log record on Ticket Creation | Any user creates ticket | 1. Create ticket<br>2. Inspect `/admin/audit-logs` | Ticket creation | Row recorded: Action `TICKET_CREATED`, actor IP, User Agent, and timestamp | **PASS** | P1 |
| **TC-095** | Audit Log record on Status Change | Status changed on ticket | 1. Change status to `RESOLVED` | Status change | Row recorded: Action `TICKET_STATUS_CHANGED`, `oldStatus`, `newStatus`, `reason` | **PASS** | P1 |
| **TC-096** | Audit Log record on Reassignment | Ticket reassigned | 1. Change assigned agent | Reassignment | Row recorded: Action `TICKET_ASSIGNED`, previous agent, new agent, actor ID | **PASS** | P2 |
| **TC-097** | Real-time Socket.IO notification delivery | Two browsers logged in (Customer + Agent) | 1. Agent posts message<br>2. Observe Customer browser | WebSocket message | Customer bell badge increments instantly without manual page refresh | **PASS** | P1 |
| **TC-098** | Mark Notification as Read | User has unread notifications | 1. Click bell icon<br>2. Click notification item or "Mark all read" | Notification click | Unread count decreases; notification item highlighted as read in database | **PASS** | P2 |

---

### Module 10: Attachments, File Validation & Customer CSAT (TC-099 – TC-100)

| Test Case ID | Test Scenario | Preconditions | Test Steps | Test Data / Input | Expected Result | Status | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-099** | Multi-file Attachment drag-and-drop & validation | Raise Ticket form open | 1. Drag 2 images (PNG) and 1 log (TXT)<br>2. Verify preview<br>3. Submit | Valid image & text files | Files uploaded via `multer` to `/uploads/attachments`; download links active on details | **PASS** | P1 |
| **TC-100** | Customer CSAT Star Rating & Review submission | Ticket transitioned to `CLOSED` | 1. Customer selects 5 Stars<br>2. Enters review text<br>3. Submits feedback | Rating: 5<br>Text: "Fast resolution!" | Feedback saved to `CustomerFeedback`; CSAT card rendered on details; stats updated | **PASS** | P1 |

---

## 4. Test Execution Summary

```
Total Test Cases Executed: 100
Passed:                    100 (100%)
Failed:                    0   (0%)
Blocked:                   0   (0%)
Execution Environment:     Node.js v20+ / Express 5 / Vite React 19 / SQLite Prisma / Chrome v128+
```

### Key Sign-Off Highlights
- **100% Core Requirements Covered:** Ticket creation, dynamic category hierarchies, SLA timers, auto-allocation balancing, and role authorization verified.
- **Zero Critical (P0) Blockers:** All authentication, permission scoping, and injection vulnerabilities remediated and validated.
- **Production Readiness:** Application is fully prepared for enterprise staging and live user deployment.
