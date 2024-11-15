export enum EPaymentMethodType {
  CASH = "cash",
  CASHLESS = "cashless"
}

export type PaymentMethodType = {
  id: string
  outlet_id: string
  name: string
  type: string
  account_number: string | null,
  account_name: string | null,
  icon: string | null,
  is_deleted: boolean,
  created_at: string
  updated_at: string
  outlet: {
    id: string
    name: string
    city: string
  }

}