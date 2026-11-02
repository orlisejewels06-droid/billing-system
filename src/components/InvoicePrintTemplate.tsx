'use client';

import React from 'react';
import { Invoice } from '@/lib/types';

interface InvoicePrintTemplateProps {
  invoice: Invoice;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({ invoice }) => {
  const company = invoice.companySnapshot;
  const billTo = invoice.billToSnapshot;
  const shipTo = invoice.shipToSnapshot || billTo;

  // Format date helper: DD/MM/YYYY
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      if (year && month && day) return `${day}/${month}/${year}`;
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  // Format currency helper
  const fmt = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0';
    return Math.round(val).toLocaleString('en-IN');
  };

  const fmtQty = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0';
    return Number(val).toFixed(2);
  };

  // Determine dominant tax rate for summary display
  const cgstItem = invoice.items.find((it) => it.cgstRate > 0) || invoice.items[0];
  const sgstItem = invoice.items.find((it) => it.sgstRate > 0) || invoice.items[0];
  const igstItem = invoice.items.find((it) => it.igstRate > 0) || invoice.items[0];
  const cgstRateDisplay = cgstItem ? cgstItem.cgstRate : 0;
  const sgstRateDisplay = sgstItem ? sgstItem.sgstRate : 0;
  const igstRateDisplay = igstItem ? igstItem.igstRate : 0;

  return (
    <div className="invoice-a4-sheet bg-white text-black p-4 mx-auto font-sans leading-tight text-[11px] border border-gray-400 shadow-md print:border-none print:shadow-none print:p-0 max-w-[210mm] min-h-[297mm]">
      {/* 1. Header: Company Name & Address */}
      <div className="text-center pb-2 border-b border-black">
        <h1 className="text-3xl font-extrabold tracking-wide uppercase font-serif py-1 text-black">
          {company.name || 'RADHA DIAMOND'}
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-tight text-neutral-800 max-w-xl mx-auto">
          {company.address}
        </p>
      </div>

      {/* 2. GSTIN and PAN Bar */}
      <div className="flex justify-between items-center px-2 py-1 border-b border-black font-bold text-[11px]">
        <div>
          <span>GSTIN: </span>
          <span className="font-extrabold tracking-wider">{company.gstin}</span>
        </div>
        <div>
          <span>PAN No: </span>
          <span className="font-extrabold tracking-wider">{company.pan}</span>
        </div>
      </div>

      {/* 3. Tax Invoice Title */}
      <div className="border-b border-black text-center py-1 bg-neutral-100">
        <h2 className="text-lg font-black uppercase tracking-wider text-black">Tax Invoice</h2>
      </div>

      {/* 4. Invoice & Transport Details Table */}
      <table className="invoice-border-table text-[11px]">
        <tbody>
          <tr>
            <td className="w-[15%] font-bold px-1.5 py-0.5">Invoice No:</td>
            <td className="w-[35%] font-bold px-1.5 py-0.5">{invoice.invoiceNumber}</td>
            <td className="w-[20%] font-bold px-1.5 py-0.5">Transport Mode:</td>
            <td className="w-[30%] px-1.5 py-0.5 uppercase">{invoice.transportMode || 'HAND TO HAND'}</td>
          </tr>
          <tr>
            <td className="font-bold px-1.5 py-0.5">Invoice date:</td>
            <td className="px-1.5 py-0.5">{formatDate(invoice.invoiceDate)}</td>
            <td className="font-bold px-1.5 py-0.5">Terms:</td>
            <td className="px-1.5 py-0.5 uppercase">{invoice.paymentTerms}</td>
          </tr>
          <tr>
            <td className="font-bold px-1.5 py-0.5">Reverse Charge:</td>
            <td className="px-1.5 py-0.5">{invoice.reverseCharge ? 'Y' : 'N'}</td>
            <td className="font-bold px-1.5 py-0.5">Due Date:</td>
            <td className="px-1.5 py-0.5">{formatDate(invoice.dueDate)}</td>
          </tr>
          <tr>
            <td className="font-bold px-1.5 py-0.5">State:</td>
            <td className="px-1.5 py-0.5">
              <span className="uppercase">{company.state}</span>
              <span className="ml-4 font-bold">Code:</span> {company.stateCode}
            </td>
            <td className="font-bold px-1.5 py-0.5">Place of Supply:</td>
            <td className="px-1.5 py-0.5 uppercase font-medium">
              {invoice.placeOfSupply}
              {invoice.supplyStateCode && ` (${invoice.supplyStateCode})`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Bill To and Ship To Section (Soft Light-Blue Headers) */}
      <table className="invoice-border-table text-[11px]">
        <thead>
          <tr className="bg-[#cce5ff] text-black">
            <th className="w-1/2 text-center py-1 font-bold border-r border-black">Bill to Party</th>
            <th className="w-1/2 text-center py-1 font-bold">Ship to Party</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {/* Bill To Column */}
            <td className="p-1.5 align-top border-r border-black">
              <div className="space-y-0.5">
                <div>
                  <span className="font-bold">Name: </span>
                  <span className="font-extrabold uppercase">{billTo.name}</span>
                </div>
                <div className="text-[10px]">
                  <span className="font-bold">Address: </span>
                  <span>{billTo.address}</span>
                </div>
                <div>
                  <span className="font-bold">PAN: </span>
                  <span className="font-semibold">{billTo.pan}</span>
                </div>
                <div>
                  <span className="font-bold">GSTIN: </span>
                  <span className="font-semibold">{billTo.gstin}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold">State: </span>
                    <span className="uppercase">{billTo.state}</span>
                  </div>
                  <div>
                    <span className="font-bold">Code: </span>
                    <span>{billTo.stateCode}</span>
                  </div>
                </div>
              </div>
            </td>

            {/* Ship To Column */}
            <td className="p-1.5 align-top">
              <div className="space-y-0.5">
                <div>
                  <span className="font-bold">Name: </span>
                  <span className="font-extrabold uppercase">{shipTo.name}</span>
                </div>
                <div className="text-[10px]">
                  <span className="font-bold">Address: </span>
                  <span>{shipTo.address}</span>
                </div>
                <div>
                  <span className="font-bold">PAN: </span>
                  <span className="font-semibold">{shipTo.pan}</span>
                </div>
                <div>
                  <span className="font-bold">GSTIN: </span>
                  <span className="font-semibold">{shipTo.gstin}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold">State: </span>
                    <span className="uppercase">{shipTo.state}</span>
                  </div>
                  <div>
                    <span className="font-bold">Code: </span>
                    <span>{shipTo.stateCode}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 6. Itemized Table with Light-Blue Headers */}
      <table className="invoice-border-table text-[10px] text-center">
        <thead>
          <tr className="bg-[#cce5ff] text-black">
            <th rowSpan={2} className="w-[4%] py-1">S. No.</th>
            <th rowSpan={2} className="w-[24%] py-1 text-left px-1">Product Description</th>
            <th rowSpan={2} className="w-[9%] py-1">HSN code</th>
            <th rowSpan={2} className="w-[8%] py-1">Qty (Cts)</th>
            <th rowSpan={2} className="w-[7%] py-1">Rate</th>
            <th rowSpan={2} className="w-[9%] py-1">Amount</th>
            <th rowSpan={2} className="w-[5%] py-1">Round Off</th>
            <th rowSpan={2} className="w-[9%] py-1">Taxable Value</th>
            <th colSpan={2} className="w-[9%] py-0.5 border-b border-black">CGST</th>
            <th colSpan={2} className="w-[9%] py-0.5 border-b border-black">SGST</th>
            <th colSpan={2} className="w-[9%] py-0.5 border-b border-black">IGST</th>
            <th rowSpan={2} className="w-[9%] py-1 font-bold">Total</th>
          </tr>
          <tr className="bg-[#cce5ff] text-black text-[9px]">
            <th className="py-0.5">Rate (%)</th>
            <th className="py-0.5">Amount</th>
            <th className="py-0.5">Rate (%)</th>
            <th className="py-0.5">Amount</th>
            <th className="py-0.5">Rate (%)</th>
            <th className="py-0.5">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id || index} className="align-middle">
              <td className="py-1">{index + 1}</td>
              <td className="text-left px-1 font-bold uppercase">{item.description}</td>
              <td>{item.hsnCode}</td>
              <td className="font-medium">{fmtQty(item.quantity)}</td>
              <td>{fmt(item.rate)}</td>
              <td>{fmt(item.grossAmount)}</td>
              <td>0</td>
              <td className="font-semibold">{fmt(item.taxableAmount)}</td>
              <td>{item.cgstRate ? item.cgstRate.toFixed(3) : '0.00'}</td>
              <td>{fmt(item.cgstAmount)}</td>
              <td>{item.sgstRate ? item.sgstRate.toFixed(3) : '0.00'}</td>
              <td>{fmt(item.sgstAmount)}</td>
              <td>{item.igstRate ? item.igstRate.toFixed(3) : '0.00'}</td>
              <td>{fmt(item.igstAmount)}</td>
              <td className="font-bold">{fmt(item.lineTotal)}</td>
            </tr>
          ))}

          {/* Padding rows if items are few, ensuring consistent sheet height */}
          {invoice.items.length < 3 &&
            Array.from({ length: 3 - invoice.items.length }).map((_, i) => (
              <tr key={`pad-${i}`} className="h-6">
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}

          {/* Total Row */}
          <tr className="font-extrabold text-[11px] bg-neutral-50">
            <td colSpan={3} className="text-center py-1 text-base tracking-wide uppercase">
              Total
            </td>
            <td>
              {fmtQty(invoice.items.reduce((acc, it) => acc + (it.quantity || 0), 0))}
            </td>
            <td></td>
            <td>{fmt(invoice.subtotal)}</td>
            <td>{invoice.roundOff ? invoice.roundOff.toFixed(2) : '0'}</td>
            <td>{fmt(invoice.taxableAmount)}</td>
            <td></td>
            <td>{fmt(invoice.cgstAmount)}</td>
            <td></td>
            <td>{fmt(invoice.sgstAmount)}</td>
            <td></td>
            <td>{fmt(invoice.igstAmount)}</td>
            <td className="text-black">{fmt(invoice.grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* 7. Total Invoice Amount in Words */}
      <table className="invoice-border-table text-[10px]">
        <tbody>
          <tr>
            <td className="w-[20%] font-bold px-1.5 py-1">Total Invoice amount in words:</td>
            <td className="w-[80%] font-extrabold uppercase px-1.5 py-1 tracking-wide">
              {invoice.totalInWords}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 8. Bank Details & GST Tax Summary */}
      <table className="invoice-border-table text-[10px]">
        <tbody>
          <tr>
            {/* Bank Coordinates */}
            <td className="w-1/2 align-top p-1.5 space-y-1">
              <div className="grid grid-cols-[90px_1fr] py-0.5">
                <span className="font-bold">Bank Name :</span>
                <span className="font-extrabold uppercase">{company.bankName}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] py-0.5">
                <span className="font-bold">Bank Branch :</span>
                <span className="font-semibold uppercase">{company.bankBranch}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] py-0.5">
                <span className="font-bold">Bank A/C:</span>
                <span className="font-extrabold tracking-wider">{company.bankAccountNo}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] py-0.5">
                <span className="font-bold">Bank IFSC:</span>
                <span className="font-extrabold tracking-wider">{company.bankIfsc}</span>
              </div>
            </td>

            {/* Tax Computation Summary */}
            <td className="w-1/2 align-top p-0">
              <table className="w-full text-[10px]">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="px-2 py-0.5 font-bold">Total Amount before Tax</td>
                    <td className="px-2 py-0.5 text-right font-bold">{fmt(invoice.taxableAmount)}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="px-2 py-0.5">
                      Add: CGST @ {cgstRateDisplay ? cgstRateDisplay.toFixed(3) : '0.000'}%
                    </td>
                    <td className="px-2 py-0.5 text-right">{fmt(invoice.cgstAmount)}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="px-2 py-0.5">
                      Add: SGST @ {sgstRateDisplay ? sgstRateDisplay.toFixed(3) : '0.000'}%
                    </td>
                    <td className="px-2 py-0.5 text-right">{fmt(invoice.sgstAmount)}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="px-2 py-0.5">
                      Add: IGST @ {igstRateDisplay ? igstRateDisplay.toFixed(3) : '0.000'}%
                    </td>
                    <td className="px-2 py-0.5 text-right">{fmt(invoice.igstAmount)}</td>
                  </tr>
                  <tr className="border-b border-black font-bold">
                    <td className="px-2 py-0.5">Total Tax Amount</td>
                    <td className="px-2 py-0.5 text-right">{fmt(invoice.totalTaxAmount)}</td>
                  </tr>
                  <tr className="font-black text-[11px] bg-neutral-50">
                    <td className="px-2 py-1">Total Amount after Tax:</td>
                    <td className="px-2 py-1 text-right">{fmt(invoice.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td className="bg-neutral-50 font-bold px-2 py-0.5">GST on Reverse Charge</td>
            <td className="text-right font-bold px-2 py-0.5">{invoice.reverseCharge ? fmt(invoice.totalTaxAmount) : '0'}</td>
          </tr>
        </tbody>
      </table>

      {/* 9. Statutory Declaration & Signature Box */}
      <table className="invoice-border-table text-[9px] leading-tight">
        <tbody>
          <tr>
            {/* Declaration Text */}
            <td className="w-1/2 p-2 align-top">
              <div className="font-bold uppercase text-[9.5px] pb-1">DECLARATION:</div>
              <div className="whitespace-pre-line text-neutral-800 text-[8.5px] leading-relaxed">
                {invoice.declarationText}
              </div>
            </td>

            {/* Authorised Signatory Box */}
            <td className="w-1/2 p-2.5 align-top text-center" style={{ height: '100%' }}>
              <div className="flex flex-col justify-between h-full min-h-[140px] text-center">
                <div>
                  <p className="text-[9.5px] text-neutral-800 leading-normal">
                    Certified that the particulars given above are true and correct
                  </p>
                  <p className="font-extrabold uppercase mt-1.5 text-black text-[11px] tracking-wide">
                    For {company.name || 'RADHA DIAMOND'}
                  </p>
                </div>

                <div className="mt-auto pt-10 pb-1">
                  {company.signatureUrl && (
                    <img
                      src={company.signatureUrl}
                      alt="Authorized Signature"
                      className="max-h-12 mx-auto mb-1"
                    />
                  )}
                  <p className="font-bold text-[10px] tracking-wider uppercase text-black">
                    Authorised signatory
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
