# SupportPro ITSM — Application Folder & Repository Structure

**Document Status**: Official Repository Map  
**Application Version**: 2.4.0  
**Target Repository**: `Ticket-raising/`  
**Last Updated**: September 19, 2026  

---

## Executive Overview

This document provides a comprehensive mapping of the **SupportPro ITSM** codebase layout, directory hierarchy, frontend components, backend modules, database schemas, and documentation artifacts.

---

## 1. High-Level Repository Hierarchy

```
Ticket-raising/
├── docs/                           # Centralized Project Documentation
│   ├── FOLDER_STRUCTURE.md         # Full Codebase & Repository Directory Map (This File)
│   ├── PROPOSED_ENHANCEMENTS.md    # Product & Architecture Enhancements Catalog
│   ├── IMPLEMENTATION_PLAN.md      # System Debugging Architecture & Technical Playbooks
│   ├── BUG_REPORT_AND_OPEN_ISSUES.md # QA Defect Matrix (25 Resolved, 5 Open/Roadmap)
│   ├── PULL_REQUEST_RELEASE_NOTES.md # Release v2.4.0 Summary & Pull Request Notes
│   └── WALKTHROUGH.md              # Role-Based QA Verification Walkthrough & Test Guide
├── prisma/                         # Database ORM Schemas & Migrations
│   ├── schema.prisma               # Prisma Schema (Users, Customers, Tickets, SLAs, Audits)
│   └── dev.db                      # Local SQLite Database Storage
├── src/                            # Application Source Code
│   ├── client/                     # Frontend Single Page Application (React + Vite + Tailwind)
│   └── server/                     # Backend API & Real-time Server (Express + Socket.IO)
├── uploads/                        # Uploaded File Storage (JPG, PNG, PDFAttachments)
├── .env                            # Active Environment Variables
├── .env.example                    # Template Environment Variables
├── package.json                    # Workspace Dependencies & NPM Scripts
├── tailwind.config.js              # Tailwind CSS Design System Configuration
├── tsconfig.json                   # TypeScript Compiler Configuration
└── vite.config.ts                  # Vite Bundler & Proxy Configuration
```

---

## 2. Frontend Architecture (`src/client/`)

```
src/client/
├── index.html                      # Single Page Application Host HTML Entry
├── src/
│   ├── main.tsx                    # React 19 Client Entry Point
│   ├── App.tsx                     # Main Router, Layout Container & Toast Provider
│   ├── index.css                   # Global CSS, Tailwind Imports, Design Tokens & Animations
│   ├── components/                 # UI Components Grouped by Domain
│   │   ├── common/                 # Shared Reusable UI Controls
│   │   │   ├── ContactActions.tsx  # Interactive Phone (tel:), Email (mailto:), Map Links
│   │   │   ├── SlaBadge.tsx        # SLA Countdown Timer & Critical Status Badges
│   │   │   ├── StatusBadge.tsx     # Ticket & User Status Badge Chips
│   │   │   └── ConfirmationModal.tsx # Reusable Confirmation Dialog Modal
│   │   ├── layout/                 # Application Shell & Navigation Layout
│   │   │   ├── Navbar.tsx          # Top Bar, Quick Search, User Menu & Notifications
│   │   │   ├── Sidebar.tsx         # Role-Scoped Navigation Bar & Prominent Sign Out
│   │   │   └── ProtectedRoute.tsx  # JWT & RBAC Route Authorization Guard
│   │   ├── modals/                 # Dialog Modals for Form Actions
│   │   │   ├── NewTicketModal.tsx  # Customer Ticket Creation Modal
│   │   │   └── NewCustomerModal.tsx# Telecaller Quick Customer Creation Modal
│   │   ├── telecaller/             # Telecaller Rapid Service Desk Controls
│   │   │   └── CallerDossier.tsx   # Integrated Customer Dossier & Recent Activity
│   │   └── tickets/                # Ticket Domain Components
│   │       ├── TicketFilterBar.tsx # Dynamic Search, Status, Priority & Date Filters
│   │       └── RaiseTicketForm.tsx # Ticket Creation Form with 15MB Upload Filter
│   ├── context/                    # React Context State Management
│   │   └── AuthContext.tsx         # User Authentication, JWT Tokens & Role State
│   ├── pages/                      # Role-Scoped Route Views
│   │   ├── Admin/                  # Administration Pages
│   │   │   ├── AuditLogsPage.tsx   # Human-Readable System Audit Log Viewer
│   │   │   ├── DepartmentsCategoriesPage.tsx # Department & Ticket Category Admin
│   │   │   ├── SlaConfigPage.tsx   # SLA Policy Rule Engine & Policy Management
│   │   │   └── UserManagementPage.tsx # System User Provisioning & Password Reset
│   │   ├── Auth/                   # Authentication Views
│   │   │   ├── LoginPage.tsx       # System Login Form
│   │   │   └── RegisterPage.tsx    # Customer Registration Form
│   │   ├── Dashboard/              # Role Dashboards
│   │   │   ├── AdminDashboard.tsx    # Executive System Overview & KPI Widgets
│   │   │   ├── AgentDashboard.tsx    # Agent Workload & Quick Resolution Queue
│   │   │   ├── CustomerDashboard.tsx # Customer Service Portal & Filtered KPI Cards
│   │   │   ├── ManagerDashboard.tsx  # Department Performance & Escalations
│   │   │   └── TelecallerDashboard.tsx # Call Center Velocity & Quick Search
│   │   ├── Telecaller/             # Telecaller Desk Pages
│   │   │   └── TelecallerDesk.tsx  # Rapid Search, Verification & Ticket Logging Desk
│   │   └── Tickets/                # Ticket Processing Pages
│   │       ├── TicketListPage.tsx  # Master Filterable Ticket Queue
│   │       └── TicketDetailsPage.tsx # Ticket Lifecycle Workspace & Discussion Thread
│   ├── services/                   # API Communications Layer
│   │   └── api.ts                  # Axios Client with Bearer Token Interceptor
│   ├── types/                      # TypeScript Interface & Type Definitions
│   │   └── index.ts                # Ticket, User, SLA, Audit & API Contract Interfaces
│   └── utils/                      # Helper & Validation Utilities
│       ├── formatters.ts           # Date & Currency Formatter Helpers
│       └── validation.ts           # 10-Digit Phone & Form Input Regex Filters
```

