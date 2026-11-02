import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { partySchema } from '@/lib/validation/schemas';
import { getCurrentUserName } from '@/lib/auth/session';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const party = await db.getPartyById(params.id);
    if (!party) {
      return NextResponse.json({ success: false, message: 'Party not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, party });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
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
    const updated = await db.updateParty(params.id, result.data, user);
    return NextResponse.json({ success: true, party: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = getCurrentUserName(request);
    const updated = await db.togglePartyStatus(params.id, user);
    return NextResponse.json({ success: true, party: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = getCurrentUserName(request);
    await db.deleteParty(params.id, user);
    return NextResponse.json({ success: true, message: 'Party deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
