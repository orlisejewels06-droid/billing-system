'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Package,
  CreditCard,
  Wallet,
  Settings,
  Gem,
  LogOut,
  UserCheck,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [switching, setSwitching] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Invoices', href: '/invoices', icon: FileText },
    { label: 'New Invoice', href: '/invoices/new', icon: PlusCircle },
    { label: 'Parties', href: '/parties', icon: Users },
    { label: 'Products Master', href: '/products', icon: Package },
    { label: 'Payments', href: '/payments', icon: CreditCard },
    { label: 'Expenses', href: '/expenses', icon: Wallet },
    { label: 'Company Settings', href: '/settings', icon: Settings },
  ];

  const adminList = [
    { name: 'Sujeet', email: 'sujeet@orlise.com', pass: 'sujeet123' },
    { name: 'Hardik', email: 'hardik@orlise.com', pass: 'hardik123' },
    { name: 'Meet', email: 'meet@orlise.com', pass: 'meet123' },
  ];

  useEffect(() => {
    // 1. Try local storage for immediate render
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      }
    }

    // 2. Fetch authenticated user from session API
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSwitchUser = async (userEmail: string, userPass: string) => {
    setSwitching(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: userPass }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        setShowSwitchMenu(false);
        // Refresh page to sync all views with the newly switched user
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
      }
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl no-print">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
        <div className="bg-brand-500 p-2 rounded-lg text-white shadow-md">
          <Gem className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-wide text-white block">ORLISE BILLING</span>
          <span className="text-[10px] text-amber-400 font-medium tracking-wider uppercase">Jewellery & Diamond</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer User / Switcher / Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 relative">
        {/* User Switch Dropdown Menu */}
        {showSwitchMenu && (
          <div className="absolute bottom-16 left-3 right-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Switch Admin Profile
            </div>
            {adminList.map((adm) => {
              const isCurrent = currentUser?.name?.toLowerCase() === adm.name.toLowerCase();
              return (
                <button
                  key={adm.name}
                  onClick={() => handleSwitchUser(adm.email, adm.pass)}
                  disabled={switching}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-brand-600 text-white'
                      : 'hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300">
                      {adm.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{adm.name}</span>
                  </div>
                  {isCurrent && <span className="text-[10px] text-amber-300 font-bold">Active</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowSwitchMenu(!showSwitchMenu)}
            title="Click to switch between Sujeet, Hardik, Meet"
            className="flex items-center space-x-2.5 text-left flex-1 min-w-0 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0">
              {getInitials(currentUser?.name)}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Sujeet'}
                </p>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </div>
              <p className="text-[10px] text-amber-400 truncate font-medium">
                Admin · {currentUser?.name || 'Sujeet'}
              </p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