---

## 3. Backend Architecture (`src/server/`)

```
src/server/
├── app.ts                          # Express Application Middleware & Route Registration
├── server.ts                       # HTTP Server Setup & Socket.IO Listener Initialization
├── db.ts                           # Prisma Client Singleton Instantiation
├── config/                         # Backend Configurations
│   └── jwt.ts                      # JWT Secret Keys & Expiration Timeouts
├── controllers/                    # Express Request Handler Controllers
│   ├── adminController.ts          # User Management, Audits, Category & SLA Handlers
│   ├── authController.ts           # Login, Registration & Auth Verification Handlers
│   ├── customerController.ts       # Telecaller Customer Search & Creation Handlers
│   ├── slaController.ts            # SLA Engine Target Calculation & Breach Alert Logic
│   └── ticketController.ts         # Ticket CRUD, Status Transitions & Replies
├── middleware/                     # Express Router Middleware
│   ├── auth.ts                     # JWT Verification & Role Permission Guards
│   └── upload.ts                   # Multer Upload Engine with 15MB JPG/PNG/PDF Filter
├── routes/                         # API Endpoint Definitions
│   ├── adminRoutes.ts              # /api/admin Sub-routes
│   ├── authRoutes.ts               # /api/auth Sub-routes
│   ├── customerRoutes.ts           # /api/customer Sub-routes
│   ├── slaRoutes.ts                # /api/sla Sub-routes
│   └── ticketRoutes.ts             # /api/tickets Sub-routes
├── services/                       # Business Logic Services
│   ├── auditService.ts             # System Audit Log Event Recorder
│   ├── notificationService.ts      # Socket.IO Real-time Push Dispatcher
│   └── slaEngine.ts                # Background SLA Monitor & Escalation Engine
├── utils/                          # Server Helper Functions
│   └── sanitize.ts                 # Input String Sanitization & XSS Protection
└── workers/                        # Background Task Workers
    └── slaWorker.ts                # Scheduled Cron Job for SLA Breach Recalculations
```

---

## 4. Documentation Folder Architecture (`docs/`)

The `docs/` directory is structured to provide clear separation of concerns across engineering, QA, management, and product roadmap teams:

```
docs/
├── FOLDER_STRUCTURE.md             # [NEW] Complete Repository Directory & Component Blueprint
├── PROPOSED_ENHANCEMENTS.md        # Feature & Architecture Enhancements Catalog
├── IMPLEMENTATION_PLAN.md          # System Debugging Architecture & Subsystem Playbooks
├── BUG_REPORT_AND_OPEN_ISSUES.md   # QA Defect Summary (25 Resolved, 5 Open/Roadmap)
├── PULL_REQUEST_RELEASE_NOTES.md   # Release v2.4.0 Changelog & Pull Request Summary
└── WALKTHROUGH.md                  # Role-Based Testing Walkthrough & Verification Matrix
```

---

## 5. Verification Commands

| Action | Command | Expected Result |
| :--- | :--- | :--- |
| **Type Check** | `npx tsc --noEmit` | **0 errors** across frontend & backend TypeScript codebase |
| **Client Build** | `npm run build` | Compiles clean production bundle into `src/client/dist` |
| **Dev Server** | `npm run dev` | Launches Vite frontend (`:5173`) and Express backend (`:5000`) |
