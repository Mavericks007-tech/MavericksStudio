import { supabaseAdmin } from './supabase';
import { getProductById } from './products';
import {
  Order,
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderItem,
} from '../types/order';

const SHIPPING_COST_PENCE = 499; // £4.99 flat rate

// ─── Build order items and calculate totals ───────────────────────────────
async function buildOrderItems(
  rawItems: CreateOrderInput['items']
): Promise<{ items: OrderItem[]; subtotal: number }> {
  const items: OrderItem[] = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    const product = await getProductById(raw.product_id);
    if (!product) throw new Error(`Product ${raw.product_id} not found`);

    const stock = product.stock[raw.size] ?? 0;
    if (stock < raw.quantity) {
      throw new Error(`Not enough stock for ${product.name} in size ${raw.size}`);
    }

    const totalPrice = product.price * raw.quantity;
    items.push({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images[0] ?? '',
      size: raw.size,
      quantity: raw.quantity,
      unit_price: product.price,
      total_price: totalPrice,
    });
    subtotal += totalPrice;
  }

  return { items, subtotal };
}

// ─── Create a new order ───────────────────────────────────────────────────
export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<Order> {
  const { items, subtotal } = await buildOrderItems(input.items);
  const total = subtotal + SHIPPING_COST_PENCE;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      items,
      shipping_address: input.shipping_address,
      subtotal,
      shipping_cost: SHIPPING_COST_PENCE,
      discount: 0,
      total,
      status: 'pending',
      payment_status: 'pending',
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
}

// ─── Fetch all orders for a user ──────────────────────────────────────────
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Order[];
}

// ─── Fetch a single order (checks ownership) ─────────────────────────────
export async function getOrderById(
  orderId: string,
  userId?: string
): Promise<Order | null> {
  let query = supabaseAdmin.from('orders').select('*').eq('id', orderId);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.single();
  if (error) return null;
  return data as Order;
}

// ─── Admin: update order status ───────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput
): Promise<Order> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Order;
}

// ─── Admin: fetch all orders (paginated) ─────────────────────────────────
export async function getAllOrders(
  page = 1,
  limit = 20,
  status?: string
): Promise<{ orders: Order[]; total: number }> {
  const offset = (page - 1) * limit;
  let query = supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { orders: data as Order[], total: count ?? 0 };
}
