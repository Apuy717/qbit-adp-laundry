export type MachineLogType = {
    id: string,
    accessed_by: string,
    duration: number,
    time_used: number,
    status: string,
    created_at: string,
    updated_at: string,
    machine: {
      name: string,
      outlet: {
        id: string,
        name: string
      }
    },
    order_item_stage: {
      id: string,
      name: string,
      status: string,
      order_item: {
        id: string,
        product_sku_name: string,
        order: {
          id: string,
          invoice_id: string,
          customer: {
            id: string,
            fullname: string
          }
        }
      }
    }
  }