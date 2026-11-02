'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Save,
  CreditCard,
  FileCheck,
  ShieldCheck,
  Info,
  Check,
} from 'lucide-react';
import { Company } from '@/lib/types';
import { INDIAN_STATES } from '@/lib/gst/constants';

export default function CompanySettingsPage() {
  const [formData, setFormData] = useState<Company>({
    id: '',
    name: 'RADHA DIAMOND',
    logoUrl: '',
    address: '',
    gstin: '',
    pan: '',
    state: 'GUJARAT',
    stateCode: '24',
    bankName: '',
    bankBranch: '',
    bankAccountNo: '',
    bankIfsc: '',
    invoicePrefix: 'OJ',
    defaultTerms: '30 DAYS',
    declarationText: '',
    signatureUrl: '',
    createdAt: '',
    updatedAt: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/company')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFormData(data.company);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setFormData(data.company);
        setSuccessMsg('Company settings and invoice profile saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to update company settings');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading company settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company & Billing Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure company legal entity, GSTIN, PAN, bank coordinates, and invoice prefix
          </p>
        </div>

        {successMsg && (
          <div className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
            <Check className="w-4 h-4 mr-1 text-emerald-600" />
            {successMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Legal Entity & Address */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-brand-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              1. Business Details & Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                placeholder="e.g. RADHA DIAMOND"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-extrabold uppercase outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Shop / Unit address, Market, City, Pincode"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 24ABEFR1272Q1ZU"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="e.g. ABEFR1272Q"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State & State Code</label>
              <select
                value={formData.stateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const st = INDIAN_STATES.find((s) => s.code === code);
                  setFormData({
                    ...formData,
                    stateCode: code,
                    state: st ? st.name : formData.state,
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Invoice Prefix
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="e.g. OJ or PD"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-black uppercase outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used in sequence: <strong>{formData.invoicePrefix}/MM-YYNN</strong> (e.g. {formData.invoicePrefix}/11-2601)
              </p>
            </div>
          </div>
        </div>

        {/* 2. Bank Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              2. Bank Account & Settlement Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value.toUpperCase() })}
                placeholder="e.g. INDUSIND BANK"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Branch</label>
              <input
                type="text"
                value={formData.bankBranch}
                onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value.toUpperCase() })}
                placeholder="e.g. VARACHHA BRANCH"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold uppercase outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={formData.bankAccountNo}
                onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                placeholder="e.g. 25 98241 81814"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-wider outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.bankIfsc}
                onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                placeholder="e.g. INDB0001731"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* 3. Payment Terms & Declaration Text */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FileCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              3. Terms, Kimberley Declaration & Signature
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Payment Terms</label>
              <input
                type="text"
                value={formData.defaultTerms}
                onChange={(e) => setFormData({ ...formData, defaultTerms: e.target.value })}
                placeholder="e.g. 30 DAYS"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statutory Trade Declaration Text (Appears on all Tax Invoices)
              </label>
              <textarea
                rows={8}
                value={formData.declarationText}
                onChange={(e) => setFormData({ ...formData, declarationText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-sans leading-relaxed outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Signature Image URL (Optional)
              </label>
              <input
                type="text"
                value={formData.signatureUrl || ''}
                onChange={(e) => setFormData({ ...formData, signatureUrl: e.target.value })}
                placeholder="https://example.com/signature.png or data:image/png;base64,..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Company Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
