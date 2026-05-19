import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '../../../services/orderService';
import { requireAuth } from '../../../lib/auth';
import { AuthError } from '../../../lib/auth';
import { CreateOrderInput } from '../../../types/order';

// GET /api/orders — get logged-in user's orders
export async function GET() {
  try {
    const user = await requireAuth();
    const orders = await orderService.getMyOrders(user.id);
    return NextResponse.json(orders);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/orders — place a new order
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body: CreateOrderInput = await req.json();
    const order = await orderService.placeOrder(user.id, body);
    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
