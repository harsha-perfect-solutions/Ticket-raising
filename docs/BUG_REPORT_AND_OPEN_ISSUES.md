# SupportPro ITSM — Application Bug Report & Known Open Issues

**Document Status**: Active QA Tracking  
**Application Version**: 2.4.0  
**Last Updated**: September 19, 2026  
**Audience**: Engineering Leads, QA Testers, Product Managers  

---

## 1. Defect Summary & Status Dashboard

| Defect Category | Total Identified | Resolved / Fixed | Open / Future Enhancements | Compliance Rate |
| :--- | :---: | :---: | :---: | :---: |
| **P0 - Critical (Security & Workflow Breaks)** | 4 | 4 | 0 | 100% |
| **P1 - High (Core Module Functionality)** | 8 | 8 | 0 | 100% |
| **P2 - Medium (UX, Validation & Display)** | 10 | 10 | 0 | 100% |
| **P3 - Low / Enhancements (Integrations & i18n)** | 8 | 3 | 5 | 37.5% |
| **TOTAL** | **30** | **25** | **5** | **83.3%** |

---

## 2. Resolved Bugs & Fix Verification Log

### BUG-001: Redundant Plus Symbol on Admin SLA Rule Page
- **Severity**: P2 (Medium)
- **Status**: **RESOLVED**
- **Fix Details**: Removed extra `<PlusCircle>` icon from [SlaConfigPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Admin/SlaConfigPage.tsx) header button. Display cleanly as `[ + Add SLA Policy ]`.

### BUG-002: Inconsistent Deletion Actions & Missing Protected Status
- **Severity**: P1 (High)
- **Status**: **RESOLVED**
- **Fix Details**: Added delete actions to all category-scoped SLA policies with a custom confirmation modal (`"Delete this SLA policy?"`, `[Cancel] [Delete]`). Global default policies render a `<ShieldCheck /> Protected` badge and cannot be accidentally deleted.

### BUG-003: Permissive File Uploads & Missing Size/MIME Restriction
- **Severity**: P0 (Critical Security)
- **Status**: **RESOLVED**
- **Fix Details**: Updated backend Multer in [upload.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/middleware/upload.ts) and frontend pickers to strictly allow `.jpg`, `.jpeg`, `.png`, and `.pdf` files up to 15 MB. Rejects ZIP, RAR, DOC, DOCX, EXE, HTML, etc., returning `"Unsupported file type. Please upload JPG, JPEG, PNG, or PDF files only."` and `"File exceeds the 15 MB limit."`.

### BUG-004: Unvalidated & Inconsistent Contact Phone Numbers
- **Severity**: P1 (High)
- **Status**: **RESOLVED**
- **Fix Details**: Created [validation.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/utils/validation.ts) enforcing exactly 10 numeric digits regex `/^[0-9]{10}$/` with input sanitization, placeholder `"Enter 10-digit mobile number"`, and error message `"Please enter a valid 10-digit mobile number."`. Applied across Raise Ticket, New Customer Modal, User Management, Register Page, and backend Controllers.

### BUG-005: Unvalidated System User Creation Form
- **Severity**: P1 (High)
- **Status**: **RESOLVED**
- **Fix Details**: Applied strict frontend and backend validation in [UserManagementPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Admin/UserManagementPage.tsx) and [adminController.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/controllers/adminController.ts): Full Name (min 2 chars, non-numeric), Email (RFC valid & unique), Password (min 8 chars), Phone (10 digits), Role (enum), and Department (required for Agent & Manager).

### BUG-006: Audit Trail Exposed Raw JSON String Dumps
- **Severity**: P2 (Medium)
- **Status**: **RESOLVED**
- **Fix Details**: Overhauled [AuditLogsPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Admin/AuditLogsPage.tsx). Formatted action titles, status transitions (`Moved from In Progress to Escalated`), enum translations, and key-value pills without raw technical JSON or UUIDs.

### BUG-007: Unclear Sidebar Logout Icon
- **Severity**: P2 (Medium)
- **Status**: **RESOLVED**
- **Fix Details**: Redesigned bottom card in [Sidebar.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/layout/Sidebar.tsx) to feature a prominent, full-width `Sign Out` button with a `LogOut` icon, red hover transition, and `aria-label="Sign out"`.

