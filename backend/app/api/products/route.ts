import { NextRequest, NextResponse } from 'next/server';
import { productService } from '../../../services/productService';
import { ProductFilters } from '../../../types/product';

// GET /api/products — list products with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filters: ProductFilters = {
      category: (searchParams.get('category') as ProductFilters['category']) ?? undefined,
      team: searchParams.get('team') ?? undefined,
      driver: searchParams.get('driver') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      is_featured: searchParams.get('featured') === 'true' ? true : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const result = await productService.listProducts(filters);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
