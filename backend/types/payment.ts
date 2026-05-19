export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'rocket';

export type ManualPaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  screenshot_url: string | null;
  amount: number;
  status: ManualPaymentStatus;
  created_at: string;
}

export interface CreatePaymentInput {
  order_id: string;
  payment_method: PaymentMethod;
  transaction_id?: string;
  screenshot_url?: string;
  amount: number;
}
