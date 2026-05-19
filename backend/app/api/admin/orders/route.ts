import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '../../../../services/orderService';

// GET /api/admin/orders — list all orders with optional status filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);
    const status = searchParams.get('status') ?? undefined;

    const result = await orderService.listAllOrders(page, limit, status);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
