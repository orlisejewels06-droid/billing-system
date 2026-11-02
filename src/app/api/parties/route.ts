import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { partySchema } from '@/lib/validation/schemas';
import { getCurrentUserName } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const activeOnly = searchParams.get('active') === 'true';

    const parties = await db.getParties(query, activeOnly);
    return NextResponse.json({ success: true, parties });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = partySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = getCurrentUserName(request);
    const created = await db.createParty(result.data, user);
    return NextResponse.json({ success: true, party: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
