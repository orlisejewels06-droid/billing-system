import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productSchema } from '@/lib/validation/schemas';
import { getCurrentUserName } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'ALL';
    const activeOnly = searchParams.get('active') === 'true';

    const products = await db.getProducts(query, category, activeOnly);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = getCurrentUserName(request);
    const created = await db.createProduct(result.data, user);
    return NextResponse.json({ success: true, product: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
