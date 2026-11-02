import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companySettingsSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const company = await db.getCompany();
    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = companySettingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await db.updateCompany(result.data, 'Admin');
    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
