import { Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import {
  User,
  Company,
  Party,
  Product,
  Invoice,
  Payment,
  Expense,
  InvoiceItem,
  InvoiceSequence,
  AuditLog,
} from '../types';
import { calculateInvoiceTotals } from '../gst/calculator';
import { parseDateForSequence, formatInvoiceNumber } from '../sequence/generator';

let indexesInitialized = false;
let migrationChecked = false;

async function checkAndMigrateUsersAndCompany(db: Db): Promise<void> {
  if (migrationChecked) return;
  migrationChecked = true;

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const dbFile = path.join(dataDir, 'db.json');
    if (!fs.existsSync(dbFile)) return;

    const fileContent = fs.readFileSync(dbFile, 'utf-8');
    const seedData = JSON.parse(fileContent);

    // 1. Check if we already have users in DB - if already have users then don't run it
    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0 && Array.isArray(seedData.users) && seedData.users.length > 0) {
      console.log(`[MongoDB Migration] Seeding ${seedData.users.length} initial users from db.json into DB...`);
      await db.collection('users').insertMany(seedData.users);
    } else {
      console.log(`[MongoDB] Users already exist in DB (${userCount} found). Skipping users migration from db.json.`);
    }

    // 2. Check if we already have company in DB - if already have company then don't run it
    const companyCount = await db.collection('companies').countDocuments();
    if (companyCount === 0 && seedData.company) {
      console.log(`[MongoDB Migration] Seeding company (${seedData.company.name}) from db.json into DB...`);
      await db.collection('companies').insertOne(seedData.company);
    } else {
      console.log(`[MongoDB] Company already exists in DB (${companyCount} found). Skipping company migration from db.json.`);
    }
  } catch (err) {
    console.error('[MongoDB Migration] Error during users/company migration check:', err);
  }
}

export async function initMongoIndexes(db: Db): Promise<void> {
  if (indexesInitialized) return;
  try {
    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('parties').createIndex({ name: 1 }),
      db.collection('parties').createIndex({ gstin: 1 }),
      db.collection('parties').createIndex({ pan: 1 }),
      db.collection('products').createIndex({ hsnCode: 1 }),
      db.collection('products').createIndex({ description: 1 }),
      db.collection('invoices').createIndex({ invoiceNumber: 1 }, { unique: true }),
      db.collection('invoices').createIndex({ invoiceDate: -1 }),
      db.collection('invoices').createIndex({ 'billToSnapshot.name': 1 }),
      db.collection('invoice_sequences').createIndex(
        { prefix: 1, year: 1, month: 1 },
        { unique: true }
      ),
      db.collection('payments').createIndex({ invoiceId: 1 }),
      db.collection('expenses').createIndex({ expenseDate: -1 }),
      db.collection('expenses').createIndex({ paidBy: 1 }),
      db.collection('expenses').createIndex({ category: 1 }),
      db.collection('audit_logs').createIndex({ timestamp: -1 }),
    ]);
    indexesInitialized = true;
  } catch (err) {
    console.error('Error initializing MongoDB indexes:', err);
  }
}

export class MongoDatabaseRepo {
  constructor(private db: Db) {
    initMongoIndexes(db).catch(console.error);
    checkAndMigrateUsersAndCompany(db).catch(console.error);
  }

