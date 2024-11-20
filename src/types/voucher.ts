export type Voucher = {
    id: string,
    name: string,
    code: string,
    started_at: string,
    ended_at: string,
    quota: number,
    discount: string,
    discount_type: string,
    is_deleted: boolean,
    created_at: string,
    updated_at: string
}