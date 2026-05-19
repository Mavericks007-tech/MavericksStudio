import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '../../../../services/orderService';
import { requireAuth, AuthError } from '../../../../lib/auth';

// GET /api/orders/:id — get a single order belonging to the logged-in user
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const order = await orderService.getMyOrder(params.id, user.id);
    return NextResponse.json(order);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Order not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
