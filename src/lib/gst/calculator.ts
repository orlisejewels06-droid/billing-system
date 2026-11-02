import Decimal from 'decimal.js';
import { DiscountType, InvoiceItem } from '../types';
import { amountToIndianWords } from './numberToWords';

// Configure Decimal precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface ItemCalculationInput {
  description: string;
  hsnCode: string;
  quantity: number | string;
  unit?: string;
  rate: number | string;
  discountType?: DiscountType;
  discountValue?: number | string;
  gstRate: number | string; // Total GST % e.g. 0.25 for rough diamonds, 1.5 for polished, 3.0 for gold
  customCgstRate?: number | string;
  customSgstRate?: number | string;
  customIgstRate?: number | string;
  isIntraState: boolean;
}

export interface CalculatedItem extends InvoiceItem {
  roundOff?: number;
}

export function calculateItemRow(input: ItemCalculationInput, sortOrder: number = 0): CalculatedItem {
  const qty = new Decimal(input.quantity || 0);
  const rate = new Decimal(input.rate || 0);
  const grossAmount = qty.times(rate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const discountVal = new Decimal(input.discountValue || 0);
  const discountType: DiscountType = input.discountType || 'PERCENTAGE';
  let discountAmount = new Decimal(0);

  if (discountType === 'PERCENTAGE' && discountVal.greaterThan(0)) {
    discountAmount = grossAmount.times(discountVal).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  } else if (discountType === 'FIXED' && discountVal.greaterThan(0)) {
    discountAmount = Decimal.min(grossAmount, discountVal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  const taxableAmount = grossAmount.minus(discountAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  let cgstRate = new Decimal(0);
  let sgstRate = new Decimal(0);
  let igstRate = new Decimal(0);

  let cgstAmount = new Decimal(0);
  let sgstAmount = new Decimal(0);
  let igstAmount = new Decimal(0);

  if (input.isIntraState) {
    if (input.customCgstRate !== undefined || input.customSgstRate !== undefined) {
      cgstRate = new Decimal(input.customCgstRate !== undefined ? input.customCgstRate : 0);
      sgstRate = new Decimal(input.customSgstRate !== undefined ? input.customSgstRate : (input.customCgstRate || 0));
    } else {
      const totalGst = new Decimal(input.gstRate || 0);
      cgstRate = totalGst.dividedBy(2);
      sgstRate = totalGst.dividedBy(2);
    }
    cgstAmount = taxableAmount.times(cgstRate).dividedBy(100).round();
    sgstAmount = taxableAmount.times(sgstRate).dividedBy(100).round();
  } else {
    if (input.customIgstRate !== undefined) {
      igstRate = new Decimal(input.customIgstRate);
    } else {
      igstRate = new Decimal(input.gstRate || 0);
    }
    igstAmount = taxableAmount.times(igstRate).dividedBy(100).round();
  }

  const lineTotal = taxableAmount.plus(cgstAmount).plus(sgstAmount).plus(igstAmount).round();

  return {
    id: '',
    description: input.description || '',
    hsnCode: input.hsnCode || '',
    quantity: qty.toNumber(),
    unit: (input.unit as any) || 'Cts',
    rate: rate.toNumber(),
    grossAmount: grossAmount.toNumber(),
    discountType,
    discountValue: discountVal.toNumber(),
    discountAmount: discountAmount.toNumber(),
    taxableAmount: taxableAmount.toNumber(),
    cgstRate: cgstRate.toNumber(),
    cgstAmount: cgstAmount.toNumber(),
    sgstRate: sgstRate.toNumber(),
    sgstAmount: sgstAmount.toNumber(),
    igstRate: igstRate.toNumber(),
    igstAmount: igstAmount.toNumber(),
    lineTotal: lineTotal.toNumber(),
    sortOrder,
  };
}

export interface InvoiceCalculationInput {
  items: InvoiceItem[];
  companyStateCode: string;
  supplyStateCode: string;
  invoiceDiscountType?: DiscountType;
  invoiceDiscountValue?: number | string;
  applyRoundOff?: boolean;
}

export interface InvoiceTotals {
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  grandTotal: number;
  totalInWords: string;
}

export function calculateInvoiceTotals(input: InvoiceCalculationInput): InvoiceTotals {
  let subtotal = new Decimal(0);
  let itemDiscountTotal = new Decimal(0);
  let taxableAmount = new Decimal(0);
  let cgstAmount = new Decimal(0);
  let sgstAmount = new Decimal(0);
  let igstAmount = new Decimal(0);

  for (const item of input.items) {
    subtotal = subtotal.plus(item.grossAmount || 0);
    itemDiscountTotal = itemDiscountTotal.plus(item.discountAmount || 0);
    taxableAmount = taxableAmount.plus(item.taxableAmount || 0);
    cgstAmount = cgstAmount.plus(item.cgstAmount || 0);
    sgstAmount = sgstAmount.plus(item.sgstAmount || 0);
    igstAmount = igstAmount.plus(item.igstAmount || 0);
  }

  // Invoice-level discount
  const discountVal = new Decimal(input.invoiceDiscountValue || 0);
  let invoiceDiscountAmount = new Decimal(0);
  if (input.invoiceDiscountType === 'PERCENTAGE' && discountVal.greaterThan(0)) {
    invoiceDiscountAmount = taxableAmount.times(discountVal).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    taxableAmount = taxableAmount.minus(invoiceDiscountAmount);
  } else if (input.invoiceDiscountType === 'FIXED' && discountVal.greaterThan(0)) {
    invoiceDiscountAmount = Decimal.min(taxableAmount, discountVal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    taxableAmount = taxableAmount.minus(invoiceDiscountAmount);
  }

  const totalTaxAmount = cgstAmount.plus(sgstAmount).plus(igstAmount);
  const rawGrandTotal = taxableAmount.plus(totalTaxAmount);

  let grandTotal = rawGrandTotal;
  let roundOff = new Decimal(0);

  if (input.applyRoundOff !== false) {
    grandTotal = rawGrandTotal.round();
    roundOff = grandTotal.minus(rawGrandTotal);
  }

  return {
    subtotal: subtotal.toNumber(),
    itemDiscountTotal: itemDiscountTotal.toNumber(),
    invoiceDiscountAmount: invoiceDiscountAmount.toNumber(),
    taxableAmount: taxableAmount.toNumber(),
    cgstAmount: cgstAmount.toNumber(),
    sgstAmount: sgstAmount.toNumber(),
    igstAmount: igstAmount.toNumber(),
    totalTaxAmount: totalTaxAmount.toNumber(),
    roundOff: roundOff.toNumber(),
    grandTotal: grandTotal.toNumber(),
    totalInWords: amountToIndianWords(grandTotal.toNumber()),
  };
}
