# ResolveHub ITSM — Pull Request & Release Notes
> **powered by HPS(OPC) Pvt. Ltd.**

**PR Title**: `feat(global-ux): ResolveHub Enterprise Rebranding, Validation, Security & Multi-Tenancy`  
**Branch**: `main` / `release/v2.4.0`  
**Target Release**: ResolveHub ITSM v2.4.0 (powered by HPS(OPC) Pvt. Ltd.)  

---

## 🚀 Summary of Changes

This release delivers major platform-wide UX enhancements, security hardening, strict input validation, human-readable audit logging, and actionable contact links across all 5 user roles (`CUSTOMER`, `TELECALLER`, `AGENT`, `MANAGER`, `ADMIN`).

---

## 🔑 Key Features Delivered

### 1. SLA Engine Clean-up & Universal Delete Action
- **SLA Page Icon Removal**: Removed redundant `<PlusCircle>` icon from [SlaConfigPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Admin/SlaConfigPage.tsx) header button, keeping the button clean as `[ + Add SLA Policy ]`.
- **Universal Delete Action**: Every policy with a `categoryId` now features a Delete action. Global fallback policies are labeled with a `<ShieldCheck /> Protected` badge and tooltip.
- **Confirmation Modal**: Integrated custom [ConfirmationModal.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/common/ConfirmationModal.tsx) (`"Delete this SLA policy?"`, `[Cancel] [Delete]`) for safe policy removal.
- **Departments & Categories**: Updated [DepartmentsCategoriesPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Admin/DepartmentsCategoriesPage.tsx) to remove duplicate plus icons and use `ConfirmationModal`.

### 2. File Attachment Restrictions (15 MB JPG, JPEG, PNG, PDF Only)
- **Backend Filter**: Updated Multer middleware in [upload.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/middleware/upload.ts) to restrict uploads to `image/jpeg`, `image/png`, `application/pdf` and `.jpg`, `.jpeg`, `.png`, `.pdf` extensions. Max file size: 15 MB.
- **Error Messages**:
  - Format rejection: `"Unsupported file type. Please upload JPG, JPEG, PNG, or PDF files only."`
  - Size rejection: `"File exceeds the 15 MB limit."`
- **Global Error Handler**: Updated [app.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/app.ts) to intercept `MulterError` and send clean HTTP 400 responses.
- **Frontend File Pickers**: Updated [RaiseTicketForm.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/tickets/RaiseTicketForm.tsx) and [TicketDetailsPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Tickets/TicketDetailsPage.tsx) with strict `accept` filters and validation.

### 3. Contact Phone 10-Digit Validation
- **Standardized Format**: Enforced 10 numeric digits regex `/^[0-9]{10}$/` with input sanitization.
- **Placeholder & Error**: Placeholder `"Enter 10-digit mobile number"`, error `"Please enter a valid 10-digit mobile number."`.
- **Applied Forms**: Ticket Raising, Telecaller Desk, New Customer Modal, User Management (Create & Edit), and Customer Registration.
- **Backend APIs**: Enforced in [adminController.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/controllers/adminController.ts), [customerController.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/controllers/customerController.ts), and [authController.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/controllers/authController.ts).

### 4. User Management Field Restrictions
- **Full Name**: Min 2 characters, non-numeric check, trimmed.
- **Email**: Standard RFC email format and database uniqueness check.
- **Temporary Password**: Min 8 characters.
- **Phone**: Exactly 10 digits.
- **Role**: Validated role enum.
- **Department**: Mandatory for `AGENT` and `MANAGER` roles.

### 5. Human-Readable Audit Trail Explorer
- Overhauled [AuditLogsPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Admin/AuditLogsPage.tsx).
- Converted raw JSON string dumps into human-readable action titles, status transitions (`Moved from In Progress to Escalated`), enum translations, and styled key-value pills without raw technical UUIDs.

### 6. Sidebar Sign Out UX
- In [Sidebar.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/layout/Sidebar.tsx), redesigned the bottom user card to display an explicit, full-width `Sign Out` button with `LogOut` icon, red hover transition, and `aria-label="Sign out"`.

