# START SMART — Your First Week. Without the Maze.

> **AI-Powered, Dependency-Aware Employee Onboarding Platform**  
> *Built for the Bennett University Hackathon 2026 · Challenge: The First-Week Maze (Enterprise Edition)*

---

## 🚀 Product Overview

**Start Smart** transforms chaotic employee onboarding from a static, dumb checklist into a personalized, dependency-aware journey. 

When new joiners join fast-growing companies, they spend their first week confused about tools, credentials, permissions, and people. When a single gate like VPN approval is stalled in an IT queue, 4 downstream tasks (GitHub access, Repository clone, Local development environment, and First PR) become completely locked. Traditional HR portals simply display *"GitHub access is pending"*, leaving employees feeling helpless and disengaged.

Start Smart answers five vital questions whenever an employee becomes blocked:
1. **Why is this task blocked?**
2. **What is the actual root cause?**
3. **Who is responsible for resolving it?**
4. **What useful work can the employee complete meanwhile (SideQuest™)?**
5. **What becomes available when the blocker is resolved (Live Unlocking)?**

### Core Philosophy
> **AI proposes; deterministic application logic decides.**  
> AI diagnoses natural language queries and cites verified sources; the deterministic backend DAG dependency engine controls task states, permissions, cycle prevention, and unlocking.

---

## 🌟 Signature Features

### 1. UNSTICK™ Root Blocker Recovery
- Natural-language diagnosis: type *"I can't access GitHub"* or choose a quick category.
- Recurses upstream across prerequisites to find the earliest uncompleted required gate (e.g. **VPN Approval** with IT Operations).
- Computes exact downstream impact count (4 tasks locked).
- Generates grounded next steps with 1-click **Nudge Responsible Owner** (rate-limited and audit-logged).
- Recommends immediate **SideQuests** and provides **Human Buddy / HR handoff** for sensitive inquiries.

### 2. SideQuest™ Alternative Work
- Dynamic recommendation engine that scans the employee's active journey.
- Identifies tasks whose prerequisites are 100% satisfied (`AVAILABLE`) that have **zero dependency** on the active blocker chain.
- Examples: *Security Awareness & Compliance Training*, *Engineering Culture & Architecture Deep Dive*, *1-on-1 Coffee Chat with Buddy*.

### 3. RippleView™ Interactive Dependency Graph
- Powered by `@xyflow/react` (React Flow).
- Visualizes the directed acyclic graph (DAG) in real time.
- Animated pulsing ring highlights the root blocker node.
- Live downstream cascade: watch GitHub Access and Repository Access transition from `LOCKED` to `AVAILABLE` the instant IT approves VPN!

### 4. HR Control Center & Blocker Intervention
- Real-time visibility into active joiners, cohort health (`FLOWING`, `DETOURING`, `STALLED`), and SLA breaches.
- Active blockers table with waiting duration, downstream impact count, and 1-click **Nudge** / **Escalate**.
- Pre-Join Readiness Matrix (evaluates Laptop, Accounts, VPN, Documents, and Buddy assignment before Day 1).
- Knowledge Gaps tracker: aggregates repeated unanswered questions and converts them into documentation tasks.

### 5. Task Owner Dashboard (My Actions)
- Dedicated fulfillment dashboard for IT Operations, Security, and Facilities.
- Shows joiner context, time in queue, and downstream impact.
- Actions: **Approve & Unlock**, **Log Delay** (with reason & ETA), **Reassign**, and **Add Status Notes**.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v7, TanStack Query, Lucide Icons, Recharts, `@xyflow/react` (React Flow) |
| **Backend** | Node.js (v24), Express, TypeScript, Zod request validation, Helmet security headers, CORS, Structured Logger |
| **Database & ORM** | Prisma ORM, SQLite (`dev.db` for zero-friction local execution, PostgreSQL-ready schema) |
| **Authentication** | JWT tokens, bcryptjs password hashing, role-based access control (RBAC), multi-tenant company isolation |
| **AI & Knowledge** | Grounded retrieval engine citing approved runbooks, keyword semantic parsing, provider-independent interface |
| **Testing** | Vitest, Supertest, automated DAG cycle detection and end-to-end unlock acceptance tests |

