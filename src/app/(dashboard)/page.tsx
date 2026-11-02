'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Eye,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.metrics);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading analytics & billing metrics...
      </div>
    );
  }

  const fmt = (val: number | undefined) => {
    if (!val) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // Find max sales for relative bar chart heights
  const maxSales = data?.monthlyRevenue
    ? Math.max(...data.monthlyRevenue.map((m: any) => m.sales), 100000)
    : 100000;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Jewellery Billing Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time sales tracking, GST reporting, and invoice management for Indian Diamond & Gems trade.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/invoices/new"
            className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Tax Invoice
          </Link>
          <Link
            href="/invoices"
            className="inline-flex items-center px-4 py-2 bg-slate-700/80 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            View All Invoices
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{fmt(data?.totalSales)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across {data?.totalInvoices || 0} issued invoices</p>
          </div>
        </div>

        {/* GST Collected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total GST Collected</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{fmt(data?.totalGstCollected)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">CGST, SGST & IGST breakdown</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Receivables</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 tracking-tight">{fmt(data?.pendingPayments)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data?.unpaidInvoices || 0} unpaid · {data?.partiallyPaidInvoices || 0} partial
            </p>
          </div>
        </div>

        {/* Current Month Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Current Month Sales</span>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 tracking-tight">{fmt(data?.currentMonthSales)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">FY Total: {fmt(data?.currentFinancialYearSales)}</p>
          </div>
        </div>
      </div>

      {/* Invoice Status Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/70 p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500 text-white rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Fully Paid Invoices</p>
            <p className="text-xl font-bold text-emerald-950 mt-0.5">{data?.paidInvoices || 0}</p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/70 p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Partially Paid Invoices</p>
            <p className="text-xl font-bold text-amber-950 mt-0.5">{data?.partiallyPaidInvoices || 0}</p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/70 p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500 text-white rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Unpaid Invoices</p>
            <p className="text-xl font-bold text-rose-950 mt-0.5">{data?.unpaidInvoices || 0}</p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Monthly Revenue & Tax Trends</h2>
            <p className="text-xs text-slate-500">Gross billing performance month-by-month</p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-brand-500 inline-block"></span>
              <span className="text-slate-600 font-medium">Sales</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-400 inline-block"></span>
              <span className="text-slate-600 font-medium">GST</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 items-end h-48 pt-6 border-b border-slate-200 pb-2">
          {data?.monthlyRevenue?.map((m: any, index: number) => {
            const heightPercent = maxSales > 0 ? Math.min(100, Math.round((m.sales / maxSales) * 100)) : 0;
            return (
              <div key={index} className="flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg z-10 whitespace-nowrap">
                  <span>{m.month}: {fmt(m.sales)}</span>
                  <span className="text-purple-300">GST: {fmt(m.gst)}</span>
                </div>

                <div className="w-full max-w-[28px] flex flex-col justify-end items-center gap-0.5">
                  <div
                    className="w-full bg-brand-500 rounded-t-md transition-all group-hover:bg-brand-600"
                    style={{ height: `${Math.max(4, heightPercent)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 mt-2">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Recent Diamond Tax Invoices</h2>
            <p className="text-xs text-slate-500">Latest generated invoices with status</p>
          </div>
          <Link
            href="/invoices"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
          >
            View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Invoice No</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Party Name</th>
                <th className="px-5 py-3 text-right">Taxable Amount</th>
                <th className="px-5 py-3 text-right">GST Amount</th>
                <th className="px-5 py-3 text-right">Grand Total</th>
                <th className="px-5 py-3 text-center">Created By</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentInvoices?.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-brand-700 font-mono">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {inv.invoiceDate}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    {inv.billToSnapshot?.name}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-600">
                    {fmt(inv.taxableAmount)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-600">
                    {fmt(inv.totalTaxAmount)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    {fmt(inv.grandTotal)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      👤 {inv.createdBy || 'Sujeet'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/invoices/${inv.id}/preview`}
                      className="inline-flex items-center px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(!data?.recentInvoices || data.recentInvoices.length === 0) && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Operations & Live Activity Log */}
      {data?.recentAuditLogs && data.recentAuditLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Recent Admin Operations & Audit Trail
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                Live Activity
              </span>
            </div>
            <span className="text-xs text-slate-400">Tracked by user login</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentAuditLogs.map((log: any) => {
              const actionColor =
                log.action === 'CREATE'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : log.action === 'UPDATE'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : log.action === 'DELETE'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-purple-100 text-purple-800 border-purple-200';

              return (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-brand-50 text-brand-800 border border-brand-200 flex items-center">
                      👤 {log.performedBy || 'Sujeet'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionColor}`}>
                      {log.action}
                    </span>
                    <span className="font-medium text-slate-800">{log.details}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
