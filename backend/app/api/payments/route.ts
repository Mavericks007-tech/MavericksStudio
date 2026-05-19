import {
  createPayment,
  getAllPayments,
  approvePayment,
  rejectPayment,
  normalizePaymentMethod,
} from '@/lib/payments';
export async function GET() {
  try {
    // ADMIN: fetch all payments
    const payments = await getAllPayments();

    return Response.json({
      success: true,
      payments,
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    /**
     * ACTION BASED SYSTEM
     * One endpoint handles everything
     */

    const action = body.action;

    // 1. CREATE PAYMENT (user checkout submission)
    if (action === "create_payment") {
      const payment = await createPayment({
        order_id: body.order_id,
        payment_method: normalizePaymentMethod(body.payment_method),
        transaction_id: body.transaction_id,
        screenshot_url: body.screenshot_url,
        amount: body.amount,
      });

      return Response.json({
        success: true,
        message: "Payment created successfully",
        payment,
      });
    }

    // 2. APPROVE PAYMENT (admin)
    if (action === "approve_payment") {
      const updated = await approvePayment(body.payment_id);

      return Response.json({
        success: true,
        message: "Payment approved",
        payment: updated,
      });
    }

    // 3. REJECT PAYMENT (admin)
    if (action === "reject_payment") {
      const updated = await rejectPayment(body.payment_id);

      return Response.json({
        success: true,
        message: "Payment rejected",
        payment: updated,
      });
    }

    return Response.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}