---

## 📂 Project Architecture

```
.
├── client/                     # Vite + React TypeScript Frontend
│   ├── src/
│   │   ├── components/         # DemoSwitcherBar, Navbar, UnstickModal, etc.
│   │   ├── context/            # AuthContext (session & demo persona switcher)
│   │   ├── lib/                # Typed API client wrapper
│   │   ├── pages/              # LandingPage, EmployeeDashboard, RippleViewPage,
│   │   │                       # HRControlCenter, OwnerDashboard, PreJoinReadiness, etc.
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── App.tsx             # Route definitions & ProtectedRoute wrapper
│   │   └── main.tsx            # Entry point with React Router & TanStack Query
│   ├── index.html
│   └── vite.config.ts
│
├── server/                     # Express TypeScript Backend & Dependency Engine
│   ├── prisma/
│   │   ├── schema.prisma       # Multi-tenant data models
│   │   └── seed.ts             # Idempotent seed script
│   ├── src/
│   │   ├── middleware/         # auth.ts (JWT, RBAC, tenant isolation)
│   │   ├── routes/             # auth, employee, unstick, hr, owner, admin, ai, etc.
│   │   ├── services/
│   │   │   ├── dependencyEngine.ts # DAG cycle detection, root cause, impact, recalculation
│   │   │   └── aiService.ts    # Grounded assistant & knowledge gap recorder
│   │   └── index.ts            # Server entry point & health check routes
│   └── tests/
│       └── acceptance.test.ts  # Automated acceptance test suite (11/11 tests pass)
│
├── DEMO_GUIDE.md               # 2-Minute Judge Demonstration Script
├── README.md                   # This documentation
└── package.json                # Root orchestration scripts
```

---

## 🔑 Demonstration Accounts

All accounts use the standard demo password: **`demo1234`**

| Persona | Name | Role | Email | Best Page to View |
|---|---|---|---|---|
| **Employee** | Aarav Sharma | `EMPLOYEE` | `aarav@technova.demo` | `/dashboard` (My Start) |
| **HR Admin** | Priya Sharma | `HR_ADMIN` | `hr@technova.demo` | `/hr` (HR Control Center) |
| **IT Task Owner**| Vikram IT | `TASK_OWNER` | `it.owner@technova.demo`| `/owner` (My Actions) |
| **Company Admin**| Neha Admin | `COMPANY_ADMIN` | `admin@technova.demo` | `/admin` (Org & Graph) |

> 💡 **Hackathon Pro-Tip**: Use the **Judge Persona Switcher** toolbar pinned at the very top of the screen to switch between personas with a single click, or reset the scenario at any time!

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Clone & Install Dependencies
```bash
# In project root:
cd server
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

cd ../client
npm install
```

### 2. Run the Application
You can run both backend and frontend concurrently:

```bash
# Terminal 1: Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 3000)
cd client
npm run dev
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🧪 Running Automated Tests

Run the full Vitest acceptance test suite:
```bash
cd server
npx vitest run
```
*Verifies JWT auth, tenant isolation, deterministic initial task states, locked task guardrails, cycle detection, UNSTICK root cause analysis, SideQuests filtering, and the live VPN-to-GitHub unlock sequence.*

---

## 🔒 Security & Tenant Isolation
- **Tenant Isolation**: Every database record is scoped by `companyId`. Cross-tenant reads and writes are strictly rejected with 403 Forbidden.
- **Passwords**: Hashed with `bcryptjs` (salt rounds: 10). Plaintext passwords are never stored.
- **RBAC**: Protected endpoints verify authorized roles (`EMPLOYEE`, `HR_ADMIN`, `TASK_OWNER`, `COMPANY_ADMIN`).
- **Nudge Rate Limiting**: Anti-spam throttling ensures users cannot spam notifications to owners.
- **Cycle Prevention**: DFS graph validation rejects circular dependency loops and displays the exact cycle path.
