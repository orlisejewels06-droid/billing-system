'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Tag,
  Gem,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import { Product, UnitType } from '@/lib/types';
import { JEWELLERY_HSN_CODES } from '@/lib/gst/constants';

export default function ProductsMasterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    description: string;
    hsnCode: string;
    defaultUnit: UnitType;
    defaultRate: number;
    defaultGstRate: number;
    category: string;
    isActive: boolean;
  }>({
    description: '',
    hsnCode: '71023100',
    defaultUnit: 'Cts',
    defaultRate: 1000,
    defaultGstRate: 0.25,
    category: 'ROUGH DIAMONDS',
    isActive: true,
  });

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.products);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, search]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      description: '',
      hsnCode: '71023100',
      defaultUnit: 'Cts',
      defaultRate: 1000,
      defaultGstRate: 0.25,
      category: 'ROUGH DIAMONDS',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      description: p.description,
      hsnCode: p.hsnCode,
      defaultUnit: p.defaultUnit,
      defaultRate: p.defaultRate,
      defaultGstRate: p.defaultGstRate,
      category: p.category,
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string, description: string) => {
    if (!confirm(`Are you sure you want to delete product "${description}"?\nThis action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure rough diamonds, polished diamonds, gems, jewellery, and default GST rates
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Product
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by description, HSN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="ROUGH DIAMONDS">Rough Diamonds</option>
            <option value="POLISHED DIAMONDS">Polished Diamonds</option>
            <option value="LAB GROWN DIAMONDS">Lab Grown Diamonds</option>
            <option value="JEWELLERY">Gold & Silver Jewellery</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">HSN Code</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Default Unit</th>
                <th className="px-5 py-3 text-right">Default Rate (₹)</th>
                <th className="px-5 py-3 text-center">GST Rate (%)</th>
                <th className="px-5 py-3 text-center">Created By</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No products found. Click &apos;Add Product&apos; to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 uppercase">
                      {p.description}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-700">
                      {p.hsnCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {p.defaultUnit}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                      ₹{fmt(p.defaultRate)}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-brand-700">
                      {p.defaultGstRate.toFixed(3)}%
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        👤 {p.createdBy || 'Sujeet'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className={`text-[11px] font-semibold ${
                          p.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.description)}
                        className="inline-flex items-center px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-semibold text-xs"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value.toUpperCase() })}
                  placeholder="e.g. ROUGH DIAMONDS / CUT & POLISHED"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              {/* Pre-fill from standard HSN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Load Pre-defined Jewellery HSN
                </label>
                <select
                  onChange={(e) => {
                    const preset = JEWELLERY_HSN_CODES.find((h) => h.code === e.target.value);
                    if (preset) {
                      setFormData({
                        ...formData,
                        description: preset.description,
                        hsnCode: preset.code,
                        defaultGstRate: preset.defaultGst,
                        defaultUnit: preset.unit as UnitType,
                      });
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="">-- Choose Standard GST Category --</option>
                  {JEWELLERY_HSN_CODES.map((h) => (
                    <option key={h.code} value={h.code}>
                      {h.code} - {h.description} (GST {h.defaultGst}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                    placeholder="e.g. DIAMOND, GOLD"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold uppercase outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Unit</label>
                  <select
                    value={formData.defaultUnit}
                    onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value as UnitType })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                  >
                    <option value="Cts">Cts (Carats)</option>
                    <option value="Grams">Grams</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Rate (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultRate}
                    onChange={(e) => setFormData({ ...formData, defaultRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Rate (% Total: e.g. 0.25% for rough, 1.5% for polished, 3% for jewellery)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.defaultGstRate}
                    onChange={(e) => setFormData({ ...formData, defaultGstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-brand-700 outline-none"
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
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
