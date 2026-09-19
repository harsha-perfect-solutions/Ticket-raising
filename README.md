# ResolveHub — Enterprise ITSM Platform
> **powered by HPS(OPC) Pvt. Ltd.**

A production-ready, full-stack **ResolveHub Enterprise Service Desk Platform** designed for high-scale IT service management, featuring role-based workflows across 5 user roles, WebRTC CTI softphone integration, speech-to-text call transcription, rapid grid ticket logging, AI knowledge deflection, automated SLA tracking with auto-escalation, and real-time Socket.IO status broadcasting.

---

## 🚀 Key Modules & Capabilities

### 1. Granular Role-Based Access Control (5 Roles)
- **Admin**: Full system configuration, SLA rule engine, department & category management, user provisioning, and audit log explorer.
- **Team Leader / Manager**: Department oversight, workload balancing, SLA compliance monitoring, manual & auto-escalation handling, and real-time telecaller velocity status.
- **Support Agent**: Assigned ticket queue, public customer communications, internal staff notes, and resolution actions.
- **Telecaller**: In-browser WebRTC CTI softphone, speech-to-text call transcription, customer dossier verification, and rapid grid batch ticket logging.
- **Customer**: Self-service portal to raise tickets, AI Knowledge Base deflection, track real-time resolution progress, local offline draft auto-save, floating assistant widget, and 1–5 star CSAT feedback.

### 2. Complete Ticket Lifecycle State Machine
`NEW` → `ASSIGNED` → `IN_PROGRESS` → `WAITING_FOR_CUSTOMER` → `ESCALATED` → `RESOLVED` → `CLOSED` / `REOPENED` / `CANCELLED`

### 3. Dynamic SLA & Auto-Escalation Engine
- Priority-driven response & resolution targets (Critical 1h, High 4h, Medium 8h, Low 24h).
- Second-by-second countdown badges.
- Background worker monitoring SLA timers and auto-escalating near-breach/breached tickets to Manager and Admin queues.

### 4. In-Browser WebRTC CTI Softphone & Rapid Desk
- Instant lookup by phone number, email address, or customer name.
- Real-time customer dossier with past ticket history.
- Softphone controls with active call timer (`00:45`), mute, hold, and dialpad.
- Speech-to-Text transcription with auto-generated call summary.
- Rapid Grid Logging modal for batch logging up to 10 caller queries in parallel.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client
- **Backend**: Node.js, Express v5, TypeScript (`tsx`), Socket.IO, Prisma ORM
- **Database**: SQLite / PostgreSQL target compatibility
- **Authentication**: JWT (JSON Web Tokens) with role-based middleware guards
- **File Upload Engine**: Multer disk storage middleware with 15MB JPG/PNG/PDF filters

---

## 📦 Getting Started

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/harsha-perfect-solutions/Ticket-raising.git
cd Ticket-raising

# Install dependencies
npm install
```

### 2. Running the Application
```bash
# Start backend API server & Vite client concurrently
npm run dev
```

---

## 👥 Demo User Credentials (Password: `password123` for all)

| Role | Email | Purpose |
|---|---|---|
| **Admin** | `admin@omnidesk.com` | System control & SLA rule engine |
| **Manager** | `manager@omnidesk.com` | Team queue & escalation handling |
| **Support Agent** | `agent@omnidesk.com` | Assigned ticket workbench & resolution |
| **Telecaller** | `telecaller@omnidesk.com` | Inbound CTI softphone & rapid call logging |
| **Customer** | `customer@acme.com` | Ticket tracking, AI deflection & CSAT rating |

---

## 📄 License
ISC