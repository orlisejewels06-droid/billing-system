'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  Filter,
  Trash2,
  Edit2,
  Download,
  User,
  Tag,
  ArrowUpDown,
  RefreshCw,
  TrendingDown,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Expense } from '@/lib/types';

const COMMON_PAYERS = ['Sujeet', 'Hardik', 'Meet'];
const COMMON_CATEGORIES = [
  'Etsy Account',
  'Packaging & Box',
  'Courier & Shipping',
  'Office Rent',
  'Marketing & Ads',
  'Tools & Machinery',
  'Raw Materials',
  'Refreshments & Tea',
  'Electricity & Bills',
  'Misc Operational',
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [timeframePreset, setTimeframePreset] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [paidByFilter, setPaidByFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    paidBy: 'Hardik',
    category: 'Etsy Account',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    referenceNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch expenses with active filters
  const fetchExpenses = () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (paidByFilter !== 'ALL') params.set('paidBy', paidByFilter);
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (selectedYear !== 'ALL') params.set('year', selectedYear);
    if (selectedMonth !== 'ALL') params.set('month', selectedMonth);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());

    // Calculate dates based on timeframe preset
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (timeframePreset === 'TODAY') {
      params.set('startDate', todayStr);
      params.set('endDate', todayStr);
    } else if (timeframePreset === 'THIS_WEEK') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      params.set('startDate', monday.toISOString().split('T')[0]);
      params.set('endDate', todayStr);
    } else if (timeframePreset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      params.set('startDate', startOfMonth);
      params.set('endDate', todayStr);
    } else if (timeframePreset === 'THIS_YEAR') {
      const startOfYear = `${now.getFullYear()}-01-01`;
      params.set('startDate', startOfYear);
      params.set('endDate', todayStr);
    } else if (timeframePreset === 'CUSTOM') {
      if (customStartDate) params.set('startDate', customStartDate);
      if (customEndDate) params.set('endDate', customEndDate);
    }

    fetch(`/api/expenses?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setExpenses(data.expenses || []);
          if (data.summary) setSummary(data.summary);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, [
    timeframePreset,
    paidByFilter,
    categoryFilter,
    selectedYear,
    selectedMonth,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // Open modal for Create
  const handleOpenAddModal = (presetPayer?: string) => {
    setEditingExpenseId(null);
    setFormData({
      paidBy: presetPayer || 'Hardik',
      category: 'Etsy Account',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      referenceNumber: '',
      notes: '',
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setFormData({
      paidBy: exp.paidBy,
      category: exp.category,
      description: exp.description || '',
      amount: String(exp.amount),
      expenseDate: exp.expenseDate,
      paymentMethod: exp.paymentMethod || 'UPI',
      referenceNumber: exp.referenceNumber || '',
      notes: exp.notes || '',
    });
    setShowModal(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (!formData.paidBy.trim()) {
      alert('Please specify who paid for this expense');
      return;
    }
    if (!formData.category.trim()) {
      alert('Please specify which part / category this was spent on');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid expense amount greater than 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        paidBy: formData.paidBy.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        amount: numAmount,
        expenseDate: formData.expenseDate,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber.trim(),
        notes: formData.notes.trim(),
      };

      let res;
      if (editingExpenseId) {
        res = await fetch(`/api/expenses/${editingExpenseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchExpenses();
      } else {
        alert(`Failed to save expense: ${data.error || 'Validation error'}`);
      }
    } catch (err: any) {
      alert(`Error saving expense: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id: string, detail: string) => {
    if (!confirm(`Are you sure you want to delete this expense record?\n${detail}`)) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchExpenses();
      } else {
        alert(`Failed to delete expense: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting expense: ${err.message}`);
    }
  };

  // Format currency helper
  const fmt = (n: number | undefined) => {
    if (n === undefined || isNaN(n)) return '0';
    return Math.round(n).toLocaleString('en-IN');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('No expense records to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Paid By', 'Category', 'Description', 'Amount (INR)', 'Payment Method', 'Reference', 'Notes'];
    const rows = expenses.map((e) => [
      e.id,
      e.expenseDate,
      `"${e.paidBy.replace(/"/g, '""')}"`,
      `"${e.category.replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount,
      e.paymentMethod,
      `"${(e.referenceNumber || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orlise_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered total amount
  const filteredTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Unique payers for filter dropdown
  const allPayers = useMemo(() => {
    const set = new Set<string>(COMMON_PAYERS);
    if (summary?.uniquePayers) {
      summary.uniquePayers.forEach((p: string) => set.add(p));
    }
    expenses.forEach((e) => set.add(e.paidBy));
    return Array.from(set);
  }, [summary, expenses]);

  // Color generator for avatar badges
  const getPayerColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('hardik')) return 'bg-blue-600 text-white';
    if (lower.includes('meet')) return 'bg-purple-600 text-white';
    if (lower.includes('admin')) return 'bg-amber-600 text-white';
    return 'bg-emerald-600 text-white';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expense Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              Spends &amp; Reimbursements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track who paid, spend parts (Etsy, Packaging, Office), and filter by date, week, month, or person
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Expense
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Filtered / Overall */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Filtered Total Spent
            </span>
            <span className="text-2xl font-black text-rose-600 tracking-tight mt-0.5 block">
              ₹{fmt(filteredTotal)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {expenses.length} expense record{expenses.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              This Month Spend
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
              ₹{fmt(summary?.thisMonthAmount || 0)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Current Calendar Month</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              This Week Spend
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
              ₹{fmt(summary?.thisWeekAmount || 0)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Monday to Today</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Today&apos;s Spend
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
              ₹{fmt(summary?.todayAmount || 0)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Today&apos;s entries</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payer Breakdown Cards */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Spends by Person (Click to Filter)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Who paid for which parts
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {/* All Payers Pill */}
          <button
            type="button"
            onClick={() => setPaidByFilter('ALL')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              paidByFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
              All Members
            </span>
            <span className="text-sm font-black block mt-0.5">
              ₹{fmt(summary?.totalAmount || 0)}
            </span>
          </button>

          {/* Individual Payers */}
          {(summary?.payerBreakdown || []).map((pb: any) => {
            const isSelected = paidByFilter.toLowerCase() === pb.paidBy.toLowerCase();
            return (
              <button
                key={pb.paidBy}
                type="button"
                onClick={() => setPaidByFilter(isSelected ? 'ALL' : pb.paidBy)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-white/20 text-white' : getPayerColor(pb.paidBy)
                    }`}
                  >
                    {pb.paidBy}
                  </span>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {pb.count} txns
                  </span>
                </div>
                <span className={`text-sm font-black block ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  ₹{fmt(pb.amount)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* Quick Timeframe Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" /> Timeframe:
            </span>
            {(
              [
                ['ALL', 'All Time'],
                ['TODAY', 'Today'],
                ['THIS_WEEK', 'This Week'],
                ['THIS_MONTH', 'This Month'],
                ['THIS_YEAR', 'This Year'],
                ['CUSTOM', 'Custom Range'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTimeframePreset(val)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeframePreset === val
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {(timeframePreset !== 'ALL' || paidByFilter !== 'ALL' || categoryFilter !== 'ALL' || selectedYear !== 'ALL' || selectedMonth !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setTimeframePreset('ALL');
                setPaidByFilter('ALL');
                setCategoryFilter('ALL');
                setSelectedYear('ALL');
                setSelectedMonth('ALL');
                setCustomStartDate('');
                setCustomEndDate('');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Reset All Filters
            </button>
          )}
        </div>

        {/* Detailed Controls: Payer, Year, Month, Search, Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search purpose, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Paid By Filter */}
          <div>
            <select
              value={paidByFilter}
              onChange={(e) => setPaidByFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="ALL">All Payers (Who Paid)</option>
              {allPayers.map((p) => (
                <option key={p} value={p}>
                  Paid By: {p}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="ALL">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="ALL">All Years</option>
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="ALL">All Spend Categories</option>
              {COMMON_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Row (Shown when timeframe is CUSTOM) */}
        {timeframePreset === 'CUSTOM' && (
          <div className="flex items-center space-x-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-700">Custom Date Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Expense Records ({expenses.length})
            </h2>
            <span className="text-[11px] text-slate-500">
              Total ₹{fmt(filteredTotal)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span>Sorted by most recent date</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">Date</th>
                <th className="p-3 w-32">Who Paid</th>
                <th className="p-3 w-36">Spend Part (Category)</th>
                <th className="p-3 min-w-[180px]">Description / Purpose</th>
                <th className="p-3 w-28">Created By</th>
                <th className="p-3 w-28">Payment Mode</th>
                <th className="p-3 w-32 text-right">Amount (₹)</th>
                <th className="p-3 w-20 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading expense records...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No expense records found matching current filters.
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal()}
                        className="text-xs text-brand-600 font-bold hover:underline"
                      >
                        + Add first expense record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>

                    {/* Date */}
                    <td className="p-3 font-mono font-medium text-slate-700">
                      {exp.expenseDate}
                    </td>

                    {/* Paid By */}
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide ${getPayerColor(
                          exp.paidBy
                        )}`}
                      >
                        {exp.paidBy}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                        <Tag className="w-2.5 h-2.5 mr-1 text-slate-500" />
                        {exp.category}
                      </span>
                    </td>

                    {/* Description & Notes */}
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 block">
                        {exp.description || '—'}
                      </span>
                      {exp.notes && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {exp.notes}
                        </span>
                      )}
                    </td>

                    {/* Created By */}
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        👤 {exp.createdBy || exp.paidBy}
                      </span>
                      {exp.updatedBy && exp.updatedBy !== (exp.createdBy || exp.paidBy) && (
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          Upd: {exp.updatedBy}
                        </span>
                      )}
                    </td>

                    {/* Payment Mode & Ref */}
                    <td className="p-3">
                      <span className="font-medium text-slate-700 block">{exp.paymentMethod || 'UPI'}</span>
                      {exp.referenceNumber && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {exp.referenceNumber}
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-3 text-right">
                      <span className="font-black text-sm text-rose-600 block">
                        ₹{fmt(exp.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteExpense(exp.id, `${exp.paidBy} - ${exp.category} (₹${exp.amount})`)
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              {/* Who Paid (Payer) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Who Paid? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hardik, Meet"
                  value={formData.paidBy}
                  onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
                {/* Quick Payer Pills */}
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick Select:</span>
                  {COMMON_PAYERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, paidBy: p })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        formData.paidBy.toLowerCase() === p.toLowerCase()
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spend Part (Category) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  For Which Part Spend? (Category) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Etsy Account, Packaging, Shipping"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
                {/* Quick Category Pills */}
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  {COMMON_CATEGORIES.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: c })}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        formData.category.toLowerCase() === c.toLowerCase()
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount & Date in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Spent (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 4500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-rose-600 focus:ring-2 focus:ring-brand-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    When Spent? (Date) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Payment Method & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transaction / Reference ID
                  </label>
                  <input
                    type="text"
                    placeholder="Optional UPI / Ref no."
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* Description / Detail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purpose / Item Detail (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly seller fee, advertisement billing..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Any extra details, reimbursement status, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingExpenseId ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}