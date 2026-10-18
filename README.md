# 🏥 MediCore HMS — Enterprise Hospital Management System

<div align="center">

![MediCore HMS Banner](https://img.shields.io/badge/MediCore-Hospital%20Management%20System-0d9488?style=for-the-badge&logo=mediamarkt&logoColor=white)

[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-Cloud%20Cluster-47a248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Google OAuth 2.0](https://img.shields.io/badge/Google%20OAuth-2.0%20SSO-4285F4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/identity/protocols/oauth2)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-729b1b?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A modern, production-grade, full-stack Hospital Management System (HMS) engineered with React 19, TypeScript, Node.js 20 LTS/Express, and MongoDB Atlas.**  
*Includes Enterprise Google OAuth 2.0 Single Sign-On, Role-Based Access Control, Medical Faculty Onboarding, Clinical Consultations, Digital Prescriptions, Inpatient Ward & Bed Occupancy Matrix, Pharmacy Formulary, Itemized Medical Billing, and Real-Time Cloud Observability.*

[Live Demo](#-live-deployment--cloud-architecture) • [System Architecture](#-system-architecture) • [Frontend Deep Dive](#-frontend-architecture--engineering) • [Backend Deep Dive](#-backend-architecture--engineering) • [Database Design](#-database-architecture-11-collections) • [Hospital Workflows](#-end-to-end-clinical-workflows) • [API Reference](#-api-specification) • [College Viva & Defense](#-university-viva--interview-defense-guide)

</div>

---

## 📌 Executive Summary & Academic Overview

Healthcare institutions often struggle with fragmented legacy software, manual paper-based record-keeping, medication dispensing errors, and vulnerable patient data stores. **MediCore HMS** is a state-of-the-art clinical information platform designed to unite all hospital operations into a unified, secure, and reactive web application.

### Key Operational Metrics
- **4 Distinct User Roles**: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, and `BILLING_STAFF`.
- **11 Normalized Mongoose Collections**: Fully relational data modeling with relational references and compound indexing.
- **Sub-150ms Cloud Database Latency**: Direct multi-region connection to MongoDB Atlas Cloud Cluster.
- **Zero-Trust Security**: HttpOnly JWT sessions, Bcrypt-12 password hashing, runtime Zod payload validation, and NoSQL injection sanitization.
- **Single-Service Unified Deployment**: React 19 frontend and Express backend served from a unified production container on Render.

---

## 🏗️ System Architecture

MediCore HMS adopts a **Single Unified Web Service Architecture**. The Express API serves both the RESTful API endpoints (`/api/*`) and the compiled Vite React 19 Single Page Application (`/*`), eliminating Cross-Origin Resource Sharing (CORS) latency and multi-domain cookie complications in production.

```mermaid
flowchart TD
    subgraph Browser["User Client Tier (Browser)"]
        UI["React 19 SPA (Vite + Tailwind CSS)"]
        State["Zustand Auth & Session Store"]
        Forms["React Hook Form + Zod Client Validation"]
        AxiosClient["Axios HTTP Client (with Credentials)"]
        UI --> State
        UI --> Forms
        Forms --> AxiosClient
    end

    subgraph ServerTier["Application & API Gateway Tier (Node.js 20 LTS + Express)"]
        Security["Security Shield: Helmet, RateLimiter, MongoSanitize"]
        OAuthHandler["Google OAuth 2.0 / OpenID Connect Engine"]
        AuthGuards["HttpOnly JWT Verification & RBAC Middleware"]
        Controllers["Clinical Feature Controllers (Doctors, Patients, Beds, Billing, etc.)"]
        AuditService["Immutable Audit Trail Engine"]

        AxiosClient -->|HTTPS Requests| Security
        Security --> OAuthHandler
        Security --> AuthGuards
        AuthGuards --> Controllers
        Controllers -.->|Async Logging| AuditService
    end

    subgraph DataTier["Data Persistence Tier (MongoDB Atlas Cloud Cluster)"]
        MongooseModels["Mongoose ODM Models (11 Schemas)"]
        CloudAtlas[("MongoDB Atlas Primary Replica Set")]
        LocalFallback[("Local MongoDB Engine Fallback")]

        Controllers --> MongooseModels
        AuditService --> MongooseModels
        MongooseModels -->|Primary TLS Connection| CloudAtlas
        MongooseModels -.->|Dev Failover| LocalFallback
    end
```

---

## 💻 Frontend Architecture & Engineering

The client tier is built with **React 19**, **TypeScript 5.6**, and **Vite 8**, prioritizing performance, accessibility, and high aesthetic standards.

### 1. Technology Stack Breakdown
| Library / Tool | Version | Purpose in MediCore HMS |
| :--- | :--- | :--- |
| **React** | `19.2.8` | Core component library utilizing modern concurrent rendering and lifecycle hooks. |
| **TypeScript** | `~6.0.2` | Compile-time type-safety across all components, API schemas, and state slices. |
| **Tailwind CSS** | `3.4.19` | Modern clinical design system with responsive glassmorphism and color tokens. |
| **Zustand** | `5.0.15` | Minimalist, unopinionated client state management for authentication and session status. |
| **React Router** | `6.30.6` | Client-side routing with role-based `ProtectedRoute` guards and deep linking. |
| **React Hook Form** | `7.90.0` | High-performance uncontrolled forms with minimal re-renders. |
| **Zod** | `3.25.76` | Runtime form validation schemas guaranteeing type integrity before API dispatch. |
| **Recharts** | `3.10.1` | Interactive, responsive SVG analytics charts for executive revenue and appointment trends. |
| **Lucide React** | `1.57.0` | Clean, standardized healthcare and operational iconography. |
| **Radix UI** | `2.x` | Headless, accessible primitives for dialogs, dropdowns, and tooltips. |

### 2. Frontend Project Structure
```
client/src/
├── api/                   # Typed Axios API service modules (auth, doctors, patients, etc.)
├── components/            # Reusable UI component library
│   ├── layout/            # AppLayout, dynamic Sidebar, Topbar with DB live ping
│   └── ui/                # Button, Modal, Card, Input, Badge, Dialog primitives
├── features/              # Modular domain feature slices
│   ├── appointments/      # Outpatient scheduling & conflict-free booking matrix
│   ├── auth/              # Dual-tab login/signup, Google SSO button, Profile Google Hub
│   ├── beds/              # Inpatient ward & ICU occupancy matrix
│   ├── consultations/     # EHR encounter portal & dynamic prescription builder
│   ├── dashboard/         # Executive analytics, revenue graphs, KPI summary cards
│   ├── doctors/           # Doctor directory, "+ Add Doctor" modal, weekly schedule pills
│   ├── invoices/          # Itemized billing generator, payment modals, tax receipts
│   ├── patients/          # Electronic health patient directory & onboarding
│   ├── pharmacy/          # Medicine formulary, batch tracking, stock threshold alerts
│   └── services/          # Laboratory, radiology & hospital procedure catalog
├── store/                 # Zustand global stores (useAuthStore, useSystemStore)
├── types/                 # Shared TypeScript interfaces & DTO schemas
└── utils/                 # Formatters, currency helpers, and validation utilities
```

### 3. Key Frontend Innovations
- **Role-Adaptive Dynamic Sidebar**: Inspects the authenticated user's role (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `BILLING_STAFF`) and dynamically mounts only permissible navigation routes.
- **Live Database Telemetry Badge**: A real-time latency ping badge in the navigation header that continuously tests round-trip response time to the cloud database cluster.
- **Dual-Tab Authentication Portal**: Complete with one-click **Viva Demonstration Personas** allowing evaluators to instantly switch roles without manual typing.
- **Interactive Weekly Schedule Builder**: Multi-day pill selection (`MON` through `SUN`) with start and end time inputs for physician consulting hours.

---

## ⚙️ Backend Architecture & Engineering

The server is built with **Node.js 20 LTS**, **Express 4.19**, and **TypeScript**, structured around a modular **Controller-Service-Repository** architecture.

### 1. Technology Stack Breakdown
| Technology | Version | Purpose in MediCore HMS |
| :--- | :--- | :--- |
| **Node.js** | `20 LTS` | High-throughput asynchronous JavaScript runtime. |
| **Express** | `4.19.2` | Minimalist HTTP web framework powering RESTful routing. |
| **Mongoose** | `8.7.0` | Object Data Modeling (ODM) library for MongoDB with schema validation. |
| **Google Auth Library** | `11.3.1` | Official Google OAuth 2.0 / OpenID Connect client for token verification. |
| **BcryptJS** | `2.4.3` | Cryptographic password hashing utilizing 12 computational salt rounds. |
| **JsonWebToken** | `9.0.2` | Cryptographically signed session tokens stored in secure HttpOnly cookies. |
| **Zod** | `3.23.8` | Strict runtime schema validation on all incoming request payloads. |
| **Helmet** | `8.0.0` | Enforces modern HTTP security headers (CSP, HSTS, Sniff-Protection). |
| **Express Rate Limit** | `7.4.1` | Protects endpoints against denial-of-service and brute-force attacks. |
| **Vitest** | `2.1.2` | High-speed unit and integration test runner for backend endpoints. |

### 2. Multi-Layered Security Architecture
1. **HttpOnly Cookie Authentication**: JWT access tokens are stored strictly in `httpOnly`, `SameSite: Lax`, `Secure` cookies. Client-side JavaScript cannot read or extract the token via `document.cookie`, completely eliminating XSS token exfiltration.
2. **Zero-Trust Google SSO Validation**: Unregistered third-party Google accounts are prevented from accessing staff routes. MediCore validates verified Google email identities against active database records before issuing sessions.
3. **Cryptographic State Security**: OAuth 2.0 flows utilize signed state cookies with a 10-minute expiration to prevent Login Cross-Site Request Forgery (CSRF).
4. **NoSQL Injection Shield**: `express-mongo-sanitize` recursively strips malicious operators (e.g., `$gt`, `$ne`, `$where`) from `req.body`, `req.query`, and `req.params`.
5. **Dual Rate Limiting**:
   - General API endpoints: 200 requests per 15 minutes.
   - Authentication endpoints: 20 requests per 15 minutes to block credential-stuffing bots.
6. **Immutable Audit Trail**: Every sensitive mutation (`PATIENT_REGISTERED`, `DOCTOR_ONBOARDED`, `PRESCRIPTION_WRITTEN`, `INVOICE_SETTLED`, `GOOGLE_ACCOUNT_LINKED`) automatically writes an immutable log record capturing actor ID, email, role, action, resource, IP address, and timestamp.

---

## 🗄️ Database Architecture (11 Collections)

MediCore HMS utilizes **11 fully normalized and indexed collections** in MongoDB Atlas:

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
| 1 | **`users`** | Staff credentials & identities | `_id` (ObjectId) | `email` (unique), `passwordHash`, `role`, `googleId`, `avatarUrl`, `phone`, `isActive` |
| 2 | **`departments`** | Hospital medical specialties | `_id` (ObjectId) | `name`, `description`, `headDoctorId` ➔ `users` |
| 3 | **`doctors`** | Specialist clinical profiles | `_id` (ObjectId) | `userId` ➔ `users`, `departmentId`, `consultationFee`, `schedule[]`, `experience`, `specialization` |
| 4 | **`patients`** | Electronic health patient records | `patientId` (`P-00001`) | `name`, `dob`, `gender`, `bloodGroup`, `allergies[]`, `emergencyContact` |
| 5 | **`appointments`**| Outpatient & emergency visits | `appointmentId` (`A-00001`)| `patientId`, `doctorId`, `date`, `timeSlot`, `status`, `type` |
| 6 | **`consultations`**| Diagnoses & Rx records | `_id` (ObjectId) | `appointmentId`, `diagnosis`, `prescription[]`, `labTests[]` |
| 7 | **`invoices`** | Itemized hospital bills | `invoiceId` (`INV-00001`) | `patientId`, `appointmentId`, `totalAmount`, `paidAmount`, `status` |
| 8 | **`hospitalservices`**| Diagnostic & procedure catalog | `code` (`SRV-LAB01`) | `name`, `category`, `price`, `description` |
| 9 | **`pharmacyitems`**| Dispensary medicine formulary | `code` (`MED-001`) | `genericName`, `dosageStrength`, `stockQuantity`, `reorderLevel`, `expiryDate` |
| 10| **`wardbeds`** | Ward & ICU bed management | `bedNumber` (`ICU-01`) | `wardType`, `floor`, `dailyRate`, `status`, `currentPatientId` |
| 11| **`auditlogs`** | Tamper-evident mutation log | `_id` (ObjectId) | `userId`, `userRole`, `action`, `resource`, `ipAddress`, `timestamp` |

---

## 🔄 End-to-End Clinical Workflows

### Workflow 1: Outpatient Journey (Registration ➔ Consultation ➔ Billing)
1. **Patient Registration**: Receptionist registers patient details (demographics, blood group, allergies, emergency contact).
2. **Conflict-Free Appointment Scheduling**: Patient selects a specialist doctor, consultation date, and time slot. The system validates doctor availability and blocks conflicting slots.
3. **Doctor Consultation**: Doctor reviews the appointment queue, documents clinical observations, enters diagnoses (with ICD codes), and builds a digital multi-drug prescription.
4. **Diagnostic Test Orders**: Doctor links required laboratory and radiology investigations.
5. **Itemized Billing**: Cashier generates a comprehensive invoice combining doctor fees, laboratory charges, and pharmacy orders minus applicable discounts, followed by instant payment processing.

### Workflow 2: Medical Faculty Onboarding & Google SSO
1. **Admin Provisioning**: Hospital Administrator navigates to **Clinical EMR > Doctors** and opens the **"+ Add New Doctor"** modal.
2. **Profile & Schedule Definition**: Enters doctor credentials, medical department, qualifications (MBBS, MD), consultation fee, and weekly consulting windows (`MON`–`SUN`).
3. **Automatic SSO Binding**: Entering the doctor's Google email address automatically registers a `User` account with role `DOCTOR` and links their `Doctor` clinical profile.
4. **1-Click Google Login**: The doctor navigates to the login screen, clicks **"Continue with Google"**, authenticates, and is immediately redirected to their **Doctor Portal** (`/appointments`) with full clinical permissions.

### Workflow 3: Inpatient Bed Management & Ward Operations
1. **Live Bed Matrix**: Displays real-time status (Available, Occupied, Under Maintenance) across ICU, Private AC, and General Wards.
2. **Patient Admission**: Admits a patient to a specific bed, linking attending physician and admission timestamp.
3. **Discharge & Billing**: Bed charges calculate automatically into the final discharge invoice based on bed daily rate and duration of stay.

---

## 📡 API Specification

| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate staff & issue HttpOnly JWT cookie | Public |
| `POST` | `/api/auth/register` | Register new staff member (with HIPAA acknowledgment) | Public |
| `POST` | `/api/auth/logout` | Revoke session cookie & log logout audit event | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user profile and permission set | Authenticated |
| `GET` | `/api/auth/google` | Initiate Google OAuth 2.0 authorization code flow | Public |
| `GET` | `/api/auth/google/callback` | Exchange OAuth code for Google profile & issue JWT | Public |
| `POST` | `/api/auth/google/link` | Link Google identity to existing account with password | Authenticated |
| `POST` | `/api/auth/google/unlink` | Unlink Google identity from active user profile | Authenticated |
| `GET` | `/api/system/status` | DB latency, readyState, and document counts across 11 collections | Public |
| `GET` | `/api/health` | Lightweight service health probe for cloud load balancers | Public |
| `GET` | `/api/doctors` | Paginated doctor directory with specialties and schedules | All Roles |
| `POST` | `/api/doctors` | Onboard new physician (provisions User + Doctor profile) | `ADMIN` |
| `PUT` | `/api/doctors/:id` | Update physician qualifications, fees, or schedules | `ADMIN` |
| `DELETE` | `/api/doctors/:id` | Deactivate/remove doctor from active hospital directory | `ADMIN` |
| `GET` | `/api/patients` | Paginated patient directory with search queries | `ADMIN`, `RECEPTIONIST` |
| `POST` | `/api/patients` | Register new electronic patient health record | `ADMIN`, `RECEPTIONIST` |
| `GET` | `/api/appointments` | Appointment schedule filtered by date or doctor | `ADMIN`, `DOCTOR`, `RECEPTIONIST` |
| `POST` | `/api/appointments` | Book appointment with atomic conflict prevention | `ADMIN`, `DOCTOR`, `RECEPTIONIST` |
| `POST` | `/api/consultations` | Save clinical diagnosis, digital Rx list, and lab orders | `DOCTOR` |
| `GET` | `/api/invoices` | List invoices with status, date, and patient filters | `ADMIN`, `BILLING_STAFF` |
| `POST` | `/api/invoices` | Generate itemized hospital invoice with dynamic fees | `ADMIN`, `BILLING_STAFF` |
| `PUT` | `/api/invoices/:id` | Process payment settlement (Cash, Card, UPI, Insurance) | `ADMIN`, `BILLING_STAFF` |
| `GET` | `/api/beds` | Real-time ward and ICU bed occupancy matrix | `ADMIN`, `DOCTOR`, `RECEPTIONIST` |
| `PUT` | `/api/beds/:id/status`| Admit patient, set maintenance, or discharge bed | `ADMIN`, `RECEPTIONIST` |
| `GET` | `/api/pharmacy` | List medication formulary, stock counts, and expiries | `ADMIN`, `DOCTOR`, `BILLING_STAFF` |
| `PUT` | `/api/pharmacy/:id/stock`| Update inventory quantities and reorder thresholds | `ADMIN`, `BILLING_STAFF` |
| `GET` | `/api/services` | Diagnostic laboratory and radiology procedure catalog | `ADMIN`, `DOCTOR`, `BILLING_STAFF` |
| `GET` | `/api/reports/dashboard`| Aggregate revenue analytics and appointment metrics | `ADMIN` |
| `GET` | `/api/reports/audit-logs`| Cryptographic audit log trail | `ADMIN` |

---

## ☁️ Live Deployment & Cloud Architecture

MediCore HMS is configured for **1-click cloud deployment on Render** via Blueprint ([`render.yaml`](file:///c:/Users/kadam/OneDrive/Desktop/MEDICORE%20HMS/render.yaml)):

### Cloud Architecture Highlights
- **Single Web Service Container**: Runs Node.js 20 LTS. Compiles the React 19 frontend into optimized production chunks and serves both the API and client from a single port (`10000`).
- **MongoDB Atlas Integration**: Connects via TLS to a multi-region replica set cluster (`cluster0.a9jzgrg.mongodb.net`) with sub-150ms latency.
- **Automated Health Probes**: `/api/health` continuously validates Mongoose connectivity and process uptime for cloud load balancers.

```yaml
# render.yaml blueprint architecture
services:
  - type: web
    name: medicore-hms
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm run render-build
    startCommand: node server/dist/index.js
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_VERSION
        value: 20.18.0
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        value: mongodb+srv://medicore_db:medicore_dbofficial@cluster0.a9jzgrg.mongodb.net/medicore_db?retryWrites=true&w=majority
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 15m
```

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **MongoDB**: MongoDB Atlas Cloud account OR Local MongoDB Community Server

### 2. Clone and Install
```bash
git clone https://github.com/itsnotdevill/MEDICORE-Hospital-Management-System-.git
cd MEDICORE-Hospital-Management-System-

# Install root, backend server, and frontend client dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Environment Variables
Create a `server/.env` file with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://medicore_db:medicore_dbofficial@cluster0.a9jzgrg.mongodb.net/medicore_db?retryWrites=true&w=majority
JWT_SECRET=medicore_super_secure_jwt_secret_development_key_university_project_2026
JWT_EXPIRES_IN=15m
CLIENT_ORIGIN=http://localhost:5173
SERVER_PUBLIC_URL=http://localhost:5000

# Optional Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 4. Database Seeding
Seed all 11 collections with rich clinical test data:
```bash
npm run seed:atlas
```

### 5. Run Development Servers
```bash
# Terminal 1 - Backend Server (Port 5000)
npm run dev:server

# Terminal 2 - Frontend Client (Port 5173)
npm run dev:client
```
Visit **`http://localhost:5173`** in your browser.

---

## 👥 Demo Personas (1-Click Viva Demonstration)

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| 🛡️ **Hospital Admin** | `admin@medicore.dev` | `Admin@12345` | System control, doctor onboarding, audit logs, revenue analytics, bed & pharmacy oversight |
| 🛡️ **Google Admin** | `itsnotdevill@gmail.com` | `Password123!` | Direct Google OAuth 1-click admin login & management |
| 🩺 **Senior Doctor** | `dr.sharma@medicore.dev` | `Doctor@12345` | Clinical queue, consultations, digital prescription builder, lab orders, patient medical histories |
| 🏥 **Receptionist** | `reception@medicore.dev` | `Reception@12345` | Patient registration, appointment scheduling, doctor directory, inpatient bed inquiry |
| 💳 **Billing Staff** | `billing@medicore.dev` | `Billing@12345` | Invoice generation, diagnostic fee additions, payment settlement, printable tax receipts |

---

## 🎓 University Viva & Interview Defense Guide

### Q1: Why store the JWT in an `httpOnly` cookie instead of `localStorage`?
> **Answer**: `localStorage` is accessible to any JavaScript running on the page. If the application has any Cross-Site Scripting (XSS) vulnerability, malicious scripts can read `localStorage.getItem('token')` and exfiltrate user credentials. Storing the JWT inside an `httpOnly`, `SameSite: Lax`, and `Secure` cookie prevents JavaScript from reading the cookie via `document.cookie`. The browser automatically includes the cookie in same-origin requests, neutralizing XSS token theft.

### Q2: How does the Google OAuth 2.0 flow prevent unauthorized external account access in MediCore?
> **Answer**: Rather than allowing any public Google account to sign up automatically, MediCore applies a **zero-trust verification policy**. When the Google authorization code is exchanged for user claims (`email`, `email_verified`), the backend queries the database for an existing `User` record with that exact email. If the email is not pre-registered by an administrator (or matches the primary provisioned administrator), access is rejected with an `unauthorized_google_account` status code. Furthermore, a cryptographically random, signed `oauth_state` cookie prevents OAuth CSRF attacks.

### Q3: How does the Doctor Onboarding lifecycle grant immediate role-based access for Google Single Sign-On?
> **Answer**: When an administrator registers a new doctor on `/doctors`, the backend atomically provisions both a `User` account (with role `DOCTOR` and the doctor's Google email) and a linked `Doctor` clinical profile. When that doctor later clicks "Continue with Google", the backend matches their verified Google email to their `User` record, links their `googleId`, and issues a signed JWT cookie granting immediate access to the Doctor Portal (`/appointments`, consultations, EHR).

### Q4: How is double-booking of doctors prevented at the database and application levels?
> **Answer**: During appointment creation, the backend executes an atomic query checking if an active appointment (`status: { $ne: 'CANCELLED' }`) already exists for the designated `doctorId` at the selected `date` and `timeSlot`. If a match is found, the server rejects the request with HTTP `409 Conflict`. Additionally, database compound indexes on `{ doctorId: 1, date: 1, timeSlot: 1 }` guarantee fast lookups and prevent concurrency race conditions.

### Q5: Explain Referenced vs. Embedded data models in MongoDB, and why MediCore uses references.
> **Answer**: MongoDB supports both embedded subdocuments and referenced relationships. In MediCore HMS, normalized **references** are chosen for core entities (e.g., `Appointment` references `patientId` and `doctorId`, `Consultation` references `appointmentId`). This prevents duplicate data, ensures that patient demographic updates propagate across all historical encounters, avoids document growth hitting the 16MB BSON limit, and guarantees referential integrity across audit logs and financial billing.

### Q6: How is financial data integrity guaranteed during invoice generation?
> **Answer**: All invoice totals are calculated **strictly server-side**. The client cannot pass arbitrary total amounts. The server computes:
> $$\text{Total Amount} = \text{Doctor Consultation Fee} + \sum(\text{Hospital Services Charges}) - \text{Discount}$$
> Every numerical value is checked using strict Zod schemas against negative numbers, non-numeric values, or unlisted service codes.

### Q7: How does MediCore handle high availability and DNS SRV resolution with MongoDB Atlas?
> **Answer**: In `server/src/config/database.ts`, the database layer connects to a multi-region MongoDB Atlas replica set (`Cluster0`) using TLS encryption. On Windows operating systems, it conditionally routes DNS queries via Google Public DNS (`8.8.8.8`) to avoid local ISP SRV resolution timeouts, while preserving native container DNS on Linux cloud platforms like Render. In local development environments, it gracefully falls back to local MongoDB (`mongodb://127.0.0.1:27017/medicore_db`) if cloud access is offline.

### Q8: What is the purpose of Zod validation at both the frontend and backend layers?
> **Answer**: This is the principle of **Defense-in-Depth**:
> 1. **Client-side (UX layer)**: React Hook Form uses Zod resolvers to provide immediate feedback to the user, preventing unnecessary network round-trips for invalid inputs.
> 2. **Server-side (Security layer)**: The backend re-validates 100% of mutation payloads using Zod middleware. Since external API requests (via Postman, curl, or attackers) bypass the browser, server-side validation is mandatory to protect database integrity.

### Q9: How is NoSQL injection prevented in Express with MongoDB?
> **Answer**: Attackers can attempt NoSQL injection by sending JSON payloads containing MongoDB query operators like `{"username": {"$gt": ""}, "password": {"$gt": ""}}`. MediCore integrates `express-mongo-sanitize`, which recursively strips any key starting with `$` or containing a `.` from `req.body`, `req.query`, and `req.params`, rendering query injection attacks ineffective.

### Q10: How does the unified deployment architecture serve both frontend and backend from a single web service?
> **Answer**: During the build phase (`npm run render-build`), Vite bundles the React 19 frontend into static assets in `client/dist`. When the Express server boots in production, `express.static` serves the static distribution bundle. A wildcard route (`app.get('*')`) redirects non-API requests to `index.html`, allowing React Router to manage client-side SPA navigation seamlessly while Express handles `/api/*` endpoints on the exact same port.

### Q11: What is the role of the Audit Log trail in a clinical healthcare environment (HIPAA compliance)?
> **Answer**: Health Insurance Portability and Accountability Act (HIPAA) security guidelines require that any creation, modification, or deletion of Electronic Protected Health Information (ePHI) be tracked. MediCore's `AuditLog` collection records the actor's ID, role, action, modified resource, client IP address, and an immutable ISO timestamp for every clinical transaction, providing complete forensic accountability.

### Q12: Why choose Zustand over Redux for client state management?
> **Answer**: Redux introduces significant boilerplate (action creators, reducers, dispatchers, complex middleware). Zustand provides a lightweight (~1.1 kB), hook-based state container with zero boilerplate, native TypeScript support, and decoupled subscriptions that only re-render components when selected state slices change. This delivers superior render performance for real-time hospital dashboards.

---

## 📜 License & Academic Integrity

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">
  <b>MediCore HMS — University Final-Year Engineering Capstone Project</b><br>
  Designed & Engineered with ❤️ using React 19, TypeScript, Express, and MongoDB Atlas.
</div>
