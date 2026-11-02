'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';
import { Invoice } from '@/lib/types';
import { InvoicePrintTemplate } from '@/components/InvoicePrintTemplate';

interface Params {
  params: { id: string };
}

export default function InvoicePreviewPage({ params }: Params) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('NEFT_RTGS');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const fetchInvoice = () => {
    fetch(`/api/invoices/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoice(data.invoice);
          setPaymentAmount(data.invoice.balanceDue);
          if (data.invoice?.invoiceNumber) {
            document.title = data.invoice.invoiceNumber;
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  // Set document.title to the exact invoice number (e.g. OJ/26-1102)
  // so browser "Save as PDF" / Print dialog defaults the downloaded filename to the invoice number
  useEffect(() => {
    if (!invoice?.invoiceNumber) return;

    document.title = invoice.invoiceNumber;

    const handleBeforePrint = () => {
      if (invoice?.invoiceNumber) {
        document.title = invoice.invoiceNumber;
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      document.title = 'Orlise Jewellery Billing & GST Invoice System';
    };
  }, [invoice?.invoiceNumber]);

  useEffect(() => {
    if (invoice && autoPrint) {
      if (invoice.invoiceNumber) {
        document.title = invoice.invoiceNumber;
      }
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [invoice, autoPrint]);

  const handlePrint = () => {
    if (invoice?.invoiceNumber) {
      document.title = invoice.invoiceNumber;
    }
    window.print();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || paymentAmount <= 0) return;

    setRecordingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: Number(paymentAmount),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod,
          referenceNumber,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(false);
        fetchInvoice();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    if (!confirm(`Are you sure you want to permanently delete invoice ${invoice.invoiceNumber}?\nThis action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/invoices');
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading Orlise Diamond tax invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 font-bold">Invoice not found.</p>
        <Link href="/invoices" className="text-brand-600 underline text-xs mt-2 inline-block">
          Return to Invoice Listing
        </Link>
      </div>
    );
  }

  const fmt = (val: number) => Math.round(val).toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/invoices"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 font-mono">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  invoice.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {invoice.paymentStatus}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                👤 Created by: {invoice.createdBy || 'Sujeet'}
              </span>
              {invoice.updatedBy && invoice.updatedBy !== invoice.createdBy && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Updated by: {invoice.updatedBy}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Grand Total: ₹{fmt(invoice.grandTotal)} · Balance Due: ₹{fmt(invoice.balanceDue)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {invoice.paymentStatus !== 'PAID' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Record Payment
            </button>
          )}

          <button
            onClick={handlePrint}
            title={`Download PDF or Print invoice ${invoice.invoiceNumber}`}
            className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download PDF / Print
          </button>

          <button
            onClick={handleDeleteInvoice}
            className="inline-flex items-center px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Rendered Pixel-Perfect A4 Sheet */}
      <div className="flex justify-center">
        <InvoicePrintTemplate invoice={invoice} />
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Number:</span>
                <span className="font-bold font-mono text-slate-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-semibold text-slate-900">₹{fmt(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Paid So Far:</span>
                <span className="font-semibold text-emerald-700">₹{fmt(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1 font-bold">
                <span>Outstanding Balance:</span>
                <span className="text-rose-700">₹{fmt(invoice.balanceDue)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  max={invoice.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="NEFT_RTGS">NEFT / RTGS</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="IMPS">IMPS</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Transaction / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-IND-994488"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment || paymentAmount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {recordingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
