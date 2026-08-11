# 🚀 Mini ERP + CRM Operations Portal

A full-stack, enterprise-grade **Mini ERP & CRM Operations Portal** built with **Node.js + Express (TypeScript)**, **PostgreSQL (Prisma ORM)**, and **React (Vite + Modern UI)**. Designed with Role-Based Access Control (RBAC), multi-product sales challans with atomic stock reduction, product price snapshotting, printable GST Tax Invoices, and resilient fallback data stores.

---

## 📋 Table of Contents

- [Features Overview](#-features-overview)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Pre-configured Demo Accounts](#-pre-configured-demo-accounts)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Docker Containerization](#-docker-containerization)
- [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
- [REST API Endpoints Summary](#-rest-api-endpoints-summary)
- [Postman API Collection](#-postman-api-collection)

---

## ✨ Features Overview

### 1. 📊 Operational Dashboard
- Real-time KPI summary cards (Total Customers, Active Leads, Product Catalog Size, Low-Stock Warnings).
- Quick Action shortcut bar for rapid CRM and inventory operations.
- Recent Customer Registrations list and Low-Stock Restock Alerts.

### 2. 👥 Customer CRM Module (`/customers`)
- Complete Customer CRUD operations (Name, Mobile, Email, Business Name, GSTIN, Address).
- Filters for customer status (`LEAD`, `ACTIVE`, `INACTIVE`) and type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
- Customer 360 Detail View featuring contact information, GST details, and follow-up notes timeline.

### 3. 📦 Inventory & Stock Movement Ledger (`/inventory`)
- Product catalog management with SKU, Category, Price, Stock Levels, and Minimum Alert Thresholds.
- Low-stock alert indicators highlighted in amber/red when current inventory drops below thresholds.
- Manual Stock Adjustments (`IN` / `OUT`) with mandatory reason logging.
- Stock Movement History Ledger tracking all inventory transactions with timestamps and user details.

### 4. 📄 Sales Challan Engine (`/challans`)
- Automatic sequential serial generator formatted as `CHL-YYYYMMDD-XXXX`.
- Multi-product dispatch picker with real-time stock availability warnings.
- **Product Price Snapshotting**: Preserves historical item rates and SKU details at the time of creation.
- **Atomic Stock Deduction**: Validates stock levels inside database transactions and atomically decrements inventory upon confirmation (`CONFIRMED`). Automatically restores stock if a confirmed challan is `CANCELLED`.

### 5. 🖨️ Printable GST Tax Invoice & PDF Export
- 1-Click **Print / Save as PDF** generator.
- Formatted official GST Tax Invoice containing Company Details, Customer GSTIN, Itemized Rate Table, 18% IGST Tax breakdown, and Authorized Signatory lines.

### 6. 🛡️ Staff Directory & User Management (`/users`)
- Restricted view for `ADMIN` role displaying staff accounts, email addresses, joined dates, and role permission levels.

---

## 🏗️ Architecture & Tech Stack

```
ERP System/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration & in-memory fallback store
│   │   ├── controllers/     # Auth, Customer, Product, Challan, Dashboard, User controllers
│   │   ├── middleware/      # JWT Authentication & Role-Based Authorization
│   │   ├── routes/          # Express route definitions
│   │   ├── utils/           # JWT token generator & verifier
│   │   └── app.ts / index.ts# Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL Schema (Users, Customers, Products, StockLogs, Challans)
│   │   └── seed.ts          # Database seed script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth/        # Login Page with 1-click test credentials
│   │   │   ├── Dashboard/   # Operational overview & financial KPIs
│   │   │   ├── Customers/   # Customer CRM list, detail view & modal
│   │   │   ├── Inventory/   # Product list, stock alerts & movement ledger
│   │   │   ├── Challans/    # Sales challan list, multi-item dispatch form & printable invoice
│   │   │   └── Users/       # Staff directory (Admin only)
│   │   ├── services/        # Axios API clients with auto 401 token refresh interceptors
│   │   ├── types/           # TypeScript interfaces
│   │   └── App.tsx          # Router layout & navigation bar
│   └── package.json
├── docs/
│   └── postman_collection.json # Complete Postman API collection
├── docker-compose.yml       # Docker container orchestration
└── README.md
```

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT Authentication, bcryptjs.
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, Date-fns, React Hot Toast.

---

## 🔐 Pre-configured Demo Accounts

The application features 1-click quick login buttons on the `/login` screen for all 4 roles:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@erp.com` | `password123` | Full system access across all modules & staff directory |
| **💼 Sales Rep** | `sales@erp.com` | `password123` | Full Customer CRM access, create draft/confirmed challans |
| **📦 Warehouse Manager** | `warehouse@erp.com` | `password123` | Product catalog, stock adjustments, dispatch verification |
| **📊 Accounts Dept** | `accounts@erp.com` | `password123` | View customer ledgers, print GST invoices, financial reports |

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Build TypeScript code
npx tsc -b

# Start backend server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5174)
npm run dev
```

Visit `http://localhost:5174` in your browser. The system will automatically authenticate you as Admin or prompt you to choose a role on the login screen!

---

## 🐳 Docker Containerization

Run the complete full-stack environment (PostgreSQL database, Node backend, React frontend) using Docker Compose:

```bash
# Build and run containers
docker compose up --build
```

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Module / Action | Admin | Sales | Warehouse | Accounts |
| :--- | :---: | :---: | :---: | :---: |
| **Customer CRM (Create/Edit)** | ✅ | ✅ | 👁️ Read | 👁️ Read |
| **Product Catalog (Create/Edit)** | ✅ | 👁️ Read | ✅ | 👁️ Read |
| **Stock Adjustments & Movement Logs** | ✅ | 👁️ Read | ✅ | 👁️ Read |
| **Create Sales Challans** | ✅ | ✅ | ✅ | 👁️ Read |
| **Confirm / Cancel Dispatches** | ✅ | ✅ | ✅ | 👁️ Read |
| **Print GST Tax Invoices** | ✅ | ✅ | ✅ | ✅ |
| **Staff & Role Management** | ✅ | ❌ | ❌ | ❌ |

---

## 🌐 REST API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Sign in and obtain JWT token
- `GET /api/auth/me` — Retrieve logged-in user profile

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — Retrieve operational metrics, recent customers, and stock warnings

### Customers (`/api/customers`)
- `GET /api/customers` — List customers with search, pagination, and status filters
- `POST /api/customers` — Create a new customer
- `GET /api/customers/:id` — Get customer details and order history
- `PUT /api/customers/:id` — Update customer details
- `POST /api/customers/:id/follow-ups` — Add follow-up notes

### Products & Inventory (`/api/products` & `/api/inventory`)
- `GET /api/products` — List product catalog with low-stock alert flags
- `POST /api/products` — Register a new product
- `GET /api/products/:id` — Get product detail & movement history
- `PUT /api/products/:id` — Update product details
- `POST /api/products/:id/adjust-stock` — Perform manual stock IN/OUT adjustment with audit log
- `GET /api/inventory/movement-logs` — Retrieve stock audit movement ledger

### Sales Challans (`/api/challans`)
- `GET /api/challans` — List sales challans with status filters
- `POST /api/challans` — Create a new challan (Draft or Confirmed with atomic stock reduction)
- `GET /api/challans/:id` — Get challan detail with product price snapshot data
- `PATCH /api/challans/:id/status` — Update status (`DRAFT` → `CONFIRMED` → `CANCELLED`)

### Users (`/api/users`)
- `GET /api/users` — List staff directory (Admin only)

---

## 📮 Postman API Collection

A pre-configured Postman API collection is included under [`docs/postman_collection.json`](docs/postman_collection.json). Import this file into Postman to test authentication headers and API endpoints.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
