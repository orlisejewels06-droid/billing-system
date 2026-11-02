'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Building,
  Truck,
  Calendar,
  Check,
  Calculator,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Company, Party, Product, UnitType, DiscountType } from '@/lib/types';
import { INDIAN_STATES, JEWELLERY_HSN_CODES } from '@/lib/gst/constants';
import { calculateItemRow, calculateInvoiceTotals } from '@/lib/gst/calculator';

interface ItemFormState {
  productId?: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: UnitType;
  rate: number;
  discountType: DiscountType;
  discountValue: number;
  gstRate: number; // e.g. 0.25 for rough diamonds, 1.5 for polished
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  lineTotal: number;
}

export default function NewInvoicePage() {
  const router = useRouter();

  // Master Data
  const [company, setCompany] = useState<Company | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Invoice Form State
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [previewNumber, setPreviewNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState(nextMonth);
  const [paymentTerms, setPaymentTerms] = useState('30 DAYS');
  const [reverseCharge, setReverseCharge] = useState(false);
  const [transportMode, setTransportMode] = useState('HAND TO HAND');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [dateOfSupply, setDateOfSupply] = useState(today);
  const [placeOfSupply, setPlaceOfSupply] = useState('GUJARAT');
  const [supplyStateCode, setSupplyStateCode] = useState('24');

  // Tax Application Mode State: 'INTRA_STATE' (CGST + SGST) | 'INTER_STATE' (IGST)
  const [taxMode, setTaxMode] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');
  const [showAllTaxColumns, setShowAllTaxColumns] = useState(false);

  // Party Selection
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [billTo, setBillTo] = useState({
    name: '',
    address: '',
    pan: '',
    gstin: '',
    state: 'GUJARAT',
    stateCode: '24',
  });

  const [sameAsBillTo, setSameAsBillTo] = useState(true);
  const [shipTo, setShipTo] = useState({
    name: '',
    address: '',
    pan: '',
    gstin: '',
    state: 'GUJARAT',
    stateCode: '24',
  });

  // Items State (Default Orlise Diamond Reference item: 0.125% CGST + 0.125% SGST)
  const [items, setItems] = useState<ItemFormState[]>([
    {
      description: 'ROUGH DIAMONDS',
      hsnCode: '71023100',
      quantity: 1569.29,
      unit: 'Cts',
      rate: 950,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      gstRate: 0.25,
      grossAmount: 1490826,
      discountAmount: 0,
      taxableAmount: 1490826,
      cgstRate: 0.125,
      cgstAmount: 1864,
      sgstRate: 0.125,
      sgstAmount: 1864,
      igstRate: 0,
      igstAmount: 0,
      lineTotal: 1494554,
    },
  ]);

  // Invoice Level Discount
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState(0);

  // Fetch initial data & sequence preview
  useEffect(() => {
    Promise.all([
      fetch('/api/company').then((r) => r.json()),
      fetch('/api/parties?active=true').then((r) => r.json()),
      fetch('/api/products?active=true').then((r) => r.json()),
      fetch(`/api/invoices/next-number?date=${invoiceDate}`).then((r) => r.json()),
    ])
      .then(([compRes, partiesRes, prodsRes, numRes]) => {
        if (compRes.success) {
          setCompany(compRes.company);
          setPaymentTerms(compRes.company.defaultTerms || '30 DAYS');
        }
        if (partiesRes.success && partiesRes.parties.length > 0) {
          setParties(partiesRes.parties);
          // Set first party by default
          const p = partiesRes.parties[0];
          setSelectedPartyId(p.id);
          setBillTo({
            name: p.name,
            address: p.billingAddress,
            pan: p.pan,
            gstin: p.gstin,
            state: p.state,
            stateCode: p.stateCode,
          });
          setShipTo({
            name: p.name,
            address: p.shippingAddress,
            pan: p.pan,
            gstin: p.gstin,
            state: p.state,
            stateCode: p.stateCode,
          });
          setPlaceOfSupply(p.state);
          setSupplyStateCode(p.stateCode);

          const isMatch = (compRes.company?.stateCode || '24') === p.stateCode;
          setTaxMode(isMatch ? 'INTRA_STATE' : 'INTER_STATE');
        }
        if (prodsRes.success) setProducts(prodsRes.products);
        if (numRes.success) setPreviewNumber(numRes.nextNumber);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Update preview number when invoice date changes
  useEffect(() => {
    if (invoiceDate) {
      fetch(`/api/invoices/next-number?date=${invoiceDate}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setPreviewNumber(res.nextNumber);
        });
    }
  }, [invoiceDate]);

  // Recalculate all items based on a target taxMode
  const applyTaxModeToItems = (newMode: 'INTRA_STATE' | 'INTER_STATE') => {
    const isIntra = newMode === 'INTRA_STATE';
    setItems((prev) =>
      prev.map((it, idx) => {
        let newCgstRate = 0;
        let newSgstRate = 0;
        let newIgstRate = 0;

        if (isIntra) {
          // If already had CGST / SGST rates, keep them. Otherwise split gstRate or igstRate into 50/50
          if (it.cgstRate > 0 || it.sgstRate > 0) {
            newCgstRate = it.cgstRate;
            newSgstRate = it.sgstRate;
          } else {
            const baseRate = it.gstRate > 0 ? it.gstRate : it.igstRate > 0 ? it.igstRate : 0.25;
            newCgstRate = Number((baseRate / 2).toFixed(3));
            newSgstRate = Number((baseRate / 2).toFixed(3));
          }
          newIgstRate = 0;
        } else {
          // INTER_STATE: combine CGST + SGST into IGST
          if (it.igstRate > 0) {
            newIgstRate = it.igstRate;
          } else {
            const combined = it.cgstRate + it.sgstRate;
            newIgstRate = combined > 0 ? combined : it.gstRate > 0 ? it.gstRate : 0.25;
          }
          newCgstRate = 0;
          newSgstRate = 0;
        }

        const calculated = calculateItemRow(
          {
            description: it.description,
            hsnCode: it.hsnCode,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            discountType: it.discountType,
            discountValue: it.discountValue,
            gstRate: isIntra ? newCgstRate + newSgstRate : newIgstRate,
            customCgstRate: newCgstRate,
            customSgstRate: newSgstRate,
            customIgstRate: newIgstRate,
            isIntraState: isIntra,
          },
          idx + 1
        );

        return {
          ...it,
          gstRate: isIntra ? newCgstRate + newSgstRate : newIgstRate,
          cgstRate: calculated.cgstRate,
          cgstAmount: calculated.cgstAmount,
          sgstRate: calculated.sgstRate,
          sgstAmount: calculated.sgstAmount,
          igstRate: calculated.igstRate,
          igstAmount: calculated.igstAmount,
          taxableAmount: calculated.taxableAmount,
          lineTotal: calculated.lineTotal,
        };
      })
    );
  };

  // Switch between Intra-State (CGST + SGST) and Inter-State (IGST)
  const handleTaxModeChange = (newMode: 'INTRA_STATE' | 'INTER_STATE') => {
    setTaxMode(newMode);
    applyTaxModeToItems(newMode);
  };

  // Handle party selection
  const handleSelectParty = (partyId: string) => {
    setSelectedPartyId(partyId);
    const p = parties.find((party) => party.id === partyId);
    if (p) {
      setBillTo({
        name: p.name,
        address: p.billingAddress,
        pan: p.pan,
        gstin: p.gstin,
        state: p.state,
        stateCode: p.stateCode,
      });
      setPlaceOfSupply(p.state);
      setSupplyStateCode(p.stateCode);

      if (sameAsBillTo) {
        setShipTo({
          name: p.name,
          address: p.shippingAddress,
          pan: p.pan,
          gstin: p.gstin,
          state: p.state,
          stateCode: p.stateCode,
        });
      }

      // Check whether state matches company state to suggest tax mode
      const isSellerState = (company?.stateCode || '24') === p.stateCode;
      const suggested = isSellerState ? 'INTRA_STATE' : 'INTER_STATE';
      setTaxMode(suggested);
      applyTaxModeToItems(suggested);
    }
  };

  // Recompute single item row with accurate Decimal.js calculations
  const updateItem = (index: number, updates: Partial<ItemFormState>) => {
    setItems((prev) => {
      const copy = [...prev];
      const merged = { ...copy[index], ...updates };
      const isIntra = taxMode === 'INTRA_STATE';

      const calculated = calculateItemRow(
        {
          description: merged.description,
          hsnCode: merged.hsnCode,
          quantity: merged.quantity,
          unit: merged.unit,
          rate: merged.rate,
          discountType: merged.discountType,
          discountValue: merged.discountValue,
          gstRate: merged.gstRate,
          customCgstRate: merged.cgstRate,
          customSgstRate: merged.sgstRate,
          customIgstRate: merged.igstRate,
          isIntraState: isIntra,
        },
        index + 1
      );

      copy[index] = {
        ...merged,
        grossAmount: calculated.grossAmount,
        discountAmount: calculated.discountAmount,
        taxableAmount: calculated.taxableAmount,
        cgstRate: calculated.cgstRate,
        cgstAmount: calculated.cgstAmount,
        sgstRate: calculated.sgstRate,
        sgstAmount: calculated.sgstAmount,
        igstRate: calculated.igstRate,
        igstAmount: calculated.igstAmount,
        lineTotal: calculated.lineTotal,
      };

      return copy;
    });
  };

  // Apply Quick Tax Rate Preset across all item rows
  const applyTaxPresetToAll = (totalGst: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        const isIntra = taxMode === 'INTRA_STATE';
        const half = Number((totalGst / 2).toFixed(3));
        const cgstRate = isIntra ? half : 0;
        const sgstRate = isIntra ? half : 0;
        const igstRate = isIntra ? 0 : totalGst;

        const calculated = calculateItemRow(
          {
            description: it.description,
            hsnCode: it.hsnCode,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            discountType: it.discountType,
            discountValue: it.discountValue,
            gstRate: totalGst,
            customCgstRate: cgstRate,
            customSgstRate: sgstRate,
            customIgstRate: igstRate,
            isIntraState: isIntra,
          },
          idx + 1
        );

        return {
          ...it,
          gstRate: totalGst,
          cgstRate: calculated.cgstRate,
          cgstAmount: calculated.cgstAmount,
          sgstRate: calculated.sgstRate,
          sgstAmount: calculated.sgstAmount,
          igstRate: calculated.igstRate,
          igstAmount: calculated.igstAmount,
          taxableAmount: calculated.taxableAmount,
          lineTotal: calculated.lineTotal,
        };
      })
    );
  };

  const addItemRow = () => {
    const isIntra = taxMode === 'INTRA_STATE';
    const defaultProduct = products[0] || {
      description: 'ROUGH DIAMONDS',
      hsnCode: '71023100',
      defaultUnit: 'Cts' as UnitType,
      defaultRate: 1000,
      defaultGstRate: 0.25,
    };

    const halfRate = Number((defaultProduct.defaultGstRate / 2).toFixed(3));
    const cgstRate = isIntra ? halfRate : 0;
    const sgstRate = isIntra ? halfRate : 0;
    const igstRate = isIntra ? 0 : defaultProduct.defaultGstRate;

    const calculated = calculateItemRow(
      {
        description: defaultProduct.description,
        hsnCode: defaultProduct.hsnCode,
        quantity: 1,
        unit: defaultProduct.defaultUnit,
        rate: defaultProduct.defaultRate,
        gstRate: defaultProduct.defaultGstRate,
        customCgstRate: cgstRate,
        customSgstRate: sgstRate,
        customIgstRate: igstRate,
        isIntraState: isIntra,
      },
      items.length + 1
    );

    setItems((prev) => [
      ...prev,
      {
        description: defaultProduct.description,
        hsnCode: defaultProduct.hsnCode,
        quantity: 1,
        unit: defaultProduct.defaultUnit,
        rate: defaultProduct.defaultRate,
        discountType: 'PERCENTAGE',
        discountValue: 0,
        gstRate: defaultProduct.defaultGstRate,
        grossAmount: calculated.grossAmount,
        discountAmount: calculated.discountAmount,
        taxableAmount: calculated.taxableAmount,
        cgstRate: calculated.cgstRate,
        cgstAmount: calculated.cgstAmount,
        sgstRate: calculated.sgstRate,
        sgstAmount: calculated.sgstAmount,
        igstRate: calculated.igstRate,
        igstAmount: calculated.igstAmount,
        lineTotal: calculated.lineTotal,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      alert('An invoice must contain at least one item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Total Calculations using Decimal.js engine
  const totals = calculateInvoiceTotals({
    items: items as any,
    companyStateCode: company?.stateCode || '24',
    supplyStateCode,
    invoiceDiscountType,
    invoiceDiscountValue,
    applyRoundOff: true,
  });

  const fmt = (n: number | undefined) => {
    if (n === undefined || isNaN(n)) return '0';
    return Math.round(n).toLocaleString('en-IN');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTo.name || !billTo.gstin) {
      alert('Please fill party name and GSTIN');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        invoiceDate,
        dueDate,
        paymentTerms,
        reverseCharge,
        transportMode,
        vehicleNumber,
        dateOfSupply,
        placeOfSupply,
        supplyState: placeOfSupply,
        supplyStateCode,
        billToSnapshot: billTo,
        shipToSnapshot: sameAsBillTo ? billTo : shipTo,
        items,
        invoiceDiscountType,
        invoiceDiscountValue,
        declarationText: company?.declarationText,
        createdBy: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('currentUser') || '{}')?.name : undefined,
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/invoices/${data.invoice.id}/preview`);
      } else {
        alert(`Failed to create invoice: ${data.error || 'Validation error'}`);
        setSaving(false);
      }
    } catch (err: any) {
      alert(`Error creating invoice: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading invoice builder and company profile...
      </div>
    );
  }

  const isIntraState = taxMode === 'INTRA_STATE';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Tax Invoice</h1>
            <p className="text-xs text-slate-500">
              Orlise Diamond Standard · Dedicated CGST &amp; SGST Controls · Sequence OJ/YY-MMNN
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Automatic Invoice Number Box */}
          <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-lg border border-slate-800 text-right">
            <span className="text-[10px] text-amber-400 font-bold uppercase block tracking-wider">
              Allocated Sequence
            </span>
            <span className="text-sm font-black font-mono tracking-wide">{previewNumber}</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Generate & Preview Invoice'}
          </button>
        </div>
      </div>

      {/* 1. Invoice & Transport Details Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            1. Invoice &amp; Logistics Information
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            Company: <strong className="text-slate-800">{company?.name || 'Orlise Diamond'}</strong> (State Code {company?.stateCode || '24'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. 30 DAYS"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reverse Charge (Y/N)</label>
            <div className="flex items-center space-x-3 h-8">
              <label className="inline-flex items-center text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={reverseCharge}
                  onChange={(e) => setReverseCharge(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300"
                />
                <span className="ml-2 font-medium text-slate-700">Reverse Charge Applicable</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transport Mode</label>
            <input
              type="text"
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value)}
              placeholder="HAND TO HAND / ROAD"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Number</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="Optional vehicle no."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Supply</label>
            <input
              type="date"
              value={dateOfSupply}
              onChange={(e) => setDateOfSupply(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Place of Supply (State)</label>
            <select
              value={supplyStateCode}
              onChange={(e) => {
                const code = e.target.value;
                setSupplyStateCode(code);
                const st = INDIAN_STATES.find((s) => s.code === code);
                if (st) setPlaceOfSupply(st.name);
              }}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.code} - {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* GST Tax Mode Selector & Indicator */}
        <div className="mt-3 p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 rounded-xl border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 uppercase tracking-wide">GST Tax Application:</span>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-black tracking-wide ${
                  isIntraState ? 'bg-blue-600 text-white shadow-sm' : 'bg-purple-600 text-white shadow-sm'
                }`}
              >
                {isIntraState ? 'INTRA-STATE (CGST + SGST)' : 'INTER-STATE (IGST)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">
              {isIntraState ? (
                <>
                  Applying <strong>CGST (50%) + SGST (50%)</strong> · Seller in Gujarat ({company?.stateCode || '24'}) · Suitable for local intra-state sales &amp; counter sales.
                </>
              ) : (
                <>
                  Applying <strong>Integrated GST (IGST 100%)</strong> · Supply from Gujarat ({company?.stateCode || '24'}) to {placeOfSupply} ({supplyStateCode}).
                </>
              )}
            </p>
          </div>

          {/* Interactive Toggle Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => handleTaxModeChange('INTRA_STATE')}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                isIntraState
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              ✓ Intra-State (CGST + SGST)
            </button>
            <button
              type="button"
              onClick={() => handleTaxModeChange('INTER_STATE')}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                !isIntraState
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              ✓ Inter-State (IGST)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bill To & Ship To Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bill To Party */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              2. Bill To Party
            </h2>
            <div className="w-52">
              <select
                value={selectedPartyId}
                onChange={(e) => handleSelectParty(e.target.value)}
                className="w-full px-2 py-1 bg-brand-50 border border-brand-200 text-brand-900 rounded text-xs font-semibold focus:outline-none"
              >
                <option value="">-- Choose Saved Party --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.state})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Party Name</label>
              <input
                type="text"
                value={billTo.name}
                onChange={(e) => setBillTo({ ...billTo, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Address</label>
              <textarea
                rows={2}
                value={billTo.address}
                onChange={(e) => setBillTo({ ...billTo, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">PAN</label>
                <input
                  type="text"
                  value={billTo.pan}
                  onChange={(e) => setBillTo({ ...billTo, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold uppercase outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">GSTIN</label>
                <input
                  type="text"
                  value={billTo.gstin}
                  onChange={(e) => setBillTo({ ...billTo, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold uppercase outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">State</label>
                <input
                  type="text"
                  value={billTo.state}
                  onChange={(e) => setBillTo({ ...billTo, state: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium uppercase outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">State Code</label>
                <input
                  type="text"
                  value={billTo.stateCode}
                  onChange={(e) => setBillTo({ ...billTo, stateCode: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ship To Party */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              3. Ship To Party
            </h2>
            <label className="inline-flex items-center text-xs font-semibold text-brand-700 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsBillTo}
                onChange={(e) => {
                  setSameAsBillTo(e.target.checked);
                  if (e.target.checked) setShipTo({ ...billTo });
                }}
                className="w-4 h-4 text-brand-600 rounded mr-1.5"
              />
              Same as Bill To
            </label>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Party Name</label>
              <input
                type="text"
                disabled={sameAsBillTo}
                value={sameAsBillTo ? billTo.name : shipTo.name}
                onChange={(e) => setShipTo({ ...shipTo, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold uppercase outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Address</label>
              <textarea
                rows={2}
                disabled={sameAsBillTo}
                value={sameAsBillTo ? billTo.address : shipTo.address}
                onChange={(e) => setShipTo({ ...shipTo, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">PAN</label>
                <input
                  type="text"
                  disabled={sameAsBillTo}
                  value={sameAsBillTo ? billTo.pan : shipTo.pan}
                  onChange={(e) => setShipTo({ ...shipTo, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold uppercase outline-none disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">GSTIN</label>
                <input
                  type="text"
                  disabled={sameAsBillTo}
                  value={sameAsBillTo ? billTo.gstin : shipTo.gstin}
                  onChange={(e) => setShipTo({ ...shipTo, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold uppercase outline-none disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">State</label>
                <input
                  type="text"
                  disabled={sameAsBillTo}
                  value={sameAsBillTo ? billTo.state : shipTo.state}
                  onChange={(e) => setShipTo({ ...shipTo, state: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium uppercase outline-none disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">State Code</label>
                <input
                  type="text"
                  disabled={sameAsBillTo}
                  value={sameAsBillTo ? billTo.stateCode : shipTo.stateCode}
                  onChange={(e) => setShipTo({ ...shipTo, stateCode: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Item Details Table (Orlise Diamond Format with Dedicated CGST & SGST Controls) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                4. Invoice Item Breakdown
              </h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  isIntraState ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {isIntraState ? 'CGST + SGST Active' : 'IGST Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Accurate Decimal.js calculations · Direct inputs for CGST %, SGST %, and IGST %
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Show All Columns Checkbox */}
            <label className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={showAllTaxColumns}
                onChange={(e) => setShowAllTaxColumns(e.target.checked)}
                className="w-3.5 h-3.5 text-brand-600 rounded mr-1.5"
              />
              Show All Tax Columns
            </label>

            {/* Quick Tax Mode Switch */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => handleTaxModeChange('INTRA_STATE')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  isIntraState ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CGST + SGST
              </button>
              <button
                type="button"
                onClick={() => handleTaxModeChange('INTER_STATE')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  !isIntraState ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                IGST
              </button>
            </div>

            {/* Add Row Button */}
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Row
            </button>
          </div>
        </div>

        {/* Quick Tax Presets Bar */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center">
            <Sparkles className="w-3 h-3 text-amber-500 mr-1" /> Apply GST Presets to All Rows:
          </span>
          <button
            type="button"
            onClick={() => applyTaxPresetToAll(0.25)}
            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
            title="Rough Diamonds: 0.125% CGST + 0.125% SGST (Total 0.25%)"
          >
            Rough Diamonds (0.25% / 0.125%+0.125%)
          </button>
          <button
            type="button"
            onClick={() => applyTaxPresetToAll(1.5)}
            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
            title="Cut & Polished Diamonds: 0.75% CGST + 0.75% SGST (Total 1.5%)"
          >
            Polished Diamonds (1.5% / 0.75%+0.75%)
          </button>
          <button
            type="button"
            onClick={() => applyTaxPresetToAll(3.0)}
            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
            title="Gold & Jewellery: 1.5% CGST + 1.5% SGST (Total 3.0%)"
          >
            Gold &amp; Jewellery (3.0% / 1.5%+1.5%)
          </button>
          <button
            type="button"
            onClick={() => applyTaxPresetToAll(5.0)}
            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
          >
            Job Work (5.0%)
          </button>
          <button
            type="button"
            onClick={() => applyTaxPresetToAll(18.0)}
            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
          >
            Standard (18.0%)
          </button>
        </div>

        {/* Responsive Table with Light-Blue Orlise Diamond (#cce5ff) Header */}
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-xs border border-slate-300 min-w-[1000px]">
            <thead>
              {/* Top Tier Header */}
              <tr className="bg-[#cce5ff] text-black font-bold text-[11px]">
                <th rowSpan={2} className="p-1.5 border border-slate-300 w-8 text-center">
                  #
                </th>
                <th rowSpan={2} className="p-1.5 border border-slate-300 text-left min-w-[220px]">
                  Product Description
                </th>
                <th rowSpan={2} className="p-1.5 border border-slate-300 w-24 text-center">
                  HSN Code
                </th>
                <th rowSpan={2} className="p-1.5 border border-slate-300 w-20 text-right">
                  Qty
                </th>
                <th rowSpan={2} className="p-1.5 border border-slate-300 w-16 text-center">
                  Unit
                </th>
                <th rowSpan={2} className="p-1.5 border border-slate-300 w-24 text-right">
                  Rate (₹)
                </th>
                <th rowSpan={2} className="p-1.5 border border-slate-300 w-28 text-right">
                  Taxable (₹)
                </th>

                {/* CGST Columns Header */}
                {(isIntraState || showAllTaxColumns) && (
                  <th colSpan={2} className="p-1 border border-slate-300 text-center bg-blue-100 text-blue-900 font-extrabold">
                    CGST
                  </th>
                )}

                {/* SGST Columns Header */}
                {(isIntraState || showAllTaxColumns) && (
                  <th colSpan={2} className="p-1 border border-slate-300 text-center bg-blue-100 text-blue-900 font-extrabold">
                    SGST
                  </th>
                )}

                {/* IGST Columns Header */}
                {(!isIntraState || showAllTaxColumns) && (
                  <th colSpan={2} className="p-1 border border-slate-300 text-center bg-purple-100 text-purple-900 font-extrabold">
                    IGST
                  </th>
                )}

                <th rowSpan={2} className="p-1.5 border border-slate-300 w-28 text-right">
                  Total (₹)
                </th>
                <th rowSpan={2} className="p-1.5 border border-slate-300 w-10 text-center">
                  Del
                </th>
              </tr>

              {/* Sub Tier Header for Rates & Amounts */}
              <tr className="bg-[#cce5ff] text-black font-bold text-[10px]">
                {(isIntraState || showAllTaxColumns) && (
                  <>
                    <th className="p-1 border border-slate-300 w-20 text-center bg-blue-50/90 text-blue-900">
                      Rate (%)
                    </th>
                    <th className="p-1 border border-slate-300 w-24 text-right bg-blue-50/90 text-blue-900">
                      Amount (₹)
                    </th>
                    <th className="p-1 border border-slate-300 w-20 text-center bg-blue-50/90 text-blue-900">
                      Rate (%)
                    </th>
                    <th className="p-1 border border-slate-300 w-24 text-right bg-blue-50/90 text-blue-900">
                      Amount (₹)
                    </th>
                  </>
                )}

                {(!isIntraState || showAllTaxColumns) && (
                  <>
                    <th className="p-1 border border-slate-300 w-20 text-center bg-purple-50/90 text-purple-900">
                      Rate (%)
                    </th>
                    <th className="p-1 border border-slate-300 w-24 text-right bg-purple-50/90 text-purple-900">
                      Amount (₹)
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">
                    {idx + 1}
                  </td>

                  {/* Description & Master Pick */}
                  <td className="p-2 border border-slate-300">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value.toUpperCase() })}
                        className="w-full px-2 py-1 border border-slate-200 rounded font-bold uppercase text-xs outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                      {/* Quick HSN / Product Preset with Explicit CGST + SGST split */}
                      <select
                        onChange={(e) => {
                          const hsn = JEWELLERY_HSN_CODES.find((h) => h.code === e.target.value);
                          if (hsn) {
                            if (isIntraState) {
                              const halfRate = Number((hsn.defaultGst / 2).toFixed(3));
                              updateItem(idx, {
                                description: hsn.description,
                                hsnCode: hsn.code,
                                unit: hsn.unit as UnitType,
                                gstRate: hsn.defaultGst,
                                cgstRate: halfRate,
                                sgstRate: halfRate,
                                igstRate: 0,
                              });
                            } else {
                              updateItem(idx, {
                                description: hsn.description,
                                hsnCode: hsn.code,
                                unit: hsn.unit as UnitType,
                                gstRate: hsn.defaultGst,
                                cgstRate: 0,
                                sgstRate: 0,
                                igstRate: hsn.defaultGst,
                              });
                            }
                          }
                        }}
                        className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 w-full font-medium"
                      >
                        <option value="">-- Apply Preset (Rough 0.25%, Polished 1.5%, Gold 3%) --</option>
                        {JEWELLERY_HSN_CODES.map((h) => (
                          <option key={h.code} value={h.code}>
                            {h.description} ·{' '}
                            {isIntraState
                              ? `CGST ${(h.defaultGst / 2).toFixed(3)}% + SGST ${(h.defaultGst / 2).toFixed(3)}%`
                              : `IGST ${h.defaultGst}%`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* HSN */}
                  <td className="p-2 border border-slate-300">
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => updateItem(idx, { hsnCode: e.target.value })}
                      className="w-full px-1.5 py-1 border border-slate-200 rounded font-mono text-center text-xs outline-none"
                      required
                    />
                  </td>

                  {/* Qty */}
                  <td className="p-2 border border-slate-300">
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-1.5 py-1 border border-slate-200 rounded text-right font-semibold text-xs outline-none"
                      required
                    />
                  </td>

                  {/* Unit */}
                  <td className="p-2 border border-slate-300">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(idx, { unit: e.target.value as UnitType })}
                      className="w-full px-1 py-1 border border-slate-200 rounded text-xs outline-none font-medium"
                    >
                      <option value="Cts">Cts</option>
                      <option value="Grams">Grams</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Kg">Kg</option>
                    </select>
                  </td>

                  {/* Rate */}
                  <td className="p-2 border border-slate-300">
                    <input
                      type="number"
                      step="any"
                      value={item.rate}
                      onChange={(e) => updateItem(idx, { rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-1.5 py-1 border border-slate-200 rounded text-right font-medium text-xs outline-none"
                      required
                    />
                  </td>

                  {/* Taxable */}
                  <td className="p-2 border border-slate-300 text-right font-semibold text-slate-800">
                    ₹{fmt(item.taxableAmount)}
                  </td>

                  {/* CGST Rate & Amount */}
                  {(isIntraState || showAllTaxColumns) && (
                    <>
                      <td className="p-1.5 border border-slate-300 bg-blue-50/30">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.001"
                            value={item.cgstRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateItem(idx, {
                                cgstRate: val,
                                sgstRate: val, // Auto-sync SGST to match CGST
                                gstRate: Number((val * 2).toFixed(3)),
                              });
                            }}
                            className="w-full px-1.5 py-1 border border-blue-300 bg-white rounded text-center font-bold text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            title="CGST Rate % (Editing auto-syncs SGST %)"
                          />
                          <span className="text-[10px] text-blue-700 font-bold">%</span>
                        </div>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-bold text-blue-900 bg-blue-50/30">
                        ₹{fmt(item.cgstAmount)}
                      </td>

                      {/* SGST Rate & Amount */}
                      <td className="p-1.5 border border-slate-300 bg-blue-50/30">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.001"
                            value={item.sgstRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateItem(idx, {
                                sgstRate: val,
                                gstRate: Number((item.cgstRate + val).toFixed(3)),
                              });
                            }}
                            className="w-full px-1.5 py-1 border border-blue-300 bg-white rounded text-center font-bold text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            title="SGST Rate %"
                          />
                          <span className="text-[10px] text-blue-700 font-bold">%</span>
                        </div>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-bold text-blue-900 bg-blue-50/30">
                        ₹{fmt(item.sgstAmount)}
                      </td>
                    </>
                  )}

                  {/* IGST Rate & Amount */}
                  {(!isIntraState || showAllTaxColumns) && (
                    <>
                      <td className="p-1.5 border border-slate-300 bg-purple-50/30">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.001"
                            value={item.igstRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateItem(idx, {
                                igstRate: val,
                                gstRate: val,
                              });
                            }}
                            className="w-full px-1.5 py-1 border border-purple-300 bg-white rounded text-center font-bold text-xs outline-none focus:ring-1 focus:ring-purple-500"
                            title="IGST Rate %"
                          />
                          <span className="text-[10px] text-purple-700 font-bold">%</span>
                        </div>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-bold text-purple-900 bg-purple-50/30">
                        ₹{fmt(item.igstAmount)}
                      </td>
                    </>
                  )}

                  {/* Total */}
                  <td className="p-2 border border-slate-300 text-right font-black text-slate-900">
                    ₹{fmt(item.lineTotal)}
                  </td>

                  {/* Del */}
                  <td className="p-2 border border-slate-300 text-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Totals & Indian Numbering Words Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Invoice Discount & Notes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Invoice Level Discount
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Discount Type</label>
              <select
                value={invoiceDiscountType}
                onChange={(e) => setInvoiceDiscountType(e.target.value as DiscountType)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Discount Value</label>
              <input
                type="number"
                step="any"
                value={invoiceDiscountValue}
                onChange={(e) => setInvoiceDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 block mb-1">
              Amount in Words (Orlise Diamond Standard):
            </span>
            <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wide">
              {totals.totalInWords}
            </p>
          </div>
        </div>

        {/* Right: Financial Summary Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            Tax &amp; Grand Total Summary
          </h3>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Total Amount before Tax:</span>
            <span className="font-semibold text-slate-800">₹{fmt(totals.taxableAmount)}</span>
          </div>

          {/* Detailed CGST & SGST Summary Lines */}
          {(totals.cgstAmount > 0 || isIntraState) && (
            <>
              <div className="flex justify-between py-1 text-slate-700">
                <span>
                  Add: CGST @ {items[0]?.cgstRate ? items[0].cgstRate.toFixed(3) : '0.000'}%:
                </span>
                <span className="font-bold text-blue-700">₹{fmt(totals.cgstAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>
                  Add: SGST @ {items[0]?.sgstRate ? items[0].sgstRate.toFixed(3) : '0.000'}%:
                </span>
                <span className="font-bold text-blue-700">₹{fmt(totals.sgstAmount)}</span>
              </div>
            </>
          )}

          {/* Detailed IGST Summary Line */}
          {(totals.igstAmount > 0 || !isIntraState) && (
            <div className="flex justify-between py-1 text-slate-700">
              <span>
                Add: IGST @ {items[0]?.igstRate ? items[0].igstRate.toFixed(3) : '0.000'}%:
              </span>
              <span className="font-bold text-purple-700">₹{fmt(totals.igstAmount)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 text-slate-600 border-t border-slate-100">
            <span className="font-semibold">Total Tax Amount:</span>
            <span className="font-bold text-blue-900">₹{fmt(totals.totalTaxAmount)}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Round Off:</span>
            <span className="font-medium text-slate-700">₹{totals.roundOff.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900 bg-neutral-50 px-2 rounded">
            <span className="uppercase">Grand Total (After Tax):</span>
            <span className="text-brand-800">₹{fmt(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </form>
  );
}