### 7. Actionable Contact Links (`tel:`, `mailto:`, Google Maps)
- Created shared [ContactActions.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/common/ContactActions.tsx) exporting `<PhoneLink>`, `<EmailLink>`, and `<LocationLink>`.
- Integrated in Ticket Details, Telecaller Desk, User Directory table, Ticket List queue, Telecaller Dashboard, and Agent Dashboard.

### 8. Category 5: Security, Compliance & System Architecture
- **SEC-01 Asynchronous Cloud Antivirus Pipeline**: Background threat scanner ([antivirusScanner.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/services/antivirusScanner.ts)) simulating ClamAV & AWS GuardDuty for JPG, PNG, PDF uploads with real-time admin metrics panel ([AntivirusSecurityPanel.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/admin/AntivirusSecurityPanel.tsx)) and ticket attachment verification badges.
- **SEC-02 Multi-Factor Authentication (MFA / TOTP)**: RFC 6238 HMAC-SHA1 engine ([totp.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/utils/totp.ts)) supporting Google Authenticator, Authy, and Microsoft Authenticator with 2-step login challenge, 8 emergency recovery codes, and enrollment modal ([MfaSetupModal.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/auth/MfaSetupModal.tsx)).
- **SEC-03 Multi-Tenant Workspace Isolation**: Tenant segregation middleware ([tenantIsolation.ts](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/server/middleware/tenantIsolation.ts)), header injection context ([WorkspaceContext.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/context/WorkspaceContext.tsx)), top-bar workspace switcher ([WorkspaceSwitcher.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/components/workspace/WorkspaceSwitcher.tsx)), and enterprise administration console ([WorkspaceIsolationPage.tsx](file:///c:/Users/netaj/OneDrive/Documents/projects/ticket/Ticket-raising/src/client/src/pages/Admin/WorkspaceIsolationPage.tsx)).

---

## 🛠 File Changes Summary

| File Path | Description of Changes |
| :--- | :--- |
| `src/client/src/components/common/ContactActions.tsx` | **[NEW]** Reusable PhoneLink, EmailLink, and LocationLink components |
| `src/client/src/utils/validation.ts` | **[NEW]** Universal validation functions for phone, email, name, attachments |
| `src/client/src/components/common/ConfirmationModal.tsx` | Fixed `confirmText` prop rendering |
| `src/client/src/pages/Admin/SlaConfigPage.tsx` | Removed extra `+` icon, added delete modal & protected policy badge |
| `src/client/src/pages/Admin/DepartmentsCategoriesPage.tsx` | Removed redundant `+` icons, added deletion confirmation modal |
| `src/server/middleware/upload.ts` | Strictly enforced JPG, JPEG, PNG, PDF & 15 MB file limits |
| `src/server/app.ts` | Added Multer error handler for HTTP 400 responses |
| `src/client/src/components/tickets/RaiseTicketForm.tsx` | Updated file dropzone accept filters & 10-digit phone validation |
| `src/client/src/pages/Tickets/TicketDetailsPage.tsx` | Clickable contact links & attachment file validation |
| `src/client/src/components/modals/NewCustomerModal.tsx` | 10-digit phone & full name validation for rapid onboarding |
| `src/client/src/pages/Telecaller/TelecallerDesk.tsx` | Clickable caller contact actions & search placeholder update |
| `src/client/src/pages/Admin/UserManagementPage.tsx` | Strict user creation validation & directory table contact links |
| `src/client/src/pages/Admin/AuditLogsPage.tsx` | Formatted human-readable audit trail without raw JSON |
| `src/client/src/components/layout/Sidebar.tsx` | Prominent Sign Out action button in bottom profile card |
| `src/server/controllers/adminController.ts` | Backend validation for user creation & profile updates |
| `src/server/controllers/customerController.ts` | Backend 10-digit phone & full name validation for customers |
| `src/server/controllers/authController.ts` | Backend 10-digit phone & full name validation for registrations |

---

## 🧪 Verification & Automated Checks

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *Result*: **0 errors**.

2. **Production Bundle Build**:
   ```bash
   npm run build
   ```
   *Result*: Vite compiled 2,520 modules into `src/client/dist` in 1.85s with **0 errors**.
