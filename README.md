# Orlise Jewellery Billing & GST Invoice Management System

A production-ready Jewellery & Diamond Billing Management Web Application built specifically for the Indian jewellery, diamond, and precious stone market, featuring exact compliance with the **Orlise Diamond** Tax Invoice standard.

---

## 💎 Features & Highlights

1. **Exact Orlise Diamond Tax Invoice Layout**
   - Pixel-accurate A4 portrait layout modeled after the Orlise Diamond reference tax invoice.
   - Light blue table headers (`#cce5ff`), dual-tier CGST/SGST/IGST breakdown, two-column Bill To & Ship To matrix.
   - Bank details (INDUSIND BANK, Varachha Branch, A/C, IFSC).
   - Reverse charge indicator, Kimberley Process conflict-free diamond declaration, and CGST Rule 138(14) E-Way Bill exemption clauses.
   - Indian numbering system amount in words (e.g. `FOURTEEN LAKH NINETY FOUR THOUSAND FIVE HUNDRED FIFTY FOUR ONLY.`).

2. **Automated Sequence Generation (`OJ/MM-YYNN`)**
   - Formula: `{PREFIX}/{MM}-{YY}{NN}` (e.g. `OJ/11-2601`, `OJ/11-2602`, `OJ/12-2601`, `OJ/01-2701`).
   - Month-by-month auto-resetting sequential counters.
   - Concurrency locking using database transactions and unique constraints to prevent race conditions.

3. **Precise GST Financial Engine (Decimal.js)**
   - Zero floating-point round-off error.
   - Intra-state (CGST + SGST) vs. Inter-state (IGST) automatic selection based on seller state code and place of supply.
   - Configurable GST rates: Rough Diamonds (0.25%: 0.125% CGST + 0.125% SGST), Cut & Polished Diamonds (1.5%: 0.75% CGST + 0.75% SGST), Gold Jewellery (3.0%), Making charges (5.0%).
   - Line-item and invoice-level discounts, mathematical round-off.

4. **Party Management**
   - Complete CRUD for buyers, consignees, and suppliers with PAN and GSTIN validation.
   - Separate Bill To and Ship To parties with one-click "Copy Billing to Shipping".
   - Immutable historical party snapshot stored with each invoice.

5. **Product Master**
   - HSN codes (71023100, 71023910, 71049100, 71131910, 998892), diamond units (Carats `Cts`, Grams, Pcs, Kg).
   - Instant inline addition on invoice without requiring prior database setup.

6. **Payment Management & Audit Trail**
   - Partial and full payments against invoices.
   - Tracks RTGS, NEFT, Cheque, IMPS, UPI, and Cash with UTR / reference numbers.
   - Auto-updating balance due and status badges (`UNPAID`, `PARTIALLY_PAID`, `PAID`).

7. **Executive Dashboard & Reporting**
   - Real-time KPIs: Gross Sales, GST Collected, Pending Receivables, Current Month vs. Financial Year totals.
   - Monthly sales and tax breakdown charts.
   - CSV and Excel export for GSTR-1 accountant filing.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Custom A4 Print Engine
- **Data Table**: TanStack Table v8
- **Math Engine**: Decimal.js
- **Validation**: Zod + React Hook Form
- **Authentication**: JWT session tokens + BCrypt password hashing
- **Exporting**: SheetJS (XLSX) + CSV Export + Window Print / Vector PDF
- **Database**:
  - Normalized PostgreSQL DDL schema (`src/lib/db/schema.sql`)
  - Embedded ACID Transaction Engine with sequence mutex lock (`src/lib/db/index.ts`)

---

## 🚀 Quick Start Guide

### 1. Installation

```bash
# Clone the repository and navigate into the workspace
cd "d:\Project\Orlise billing"

# Install dependencies (already installed)
npm install
```

### 2. Development Mode

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Start

```bash
npm run build
npm start
```

---

## 🔐 Default Authentication Credentials

- **Email**: `admin@orlise.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

---

## 🗄️ Database Backup & Restore

### Automated JSON Snapshot Backup
The database state is safely maintained with ACID write locks in `data/db.json`.

1. **Backup**:
   ```bash
   copy data\db.json data\db_backup_%date%.json
   ```
2. **Restore**:
   Copy any backup snapshot back to `data/db.json` and restart the application.

### PostgreSQL Production Migration
To connect to an external PostgreSQL instance:
1. Execute the DDL schema in `src/lib/db/schema.sql`:
   ```bash
   psql -U postgres -d orlise_billing -f src/lib/db/schema.sql
   ```
2. Set environment variable:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/orlise_billing?schema=public"
   JWT_SECRET="your-super-secret-production-jwt-key"
   ```

---

## 📄 Reference Orlise Diamond Tax Invoice

The reference invoice `media_1793514686220_5af47a31.jpg` has been embedded as the initial reference invoice `OJ/11-2601`:
- **Party**: GURUKRUPA DIAMOND, Surat
- **Item**: ROUGH DIAMONDS (1,569.29 Cts @ ₹950 = ₹14,90,826)
- **CGST (0.125%)**: ₹1,864
- **SGST (0.125%)**: ₹1,864
- **Grand Total**: ₹14,94,554
- **Amount in Words**: `FOURTEEN LAKH NINETY FOUR THOUSAND FIVE HUNDRED FIFTY FOUR ONLY.`
