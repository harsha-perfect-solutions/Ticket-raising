# SupportPro - Customer & Telecaller Ticket Management System

A production-ready, full-stack **Customer & Telecaller Support Ticket Management System** designed for high-scale enterprise support operations, featuring role-based workflows across 5 user roles, automated SLA tracking with auto-escalation, rapid telecaller customer search, isolated internal staff collaboration, and modern SaaS analytics.

---

## 🚀 Key Features

### 1. Granular Role-Based Access Control (5 Roles)
- **Admin**: Full system configuration, SLA rule management, department & category administration, user provisioning, and tamper-evident audit log review.
- **Team Leader / Manager**: Department-level oversight, workload balancing, SLA compliance monitoring, manual & auto-escalation handling.
- **Support Agent**: Assigned ticket queue, public customer communications, isolated internal notes, and resolution actions.
- **Telecaller**: High-throughput caller lookup by phone/email/name, customer onboarding, call log entry, and rapid ticket dispatch.
- **Customer**: Self-service portal to raise tickets, track real-time resolution progress, reply with attachments, reopen resolved tickets, and submit 1–5 star CSAT feedback.

### 2. Complete Ticket Lifecycle State Machine
`NEW` → `ASSIGNED` → `IN_PROGRESS` → `WAITING_FOR_CUSTOMER` → `ESCALATED` → `RESOLVED` → `CLOSED` / `REOPENED` / `CANCELLED`

### 3. Dynamic SLA & Auto-Escalation Engine
- Priority-driven response & resolution targets (Critical 1h, High 4h, Medium 8h, Low 24h).
- Second-by-second countdown badges.
- Background worker monitoring SLA timers and auto-escalating near-breach/breached tickets to Manager and Admin queues.

### 4. Telecaller Rapid Call Desk
- Instant lookup by phone number, email address, or customer name.
- Real-time customer dossier with past ticket history.
- Rapid ticket creation with structured call summaries.

### 5. Secure Collaboration & Privacy Enforcement
- Isolated customer conversations vs. staff-only internal notes (internal notes are strictly hidden from customers at both API and frontend layers).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide React, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite / PostgreSQL
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt password hashing
- **Automation**: Node-Cron background SLA worker

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/harsha-perfect-solutions/Ticket-raising.git
cd Ticket-raising

# Install dependencies
npm install
```

### 3. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```

### 4. Database Setup & Seeding
```bash
# Generate Prisma client and initialize database
npx prisma db push

# Seed demo data for all 5 roles
npm run db:seed
```

### 5. Running the Application
```bash
# Start backend API server (runs on http://127.0.0.1:5000)
npm run server

# In a separate terminal, start frontend client (runs on http://localhost:5173)
npm run client
```

---

## 👥 Demo User Credentials (Password: `password123` for all)

| Role | Email | Purpose |
|---|---|---|
| **Admin** | `admin@supportpro.com` | Full system control & SLA settings |
| **Manager** | `manager@supportpro.com` | Team queue & escalation handling |
| **Support Agent** | `agent@supportpro.com` | Assigned ticket workbench & resolution |
| **Telecaller** | `telecaller@supportpro.com` | Rapid customer verification & call logging |
| **Customer** | `customer@acme.com` | Ticket tracking, replies & CSAT rating |

*(A 1-Click Perspective Switcher is also included in the navigation header for rapid testing across all roles without re-logging in)*.

---

## 📄 License
ISC