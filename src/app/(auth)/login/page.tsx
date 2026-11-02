'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gem, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('sujeet@orlise.com');
  const [password, setPassword] = useState('sujeet123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const adminProfiles = [
    { name: 'Sujeet', email: 'sujeet@orlise.com', pass: 'sujeet123', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { name: 'Hardik', email: 'hardik@orlise.com', pass: 'hardik123', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Meet', email: 'meet@orlise.com', pass: 'meet123', color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  const handleQuickSelect = (selectedEmail: string, selectedPass: string) => {
    setEmail(selectedEmail);
    setPassword(selectedPass);
    setError('');
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined' && data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        router.push('/');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
        {/* Top Header */}
        <div className="bg-slate-900 p-8 text-center text-white border-b border-slate-800">
          <div className="inline-flex p-3 rounded-2xl bg-brand-600/30 border border-brand-500/40 text-amber-300 mb-3 shadow-lg">
            <Gem className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-wider uppercase text-white">ORLISE BILLING</h1>
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mt-0.5">
            Jewellery & Diamond Billing System
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800">Sign in to Admin Account</h2>
            <p className="text-xs text-slate-500">Access GST Invoicing, Expenses, and Financials</p>
          </div>

          {/* Quick 1-Click Login Buttons for Sujeet, Hardik, Meet */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-brand-600" /> Select Admin Account:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {adminProfiles.map((p) => {
                const isSelected = email.toLowerCase().includes(p.name.toLowerCase());
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleQuickSelect(p.email, p.pass)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm font-black">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">Admin</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email or Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sujeet@orlise.com or sujeet"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Sign In as ${email.split('@')[0]}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
