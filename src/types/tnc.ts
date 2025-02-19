export type TNC = {
    id: string,
    outlet_id: string,
    title: string,
    terms_and_conditions_items: 
        {
            label: string,
            text: string,
        }[]
    is_deleted: boolean,
    created_at: string,
    updated_at: string
}