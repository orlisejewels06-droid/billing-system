import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // 'csv' or 'xlsx'
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;

    const invoices = await db.getInvoices({ year, month });

    const rows = invoices.map((inv) => ({
      'Invoice No': inv.invoiceNumber,
      'Invoice Date': inv.invoiceDate,
      'Due Date': inv.dueDate,
      'Party Name': inv.billToSnapshot.name,
      'Party GSTIN': inv.billToSnapshot.gstin,
      'Party PAN': inv.billToSnapshot.pan,
      'Place of Supply': inv.placeOfSupply,
      'Supply State Code': inv.supplyStateCode,
      'Taxable Amount': inv.taxableAmount,
      'CGST Amount': inv.cgstAmount,
      'SGST Amount': inv.sgstAmount,
      'IGST Amount': inv.igstAmount,
      'Total GST': inv.totalTaxAmount,
      'Round Off': inv.roundOff,
      'Grand Total': inv.grandTotal,
      'Amount Paid': inv.amountPaid,
      'Balance Due': inv.balanceDue,
      'Payment Status': inv.paymentStatus,
      'Status': inv.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

    if (format === 'xlsx') {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="invoices_export_${Date.now()}.xlsx"`,
        },
      });
    } else {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="invoices_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
