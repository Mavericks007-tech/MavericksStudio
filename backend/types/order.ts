import { ProductSize } from './product';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

export type OrderPaymentStatus = 'unpaid' | 'pending_verification' | 'paid';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  size: ProductSize;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ShippingAddress {
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total_price: number;
  order_status: OrderStatus;
  payment_status: OrderPaymentStatus;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  items: {
    product_id: string;
    size: ProductSize;
    quantity: number;
  }[];
  shipping_address: ShippingAddress;
  notes?: string;
}

export interface UpdateOrderStatusInput {
  order_status: OrderStatus;
  tracking_number?: string;
}
