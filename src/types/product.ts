export type TypeProduct = {
  id: string;
  name: string,
  picture: string,
  slug: string,
  description: string | null,
  is_self_service: boolean,
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
  product_creator: iUser | null,
  product_updater: iUser | null
}

interface iUser {
  id: string
  fullname: string
  email: string
  dial_code: string
  phone_number: string
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
  is_self_service: boolean,
  machine_ids: iMachineIds[]
  sku_creator: iUser | null,
  sku_updater: iUser | null
}

export interface iMachineIds {
  machine_id: string,
  duration: number
}