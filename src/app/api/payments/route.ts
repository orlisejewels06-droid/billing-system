import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentRecordSchema } from '@/lib/validation/schemas';
import { getCurrentUserName } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId') || undefined;
    const payments = await db.getPayments(invoiceId);
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = paymentRecordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = getCurrentUserName(request);
    const { payment, invoice } = await db.recordPayment(result.data, user);
    return NextResponse.json({ success: true, payment, invoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
