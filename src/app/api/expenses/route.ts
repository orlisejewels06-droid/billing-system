import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenseSchema } from '@/lib/validation/schemas';
import { getCurrentUserName } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paidBy = searchParams.get('paidBy') || undefined;
    const category = searchParams.get('category') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const search = searchParams.get('q') || undefined;

    const [expenses, summary] = await Promise.all([
      db.getExpenses({ paidBy, category, startDate, endDate, month, year, search }),
      db.getExpenseSummary(),
    ]);

    return NextResponse.json({ success: true, expenses, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = getCurrentUserName(request);
    const created = await db.createExpense(result.data, user);
    return NextResponse.json({ success: true, expense: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
