export type TypeProduct = {
  id: string;
  name: string,
  picture: string,
  slug: string,
  description: string | null,
  is_deleted: false,
  created_at: string,
  updated_at: string,
  category: {
    id: string,
    name: string,
  },
  outlet: {
    id: string,
    name: string,
    city: string
  },
  skus: iSku[]
}

export interface iSku {
  id: string,
  product_id: string,
  code: string,
  name: string,
  picture: string | null,
  description: string,
  capital_price: number,
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
  updated_at: string,
  outlet_price_skus: { price: string }[]

}