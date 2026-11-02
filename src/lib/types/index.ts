export type Role = 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  gstin: string;
  pan: string;
  state: string;
  stateCode: string;
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  bankIfsc: string;
  invoicePrefix: string; // e.g. "OJ"
  defaultTerms: string; // e.g. "30 DAYS"
  declarationText: string;
  signatureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  billingAddress: string;
  shippingAddress: string;
  pan: string;
  gstin: string;
  state: string;
  stateCode: string;
  country: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type UnitType = 'Cts' | 'Grams' | 'Pcs' | 'Kg';

export interface Product {
  id: string;
  description: string;
  hsnCode: string;
  defaultUnit: UnitType;
  defaultRate: number;
  defaultGstRate: number; // e.g. 0.25 for rough diamonds, 1.5 for cut & polished, 3.0 for gold
  category: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  invoiceId?: string;
  productId?: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: UnitType;
  rate: number;
  grossAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  lineTotal: number;
  sortOrder: number;
}

export interface PartySnapshot {
  name: string;
  address: string;
  pan: string;
  gstin: string;
  state: string;
  stateCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface CompanySnapshot {
  name: string;
  address: string;
  gstin: string;
  pan: string;
  state: string;
  stateCode: string;
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  bankIfsc: string;
  logoUrl?: string;
  signatureUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "OJ/26-1101"
  invoiceDate: string; // ISO date string or YYYY-MM-DD
  dueDate: string;
  paymentTerms: string;
  reverseCharge: boolean;
  transportMode: string;
  vehicleNumber?: string;
  dateOfSupply: string;
  placeOfSupply: string;
  supplyState: string;
  supplyStateCode: string;

  // Snapshots
  companySnapshot: CompanySnapshot;
  billToSnapshot: PartySnapshot;
  shipToSnapshot: PartySnapshot;

  // Financials calculated using Decimal.js
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountType: DiscountType;
  invoiceDiscountValue: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  grandTotal: number;
  totalInWords: string;

  // Payment Tracking
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  status: InvoiceStatus;

  declarationText: string;
  notes?: string;

  items: InvoiceItem[];
  payments?: Payment[];

  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSequence {
  id: string;
  prefix: string;
  year: number; // 26
  month: number; // 11
  currentSequence: number; // 1, 2, ...
  updatedAt: string;
}

export type PaymentMethod = 'NEFT_RTGS' | 'CHEQUE' | 'IMPS' | 'CASH' | 'UPI' | 'OTHER';

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedBy?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'INVOICE' | 'PARTY' | 'PRODUCT' | 'COMPANY' | 'PAYMENT' | 'EXPENSE';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'RECORD_PAYMENT' | 'DELETE';
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface Expense {
  id: string;
  paidBy: string; // e.g. "Hardik", "Meet"
  category: string; // e.g. "Etsy account", "Office rent", "Packaging", "Tools"
  description: string; // e.g. "Etsy listing and account fees"
  amount: number; // e.g. 4500
  expenseDate: string; // "YYYY-MM-DD"
  paymentMethod: string; // "UPI", "Bank Transfer", "Cash", "Credit Card"
  referenceNumber?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndianState {
  code: string;
  name: string;
}
