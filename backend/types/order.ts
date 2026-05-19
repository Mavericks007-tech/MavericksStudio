import { ProductSize } from './product';

export type OrderStatus =
  | 'pending'
  | 'payment_confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  size: ProductSize;
  quantity: number;
  unit_price: number;   // in pence at time of order
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
  subtotal: number;       // in pence
  shipping_cost: number;  // in pence
  discount: number;       // in pence
  total: number;          // in pence
  status: OrderStatus;
  payment_status: PaymentStatus;
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
  status: OrderStatus;
  tracking_number?: string;
}
