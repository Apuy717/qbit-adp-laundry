
export type IronTypes = {
    id: string,
    started_at: string,
    finished_at: string | null,
    work_duration_minutes: number | null,
    user: {
        id: string,
        fullname: string,
        department: string,
        dial_code: number,
        phone_number: number
    },
    outlet: {
        id: string,
        name: string,
        city: string,
        district: string
    },
    order_item_stage: {
        id: string,
        order_item_id: string,
        order_item: {
            id: string,
            product_name: string,
            product_sku_name: string,
            total_item: number,
            order: {
                invoice_id: string
            }
        }
    }
}