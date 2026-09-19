# ResolveHub ITSM — Feature Walkthrough & Testing Guide
> **powered by HPS(OPC) Pvt. Ltd.**

This walkthrough provides step-by-step guidance for testing and verifying all features across the 5 system roles (`CUSTOMER`, `TELECALLER`, `AGENT`, `MANAGER`, `ADMIN`).

---

## 1. Role-Wise Verification Walkthrough

### 1.1 Customer Role (`CUSTOMER`)
1. **Login**: Sign in with customer credentials or click "Register Account".
2. **Raise Ticket**:
   - Navigate to **Raise Ticket**.
   - Input **Contact Phone**: Verify entering non-digits or less than 10 digits triggers `"Please enter a valid 10-digit mobile number."`.
   - Input **Supporting Attachments**: Click or drag files. Attempt uploading `.doc` or `.zip` or a file >15MB; verify error `"Unsupported file type. Please upload JPG, JPEG, PNG, or PDF files only."` or `"File exceeds the 15 MB limit."`.
   - Attach valid `.png` or `.pdf` file under 15MB.
3. **Ticket Details**:
   - Open ticket details page.
   - Verify phone number is clickable (`tel:`), email is clickable (`mailto:`), and address opens Google Maps.
4. **Sign Out**:
   - Look at bottom left of sidebar. Verify the prominent **Sign Out** button with logout icon is visible. Click it to log out.

---

### 1.2 Telecaller Role (`TELECALLER`)
1. **Telecaller Desk**:
   - Open **Telecaller Rapid Service Desk**.
   - Inspect customer dossier card: verify phone number opens device dialer (`tel:`), email opens mail client, and address opens Google Maps.
2. **Register Caller**:
   - Click **+ Register Caller**.
   - Test Phone input: verify 10-digit numeric constraint (`/^[0-9]{10}$/`).
   - Submit customer details and verify instant dossier selection.

---

### 1.3 Support Agent Role (`AGENT`)
1. **Agent Workbench**:
   - Navigate to **Assigned Ticket Queue**.
   - Inspect ticket rows: verify customer contact details are interactive.
2. **Ticket Resolution**:
   - Open an assigned ticket.
   - Change status to `IN_PROGRESS` or `RESOLVED`.
   - Verify reply attachment input restricts uploads to JPG, JPEG, PNG, PDF up to 15MB.

---

### 1.4 Manager / Team Lead Role (`MANAGER`)
1. **Department Queue**:
   - Inspect team tickets and active escalations.
2. **Reassignment & Overrides**:
   - Use ticket list queue to select multiple tickets and perform batch agent reassignments.

---

### 1.5 Admin Role (`ADMIN`)
1. **SLA Rule Engine**:
   - Navigate to **Admin → SLA Rule Engine**.
   - Verify top header button reads `[ + Add SLA Policy ]` without a duplicate `+` icon.
   - Inspect table rows: verify category-scoped policies display Edit and Delete buttons. Verify global default policy shows `<ShieldCheck /> Protected` badge.
   - Click Delete on a custom policy: verify custom `ConfirmationModal` (`"Delete this SLA policy?"`, `[Cancel] [Delete]`) opens.
2. **User & Role Management**:
   - Navigate to **Admin → User Management**.
   - Click **+ Provision System User**.
   - Test validation: Full Name (min 2 chars, non-numeric), Email (standard format), Password (min 8 chars), Phone (10 digits), Role, and Department (required for Agent & Manager).
   - Inspect User Directory table: verify email and phone columns have clickable `mailto:` and `tel:` links.
3. **Audit Trail Explorer**:
   - Navigate to **Admin → Audit Trail Activity Log**.
   - Inspect system timeline: verify **NO raw JSON string dumps** appear in the Details column.
   - Verify actions are formatted in plain English (e.g. `Moved from In Progress to Escalated`, `User Provisioned`, `SLA Policy Created`) with formatted key-value badges.
   - Click **Export to CSV** and verify `audit_logs_YYYY-MM-DD.csv` downloads cleanly.

---

### 1.6 Security, Compliance & Workspace Isolation (Category 5: `SEC-01`, `SEC-02`, `SEC-03`)
1. **Asynchronous Cloud Antivirus Pipeline (`SEC-01`)**:
   - Navigate to **Admin Console → Antivirus Security Panel** (`/admin/security/antivirus`).
   - Inspect the real-time pipeline status: total files scanned, clean vs quarantined ratio, and ClamAV v1.2 / AWS GuardDuty simulation logs.
   - Upload an attachment on any ticket: verify the attachment displays the `🛡️ ClamAV Verified Clean` security verification badge.
2. **Multi-Factor Authentication / TOTP (`SEC-02`)**:
   - Log out and log in with an Admin account (`admin@supportpro.com` or any admin).
   - Verify the 2-step authentication screen prompts for the 6-digit TOTP code.
   - Enter your authenticator code (or click "Auto-fill Demo Code" `123456` in staging) or use an 8-character backup recovery code.
   - Open user settings / profile modal: test the **Enable/Manage 2FA** dialog with interactive QR code scanner enrollment and 8 backup emergency codes.
3. **Multi-Tenant Workspace Isolation (`SEC-03`)**:
   - Inspect the top navigation bar: notice the **Enterprise Workspace Switcher** dropdown (`Acme Corp Global`, `Apex Financial Services`, `Nova Health Systems`).
   - Switch workspace from `Acme Corp` to `Apex Financial`: verify active tenant badge updates and all tickets and customer records scope strictly to the selected enterprise workspace.
   - Navigate to **Admin → Workspace Isolation & Multi-Tenancy** (`/admin/workspaces`): view enterprise quotas, compliance frameworks (SOC2, PCI-DSS, HIPAA), and provision new tenant schemas.

---

## 2. Automated Test Commands
Run the following build & typecheck commands to confirm zero regressions:

```bash
# 1. TypeScript Typecheck
npx tsc --noEmit

# 2. Production Vite Bundle Build
npm run build
```
Both commands must exit with status `0`.
