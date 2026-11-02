import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orlise Jewellery Billing & GST Invoice System',
  description: 'Production-ready Jewellery & Diamond Billing Management System with GST Compliance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
