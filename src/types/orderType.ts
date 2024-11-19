import { EPaymentMethodType } from "./paymentMethod";


export enum EPaymentStatus {
  PENDING = "pending",
  RECEIVABLES = "receivables",
  PAID = "paid",
}

export enum EStatusOrder {
  REGISTERED = "registered",
  COMPLETED = "completed",
  CANCELED = "canceled",
}

export type OrderType = {
  id: string;
  invoice_id: string;
  payment_status: EPaymentStatus;
  status: EStatusOrder;
  total: string;
  total_item: number | null;
  created_at: string;
  updated_at: string;
  outlet: {
    id: string;
    name: string;
    city: string;
  },
  customer: {
    id: string;
    fullname: string;
    dial_code: string;
    phone_number: string;
  },
  admin: {
    id: string;
    fullname: string;
  },
  voucher: null,
  payment_method: {
    id: string
    name: string
    type: EPaymentMethodType
    account_number: string | null,
    account_name: string | null
  },
  items: {
    id: string;
    order_id: string;
    product_sku_id: string;
    product_sku_name: string;
    product_name: string;
    washer_duration: number | null,
    dryer_duration: number | null,
    iron_duration: null,
    price: string;
    quantity: number,
    unit: string | null,
    sub_total: string;
    created_at: string;
    updated_at: string;
    stages: {
      id: string;
      order_item_id: string;
      name: string;
      status: string;
    }[]
  }[]
}