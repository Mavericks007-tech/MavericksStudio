import { supabaseAdmin } from './supabase';
import { getOrderById } from './orders';
import { decrementStock } from './products';
import {
  CreatePaymentInput,
  Payment,
  PaymentMethod,
} from '../types/payment';
import { Order } from '../types/order';

export type { PaymentMethod, CreatePaymentInput, Payment };
export type PaymentRecordStatus = Payment['status'];

const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'bkash', 'nagad', 'rocket'];

export function normalizePaymentMethod(value: string): PaymentMethod {
  const normalized = value.trim().toLowerCase();
  if (PAYMENT_METHODS.includes(normalized as PaymentMethod)) {
    return normalized as PaymentMethod;
  }
  throw new Error(`Invalid payment_method. Use one of: ${PAYMENT_METHODS.join(', ')}`);
}

async function getOrderForPayment(orderId: string, userId?: string): Promise<Order> {
  const order = await getOrderById(orderId, userId);
  if (!order) throw new Error('Order not found');
  return order;
}

export async function createPayment(
  input: CreatePaymentInput,
  userId: string
): Promise<Payment> {
  const payment_method = normalizePaymentMethod(input.payment_method);
  const order = await getOrderForPayment(input.order_id, userId);

  if (order.payment_status === 'paid') {
    throw new Error('Order is already paid');
  }

  if (order.payment_status === 'pending_verification') {
    throw new Error('A payment is already pending verification for this order');
  }

  if (input.amount !== order.total_price) {
    throw new Error('Payment amount must match order total');
  }

  if (payment_method !== 'cod' && !input.transaction_id && !input.screenshot_url) {
    throw new Error('transaction_id or screenshot_url is required for mobile payments');
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert({
      order_id: input.order_id,
      payment_method,
      transaction_id: input.transaction_id ?? null,
      screenshot_url: input.screenshot_url ?? null,
      amount: input.amount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'pending_verification',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.order_id);

  if (orderError) throw new Error(orderError.message);

  return data as Payment;
}

export async function getAllPayments(): Promise<Payment[]> {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Payment[];
}

export async function getPaymentByOrderId(order_id: string): Promise<Payment> {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('order_id', order_id)
    .single();

  if (error) throw new Error(error.message);
  return data as Payment;
}

async function decrementOrderStock(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  for (const item of order.items) {
    await decrementStock(item.product_id, item.size, item.quantity);
  }
}

export async function approvePayment(payment_id: string): Promise<Payment> {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({ status: 'approved' })
    .eq('id', payment_id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await decrementOrderStock(data.order_id);

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      order_status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.order_id);

  if (orderError) throw new Error(orderError.message);

  return data as Payment;
}

export async function rejectPayment(payment_id: string): Promise<Payment> {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({ status: 'rejected' })
    .eq('id', payment_id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'unpaid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.order_id);

  if (orderError) throw new Error(orderError.message);

  return data as Payment;
}
