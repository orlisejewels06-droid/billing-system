'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  CheckCircle,
  XCircle,
  Copy,
  Building,
  Phone,
  Mail,
  MapPin,
  Trash2,
} from 'lucide-react';
import { Party } from '@/lib/types';
import { INDIAN_STATES } from '@/lib/gst/constants';

export default function PartiesMasterPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
    pan: '',
    gstin: '',
    state: 'GUJARAT',
    stateCode: '24',
    country: 'INDIA',
    isActive: true,
  });

  const fetchParties = () => {
    setLoading(true);
    fetch(`/api/parties${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setParties(data.parties);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchParties();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingParty(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      billingAddress: '',
      shippingAddress: '',
      pan: '',
      gstin: '',
      state: 'GUJARAT',
      stateCode: '24',
      country: 'INDIA',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Party) => {
    setEditingParty(p);
    setFormData({
      name: p.name,
      contactPerson: p.contactPerson || '',
      phone: p.phone || '',
      email: p.email || '',
      billingAddress: p.billingAddress,
      shippingAddress: p.shippingAddress,
      pan: p.pan,
      gstin: p.gstin,
      state: p.state,
      stateCode: p.stateCode,
      country: p.country,
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleCopyBillingToShipping = () => {
    setFormData((prev) => ({
      ...prev,
      shippingAddress: prev.billingAddress,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingParty ? `/api/parties/${editingParty.id}` : '/api/parties';
      const method = editingParty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchParties();
      } else {
        alert(data.error || 'Failed to save party');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/parties/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) fetchParties();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteParty = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete party "${name}"?\nThis action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchParties();
      } else {
        alert(data.error || 'Failed to delete party');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting party');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Party Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage diamond buyers, jewelers, suppliers, and separate Bill To / Ship To locations
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add New Party
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by party name, PAN, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">{parties.length} Parties Registered</span>
      </div>

      {/* Parties Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-medium">
            Loading parties directory...
          </div>
        ) : parties.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-medium">
            No parties found. Click &apos;Add New Party&apos; to register a client.
          </div>
        ) : (
          parties.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-brand-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Contact: {p.contactPerson || 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">GSTIN:</span>
                    <span className="font-mono font-bold text-slate-800">{p.gstin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">PAN:</span>
                    <span className="font-mono font-bold text-slate-800">{p.pan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">State:</span>
                    <span className="font-semibold text-slate-800">
                      {p.state} ({p.stateCode})
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="font-bold text-slate-500">Created By:</span>
                    <span className="font-bold text-brand-700">👤 {p.createdBy || 'Sujeet'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{p.billingAddress}</span>
                  </div>
                  {p.phone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                <button
                  onClick={() => handleToggleStatus(p.id)}
                  className={`text-xs font-semibold ${
                    p.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {p.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteParty(p.id, p.name)}
                    className="inline-flex items-center px-2 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                    title="Delete Party"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Party Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingParty ? 'Edit Party Details' : 'Add New Party'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Party / Business Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    placeholder="e.g. GURUKRUPA DIAMOND"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State & GST Code</label>
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="e.g. ABBFG2028C"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g. 24ABBFG2028C1Z5"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Billing Address</label>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Shipping Address</label>
                    <button
                      type="button"
                      onClick={handleCopyBillingToShipping}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-bold flex items-center"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Billing to Shipping
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none"
                    required
                  />
                </div>
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
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  {editingParty ? 'Update Party' : 'Create Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
