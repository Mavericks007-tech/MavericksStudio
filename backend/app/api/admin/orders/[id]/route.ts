import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '../../../../../services/orderService';
import { UpdateOrderStatusInput } from '../../../../../types/order';

// GET /api/admin/orders/:id — get order detail
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await orderService.getOrderAdmin(params.id);
    return NextResponse.json(order);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

// PATCH /api/admin/orders/:id — update order status / tracking
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateOrderStatusInput = await req.json();
    const order = await orderService.updateStatus(params.id, body);
    return NextResponse.json(order);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
