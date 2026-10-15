# 🏥 MediCore HMS — Enterprise Hospital Management System

<div align="center">

![MediCore HMS Banner](https://img.shields.io/badge/MediCore-Hospital%20Management%20System-0d9488?style=for-the-badge&logo=mediamarkt&logoColor=white)

[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-Cloud%20Cluster-47a248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-729b1b?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A modern, production-grade, full-stack Hospital Management System (HMS) engineered with React 19, TypeScript, Node.js/Express, and MongoDB Atlas.**  
*Includes Role-Based Access Control, Clinical Consultations, Digital Prescriptions, Inpatient Ward & Bed Occupancy, Pharmacy Dispensary Formulary, Diagnostic Test Catalog, Itemized Billing, and Real-Time System Observability.*

[Features](#-key-features--modules) • [Database Architecture](#-database-architecture-11-collections) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-specification) • [Viva Guide](#-university-viva--architectural-defense)

</div>

---

## 🌟 Key Features & Modules

### 1. 🛡️ Role-Based Access Control (RBAC) & Persona Workflows
- **4 Distinct User Roles**: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, and `BILLING_STAFF`.
- Strict route-level enforcement on both frontend (`ProtectedRoute`) and backend (`authorize(...roles)` middleware).
- Responsive dynamic navigation sidebar adapting instantly to the active role's permissions.

### 2. 🔐 Enterprise Application Security
- **HttpOnly Cookie Authentication**: JWT access tokens stored exclusively in `httpOnly`, `SameSite: strict` cookies, preventing XSS-based token theft.
- **Password Protection**: Hashed using `bcryptjs` with 12 computational salt rounds.
- **Input Validation**: 100% of mutation payloads validated at runtime using strict **Zod** schemas.
- **NoSQL Injection Shield**: Armed with `express-mongo-sanitize` to strip malicious query operators (`$gt`, `$ne`, etc.).
- **HTTP Security Headers**: Enforced via `helmet` (CSP, X-Frame-Options, HSTS, Sniff-Protection).
- **Dual Rate Limiting**: General API limiter (200 req / 15m) + dedicated auth brute-force limiter (20 req / 15m).

### 3. 🩺 Clinical Consultation & Electronic Health Records (EHR)
- **Consultation Portal**: Record patient chief complaints, clinical diagnoses (with ICD codes), and physician advice.
- **Dynamic Digital Prescription**: Multi-drug prescription builder with medicine name, dosage, duration, and clinical instructions.
- **Diagnostic Orders**: Link required laboratory and radiology investigations directly to the consultation encounter.

### 4. 🛏️ Inpatient Ward & Bed Occupancy Matrix
- Real-time bed availability tracking across **ICU**, **Private AC**, **General Ward**, and **Emergency**.
- Live occupancy indicators (Available, Occupied, Under Maintenance) with assigned patient, attending physician, and admission timestamp.

### 5. 🧪 Hospital Diagnostic Services & Procedures Directory
- Standardized hospital service catalog (`SRV-LAB01`, `SRV-RAD01`, `SRV-CARD01`, `SRV-ROOM01`).
- Categorized by **Laboratory**, **Radiology**, **Procedure**, and **Room Charges** with fixed pricing.

### 6. 💊 Pharmacy Dispensary & Medicine Stock Formulary
- Hospital medicine formulary tracking tablets, syrups, injections, and inhalers.
- Real-time stock counts, reorder threshold alerts, batch numbers, manufacturer details, and expiry date warnings.

### 7. 📅 Conflict-Aware Outpatient & Emergency Scheduling
- Double-booking prevention algorithm ensuring doctors cannot have conflicting appointment time slots.
- Status management workflow: `SCHEDULED` ➔ `COMPLETED` / `CANCELLED` / `NO_SHOW`.

### 8. 🧾 Itemized Billing, Invoicing & Receipts
- Comprehensive hospital invoice generation calculating consultation fees + dynamic lab/procedure charges - discounts.
- Payment processing across **Cash**, **Card**, **Online (UPI/NetBanking)**, and **Insurance**.
- Printable, tax-compliant invoice modal with hospital branding.

### 9. 📊 Executive Analytics Dashboard
- Interactive financial metrics powered by **Recharts**:
  - Monthly revenue area chart with gradient fills.
  - Appointment volume distribution pie chart by status.
  - Key operational indicators (Total Patients, Today's Appointments, Active Doctors, Pending Invoices).

### 10. 📋 Immutable Audit Log Trail
- Cryptographic-style audit logging capturing actor ID, email, role, action, resource, IP address, and timestamp for all clinical mutations.

### 11. 🌐 Real-Time Database Observability Hub
- Live topbar status badge with dynamic network round-trip ping (ms).
- One-click diagnostics modal showing MongoDB Atlas cloud shard status, Mongoose readyState, and live document counts across all 11 collections.

### 12. 🎨 Vibrant Animated Dual-Tab Authentication Portal
- Glassmorphic interface with floating ambient healthcare particles (`animate-float` and `animate-pulse-glow`).
- Instant 1-click **Viva Demo Auto-Fill** cards for each role.
- New staff onboarding tab with real-time **Password Strength Meter** and HIPAA compliance acknowledgment.

---

## 🗄️ Database Architecture (11 Collections)

The database schema is designed for full healthcare operational integrity:

```mermaid
erDiagram
    USERS ||--o{ DOCTORS : "has profile"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    DEPARTMENTS ||--o{ DOCTORS : "employs"
    DOCTORS ||--o{ APPOINTMENTS : "conducts"
    PATIENTS ||--o{ APPOINTMENTS : "books"
    APPOINTMENTS ||--o| CONSULTATIONS : "produces"
    PATIENTS ||--o{ INVOICES : "billed to"
    APPOINTMENTS ||--o| INVOICES : "settles"
    PATIENTS ||--o| WARD_BEDS : "occupies"
    DOCTORS ||--o| WARD_BEDS : "attends"
    HOSPITAL_SERVICES ||--o{ INVOICES : "charged in"
    PHARMACY_ITEMS ||--o{ CONSULTATIONS : "prescribed in"
```

| # | Collection | Description | Primary Key / Auto ID | Key Relations & Attributes |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **`users`** | Staff & administrative credentials | `_id` (ObjectId) | `email` (unique), `passwordHash`, `role`, `phone`, `isActive` |
| 2 | **`departments`** | Hospital medical specialties | `_id` (ObjectId) | `name`, `description`, `headDoctorId` ➔ `users` |
| 3 | **`doctors`** | Specialist clinical profiles | `_id` (ObjectId) | `userId` ➔ `users`, `departmentId`, `consultationFee`, `schedule[]` |
| 4 | **`patients`** | Electronic health patient records | `patientId` (`P-00001`) | `name`, `dob`, `gender`, `bloodGroup`, `allergies[]`, `emergencyContact` |
| 5 | **`appointments`**| Outpatient & emergency visits | `appointmentId` (`A-00001`)| `patientId`, `doctorId`, `date`, `timeSlot`, `status`, `type` |
| 6 | **`consultations`**| Diagnoses & Rx records | `_id` (ObjectId) | `appointmentId`, `diagnosis`, `prescription[]`, `labTests[]` |
| 7 | **`invoices`** | Itemized hospital bills | `invoiceId` (`INV-00001`) | `patientId`, `appointmentId`, `totalAmount`, `paidAmount`, `status` |
| 8 | **`hospitalservices`**| Diagnostic & procedure catalog | `code` (`SRV-LAB01`) | `name`, `category`, `price`, `description` |
| 9 | **`pharmacyitems`**| Dispensary medicine formulary | `code` (`MED-001`) | `genericName`, `dosageStrength`, `stockQuantity`, `reorderLevel`, `expiryDate` |
| 10| **`wardbeds`** | Ward & ICU bed management | `bedNumber` (`ICU-01`) | `wardType`, `floor`, `dailyRate`, `status`, `currentPatientId` |
| 11| **`auditlogs`** | Tamper-evident mutation log | `_id` (ObjectId) | `userId`, `userRole`, `action`, `resource`, `ipAddress`, `timestamp` |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + TypeScript + Vite)"]
        UI[UI Components & Pages]
        Zustand[Zustand Auth Store]
        Axios[Axios HTTP Client with Interceptors]
        UI --> Zustand
        UI --> Axios
    end

    subgraph Gateway["API Gateway / Reverse Proxy"]
        Proxy["Vite Dev Server (/api proxy) :5173"]
        Axios --> Proxy
    end

    subgraph Server["Backend Server (Node.js + Express + TypeScript)"]
        SecMiddle["Security Middleware: Helmet, CORS, RateLimit, MongoSanitize"]
        JWT["HttpOnly Cookie JWT Verification & RBAC Guards"]
        ZodVal["Zod Schema Runtime Validation"]
        Controllers["Feature Controllers (Auth, Appointments, Beds, etc.)"]
        Audit["Background Audit Logger"]

        Proxy -->|Port 5000| SecMiddle
        SecMiddle --> JWT
        JWT --> ZodVal
        ZodVal --> Controllers
        Controllers -.-> Audit
    end

    subgraph Database["Database Persistence Layer"]
        Mongoose["Mongoose ODM Models (11 Schemas)"]
        Atlas[("MongoDB Atlas Cloud Cluster (Cluster0)")]
        LocalDB[("Local MongoDB Fallback (:27017)")]

        Controllers --> Mongoose
        Audit --> Mongoose
        Mongoose -->|Primary Connection| Atlas
        Mongoose -.->|Resilient Fallback| LocalDB
    end
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas Cloud Cluster account OR Local MongoDB Community Server

### 2. Clone the Repository
```bash
git clone https://github.com/itsnotdevill/MEDICORE-Hospital-Management-System-.git
cd MEDICORE-Hospital-Management-System-
```

### 3. Install Dependencies
Install dependencies for root, backend server, and frontend client:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 4. Configure Environment Variables
Create `server/.env` (a template is provided in `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.a9jzgrg.mongodb.net/medicore_db?retryWrites=true&w=majority
JWT_SECRET=medicore_super_secure_jwt_secret_development_key_university_project_2026
JWT_EXPIRES_IN=15m
CLIENT_ORIGIN=http://localhost:5173
```

> [!TIP]
> **Zero Configuration Fallback**: If `MONGODB_URI` is not provided or Atlas credentials are being set up, MediCore automatically connects to local MongoDB (`mongodb://127.0.0.1:27017/medicore_db`) so the app never fails!

### 5. Seed Database (All 11 Collections)
Seed the database with rich clinical test data:
```bash
# Seed to your currently active database (Local or Atlas)
npm run seed

# OR seed directly to MongoDB Atlas Cloud Cluster
npm run seed:atlas
```

### 6. Start Development Servers
Run both backend and frontend concurrently:
```bash
# In Terminal 1 - Backend Server (Port 5000)
npm run dev:server

# In Terminal 2 - Frontend Client (Port 5173)
npm run dev:client
```
Open **`http://localhost:5173`** in your browser.

---

## 👥 Demo User Credentials

The application includes 4 pre-configured personas ready for demonstration:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| 🛡️ **Hospital Admin** | `admin@medicore.dev` | `Admin@12345` | Full system control, staff onboarding, audit logs, revenue analytics, beds & inventory oversight |
| 🩺 **Senior Doctor** | `dr.sharma@medicore.dev` | `Doctor@12345` | Clinical queue, consultations, digital prescription builder, lab orders, patient medical histories |
| 🏥 **Receptionist** | `reception@medicore.dev` | `Reception@12345` | Patient registration, appointment scheduling, doctor directory, inpatient bed inquiry |
| 💳 **Billing Staff** | `billing@medicore.dev` | `Billing@12345` | Invoice generation, diagnostic fee additions, payment settlement, printable tax receipts |

*(All login credentials can also be auto-filled with 1-click directly on the Sign In page)*

---

## 📡 API Specification

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate staff & issue HttpOnly JWT cookie | Public |
| `POST` | `/api/auth/register` | Register new hospital staff / doctor | Public |
| `POST` | `/api/auth/logout` | Clear auth cookie & revoke session | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user profile & privileges | Authenticated |
| `GET` | `/api/system/status` | Real-time DB latency, 11 collection counts & security state | Public |
| `GET` | `/api/patients` | Paginated patient list with query search | Admin, Receptionist |
| `POST` | `/api/patients` | Register new electronic patient health record | Admin, Receptionist |
| `GET` | `/api/doctors` | List doctors with specialties & fees | All Roles |
| `GET` | `/api/appointments` | List appointments with doctor/date filters | Admin, Receptionist, Doctor |
| `POST` | `/api/appointments` | Create appointment with conflict detection | Admin, Receptionist, Doctor |
| `POST` | `/api/consultations` | Save clinical diagnosis, Rx list & lab tests | Doctor |
| `GET` | `/api/invoices` | List invoices with status & patient filters | Admin, Billing |
| `POST` | `/api/invoices` | Generate invoice with dynamic charges | Admin, Billing |
| `PUT` | `/api/invoices/:id` | Process partial or full payment settlement | Admin, Billing |
| `GET` | `/api/beds` | Real-time ward & ICU bed occupancy matrix | Admin, Doctor, Receptionist |
| `PUT` | `/api/beds/:id/status`| Admit patient / discharge bed | Admin, Receptionist |
| `GET` | `/api/pharmacy` | List medication inventory & stock levels | Admin, Doctor, Billing |
| `PUT` | `/api/pharmacy/:id/stock`| Update inventory quantities | Admin, Billing |
| `GET` | `/api/services` | Diagnostic laboratory & radiology test catalog | Admin, Doctor, Billing |
| `GET` | `/api/reports/dashboard`| Aggregate revenue & appointment statistics | Admin |
| `GET` | `/api/reports/audit-logs`| System audit trail events | Admin |

---

## 🧪 Testing & Quality Assurance

MediCore HMS includes an automated backend integration test suite:
```bash
# Run Vitest test suite
npm run test:server

# Run TypeScript type check across entire project
npm run build:server
npm run build:client
```

---

## 🎓 University Viva & Architectural Defense

### Q1: Why store JWT in an `httpOnly` cookie instead of `localStorage`?
> **Answer**: `localStorage` is accessible by any client-side JavaScript executing in the browser. In the event of a Cross-Site Scripting (XSS) vulnerability, an attacker can extract tokens directly. An `httpOnly` cookie is inaccessible to JavaScript via `document.cookie`, meaning tokens cannot be stolen via XSS, while the browser automatically attaches it to same-origin requests.

### Q2: How does MediCore prevent double-booking of doctors?
> **Answer**: During appointment creation, the backend runs an atomic query checking if an active appointment (`status: { $ne: 'CANCELLED' }`) already exists for the designated `doctorId` at the selected `date` and `timeSlot`. If a match exists, a `409 Conflict` HTTP error is returned.

### Q3: How is data integrity guaranteed during financial invoice creation?
> **Answer**: Invoices calculate the total amount deterministically on the server:
> $$\text{Total Amount} = \text{Consultation Fee} + \sum(\text{Additional Charges}) - \text{Discount}$$
> The client cannot tamper with the final total, and all numeric fields are strictly validated via Zod schemas.

### Q4: How is high availability achieved with MongoDB Atlas?
> **Answer**: The database connection layer in `server/src/config/database.ts` establishes an encrypted connection to the multi-region MongoDB Atlas replica set (`Cluster0`) using Google Public DNS (`8.8.8.8`) to prevent Windows SRV lookup timeouts. If network degradation occurs, a local fallback is initiated automatically.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">
  <b>Developed for University Final-Year Project Demonstration</b><br>
  Built with ❤️ using React 19, TypeScript, Express, and MongoDB Atlas.
</div>