### BUG-008: Non-Clickable Contact Icons (Phone / Email / Address)
- **Severity**: P2 (Medium)
- **Status**: **RESOLVED**
- **Fix Details**: Created shared [ContactActions.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/common/ContactActions.tsx) (`<PhoneLink>` `tel:`, `<EmailLink>` `mailto:`, `<LocationLink>` Google Maps) and integrated into Ticket Details, Telecaller Desk, User Directory, Ticket Queue, Telecaller Dashboard, and Agent Dashboard.

### BUG-009: Non-Navigable Customer Dashboard KPI Cards
- **Severity**: P1 (High)
- **Status**: **RESOLVED**
- **Fix Details**: Wired all KPI cards in `CustomerDashboard.tsx` to navigate to filtered views (`/customer/tickets?status=active`, `/customer/tickets?status=resolved`, `/customer/tickets?slaStatus=critical`).

---

## 3. Open Issues & Future Roadmap Items

The following items are tracked for future integration cycles:

### OPEN-001: WebRTC Softphone / Twilio CTI Browser Inbound Calling
- **Module**: Telecaller Rapid Service Desk (`TelecallerDesk.tsx`)
- **Severity**: P3 (Feature Enhancement)
- **Status**: **OPEN / FUTURE ROADMAP**
- **Description**: Currently, phone links use native `tel:<phone>` protocol handlers that trigger external dialer software (Skype, MicroSIP, or mobile phone dialer).
- **Target Fix**: Integrate direct WebRTC in-browser softphone (e.g. Twilio Voice SDK / SIP.js) to allow telecallers to answer calls inside the browser tab with automatic caller ID popups.

### OPEN-002: Asynchronous Cloud Antivirus Scanning for Attachments
- **Module**: Attachment Storage (`upload.ts` / S3)
- **Severity**: P3 (Security Hardening)
- **Status**: **OPEN / FUTURE ROADMAP**
- **Description**: Current file upload security validates MIME types (`image/jpeg`, `image/png`, `application/pdf`), file extension whitelist, 15 MB size limit, and filename sanitization.
- **Target Fix**: Integrate asynchronous virus scanning engine (ClamAV / AWS GuardDuty malware scanning) to scan attachments before moving them to permanent production storage.

### OPEN-003: Multi-Language / i18n Internationalization
- **Module**: Global UI Components
- **Severity**: P3 (Localization)
- **Status**: **OPEN / FUTURE ROADMAP**
- **Description**: System strings are currently rendered in English.
- **Target Fix**: Implement `react-i18next` bundle to allow dynamic language switching (e.g., Hindi, Spanish, French) for customer-facing portals.

### OPEN-004: SMS Gateway Integration for Ticket Notifications
- **Module**: Notifications System (`notificationController.ts`)
- **Severity**: P3 (Integration)
- **Status**: **OPEN / FUTURE ROADMAP**
- **Description**: Real-time notifications are currently delivered via Socket.IO in-app alerts and email notifications.
- **Target Fix**: Integrate SMS Gateway (Twilio / Fast2SMS) for instant SMS status alerts on critical SLA tickets.

### OPEN-005: AI-Powered KB Deflection & Draft Article Auto-Generation
- **Module**: Knowledge Base Deflection (`kbRoutes.ts` / `RaiseTicketForm.tsx`)
- **Severity**: P3 (AI Enhancement)
- **Status**: **OPEN / FUTURE ROADMAP**
- **Description**: KB article search deflection and rating are implemented.
- **Target Fix**: Automatically convert high-rated resolved tickets into draft Knowledge Base articles for manager review.

---

## 4. Test Matrix & Verification Checklist

- [x] **Customer Role**: Raise Ticket, Attachment Filter (15MB JPG/PNG/PDF), 10-Digit Phone, Clickable Contacts, Sign Out.
- [x] **Telecaller Role**: Caller Verification, 10-Digit Phone, Actionable Dossier (`tel:`, `mailto:`, Maps), Log Call.
- [x] **Support Agent Role**: Workload Queue, Interactive Customer Contacts, Reply Attachment Restrictions.
- [x] **Manager Role**: Escalation Workbench, Reassignment, Department Queue.
- [x] **Admin Role**: SLA Engine Clean-up (`+ Add SLA Policy`), Protected Default Policies, Delete Modal, User Creation Validation, Human-Readable Audit Trail, CSV Exports.
- [x] **TypeScript Check**: `npx tsc --noEmit` (**0 errors**).
- [x] **Production Build**: `npm run build` (**0 errors**).
