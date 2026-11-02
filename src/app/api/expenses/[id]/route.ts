import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenseSchema } from '@/lib/validation/schemas';
import { getCurrentUserName } from '@/lib/auth/session';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const expense = await db.getExpenseById(params.id);
    if (!expense) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const result = expenseSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = getCurrentUserName(request);
    const updated = await db.updateExpense(params.id, result.data, user);
    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUserName(request);
    const success = await db.deleteExpense(params.id, user);
    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    const isNotFound = error.message?.toLowerCase().includes('not found');
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete expense' },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