  // Company Profile
  async getCompany(): Promise<Company> {
    const comp = await this.db.collection('companies').findOne<Company>({});
    if (comp) return comp;

    const fallback: Company = {
      id: 'comp_01',
      name: 'RADHA DIAMOND',
      address:
        'SY NO.19/1-A, PLOT-69,OFFICE-201, 2ND FLOOR, PANCH RATNA DIAMOND CENTER, MOHAN NAGAR, MINI HIRA BAZAR, VARACHHA, Surat',
      gstin: '24ABEFR1272Q1ZU',
      pan: 'ABEFR1272Q',
      state: 'GUJARAT',
      stateCode: '24',
      bankName: 'INDUSIND BANK',
      bankBranch: 'VARACHHA BRANCH',
      bankAccountNo: '25 98241 81814',
      bankIfsc: 'INDB0001731',
      invoicePrefix: 'OJ',
      defaultTerms: '30 DAYS',
      declarationText: `* We declare that this Invoice Shows the actual price of the goods described and that all particulars are true and correct.
* The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict, in compliance with United Nations Resolutions and corresponding nation laws. The seller hereby guarantees that these diamonds are conflict free and confirms.
* By receipt of the above goods, then buyer/consignee acknowledges that the above goods purchased or received will be fully represented and disclosed as laboratory grown polished diamonds.
* Any claim or dispute arising from change in quality or shortage in quantity or any cause what-so-ever will not be entertained once the goods are delivered.
* Late payment charges at 24% p.a, will be charged on amount of the bill after due date.
* We are not responsible for any loss or damage during transit.
* Payment to be made by Payees A/c Cheque, Draft or NEFT/RTGS/IMPS only.
* No E-Way bill is required to be generated as the Goods covered under this invoice are exempted as per serial No.4/5 to the Annexure to Rule 138(14) of the CGST Rules2017.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.collection('companies').insertOne(fallback as any);
    return fallback;
  }

  async updateCompany(updates: Partial<Company>, performedBy: string = 'Admin'): Promise<Company> {
    const now = new Date().toISOString();
    await this.db.collection('companies').updateOne(
      {},
      { $set: { ...updates, updatedAt: now } },
      { upsert: true }
    );

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'COMPANY',
      entityId: 'comp_01',
      action: 'UPDATE',
      performedBy,
      details: 'Updated company settings and bank details in MongoDB',
      timestamp: now,
    });

    return this.getCompany();
  }

  // Parties CRUD
  async getParties(query?: string, activeOnly: boolean = false): Promise<Party[]> {
    const filter: any = {};
    if (activeOnly) filter.isActive = true;
    if (query && query.trim()) {
      const q = query.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { gstin: { $regex: q, $options: 'i' } },
        { pan: { $regex: q, $options: 'i' } },
      ];
    }
    return (await this.db.collection('parties').find<Party>(filter).sort({ createdAt: -1 }).toArray()) as Party[];
  }

  async getPartyById(id: string): Promise<Party | null> {
    return (await this.db.collection('parties').findOne<Party>({ id })) as Party | null;
  }

  async createParty(partyData: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>, performedBy: string = 'Admin'): Promise<Party> {
    const now = new Date().toISOString();
    const newParty: Party = {
      ...partyData,
      id: `party_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdBy: partyData.createdBy || performedBy,
      updatedBy: performedBy,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.collection('parties').insertOne(newParty as any);

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'PARTY',
      entityId: newParty.id,
      action: 'CREATE',
      performedBy,
      details: `Party created in MongoDB: ${newParty.name} (${newParty.gstin})`,
      timestamp: now,
    });

