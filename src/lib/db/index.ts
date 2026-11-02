import { getMongoDb } from './mongodb';
import { MongoDatabaseRepo } from './mongoRepo';
import {
  AuditLog,
  Company,
  Invoice,
  Party,
  Payment,
  Product,
  User,
  Expense,
} from '../types';

let mongoRepoInstance: MongoDatabaseRepo | null = null;

export async function getActiveMongoRepo(): Promise<MongoDatabaseRepo> {
  if (mongoRepoInstance) return mongoRepoInstance;
  const mongoDb = await getMongoDb();
  mongoRepoInstance = new MongoDatabaseRepo(mongoDb);
  return mongoRepoInstance;
}

/**
 * Universal Database Access Layer
 * All operations execute directly against MongoDB.
 * data/db.json is used exclusively for one-time seed migration of users and company if DB is completely empty.
 */
export const db = {
  // Company Settings
  async getCompany(): Promise<Company> {
    const repo = await getActiveMongoRepo();
    return repo.getCompany();
  },

  async updateCompany(updates: Partial<Company>, performedBy: string = 'Admin'): Promise<Company> {
    const repo = await getActiveMongoRepo();
    return repo.updateCompany(updates, performedBy);
  },

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const repo = await getActiveMongoRepo();
    return repo.getUserByEmail(email);
  },

  async getUserById(id: string): Promise<User | null> {
    const repo = await getActiveMongoRepo();
    return repo.getUserById(id);
  },

  // Parties
  async getParties(query?: string, activeOnly: boolean = false): Promise<Party[]> {
    const repo = await getActiveMongoRepo();
    return repo.getParties(query, activeOnly);
  },

  async getPartyById(id: string): Promise<Party | null> {
    const repo = await getActiveMongoRepo();
    return repo.getPartyById(id);
  },

  async createParty(
    data: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>,
    performedBy: string = 'Admin'
  ): Promise<Party> {
    const repo = await getActiveMongoRepo();
    return repo.createParty(data, performedBy);
  },

  async updateParty(
    id: string,
    updates: Partial<Party>,
    performedBy: string = 'Admin'
  ): Promise<Party | null> {
    const repo = await getActiveMongoRepo();
    return repo.updateParty(id, updates, performedBy);
  },

  async togglePartyStatus(id: string, performedBy: string = 'Admin'): Promise<Party> {
    const repo = await getActiveMongoRepo();
    return repo.togglePartyStatus(id, performedBy);
  },

  async deleteParty(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const repo = await getActiveMongoRepo();
    return repo.deleteParty(id, performedBy);
  },

  // Products
  async getProducts(
    query?: string,
    category?: string,
    activeOnly: boolean = false
  ): Promise<Product[]> {
    const repo = await getActiveMongoRepo();
    return repo.getProducts(query, category, activeOnly);
  },

  async getProductById(id: string): Promise<Product | null> {
    const repo = await getActiveMongoRepo();
    return repo.getProductById(id);
  },

  async createProduct(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    performedBy: string = 'Admin'
  ): Promise<Product> {
    const repo = await getActiveMongoRepo();
    return repo.createProduct(data, performedBy);
  },

  async updateProduct(
    id: string,
    updates: Partial<Product>,
    performedBy: string = 'Admin'
  ): Promise<Product | null> {
    const repo = await getActiveMongoRepo();
    return repo.updateProduct(id, updates, performedBy);
  },

  async toggleProductStatus(id: string, performedBy: string = 'Admin'): Promise<Product> {
    const repo = await getActiveMongoRepo();
    return repo.toggleProductStatus(id, performedBy);
  },

  async deleteProduct(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const repo = await getActiveMongoRepo();
    return repo.deleteProduct(id, performedBy);
  },

  // Invoices & Sequences
  async peekNextInvoiceNumber(invoiceDate?: string): Promise<string> {
    const repo = await getActiveMongoRepo();
    return repo.peekNextInvoiceNumber(invoiceDate);
  },

  async createInvoice(
    invoiceData: {
      invoiceDate: string;
      dueDate?: string;
      paymentTerms?: string;
      reverseCharge?: boolean;
      transportMode?: string;
      vehicleNumber?: string;
      dateOfSupply?: string;
      placeOfSupply?: string;
      supplyState?: string;
      supplyStateCode?: string;
      billToPartyId?: string;
      shipToPartyId?: string;
      partyName?: string;
      billingAddress?: string;
      partyGstin?: string;
      partyPan?: string;
      partyState?: string;
      partyStateCode?: string;
      invoiceDiscountType?: 'PERCENTAGE' | 'FIXED';
      invoiceDiscountValue?: number;
      notes?: string;
      items: Array<{
        productId?: string;
        description: string;
        hsnCode: string;
        quantity: number;
        unit: string;
        rate: number;
        discountType?: 'PERCENTAGE' | 'FIXED';
        discountValue?: number;
        gstRate?: number;
        cgstRate?: number;
        sgstRate?: number;
        igstRate?: number;
      }>;
    },
    performedBy: string = 'Admin'
  ): Promise<Invoice> {
    const repo = await getActiveMongoRepo();
    return repo.createInvoice(invoiceData, performedBy);
  },

  async getInvoices(filters?: {
    year?: number;
    month?: number;
    partyId?: string;
    partyName?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Invoice[]> {
    const repo = await getActiveMongoRepo();
    return repo.getInvoices(filters);
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const repo = await getActiveMongoRepo();
    return repo.getInvoiceById(id);
  },

  async cancelInvoice(id: string, performedBy: string = 'Admin'): Promise<Invoice> {
    const repo = await getActiveMongoRepo();
    return repo.cancelInvoice(id, performedBy);
  },

  async deleteInvoice(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const repo = await getActiveMongoRepo();
    return repo.deleteInvoice(id, performedBy);
  },

  // Payments
  async recordPayment(
    paymentData: {
      invoiceId: string;
      paymentDate: string;
      amount: number;
      paymentMethod: any;
      referenceNumber?: string;
      notes?: string;
      createdBy?: string;
    },
    performedBy: string = 'Admin'
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    const repo = await getActiveMongoRepo();
    return repo.recordPayment(paymentData, performedBy);
  },

  async getPayments(invoiceId?: string): Promise<Payment[]> {
    const repo = await getActiveMongoRepo();
    return repo.getPayments(invoiceId);
  },

  // Dashboard Metrics
  async getDashboardMetrics() {
    const repo = await getActiveMongoRepo();
    return repo.getDashboardMetrics();
  },

  // Backup & Restore
  async exportBackup() {
    const repo = await getActiveMongoRepo();
    return repo.exportBackup();
  },

  async restoreBackup(backup: any, performedBy: string = 'Admin'): Promise<boolean> {
    const repo = await getActiveMongoRepo();
    return repo.restoreBackup(backup, performedBy);
  },

  // Expenses
  async getExpenses(filters?: {
    paidBy?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    search?: string;
  }): Promise<Expense[]> {
    const repo = await getActiveMongoRepo();
    return repo.getExpenses(filters);
  },

  async getExpenseById(id: string): Promise<Expense | null> {
    const repo = await getActiveMongoRepo();
    return repo.getExpenseById(id);
  },

  async createExpense(
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
    performedBy: string = 'Admin'
  ): Promise<Expense> {
    const repo = await getActiveMongoRepo();
    return repo.createExpense(data, performedBy);
  },

  async updateExpense(
    id: string,
    updates: Partial<Expense>,
    performedBy: string = 'Admin'
  ): Promise<Expense | null> {
    const repo = await getActiveMongoRepo();
    return repo.updateExpense(id, updates, performedBy);
  },

  async deleteExpense(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const repo = await getActiveMongoRepo();
    return repo.deleteExpense(id, performedBy);
  },

  async getExpenseSummary(): Promise<{
    totalAmount: number;
    thisMonthAmount: number;
    thisWeekAmount: number;
    todayAmount: number;
    payerBreakdown: { paidBy: string; amount: number; count: number }[];
    categoryBreakdown: { category: string; amount: number; count: number }[];
    uniquePayers: string[];
  }> {
    const repo = await getActiveMongoRepo();
    return repo.getExpenseSummary();
  },
};
