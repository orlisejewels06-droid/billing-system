import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserName } from '@/lib/auth/session';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const invoice = await db.getInvoiceById(params.id);
    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const user = getCurrentUserName(request);

    if (mode === 'cancel') {
      const cancelled = await db.cancelInvoice(params.id, user);
      return NextResponse.json({ success: true, invoice: cancelled, message: 'Invoice status changed to CANCELLED' });
    }

    await db.deleteInvoice(params.id, user);
    return NextResponse.json({ success: true, message: 'Invoice permanently deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
