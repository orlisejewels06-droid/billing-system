import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen print:ml-0">
        <Navbar />
        <main className="flex-1 mt-16 p-6 overflow-x-hidden print:m-0 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
