'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  FileText,
  Plus,
  Download,
  Search,
  Eye,
  CreditCard,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
} from 'lucide-react';
import { Invoice } from '@/lib/types';

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('2026');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [creatorFilter, setCreatorFilter] = useState<string>('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchInvoices = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (yearFilter !== 'ALL') params.set('year', yearFilter);
    if (monthFilter !== 'ALL') params.set('month', monthFilter);
    if (statusFilter !== 'ALL') params.set('paymentStatus', statusFilter);
    if (search.trim()) params.set('q', search.trim());

    fetch(`/api/invoices?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvoices(data.invoices);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, [yearFilter, monthFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete invoice ${invoiceNumber}?\nThis action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting invoice');
    }
  };

  const fmt = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // Compute aggregate totals for filtered list
  const totals = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => {
        acc.taxable += inv.taxableAmount || 0;
        acc.gst += inv.totalTaxAmount || 0;
        acc.grandTotal += inv.grandTotal || 0;
        acc.balanceDue += inv.balanceDue || 0;
        return acc;
      },
      { taxable: 0, gst: 0, grandTotal: 0, balanceDue: 0 }
    );
  }, [invoices]);

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice No',
        cell: (info) => (
          <Link
            href={`/invoices/${info.row.original.id}/preview`}
            className="font-bold text-brand-600 hover:text-brand-800 font-mono"
          >
            {info.getValue() as string}
          </Link>
        ),
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Date',
        cell: (info) => <span className="text-slate-600">{info.getValue() as string}</span>,
      },
      {
        id: 'partyName',
        header: 'Party Name',
        accessorFn: (row) => row.billToSnapshot?.name,
        cell: (info) => (
          <div>
            <span className="font-semibold text-slate-800 uppercase block">{info.getValue() as string}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              GST: {info.row.original.billToSnapshot?.gstin}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'taxableAmount',
        header: 'Taxable Amt',
        cell: (info) => <span className="font-medium text-slate-700">{fmt(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'totalTaxAmount',
        header: 'GST Amt',
        cell: (info) => <span className="font-medium text-slate-700">{fmt(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'grandTotal',
        header: 'Grand Total',
        cell: (info) => <span className="font-black text-slate-900">{fmt(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment Status',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : status === 'PARTIALLY_PAID'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: 'createdBy',
        header: 'Created By',
        cell: (info) => {
          const inv = info.row.original;
          const creator = inv.createdBy || 'Sujeet';
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 w-fit">
                👤 {creator}
              </span>
              {inv.updatedBy && inv.updatedBy !== creator && (
                <span className="text-[9px] text-slate-400 mt-0.5">
                  Upd: {inv.updatedBy}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const inv = info.row.original;
          return (
            <div className="flex items-center space-x-2">
              <Link
                href={`/invoices/${inv.id}/preview`}
                title="Preview Invoice"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <Link
                href={`/invoices/${inv.id}/preview?print=true`}
                title={`Download PDF / Print (${inv.invoiceNumber})`}
                className="p-1.5 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-600 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                title="Delete Invoice"
                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const displayedInvoices = useMemo(() => {
    if (creatorFilter === 'ALL') return invoices;
    return invoices.filter((inv) => (inv.createdBy || '').toLowerCase() === creatorFilter.toLowerCase());
  }, [invoices, creatorFilter]);

  const table = useReactTable({
    data: displayedInvoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, filter, export and manage all diamond & jewellery tax invoices
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href={`/api/invoices/export?format=xlsx${yearFilter !== 'ALL' ? `&year=${yearFilter}` : ''}${monthFilter !== 'ALL' ? `&month=${monthFilter}` : ''}`}
            download
            className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Excel
          </a>
          <a
            href={`/api/invoices/export?format=csv${yearFilter !== 'ALL' ? `&year=${yearFilter}` : ''}${monthFilter !== 'ALL' ? `&month=${monthFilter}` : ''}`}
            download
            className="inline-flex items-center px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </a>
          <Link
            href="/invoices/new"
            className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Aggregate Financial Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="border-r border-slate-100 pr-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Records</span>
          <span className="text-xl font-black text-slate-800">{invoices.length} Invoices</span>
        </div>
        <div className="border-r border-slate-100 pr-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Filtered Taxable</span>
          <span className="text-xl font-black text-slate-800">{fmt(totals.taxable)}</span>
        </div>
        <div className="border-r border-slate-100 pr-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total GST</span>
          <span className="text-xl font-black text-blue-700">{fmt(totals.gst)}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Grand Total</span>
          <span className="text-xl font-black text-emerald-700">{fmt(totals.grandTotal)}</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice no, party, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Year Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Years</option>
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Month:</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Months</option>
              <option value="1">January (01)</option>
              <option value="2">February (02)</option>
              <option value="3">March (03)</option>
              <option value="4">April (04)</option>
              <option value="5">May (05)</option>
              <option value="6">June (06)</option>
              <option value="7">July (07)</option>
              <option value="8">August (08)</option>
              <option value="9">September (09)</option>
              <option value="10">October (10)</option>
              <option value="11">November (11)</option>
              <option value="12">December (12)</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          {/* Created By Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Created By:</span>
            <select
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Users</option>
              <option value="Sujeet">Sujeet</option>
              <option value="Hardik">Hardik</option>
              <option value="Meet">Meet</option>
            </select>
          </div>
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-5 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-slate-500">
                    No invoices match the selected criteria.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() || 1}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
