export type GraphType = {
  date: string,
  week_in_month?: string,
  total_revenue: string,
  total_sales: string
}

export type GraphProductAnalytic = {
  product_sku_id: string,
  product_sku_name: string,
  count: string,
}

export type TopPerformanceCustomer = {
  customer_name: string,
  count_order: string,
  total_sum: string,
  customer: {
    id: string,
    dial_code: string,
    phone_number: string,
  }
}