    return newParty;
  }

  async updateParty(id: string, updates: Partial<Party>, performedBy: string = 'Admin'): Promise<Party> {
    const now = new Date().toISOString();
    await this.db.collection('parties').updateOne(
      { id },
      { $set: { ...updates, updatedBy: performedBy, updatedAt: now } }
    );
    const updated = await this.getPartyById(id);
    if (!updated) throw new Error(`Party not found: ${id}`);
    return updated;
  }

  async togglePartyStatus(id: string, performedBy: string = 'Admin'): Promise<Party> {
    const current = await this.getPartyById(id);
    if (!current) throw new Error(`Party not found: ${id}`);
    return this.updateParty(id, { isActive: !current.isActive }, performedBy);
  }

  async deleteParty(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const existing = await this.getPartyById(id);
    if (!existing) throw new Error(`Party not found: ${id}`);

    await this.db.collection('parties').deleteOne({ id });
    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'PARTY',
      entityId: id,
      action: 'DELETE',
      performedBy,
      details: `Party deleted from MongoDB: ${existing.name}`,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // Products CRUD
  async getProducts(query?: string, category?: string, activeOnly: boolean = false): Promise<Product[]> {
    const filter: any = {};
    if (activeOnly) filter.isActive = true;
    if (category && category !== 'ALL') filter.category = category;
    if (query && query.trim()) {
      const q = query.trim();
      filter.$or = [
        { description: { $regex: q, $options: 'i' } },
        { hsnCode: { $regex: q, $options: 'i' } },
      ];
    }
    return (await this.db.collection('products').find<Product>(filter).sort({ createdAt: -1 }).toArray()) as Product[];
  }

  async getProductById(id: string): Promise<Product | null> {
    return (await this.db.collection('products').findOne<Product>({ id })) as Product | null;
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, performedBy: string = 'Admin'): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdBy: productData.createdBy || performedBy,
      updatedBy: performedBy,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.collection('products').insertOne(newProduct as any);

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'PRODUCT',
      entityId: newProduct.id,
      action: 'CREATE',
      performedBy,
      details: `Product created in MongoDB: ${newProduct.description}`,
      timestamp: now,
    });

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>, performedBy: string = 'Admin'): Promise<Product> {
    const now = new Date().toISOString();
    await this.db.collection('products').updateOne(
      { id },
      { $set: { ...updates, updatedBy: performedBy, updatedAt: now } }
    );
    const updated = await this.getProductById(id);
    if (!updated) throw new Error(`Product not found: ${id}`);
    return updated;
  }

  async toggleProductStatus(id: string, performedBy: string = 'Admin'): Promise<Product> {
    const current = await this.getProductById(id);
    if (!current) throw new Error(`Product not found: ${id}`);
    return this.updateProduct(id, { isActive: !current.isActive }, performedBy);
  }

  async deleteProduct(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const existing = await this.getProductById(id);
    if (!existing) throw new Error(`Product not found: ${id}`);

    await this.db.collection('products').deleteOne({ id });
    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'PRODUCT',
      entityId: id,
      action: 'DELETE',
      performedBy,
      details: `Product deleted from MongoDB: ${existing.description}`,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // Atomic Sequence Numbering in MongoDB: OJ/YY-MMNN
  async peekNextInvoiceNumber(invoiceDate?: string): Promise<string> {
    const comp = await this.getCompany();
    const prefix = comp.invoicePrefix || 'OJ';
    const parsed = parseDateForSequence(prefix, invoiceDate);

    const seqDoc = await this.db.collection('invoice_sequences').findOne<InvoiceSequence>({
      prefix: parsed.prefix,
      year: parsed.year,
      month: parsed.month,
    });

    const nextSeq = (seqDoc ? seqDoc.currentSequence : 0) + 1;
    return formatInvoiceNumber(parsed.prefix, parsed.formattedMonth, parsed.formattedYear, nextSeq);
  }

  // Invoice Creation with MongoDB Atomic Sequence & Snapshots
  async createInvoice(invoiceInput: any, performedBy: string = 'Admin'): Promise<Invoice> {
    const comp = await this.getCompany();
    const prefix = comp.invoicePrefix || 'OJ';
    const parsed = parseDateForSequence(prefix, invoiceInput.invoiceDate);
    const now = new Date().toISOString();

    // Atomic increment sequence in MongoDB
    const seqResult = await this.db.collection('invoice_sequences').findOneAndUpdate(
      { prefix: parsed.prefix, year: parsed.year, month: parsed.month },
      {
        $inc: { currentSequence: 1 },
        $setOnInsert: { id: `seq_${Date.now()}`, createdAt: now },
        $set: { updatedAt: now },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const allocatedSeq = (seqResult as any)?.currentSequence || 1;
    const generatedInvoiceNumber = formatInvoiceNumber(
      parsed.prefix,
      parsed.formattedMonth,
      parsed.formattedYear,
      allocatedSeq
    );

    // Calculate totals using accurate Decimal.js
    const totals = calculateInvoiceTotals({
      items: invoiceInput.items || [],
      companyStateCode: comp.stateCode,
      supplyStateCode: invoiceInput.supplyStateCode || comp.stateCode,
      invoiceDiscountType: invoiceInput.invoiceDiscountType,
      invoiceDiscountValue: invoiceInput.invoiceDiscountValue,
      applyRoundOff: true,
    });

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceNumber: generatedInvoiceNumber,
      invoiceDate: invoiceInput.invoiceDate || now.split('T')[0],
      dueDate: invoiceInput.dueDate || now.split('T')[0],
      paymentTerms: invoiceInput.paymentTerms || comp.defaultTerms || '30 DAYS',
      reverseCharge: Boolean(invoiceInput.reverseCharge),
      transportMode: invoiceInput.transportMode || 'HAND TO HAND',
      vehicleNumber: invoiceInput.vehicleNumber || '',
      dateOfSupply: invoiceInput.dateOfSupply || invoiceInput.invoiceDate || now.split('T')[0],
      placeOfSupply: invoiceInput.placeOfSupply || comp.state,
      supplyState: invoiceInput.supplyState || comp.state,
      supplyStateCode: invoiceInput.supplyStateCode || comp.stateCode,

      // Immutable snapshots
      companySnapshot: {
        name: comp.name,
        address: comp.address,
        gstin: comp.gstin,
        pan: comp.pan,
        state: comp.state,
        stateCode: comp.stateCode,
        bankName: comp.bankName,
        bankBranch: comp.bankBranch,
        bankAccountNo: comp.bankAccountNo,
        bankIfsc: comp.bankIfsc,
        logoUrl: comp.logoUrl,
        signatureUrl: comp.signatureUrl,
      },
      billToSnapshot: invoiceInput.billToSnapshot,
      shipToSnapshot: invoiceInput.shipToSnapshot || invoiceInput.billToSnapshot,

      // Financials
      subtotal: totals.subtotal,
      itemDiscountTotal: totals.itemDiscountTotal,
      invoiceDiscountType: invoiceInput.invoiceDiscountType || 'PERCENTAGE',
      invoiceDiscountValue: Number(invoiceInput.invoiceDiscountValue || 0),
      invoiceDiscountAmount: totals.invoiceDiscountAmount,
      taxableAmount: totals.taxableAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      totalTaxAmount: totals.totalTaxAmount,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      totalInWords: totals.totalInWords,

      amountPaid: 0,
      balanceDue: totals.grandTotal,
      paymentStatus: 'UNPAID',
      status: 'ISSUED',
      declarationText: invoiceInput.declarationText || comp.declarationText,
      notes: invoiceInput.notes || '',

      items: (invoiceInput.items || []).map((it: any, idx: number) => ({
        ...it,
        id: `item_${Date.now()}_${idx}`,
      })),
      payments: [],
      createdBy: invoiceInput.createdBy || performedBy,
      updatedBy: performedBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.collection('invoices').insertOne(newInvoice as any);

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'INVOICE',
      entityId: newInvoice.id,
      action: 'CREATE',
      performedBy,
      details: `Invoice created in MongoDB: ${newInvoice.invoiceNumber} for ₹${newInvoice.grandTotal.toLocaleString('en-IN')}`,
      timestamp: now,
    });

    return newInvoice;
  }

  // Invoices Querying
  async getInvoices(filters?: {
    year?: number;
    month?: number;
    partyId?: string;
    paymentStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Invoice[]> {
    const filter: any = {};

    if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
      filter.paymentStatus = filters.paymentStatus;
    }
    if (filters?.startDate && filters?.endDate) {
      filter.invoiceDate = { $gte: filters.startDate, $lte: filters.endDate };
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      filter.$or = [
        { invoiceNumber: { $regex: q, $options: 'i' } },
        { 'billToSnapshot.name': { $regex: q, $options: 'i' } },
        { 'billToSnapshot.gstin': { $regex: q, $options: 'i' } },
      ];
    }

    const invoices = (await this.db.collection('invoices').find<Invoice>(filter).sort({ invoiceDate: -1, createdAt: -1 }).toArray()) as Invoice[];

    return invoices.filter((inv) => {
      const invDate = new Date(inv.invoiceDate);
      if (filters?.year && invDate.getFullYear() !== filters.year) return false;
      if (filters?.month && invDate.getMonth() + 1 !== filters.month) return false;
      return true;
    });
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return (await this.db.collection('invoices').findOne<Invoice>({
      $or: [{ id }, { invoiceNumber: id }],
    })) as Invoice | null;
  }

  async cancelInvoice(id: string, performedBy: string = 'Admin'): Promise<Invoice> {
    const now = new Date().toISOString();
    await this.db.collection('invoices').updateOne(
      { $or: [{ id }, { invoiceNumber: id }] },
      { $set: { status: 'CANCELLED', updatedAt: now } }
    );
    const updated = await this.getInvoiceById(id);
    if (!updated) throw new Error(`Invoice not found: ${id}`);
    return updated;
  }

  async deleteInvoice(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const inv = await this.getInvoiceById(id);
    if (!inv) throw new Error(`Invoice not found: ${id}`);

    await this.db.collection('invoices').deleteOne({ id: inv.id });
    await this.db.collection('payments').deleteMany({ invoiceId: inv.id });

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'INVOICE',
      entityId: inv.id,
      action: 'DELETE',
      performedBy,
      details: `Invoice deleted from MongoDB: ${inv.invoiceNumber}`,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // Payments & Receipts
  async recordPayment(
    paymentData: {
      invoiceId: string;
      paymentDate: string;
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;
    },
    performedBy: string = 'Admin'
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    const inv = await this.getInvoiceById(paymentData.invoiceId);
    if (!inv) throw new Error(`Invoice not found: ${paymentData.invoiceId}`);

    const now = new Date().toISOString();
    const newPayment: Payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      paymentDate: paymentData.paymentDate || now.split('T')[0],
      amount: Number(paymentData.amount),
      paymentMethod: paymentData.paymentMethod as any,
      referenceNumber: paymentData.referenceNumber || '',
      notes: paymentData.notes || '',
      recordedBy: performedBy,
      createdAt: now,
    };

    const currentPaid = Number((Number(inv.amountPaid || 0) + Number(paymentData.amount)).toFixed(2));
    const balance = Number(Math.max(0, Number(inv.grandTotal || 0) - currentPaid).toFixed(2));
    const status = balance <= 0 ? 'PAID' : currentPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

    await this.db.collection('payments').insertOne(newPayment as any);
    await this.db.collection('invoices').updateOne(
      { id: inv.id },
      {
        $push: { payments: newPayment as any },
        $set: {
          amountPaid: currentPaid,
          balanceDue: balance,
          paymentStatus: status,
          updatedAt: now,
        },
      }
    );

    const updatedInvoice = (await this.getInvoiceById(inv.id)) || inv;

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'PAYMENT',
      entityId: newPayment.id,
      action: 'RECORD_PAYMENT',
      performedBy,
      details: `Payment of ₹${paymentData.amount.toLocaleString('en-IN')} recorded in MongoDB for invoice ${inv.invoiceNumber}`,
      timestamp: now,
    });

    return { payment: newPayment, invoice: updatedInvoice };
  }

  async getPayments(invoiceId?: string): Promise<Payment[]> {
    const filter = invoiceId ? { invoiceId } : {};
    return (await this.db.collection('payments').find<Payment>(filter).sort({ paymentDate: -1, createdAt: -1 }).toArray()) as Payment[];
  }

  // Dashboard Aggregates & KPIs
  async getDashboardMetrics() {
    const invoices = (await this.db.collection('invoices').find<Invoice>({}).toArray()) as Invoice[];
    const validInvoices = invoices.filter((inv) => inv.status !== 'CANCELLED');

    const totalInvoices = validInvoices.length;
    let totalSales = 0;
    let totalGstCollected = 0;
    let pendingPayments = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Indian Financial Year: April 1 to March 31
    const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const fyStartDate = `${fyStartYear}-04-01`;
    const fyEndDate = `${fyStartYear + 1}-03-31`;

    let currentMonthSales = 0;
    let currentFYSales = 0;

    // Monthly breakdown for charts
    const monthlyMap = new Map<string, { month: string; sales: number; gst: number; count: number }>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const mName = monthNames[i];
      monthlyMap.set(mName, { month: mName, sales: 0, gst: 0, count: 0 });
    }

    for (const inv of validInvoices) {
      totalSales += inv.grandTotal || 0;
      totalGstCollected += inv.totalTaxAmount || 0;
      pendingPayments += inv.balanceDue || 0;

      if (inv.paymentStatus === 'PAID') paidCount++;
      else if (inv.paymentStatus === 'PARTIALLY_PAID') partialCount++;
      else unpaidCount++;

      const invDate = new Date(inv.invoiceDate);
      if (invDate.getFullYear() === currentYear && invDate.getMonth() + 1 === currentMonth) {
        currentMonthSales += inv.grandTotal || 0;
      }

      if (inv.invoiceDate >= fyStartDate && inv.invoiceDate <= fyEndDate) {
        currentFYSales += inv.grandTotal || 0;
      }

      if (invDate.getFullYear() === currentYear) {
        const mKey = monthNames[invDate.getMonth()];
        const entry = monthlyMap.get(mKey);
        if (entry) {
          entry.sales += inv.grandTotal || 0;
          entry.gst += inv.totalTaxAmount || 0;
          entry.count += 1;
        }
      }
    }

    const recentAuditLogs = await this.db
      .collection('audit_logs')
      .find()
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return {
      totalInvoices,
      totalSales: Math.round(totalSales),
      totalGstCollected: Math.round(totalGstCollected),
      pendingPayments: Math.round(pendingPayments),
      paidInvoices: paidCount,
      unpaidInvoices: unpaidCount,
      partiallyPaidInvoices: partialCount,
      currentMonthSales: Math.round(currentMonthSales),
      currentFinancialYearSales: Math.round(currentFYSales),
      recentInvoices: validInvoices.slice(0, 8),
      recentAuditLogs,
      monthlyRevenue: Array.from(monthlyMap.values()),
    };
  }

  // Users Auth
  async getUserByEmail(email: string): Promise<User | null> {
    const q = email.trim();
    return (await this.db.collection('users').findOne<User>({
      $or: [
        { email: { $regex: `^${q}$`, $options: 'i' } },
        { name: { $regex: `^${q}$`, $options: 'i' } },
        { email: { $regex: `^${q}@`, $options: 'i' } },
      ],
    })) as User | null;
  }

  async getUserById(id: string): Promise<User | null> {
    return (await this.db.collection('users').findOne<User>({ id })) as User | null;
  }

  // Expenses Tracking CRUD
  async getExpenses(filters?: {
    paidBy?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    search?: string;
  }): Promise<Expense[]> {
    const filter: any = {};
    if (filters?.paidBy && filters.paidBy !== 'ALL') {
      filter.paidBy = { $regex: `^${filters.paidBy}$`, $options: 'i' };
    }
    if (filters?.category && filters.category !== 'ALL') {
      filter.category = filters.category;
    }
    if (filters?.startDate && filters?.endDate) {
      filter.expenseDate = { $gte: filters.startDate, $lte: filters.endDate };
    } else if (filters?.startDate) {
      filter.expenseDate = { $gte: filters.startDate };
    } else if (filters?.endDate) {
      filter.expenseDate = { $lte: filters.endDate };
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      filter.$or = [
        { paidBy: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    const expenses = (await this.db
      .collection('expenses')
      .find<Expense>(filter)
      .sort({ expenseDate: -1, createdAt: -1 })
      .toArray()) as Expense[];

    return expenses.filter((e) => {
      const d = new Date(e.expenseDate);
      if (filters?.year && d.getFullYear() !== Number(filters.year)) return false;
      if (filters?.month && d.getMonth() + 1 !== Number(filters.month)) return false;
      return true;
    });
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    return (await this.db.collection('expenses').findOne<Expense>({ id })) as Expense | null;
  }

  async createExpense(
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
    performedBy: string = 'Admin'
  ): Promise<Expense> {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...data,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdBy: data.createdBy || performedBy,
      updatedBy: performedBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.collection('expenses').insertOne(newExpense as any);
    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'EXPENSE',
      entityId: newExpense.id,
      action: 'CREATE',
      performedBy,
      details: `Expense recorded: ₹${newExpense.amount} paid by ${newExpense.paidBy} for ${newExpense.category} (by ${performedBy})`,
      timestamp: now,
    });

    return newExpense;
  }

  async updateExpense(
    id: string,
    updates: Partial<Expense>,
    performedBy: string = 'Admin'
  ): Promise<Expense> {
    const now = new Date().toISOString();
    await this.db.collection('expenses').updateOne({ id }, { $set: { ...updates, updatedBy: performedBy, updatedAt: now } });
    const updated = await this.getExpenseById(id);
    if (!updated) throw new Error(`Expense not found: ${id}`);

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'EXPENSE',
      entityId: id,
      action: 'UPDATE',
      performedBy,
      details: `Expense updated: ${updated.paidBy} - ${updated.category} (₹${updated.amount})`,
      timestamp: now,
    });

    return updated;
  }

  async deleteExpense(id: string, performedBy: string = 'Admin'): Promise<boolean> {
    const existing = await this.getExpenseById(id);
    if (!existing) throw new Error(`Expense not found: ${id}`);

    await this.db.collection('expenses').deleteOne({ id });
    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'EXPENSE',
      entityId: id,
      action: 'DELETE',
      performedBy,
      details: `Expense deleted: ₹${existing.amount} by ${existing.paidBy}`,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  async getExpenseSummary(): Promise<{
    totalAmount: number;
    thisMonthAmount: number;
    thisWeekAmount: number;
    todayAmount: number;
    payerBreakdown: { paidBy: string; amount: number; count: number }[];
    categoryBreakdown: { category: string; amount: number; count: number }[];
    uniquePayers: string[];
  }> {
    const expenses = (await this.db.collection('expenses').find<Expense>({}).toArray()) as Expense[];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    // Start of current week (Monday)
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    let totalAmount = 0;
    let thisMonthAmount = 0;
    let thisWeekAmount = 0;
    let todayAmount = 0;

    const payerMap = new Map<string, { paidBy: string; amount: number; count: number }>();
    const catMap = new Map<string, { category: string; amount: number; count: number }>();

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalAmount += amt;

      const d = new Date(exp.expenseDate);
      if (exp.expenseDate === todayStr) todayAmount += amt;
      if (exp.expenseDate >= mondayStr && exp.expenseDate <= todayStr) thisWeekAmount += amt;
      if (d.getFullYear() === curYear && d.getMonth() + 1 === curMonth) thisMonthAmount += amt;

      const pKey = (exp.paidBy || 'Unknown').trim();
      const pEntry = payerMap.get(pKey) || { paidBy: pKey, amount: 0, count: 0 };
      pEntry.amount += amt;
      pEntry.count += 1;
      payerMap.set(pKey, pEntry);

      const cKey = (exp.category || 'General').trim();
      const cEntry = catMap.get(cKey) || { category: cKey, amount: 0, count: 0 };
      cEntry.amount += amt;
      cEntry.count += 1;
      catMap.set(cKey, cEntry);
    }

    return {
      totalAmount: Math.round(totalAmount),
      thisMonthAmount: Math.round(thisMonthAmount),
      thisWeekAmount: Math.round(thisWeekAmount),
      todayAmount: Math.round(todayAmount),
      payerBreakdown: Array.from(payerMap.values()).sort((a, b) => b.amount - a.amount),
      categoryBreakdown: Array.from(catMap.values()).sort((a, b) => b.amount - a.amount),
      uniquePayers: Array.from(payerMap.keys()),
    };
  }

  async exportBackup(): Promise<{
    users: User[];
    company: Company;
    parties: Party[];
    products: Product[];
    invoices: Invoice[];
    invoiceSequences: InvoiceSequence[];
    payments: Payment[];
    expenses: Expense[];
    auditLogs: AuditLog[];
  }> {
    const [users, company, parties, products, invoices, invoiceSequences, payments, expenses, auditLogs] =
      await Promise.all([
        this.db.collection('users').find<User>({}, { projection: { _id: 0 } }).toArray(),
        this.db.collection('companies').findOne<Company>({}, { projection: { _id: 0 } }),
        this.db.collection('parties').find<Party>({}, { projection: { _id: 0 } }).toArray(),
        this.db.collection('products').find<Product>({}, { projection: { _id: 0 } }).toArray(),
        this.db.collection('invoices').find<Invoice>({}, { projection: { _id: 0 } }).toArray(),
        this.db.collection('invoice_sequences').find<InvoiceSequence>({}, { projection: { _id: 0 } }).toArray(),
        this.db.collection('payments').find<Payment>({}, { projection: { _id: 0 } }).toArray(),
        this.db.collection('expenses').find<Expense>({}, { projection: { _id: 0 } }).toArray(),
        this.db.collection('audit_logs').find<AuditLog>({}, { projection: { _id: 0 } }).toArray(),
      ]);

    return {
      users,
      company: company || ({} as Company),
      parties,
      products,
      invoices,
      invoiceSequences,
      payments,
      expenses,
      auditLogs,
    };
  }

  async restoreBackup(backup: any, performedBy: string = 'Admin'): Promise<boolean> {
    if (!backup.company || !Array.isArray(backup.invoices)) {
      throw new Error('Invalid backup schema');
    }
    if (backup.company) {
      await this.db.collection('companies').deleteMany({});
      await this.db.collection('companies').insertOne(backup.company);
    }
    if (Array.isArray(backup.parties) && backup.parties.length > 0) {
      await this.db.collection('parties').deleteMany({});
      await this.db.collection('parties').insertMany(backup.parties);
    }
    if (Array.isArray(backup.products) && backup.products.length > 0) {
      await this.db.collection('products').deleteMany({});
      await this.db.collection('products').insertMany(backup.products);
    }
    if (Array.isArray(backup.invoices) && backup.invoices.length > 0) {
      await this.db.collection('invoices').deleteMany({});
      await this.db.collection('invoices').insertMany(backup.invoices);
    }
    if (Array.isArray(backup.invoiceSequences) && backup.invoiceSequences.length > 0) {
      await this.db.collection('invoice_sequences').deleteMany({});
      await this.db.collection('invoice_sequences').insertMany(backup.invoiceSequences);
    }
    if (Array.isArray(backup.payments) && backup.payments.length > 0) {
      await this.db.collection('payments').deleteMany({});
      await this.db.collection('payments').insertMany(backup.payments);
    }
    if (Array.isArray(backup.expenses) && backup.expenses.length > 0) {
      await this.db.collection('expenses').deleteMany({});
      await this.db.collection('expenses').insertMany(backup.expenses);
    }
    if (Array.isArray(backup.auditLogs) && backup.auditLogs.length > 0) {
      await this.db.collection('audit_logs').deleteMany({});
      await this.db.collection('audit_logs').insertMany(backup.auditLogs);
    }

    await this.db.collection('audit_logs').insertOne({
      id: `audit_${Date.now()}`,
      entityType: 'COMPANY',
      entityId: 'system',
      action: 'UPDATE',
      performedBy,
      details: 'System restored from backup snapshot',
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}
