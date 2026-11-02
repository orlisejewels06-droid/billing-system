'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  FileText,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Invoice, Payment } from '@/lib/types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('NEFT_RTGS');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/payments').then((r) => r.json()),
      fetch('/api/invoices').then((r) => r.json()),
    ])
      .then(([payRes, invRes]) => {
        if (payRes.success) setPayments(payRes.payments);
        if (invRes.success) setInvoices(invRes.invoices);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(inv.balanceDue);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || amount <= 0) {
      alert('Please select an invoice and enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount,
          paymentDate,
          paymentMethod,
          referenceNumber,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setSelectedInvoiceId('');
        setAmount(0);
        setReferenceNumber('');
        setNotes('');
        fetchData();
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number | undefined) => {
    if (!n) return '₹0';
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.paymentStatus !== 'PAID');
  const totalPending = pendingInvoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track bank transfers, RTGS/NEFT receipts, cheques, and outstanding balances
          </p>
        </div>
        <button
          onClick={() => {
            if (pendingInvoices.length > 0) {
              handleInvoiceChange(pendingInvoices[0].id);
            }
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Record New Receipt
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Payments Received</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{fmt(totalCollected)}</span>
            <span className="text-[11px] text-slate-500">{payments.length} transactions recorded</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Outstanding Balance</span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">{fmt(totalPending)}</span>
            <span className="text-[11px] text-slate-500">{pendingInvoices.length} pending invoices</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Collection Efficiency</span>
            <span className="text-2xl font-black text-brand-700 mt-1 block">
              {totalCollected + totalPending > 0
                ? `${Math.round((totalCollected / (totalCollected + totalPending)) * 100)}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-slate-500">Collected vs Total Billing</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Payment Audit Trail & Receipts</h2>
          <span className="text-xs font-semibold text-slate-500">{payments.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Receipt Date</th>
                <th className="px-5 py-3">Invoice No</th>
                <th className="px-5 py-3">Party Name</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Reference / UTR</th>
                <th className="px-5 py-3 text-right">Amount Received</th>
                <th className="px-5 py-3">Recorded By</th>
                <th className="px-5 py-3 text-right">View Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No payment receipts recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const inv = invoices.find((i) => i.id === p.invoiceId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {p.paymentDate}
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-brand-700">
                        {p.invoiceNumber || inv?.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 uppercase">
                        {inv?.billToSnapshot?.name || 'Party'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                        {p.referenceNumber || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-emerald-700">
                        {fmt(p.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          👤 {p.recordedBy || p.createdBy || 'Sujeet'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/invoices/${p.invoiceId}/preview`}
                          className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-800"
                        >
                          Invoice <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Receipt */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Payment Receipt</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Invoice</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">-- Choose Invoice to Apply Payment --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} · {inv.billToSnapshot?.name} · Due: {fmt(inv.balanceDue)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Party Name:</span>
                    <span className="font-bold uppercase text-slate-900">{selectedInvoice.billToSnapshot?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Invoice Total:</span>
                    <span className="font-semibold text-slate-900">{fmt(selectedInvoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Already Paid:</span>
                    <span className="font-semibold text-emerald-700">{fmt(selectedInvoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1 font-bold">
                    <span>Current Outstanding:</span>
                    <span className="text-rose-700">{fmt(selectedInvoice.balanceDue)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Method</label>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9821447"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || amount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
