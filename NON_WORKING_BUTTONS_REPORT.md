# SupportPro ITSM — Non-Working & Missing Buttons Report

**Report Date:** September 10, 2026  
**Module Scope:** Entire Application (Admin, Agent, Telecaller, Customer Dashboards & Workbenches)  
**Target Audience:** Senior Full-Stack Developers / Engineering Leads  
**Purpose:** Identify missing, incomplete, or static UI buttons to prioritize implementation and bug fixes.

---

## Executive Summary

A comprehensive code and UI inspection was performed across the **SupportPro ITSM** frontend and backend codebases. While major buttons like "+ Add Department", "+ Create Category", and "Auto-Allocate Staff" have been made fully dynamic and operational, several key operational buttons and lifecycle transitions are either missing, static, or lack backend event wiring.

---

## 1. Incomplete Lifecycle & Workflow Action Buttons (High Priority)

### 1.1 "Resume Work / Back to In Progress" Button
* **Location:** Ticket Details Workbench (`src/client/src/pages/Tickets/TicketDetailsPage.tsx`)
* **Status:** **✅ RESOLVED & OPERATIONAL**
* **Delivered Fix:**
  - Added dynamic `<button onClick={() => handleStatusChange('IN_PROGRESS')}>Resume Work</button>` when ticket is in `WAITING_FOR_CUSTOMER` status.
  - Added `<button onClick={() => handleStatusChange('IN_PROGRESS')}>Start Progress</button>` when ticket is in `ASSIGNED` status.

---

## 2. Missing CRUD & Account Management Buttons (High Priority)

### 2.1 "Edit User / Deactivate / Reset Password" Actions
* **Location:** User & Role Management Table (`src/client/src/pages/Admin/UserManagementPage.tsx`)
* **Status:** **✅ RESOLVED & OPERATIONAL**
* **Delivered Fix:**
  - **Backend:** Added `PUT /admin/users/:id`, `PATCH /admin/users/:id/toggle-status`, `POST /admin/users/:id/reset-password`, and safe `DELETE /admin/users/:id` (with ticket history safeguard).
  - **Frontend:** Added Actions column in User Directory table with:
    1. **Edit User Profile modal** (update Full Name, Phone, Role, Department).
    2. **Toggle Status** (instantly toggle between Active and Suspended).
    3. **Reset Password modal** (generate and apply new temporary password).
    4. **Delete User confirmation dialog** (with relational integrity protection).
  - Trigger a password reset
  - Remove/delete obsolete accounts

### 2.2 "+ Add Custom SLA Policy" Button
* **Location:** SLA Rule Engine (`src/client/src/pages/Admin/SlaConfigPage.tsx`)
* **Status:** **✅ RESOLVED & OPERATIONAL**
* **Delivered Fix:**
  - **Backend:** Added `createSlaRule` (`POST /admin/sla-rules`) and `deleteSlaRule` (`DELETE /admin/sla-rules/:id`) in `adminController.ts`.
  - **Frontend:** Added `+ Add SLA Policy` button in `SlaConfigPage.tsx` with modal dialog supporting Category scoping, Priority selection, First Response deadline, Resolution deadline, and Escalation Thresholds, plus custom rule deletion.

---

## 3. Missing Export & Batch Utility Buttons (Medium Priority)

### 3.1 "Export to CSV / Excel" Buttons
* **Locations:**
  1. Ticket Queue Management (`src/client/src/pages/Tickets/TicketListPage.tsx`)
  2. Compliance & Audit Activity Trail (`src/client/src/pages/Admin/AuditLogsPage.tsx`)
* **Status:** **✅ RESOLVED & OPERATIONAL**
* **Delivered Fix:**
  - Added dedicated **"Export CSV"** button with icon in `TicketListPage.tsx` that downloads sanitized ticket queue records (ticket number, customer, status, priority, SLA deadline, timestamps).
  - Added **"Export to CSV"** button in `AuditLogsPage.tsx` that exports audit records into `audit_logs_YYYY-MM-DD.csv`.

### 3.2 Bulk Selection & Batch Actions Toolbar
* **Location:** Ticket Queue Management (`src/client/src/pages/Tickets/TicketListPage.tsx`)
* **Status:** **✅ RESOLVED & OPERATIONAL**
* **Delivered Fix:**
  - **Backend:** Added `bulkUpdateTickets` (`PATCH /api/v1/tickets/batch`) with support for batch status transitions, agent reassignments, assignment records, and audit events.
  - **Frontend:** Added multi-select checkbox column in table header and ticket rows, plus dynamic floating Bulk Actions Bar with:
    1. **Count indicator** (`X tickets selected`) & **Deselect All**
    2. **Mark In Progress** button
    3. **Batch Resolve** button
    4. **Batch Close** button
    5. **Reassign to Agent** dropdown & Apply button for Admins and Managers.

---

## 4. Static Elements Styled as Buttons / Missing Triggers (Low Priority)

### 4.1 Fiscal Period Selector Pill
* **Location:** Admin & Manager Dashboard Header (`src/client/src/pages/Dashboard/AdminDashboard.tsx`)
* **Status:** **✅ RESOLVED & OPERATIONAL**
* **Delivered Fix:**
  - Converted static text badge into an interactive dropdown selector with options: All Time, Today, Past 7 Days, Current Month, Q1 FY 2025–26, Q2 FY 2025–26, Q3 FY 2025–26, Q4 FY 2025–26, and Year to Date (YTD).
  - Wired backend `getDashboardStats` in `analyticsController.ts` to accept `period` / `timeRange` and calculate metrics based on ticket creation dates.

### 4.2 Global `⌘K` / `Ctrl+K` Keyboard Shortcut Trigger
* **Location:** Top Navigation Bar (`src/client/src/components/layout/Navbar.tsx`)
* **Status:** **✅ RESOLVED & OPERATIONAL**
* **Delivered Fix:**
  - Added `useEffect` global `keydown` event listener in `Navbar.tsx` that listens for `(e.metaKey || e.ctrlKey) && e.key === 'k'`.
  - Automatically focuses and selects the search input on shortcut or clicking the `⌘K` badge.

---

## Summary Action Checklist

| Priority | Feature / Button | Target File | Status / Delivered Action |
| :--- | :--- | :--- | :--- |
| **High** | `Resume Work` Button | `TicketDetailsPage.tsx` | **✅ RESOLVED** — Transition from `WAITING_FOR_CUSTOMER` / `ASSIGNED` to `IN_PROGRESS` |
| **High** | `Edit / Suspend / Delete / Reset User` | `UserManagementPage.tsx` | **✅ RESOLVED** — Full actions column, Edit Profile modal, Toggle Status, Password Reset, Delete |
| **Medium** | `+ Add SLA Rule` | `SlaConfigPage.tsx` | **✅ RESOLVED** — Category-scoped SLA policies modal, creation and deletion APIs |
| **Medium** | `Export to CSV` | `TicketListPage.tsx`, `AuditLogsPage.tsx` | **✅ RESOLVED** — Direct CSV download utilities on Ticket Queue and Audit Trail |
| **Medium** | `Bulk Actions Bar` | `TicketListPage.tsx` | **✅ RESOLVED** — Checkboxes, batch status updates, and agent reassignment toolbar |
| **Low** | `Fiscal Period Dropdown` | `AdminDashboard.tsx` | **✅ RESOLVED** — Interactive quarter & time-range analytics filter |
| **Low** | `⌘K Shortcut Listener` | `Navbar.tsx` | **✅ RESOLVED** — Global keyboard shortcut and badge click to focus search bar |
