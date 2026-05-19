import { supabaseAdmin } from './supabase';
import { getOrderById } from './orders';
import { decrementStock } from './products';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'rocket';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface CreatePaymentInput {
  order_id: string;
  payment_method: PaymentMethod;
  transaction_id?: string;
  screenshot_url?: string;
  amount: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'bkash', 'nagad', 'rocket'];

export function normalizePaymentMethod(value: string): PaymentMethod {
  const normalized = value.trim().toLowerCase();
  if (PAYMENT_METHODS.includes(normalized as PaymentMethod)) {
    return normalized as PaymentMethod;
  }
  throw new Error(`Invalid payment_method. Use one of: ${PAYMENT_METHODS.join(', ')}`);
}

export async function createPayment(input: CreatePaymentInput) {
  const payment_method = normalizePaymentMethod(input.payment_method);

  if (payment_method !== 'cod' && !input.transaction_id && !input.screenshot_url) {
    throw new Error('transaction_id or screenshot_url is required for mobile payments');
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert([
      {
        order_id: input.order_id,
        payment_method,
        transaction_id: input.transaction_id || null,
        screenshot_url: input.screenshot_url || null,
        amount: input.amount,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.order_id);

  return data;
}

export async function getAllPayments() {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}

export async function getPaymentByOrderId(order_id: string) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('order_id', order_id)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

async function decrementOrderStock(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  for (const item of order.items) {
    await decrementStock(item.product_id, item.size, item.quantity);
  }
}

export async function approvePayment(payment_id: string) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({ status: 'approved' })
    .eq('id', payment_id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await decrementOrderStock(data.order_id);

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.order_id);

  return data;
}

export async function rejectPayment(payment_id: string) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({ status: 'rejected' })
    .eq('id', payment_id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.order_id);

  return data;
}
