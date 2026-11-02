'use client';

import React, { useEffect, useState } from 'react';
import { Company } from '@/lib/types';
import { Building2, ShieldCheck, Plus, UserCheck } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/company')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCompany(data.company);
      })
      .catch((err) => console.error(err));

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) setCurrentUser(data.user);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-20 flex items-center justify-between px-6 shadow-sm no-print">
      {/* Left: Company Details Tag */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Building2 className="w-4 h-4 text-brand-600" />
          <span className="font-bold text-xs text-slate-800 tracking-wide">
            {company?.name || 'ORLISE JEWELS'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-[11px] font-mono font-medium text-slate-600">
            GSTIN: {company?.gstin || '24BFJPR0684G1ZA'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-[11px] font-medium text-slate-600">
            Prefix: <strong className="text-brand-700">{company?.invoicePrefix || 'OJ'}</strong>
          </span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
          GST Compliant
        </span>
      </div>

      {/* Right: Logged-in User Badge & Quick Action Buttons */}
      <div className="flex items-center space-x-3">
        {currentUser && (
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-xs font-bold text-amber-900">
              Admin: <span className="underline decoration-amber-400 decoration-2">{currentUser.name}</span>
            </span>
          </div>
        )}

        <Link
          href="/invoices/new"
          className="inline-flex items-center px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create Tax Invoice
        </Link>
      </div>
    </header>
  );
};
