export type TypeProduct = {
  id: string;
  outlet_id: string,
  name: string,
  picture: string,
  slug: string,
  description: string | null,
  category_id: string,
  is_deleted: false,
  created_at: string,
  updated_at: string,
  outlet: {
    id: string,
    name: string,
    city: string
  },
  skus: {
    id: string,
    product_id: string,
    code: string,
    name: string,
    picture: string | null,
    description: string,
    price: number,
    type: string,
    stock: number | null,
    unit: string | null,
    machine_washer: boolean,
    machine_dryer: boolean,
    machine_iron: boolean,
    washer_duration: number | null,
    dryer_duration: number | null,
    iron_duration: number | null,
    is_deleted: boolean,
    created_at: string,
    updated_at: string
  }[]
}