export type Outlet = {
  id: string;
  name: string;
  country: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  address: string;
  dial_code: string;
  phone_number: string;
  email: string;
  latitude: string;
  longitude: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  outlet_area_grouping: OutletArea
  outlet_grouping: OutletCV
}

export type OutletArea = {
  id: string,
  outlet_area: {
    id: string
    name: string
  }
}
export type OutletCV = {
  id: string,
  outlet_grouping_master: {
    id: string
    name: string
  }
}

export type OutletMapWitContribution = {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  order_count: string;
  total_sum: string | null;
};