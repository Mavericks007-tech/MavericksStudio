import { NextRequest, NextResponse } from 'next/server';
import { productService } from '../../../../services/productService';
import { AuthError } from '../../../../lib/auth';
import { CreateProductInput } from '../../../../types/product';

// GET /api/admin/products — list ALL products (including inactive)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await productService.listProducts({
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 20),
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/products — create a new product
export async function POST(req: NextRequest) {
  try {
    const body: CreateProductInput = await req.json();
    const product = await productService.createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
