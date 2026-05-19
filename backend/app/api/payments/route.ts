import { NextResponse } from 'next/server';
import {
  createPayment,
  getAllPayments,
  approvePayment,
  rejectPayment,
  normalizePaymentMethod,
} from '@/lib/payments';
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const payments = await getAllPayments();

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'create_payment') {
      const user = await requireAuth();
      const payment = await createPayment(
        {
          order_id: body.order_id,
          payment_method: normalizePaymentMethod(body.payment_method),
          transaction_id: body.transaction_id,
          screenshot_url: body.screenshot_url,
          amount: body.amount,
        },
        user.id
      );

      return NextResponse.json({
        success: true,
        message: 'Payment created successfully',
        payment,
      });
    }

    if (action === 'approve_payment') {
      await requireAdmin();
      const payment = await approvePayment(body.payment_id);

      return NextResponse.json({
        success: true,
        message: 'Payment approved',
        payment,
      });
    }

    if (action === 'reject_payment') {
      await requireAdmin();
      const payment = await rejectPayment(body.payment_id);

      return NextResponse.json({
        success: true,
        message: 'Payment rejected',
        payment,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
