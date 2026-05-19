import { NextRequest, NextResponse } from 'next/server';
import { productService } from '../../../../services/productService';

// GET /api/products/:slug
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await productService.getProductBySlug(params.slug);
    return NextResponse.json(product);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
