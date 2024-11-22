export type ProfitType = {
  count_expense: number,
  total_expense: number | null,
  count_sales: number,
  total_sales: number | null,
  profit: number,
  avg: {
    total: string | null
  }
}

export type TopPerformanceOutlet = {
  outlet_id: string;
  order_count: string;
  total_sum: string;
  outlet: {
    id: string;
    name: string;
    city: string;
  }
}