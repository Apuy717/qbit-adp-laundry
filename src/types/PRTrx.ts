import { Outlet } from "./outlet"

export type PRTrx = {
  id: string,
  invoice_id: string | undefined,
  outlet_id: string,
  user_id: string,
  note: string | null,
  total: string,
  trx_date: string,
  created_at: string,
  updated_at: string,
  outlet: Outlet | null,
  user: {
    id: string,
    fullname: string,
    email: string,
    dial_code: string,
    phone_number: string,
  },
  trx_pr_items: {
    id: string,
    trx_pr_id: string,
    name: string,
    price: string,
    quantity: number,
    unit: string,
    sub_total: string,
    created_at: string,
    updated_at: string,
  }[]
}