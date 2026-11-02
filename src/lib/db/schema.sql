-- ==============================================================================
-- ORLISE JEWELLERY BILLING & GST INVOICE MANAGEMENT SYSTEM
-- PostgreSQL Normalized Database Schema
-- Production Ready with Foreign Keys, Unique Constraints, Decimal Types & Audit
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'ACCOUNTANT', 'VIEWER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    address TEXT NOT NULL,
    gstin VARCHAR(15) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    bank_branch VARCHAR(255) NOT NULL,
    bank_account_no VARCHAR(50) NOT NULL,
    bank_ifsc VARCHAR(20) NOT NULL,
    invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'OJ',
    default_terms VARCHAR(100) NOT NULL DEFAULT '30 DAYS',
    declaration_text TEXT NOT NULL,
    signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Parties Table (Customers, Suppliers, Consignees)
CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(30),
    email VARCHAR(255),
    billing_address TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    pan VARCHAR(10) NOT NULL,
    gstin VARCHAR(15) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'INDIA',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
CREATE INDEX IF NOT EXISTS idx_parties_pan ON parties(pan);
CREATE INDEX IF NOT EXISTS idx_parties_gstin ON parties(gstin);

-- 4. Products Master Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(12) NOT NULL,
    default_unit VARCHAR(16) NOT NULL DEFAULT 'Cts' CHECK (default_unit IN ('Cts', 'Grams', 'Pcs', 'Kg')),
    default_rate NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    default_gst_rate NUMERIC(6, 3) NOT NULL DEFAULT 0.250, -- e.g. 0.250% for rough diamond, 1.500% for cut diamond
    category VARCHAR(100) NOT NULL DEFAULT 'DIAMOND',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_hsn ON products(hsn_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 5. Invoice Sequences Table (Atomic monthly sequential counter e.g. OJ/MM-YYNN)
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id VARCHAR(36) PRIMARY KEY,
    prefix VARCHAR(10) NOT NULL,
    year INT NOT NULL,       -- e.g. 26
    month INT NOT NULL,      -- e.g. 11
    current_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sequence_prefix_year_month UNIQUE (prefix, year, month)
);

-- 6. Invoices Table (With immutable historical snapshot columns)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- Format: OJ/11-2601
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_terms VARCHAR(100) NOT NULL DEFAULT '30 DAYS',
    reverse_charge BOOLEAN NOT NULL DEFAULT FALSE,
    transport_mode VARCHAR(100) NOT NULL DEFAULT 'HAND TO HAND',
    vehicle_number VARCHAR(50),
    date_of_supply DATE NOT NULL,
    place_of_supply VARCHAR(100) NOT NULL,
    supply_state VARCHAR(100) NOT NULL,
    supply_state_code VARCHAR(2) NOT NULL,

    -- Immutable JSON historical snapshots
    company_snapshot JSONB NOT NULL,
    bill_to_snapshot JSONB NOT NULL,
    ship_to_snapshot JSONB NOT NULL,

    -- Financial calculations (Decimal 15,2)
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    item_discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    invoice_discount_type VARCHAR(16) NOT NULL DEFAULT 'PERCENTAGE' CHECK (invoice_discount_type IN ('PERCENTAGE', 'FIXED')),
    invoice_discount_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    invoice_discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    round_off NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_in_words TEXT NOT NULL,

    -- Payment tracking
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
    status VARCHAR(32) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'CANCELLED')),

    declaration_text TEXT NOT NULL,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 7. Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id VARCHAR(36) REFERENCES products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(12) NOT NULL,
    quantity NUMERIC(15, 4) NOT NULL, -- 4 decimal digits for carats
    unit VARCHAR(16) NOT NULL DEFAULT 'Cts',
    rate NUMERIC(15, 2) NOT NULL,
    gross_amount NUMERIC(15, 2) NOT NULL,
    discount_type VARCHAR(16) NOT NULL DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    taxable_amount NUMERIC(15, 2) NOT NULL,
    cgst_rate NUMERIC(6, 3) NOT NULL DEFAULT 0.000,
    cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(6, 3) NOT NULL DEFAULT 0.000,
    sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(6, 3) NOT NULL DEFAULT 0.000,
    igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(15, 2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('NEFT_RTGS', 'CHEQUE', 'IMPS', 'CASH', 'UPI', 'OTHER')),
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('INVOICE', 'PARTY', 'PRODUCT', 'COMPANY', 'PAYMENT')),
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(32) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'CANCEL', 'RECORD_PAYMENT')),
    performed_by VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
