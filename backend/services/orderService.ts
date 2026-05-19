import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} from '../lib/orders';
import {
  Order,
  CreateOrderInput,
  UpdateOrderStatusInput,
} from '../types/order';

export class OrderService {
  // ── Customer ─────────────────────────────────────────────────────────────

  async placeOrder(userId: string, input: CreateOrderInput): Promise<Order> {
    this.validateOrderInput(input);
    return createOrder(userId, input);
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    return getOrdersByUser(userId);
  }

  async getMyOrder(orderId: string, userId: string): Promise<Order> {
    const order = await getOrderById(orderId, userId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listAllOrders(page = 1, limit = 20, status?: string) {
    return getAllOrders(page, limit, status);
  }

  async getOrderAdmin(orderId: string): Promise<Order> {
    const order = await getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async updateStatus(
    orderId: string,
    input: UpdateOrderStatusInput
  ): Promise<Order> {
    const existing = await this.getOrderAdmin(orderId);

    // Guard: can't update a cancelled/refunded order
    if (['cancelled', 'refunded'].includes(existing.status)) {
      throw new Error(`Cannot update a ${existing.status} order`);
    }

    return updateOrderStatus(orderId, input);
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validateOrderInput(input: CreateOrderInput): void {
    if (!input.items?.length) throw new Error('Order must contain at least one item');
    for (const item of input.items) {
      if (!item.product_id) throw new Error('Each item must have a product_id');
      if (!item.size) throw new Error('Each item must have a size');
      if (!item.quantity || item.quantity < 1) throw new Error('Quantity must be at least 1');
    }
    const addr = input.shipping_address;
    if (!addr?.full_name || !addr?.line1 || !addr?.city || !addr?.postcode || !addr?.country) {
      throw new Error('Incomplete shipping address');
    }
  }
}

export const orderService = new OrderService();
