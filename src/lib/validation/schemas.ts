import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  logoUrl: z.string().optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid 15-character GSTIN format').or(z.string().min(15)),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid 10-character PAN format').or(z.string().min(10)),
  state: z.string().min(2, 'State is required'),
  stateCode: z.string().min(2, '2-digit state code is required').max(2),
  bankName: z.string().min(2, 'Bank name is required'),
  bankBranch: z.string().min(2, 'Bank branch is required'),
  bankAccountNo: z.string().min(6, 'Bank account number is required'),
  bankIfsc: z.string().min(4, 'IFSC code is required'),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required').max(10),
  defaultTerms: z.string().min(1, 'Payment terms is required'),
  declarationText: z.string().min(10, 'Declaration text is required'),
  signatureUrl: z.string().optional().or(z.literal('')),
});

export const partySchema = z.object({
  name: z.string().min(2, 'Party name is required'),
  contactPerson: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  billingAddress: z.string().min(5, 'Billing address is required'),
  shippingAddress: z.string().min(5, 'Shipping address is required'),
  pan: z.string().min(10, 'PAN must be 10 characters'),
  gstin: z.string().min(15, 'GSTIN must be 15 characters'),
  state: z.string().min(2, 'State is required'),
  stateCode: z.string().min(2, 'State code is required').max(2),
  country: z.string().default('INDIA'),
  isActive: z.boolean().default(true),
  createdBy: z.string().optional(),
});

export const productSchema = z.object({
  description: z.string().min(2, 'Product description is required'),
  hsnCode: z.string().min(4, 'HSN code is required'),
  defaultUnit: z.enum(['Cts', 'Grams', 'Pcs', 'Kg']),
  defaultRate: z.number().min(0, 'Default rate must be non-negative'),
  defaultGstRate: z.number().min(0, 'GST rate must be non-negative'),
  category: z.string().min(2, 'Category is required'),
  isActive: z.boolean().default(true),
  createdBy: z.string().optional(),
});

export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  hsnCode: z.string().min(1, 'HSN code is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.enum(['Cts', 'Grams', 'Pcs', 'Kg']),
  rate: z.number().min(0, 'Rate must be positive'),
  grossAmount: z.number(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  discountValue: z.number().default(0),
  discountAmount: z.number().default(0),
  taxableAmount: z.number(),
  cgstRate: z.number().default(0),
  cgstAmount: z.number().default(0),
  sgstRate: z.number().default(0),
  sgstAmount: z.number().default(0),
  igstRate: z.number().default(0),
  igstAmount: z.number().default(0),
  lineTotal: z.number(),
  sortOrder: z.number().default(0),
});

export const invoiceCreateSchema = z.object({
  invoiceDate: z.string(),
  dueDate: z.string(),
  paymentTerms: z.string(),
  reverseCharge: z.boolean().default(false),
  transportMode: z.string().default('HAND TO HAND'),
  vehicleNumber: z.string().optional(),
  dateOfSupply: z.string(),
  placeOfSupply: z.string(),
  supplyState: z.string(),
  supplyStateCode: z.string(),
  billToSnapshot: z.object({
    name: z.string(),
    address: z.string(),
    pan: z.string(),
    gstin: z.string(),
    state: z.string(),
    stateCode: z.string(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }),
  shipToSnapshot: z.object({
    name: z.string(),
    address: z.string(),
    pan: z.string(),
    gstin: z.string(),
    state: z.string(),
    stateCode: z.string(),
  }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  invoiceDiscountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  invoiceDiscountValue: z.number().default(0),
  declarationText: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

export const paymentRecordSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentDate: z.string(),
  paymentMethod: z.enum(['NEFT_RTGS', 'CHEQUE', 'IMPS', 'CASH', 'UPI', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

export const expenseSchema = z.object({
  paidBy: z.string().min(1, 'Name of person who paid is required'),
  category: z.string().min(1, 'Category or purpose is required'),
  description: z.string().optional().default(''),
  amount: z.number().positive('Expense amount must be greater than 0'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  paymentMethod: z.string().default('UPI'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});
